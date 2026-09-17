import { NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

export const runtime = 'nodejs';

const RP_NAME = 'Estate Tea AI';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'estatetea.in';
const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'https://estatetea.in';
const CREDENTIAL_COOKIE = 'estate_ai_passkey';
const CHALLENGE_COOKIE = 'estate_ai_passkey_challenge';

function secret() { return process.env.ADMIN_PASSWORD || ''; }
function ownerToken() { return secret() ? crypto.createHmac('sha256', secret()).update('estate-tea-admin').digest('hex') : ''; }
function authorized(request) {
  const expected = ownerToken();
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!expected || supplied.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}
function sign(value) { return crypto.createHmac('sha256', secret()).update(value).digest('base64url'); }
function pack(data) { const value=Buffer.from(JSON.stringify(data)).toString('base64url'); return `${value}.${sign(value)}`; }
function unpack(raw) {
  try {
    const [value,sig]=String(raw||'').split('.');
    if (!value || !sig) return null;
    const expected=sign(value);
    if (sig.length!==expected.length || !crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected))) return null;
    return JSON.parse(Buffer.from(value,'base64url').toString('utf8'));
  } catch { return null; }
}
function cookieOptions(maxAge=300) { return {httpOnly:true,secure:true,sameSite:'strict',path:'/',maxAge}; }
function credentialFrom(request) { return unpack(request.cookies.get(CREDENTIAL_COOKIE)?.value); }
function jsonError(message,status=400){return NextResponse.json({error:message},{status});}

export async function GET(request,{params}) {
  const {action}=await params;
  if (!secret()) return jsonError('Admin authentication is not configured',503);

  if (action==='status') return NextResponse.json({supported:true,enrolled:!!credentialFrom(request)});

  if (action==='register-options') {
    if (!authorized(request)) return jsonError('Owner authentication required',401);
    const existing=credentialFrom(request);
    const options=await generateRegistrationOptions({
      rpName:RP_NAME,rpID:RP_ID,userName:'Estate Tea Owner',attestationType:'none',
      excludeCredentials:existing?[{id:existing.id,transports:['internal']}]:[],
      authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'required',userVerification:'required'},
      supportedAlgorithmIDs:[-7,-257],
    });
    // WebAuthn hints are advisory, but on supporting iOS/Safari versions this
    // steers the ceremony toward this iPhone instead of hybrid/QR sign-in.
    options.hints=['client-device'];
    const response=NextResponse.json(options);
    response.cookies.set(CHALLENGE_COOKIE,pack({type:'register',challenge:options.challenge}),cookieOptions());
    return response;
  }

  if (action==='auth-options') {
    const credential=credentialFrom(request);
    if (!credential) return jsonError('Face ID is not enrolled on this device',404);
    const options=await generateAuthenticationOptions({
      rpID:RP_ID,userVerification:'required',allowCredentials:[{id:credential.id,transports:['internal']}],
    });
    // Do not advertise hybrid transport: this owner app intentionally uses the
    // local platform authenticator (Face ID / device passcode) only.
    options.hints=['client-device'];
    const response=NextResponse.json(options);
    response.cookies.set(CHALLENGE_COOKIE,pack({type:'auth',challenge:options.challenge}),cookieOptions());
    return response;
  }
  return jsonError('Unknown passkey action',404);
}

export async function POST(request,{params}) {
  const {action}=await params;
  if (!secret()) return jsonError('Admin authentication is not configured',503);
  let body; try{body=await request.json()}catch{return jsonError('Invalid request')}
  const challenge=unpack(request.cookies.get(CHALLENGE_COOKIE)?.value);

  if (action==='register-verify') {
    if (!authorized(request)) return jsonError('Owner authentication required',401);
    if (!challenge || challenge.type!=='register') return jsonError('Registration challenge expired');
    try {
      const verification=await verifyRegistrationResponse({response:body,expectedChallenge:challenge.challenge,expectedOrigin:ORIGIN,expectedRPID:RP_ID,requireUserVerification:true,supportedAlgorithmIDs:[-7,-257]});
      if (!verification.verified || !verification.registrationInfo) return jsonError('Face ID registration could not be verified');
      const {credential,credentialDeviceType,credentialBackedUp}=verification.registrationInfo;
      const saved={id:credential.id,publicKey:Buffer.from(credential.publicKey).toString('base64url'),counter:credential.counter,transports:['internal'],deviceType:credentialDeviceType,backedUp:credentialBackedUp};
      const response=NextResponse.json({verified:true});
      response.cookies.set(CREDENTIAL_COOKIE,pack(saved),cookieOptions(60*60*24*365));
      response.cookies.delete(CHALLENGE_COOKIE);
      return response;
    } catch(e){return jsonError(e?.message||'Face ID registration failed')}
  }

  if (action==='auth-verify') {
    const credential=credentialFrom(request);
    if (!credential || !challenge || challenge.type!=='auth') return jsonError('Face ID authentication session expired');
    if (body.id!==credential.id) return jsonError('Unknown passkey',401);
    try {
      const verification=await verifyAuthenticationResponse({response:body,expectedChallenge:challenge.challenge,expectedOrigin:ORIGIN,expectedRPID:RP_ID,requireUserVerification:true,credential:{id:credential.id,publicKey:new Uint8Array(Buffer.from(credential.publicKey,'base64url')),counter:credential.counter,transports:['internal']}});
      if (!verification.verified) return jsonError('Face ID could not be verified',401);
      const updated={...credential,counter:verification.authenticationInfo.newCounter,transports:['internal']};
      const response=NextResponse.json({verified:true,token:ownerToken(),method:'passkey'});
      response.cookies.set(CREDENTIAL_COOKIE,pack(updated),cookieOptions(60*60*24*365));
      response.cookies.delete(CHALLENGE_COOKIE);
      return response;
    } catch(e){return jsonError(e?.message||'Face ID authentication failed',401)}
  }
  return jsonError('Unknown passkey action',404);
}
