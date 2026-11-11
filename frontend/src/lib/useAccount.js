'use client';
import { useEffect, useState } from 'react';

// The signed-in customer (Brew's record), shared by every part of the website. A small hint in this browser says
// "probably signed in", so returning customers skip the welcome form without a flash of it.
const HINT = 'et_signed_in';
let state = { loading: true, signedIn: false, profile: null };
let loaded = false;
const subs = new Set();
const set = next => { state = { ...state, ...next }; subs.forEach(f => f(state)); };
const hint = on => { try { on ? localStorage.setItem(HINT, '1') : localStorage.removeItem(HINT); } catch {} };
export const probablySignedIn = () => { try { return localStorage.getItem(HINT) === '1'; } catch { return false; } };

export async function refreshAccount() {
  try {
    const r = await fetch('/api/account/me', { cache: 'no-store' }), b = await r.json();
    if (b.unavailable) { set({ loading: false }); return state; }   // Brew briefly unreachable: keep the hint, try again later
    hint(!!b.signed_in); set({ loading: false, signedIn: !!b.signed_in, profile: b.profile || null });
  } catch { set({ loading: false }); }
  return state;
}
export function signedIn(profile) { hint(true); loaded = true; set({ loading: false, signedIn: true, profile }); }
export async function signOut(everywhere = false) {
  try { await fetch('/api/account/me' + (everywhere === true ? '?everywhere=1' : ''), { method: 'DELETE' }); } catch {}
  hint(false); set({ signedIn: false, profile: null });
}
export async function saveAccount(details) {
  const r = await fetch('/api/account/me', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(details) });
  const b = await r.json().catch(() => ({}));
  if (!r.ok) { if (r.status === 401) { hint(false); set({ signedIn: false, profile: null }); } throw new Error(b.error || 'Could not save your details'); }
  set({ profile: b.profile }); return b.profile;
}

// An open page keeps checking (when they come back to it, and every minute while it's on screen), so "NOT ME" on
// WhatsApp or signing out elsewhere shows here straight away instead of only after a reload.
let watching = false;
function watch() {
  if (watching || typeof window === 'undefined') return;
  watching = true;
  let last = 0, active = Date.now();
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(e => window.addEventListener(e, () => { active = Date.now(); }, { passive: true }));
  const recheck = async (timed) => {
    if (!state.signedIn || document.visibilityState !== 'visible' || Date.now() - last < 4000) return;
    if (timed === true && Date.now() - active > 10 * 60 * 1000) return;   // nobody using the page: check when they come back
    last = Date.now();
    const was = state.signedIn;
    const now = await refreshAccount();
    if (was && !now.signedIn) {
      try { const { toast } = await import('sonner'); toast('You have been signed out of your Estate Tea account.'); } catch {}
    }
  };
  document.addEventListener('visibilitychange', () => { active = Date.now(); recheck(); });
  window.addEventListener('focus', () => { active = Date.now(); recheck(); });
  setInterval(() => recheck(true), 8000);   // "NOT ME" on WhatsApp shows here within seconds, even with the page left open
}

export function useAccount() {
  const [s, setS] = useState(state);
  useEffect(() => { subs.add(setS); watch(); if (!loaded) { loaded = true; refreshAccount(); } else setS(state); return () => subs.delete(setS); }, []);
  return s;
}

// What a checkout form needs, from their account (only fills what's still empty, never overwrites what they typed).
export function fillFromProfile(details, p) {
  if (!p) return details;
  const phone = String(p.phone || '').replace(/\D/g, '').slice(-10);
  const from = { name: p.name, phone, email: p.email, house: p.house, street: p.street, landmark: p.landmark, city: p.city, pincode: p.pincode,
    customer_type: p.customer_type, business_name: p.business_name, gstin: p.gstin };
  const out = { ...details };
  // The welcome form only asks a first name, so a full name on file replaces it.
  const firstOnly = k => k === 'name' && out.name && !String(out.name).trim().includes(' ') && String(v0(k)).toLowerCase().startsWith(String(out.name).trim().toLowerCase());
  function v0(k) { return from[k] || ''; }
  for (const [k, v] of Object.entries(from)) if (v && (!out[k] || firstOnly(k) || (k === 'city' && out[k] === 'Bengaluru') || (k === 'customer_type' && out[k] === 'home'))) out[k] = v;
  return out;
}
