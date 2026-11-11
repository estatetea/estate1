'use client';
import { useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, CheckCircle2 } from 'lucide-react';
import { signedIn } from '@/lib/useAccount';

// Sign in with WhatsApp: we show a fresh code and open WhatsApp with it typed in; they send it to us from their own
// WhatsApp (which proves the number is theirs), and this page signs in as soon as Brew receives it.
export default function WhatsAppSignIn({ onDone, label = 'Sign in with WhatsApp', note }) {
  const [step, setStep] = useState('idle'), [login, setLogin] = useState(null), [error, setError] = useState(''), [qr, setQr] = useState('');
  const timer = useRef(null), until = useRef(0);
  const stop = () => { if (timer.current) clearInterval(timer.current); timer.current = null; };
  useEffect(() => stop, []);
  const check = async () => {
    if (Date.now() > until.current) { stop(); setStep('expired'); return; }
    try {
      const b = await (await fetch('/api/account/login/status', { cache: 'no-store' })).json();
      if (b.status === 'signed_in') { stop(); setStep('done'); signedIn(b.profile); onDone?.(b.profile); }
      else if (b.status === 'expired') { stop(); setStep('expired'); }
    } catch {}
  };
  useEffect(() => {
    const back = () => { if (document.visibilityState === 'visible' && timer.current) check(); };   // back from WhatsApp: check at once
    document.addEventListener('visibilitychange', back); window.addEventListener('focus', back);
    return () => { document.removeEventListener('visibilitychange', back); window.removeEventListener('focus', back); };
  }, []);
  const begin = async () => {
    setStep('starting'); setError(''); stop();
    try {
      const r = await fetch('/api/account/login/start', { method: 'POST' }), b = await r.json();
      if (!r.ok) throw new Error(b.error || 'Sign-in is not available right now.');
      setLogin(b); setStep('code'); setQr('');
      import('qrcode').then(Q => Q.toDataURL(b.whatsapp_url, { margin: 1, width: 440, errorCorrectionLevel: 'M' })).then(setQr).catch(() => setQr('')); until.current = Date.now() + (b.expires_in || 600) * 1000;
      timer.current = setInterval(check, 2500);
    } catch (e) { setError(e.message); setStep('idle'); }
  };

  if (step === 'done') return <p className="flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 className="w-4 h-4" />Signed in</p>;
  if (step === 'code' && login) return <div className="space-y-3">
    <p className="text-sm text-gray-300">Send this code to Estate Tea on WhatsApp. It's already typed in for you, just tap send.</p>
    <p className="text-center text-3xl tracking-[.35em] text-[#E9CF8A] font-light" aria-label={`Your code is ${login.code.split('').join(' ')}`}>{login.code}</p>
    {qr && <div className="hidden sm:flex flex-col items-center gap-2" data-testid="signin-qr">
      <img src={qr} alt="QR code: scan with your phone to send the sign-in code on WhatsApp" width="176" height="176" className="rounded-lg bg-white p-2" />
      <p className="text-center text-xs text-gray-400">On a computer? Scan this with your phone's camera. WhatsApp opens with the code typed in, then just tap send.</p>
    </div>}
    <a href={login.whatsapp_url} target="_blank" rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-sm font-medium text-black hover:bg-[#25D366]/90">
      <MessageCircle className="w-4 h-4" /><span className="sm:hidden">Open WhatsApp and send the code</span><span className="hidden sm:inline">Or open WhatsApp on this computer</span></a>
    <p className="flex items-center justify-center gap-2 text-xs text-gray-500"><Loader2 className="w-3 h-3 animate-spin" />Waiting for your message… this page signs in by itself.</p>
    <p className="text-center text-[11px] text-gray-600">The code works once and only for the next 10 minutes. <button type="button" onClick={() => { stop(); setStep('idle'); }} className="underline">Cancel</button></p>
  </div>;
  return <div className="space-y-2">
    <button type="button" onClick={begin} disabled={step === 'starting'}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#25D366]/50 bg-[#25D366]/10 px-4 py-3 text-sm text-[#7ee2a3] hover:bg-[#25D366]/15 disabled:opacity-60">
      {step === 'starting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}{label}</button>
    {step === 'expired' && <p className="text-xs text-amber-300">That code has expired. Tap the button for a new one.</p>}
    {error && <p className="text-xs text-red-300">{error}</p>}
    {note && step !== 'expired' && <p className="text-xs text-gray-500">{note}</p>}
  </div>;
}
