'use client';
import { useEffect, useRef, useState } from 'react';
import { UserRound, LogOut, MonitorSmartphone, X, Crown, Gift, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import WhatsAppSignIn from './WhatsAppSignIn';
import { useAccount, signOut } from '@/lib/useAccount';

// The account button in the website's top bar: who's signed in and Sign out, or Sign in with WhatsApp.
export default function AccountButton() {
  const acct = useAccount();
  const [open, setOpen] = useState(false), [busy, setBusy] = useState('');
  const box = useRef(null);
  useEffect(() => {
    if (!open) return;
    const away = e => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const esc = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  const out = async everywhere => {
    setBusy(everywhere ? 'all' : 'one');
    await signOut(everywhere);   // the page reloads as signed out, and says so
  };
  const p = acct.profile || {};
  const phone = String(p.phone || '').replace(/\D/g, '').slice(-10);
  const name = p.name || p.whatsapp_name || '';
  return <div className="relative" ref={box}>
    <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} data-testid="account-button"
      aria-label={acct.signedIn ? `Account: signed in as ${name || 'you'}` : 'Sign in'}
      className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs touch-manipulation transition-colors ${acct.signedIn ? 'border-[#D4AF37]/50 text-[#E9CF8A] bg-[#D4AF37]/10' : 'border-white/15 text-gray-300 hover:border-[#D4AF37]/40'}`}>
      <UserRound className="w-4 h-4" />
      <span className="hidden sm:inline max-w-[8rem] truncate">{acct.signedIn ? (name.split(' ')[0] || 'Account') : 'Sign in'}</span>
    </button>
    {open && <div role="dialog" aria-label="Your account" data-testid="account-panel"
      className="fixed left-4 right-4 top-14 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[340px] z-[60] rounded-2xl border border-white/10 bg-[#141210] p-4 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[.2em] text-[#D4AF37]">{acct.signedIn ? 'Your account' : 'Sign in'}</p>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-gray-500 hover:text-gray-300"><X className="w-4 h-4" /></button>
      </div>
      {acct.signedIn ? <>
        <p className="mt-2 text-white">{name || 'Signed in'}</p>
        {phone && <p className="text-xs text-gray-400">WhatsApp +91 {phone.slice(0, 5)} {phone.slice(5)}</p>}
        {p.address && <p className="mt-2 text-xs leading-5 text-gray-400">Delivering to: {p.address}</p>}
        {p.is_owner && <div className="mt-3 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[.06] p-3" data-testid="owner-panel">
          <p className="flex items-center gap-1.5 text-xs text-[#E9CF8A]"><Crown className="w-3.5 h-3.5" />Signed in as the owner</p>
          <p className="mt-1 text-[11px] leading-4 text-gray-400">You see the website as the boss: the Christmas collection shows even before it's public.</p>
          <button type="button" data-testid="owner-collection" onClick={() => { setOpen(false); window.dispatchEvent(new CustomEvent('estate:navigate', { detail: 'collection' })); }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm text-black"><Gift className="w-4 h-4" />Christmas collection</button>
          <button type="button" data-testid="owner-webapp" onClick={() => { window.location.assign('/#ai'); window.location.reload(); }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[#D4AF37]/30 px-4 py-2 text-sm text-[#E9CF8A]"><LayoutDashboard className="w-4 h-4" />Owner web app</button>
        </div>}
        <div className="mt-4 space-y-2">
          <button type="button" onClick={() => out(false)} disabled={!!busy} data-testid="sign-out"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm text-gray-200 hover:border-[#D4AF37]/40 disabled:opacity-50">
            <LogOut className="w-4 h-4" />{busy === 'one' ? 'Signing out…' : 'Sign out'}</button>
          <button type="button" onClick={() => out(true)} disabled={!!busy} data-testid="sign-out-everywhere"
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs text-gray-400 hover:text-gray-200 disabled:opacity-50">
            <MonitorSmartphone className="w-4 h-4" />{busy === 'all' ? 'Signing out…' : 'Sign out of every device'}</button>
        </div>
      </> : <div className="mt-3">
        <p className="mb-3 text-xs text-gray-400">Sign in with your WhatsApp number and your delivery details fill in by themselves at checkout.</p>
        <WhatsAppSignIn onDone={() => { toast.success('Signed in'); setTimeout(() => setOpen(false), 1200); }} />
      </div>}
    </div>}
  </div>;
}
