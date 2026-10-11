'use client';
import { useState } from 'react';
import { MessageCircle, X, ArrowLeft, ArrowRight } from 'lucide-react';

const MENU = [
  ['explore', 'Explore Estate Tea'],
  ['prices', 'Prices & Pack Sizes'],
  ['order', 'Place an Order'],
  ['existing', 'Existing Order'],
  ['bulk', 'Bulk Orders'],
];

export default function WebsiteBrew({ navigate }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('home');
  const [bulkName, setBulkName] = useState('');
  const [bulkContact, setBulkContact] = useState('');
  const [bulkQuantity, setBulkQuantity] = useState('10');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderEmail, setOrderEmail] = useState('');
  const [orderLookup, setOrderLookup] = useState(null);
  const [orderLookupLoading, setOrderLookupLoading] = useState(false);
  const go = next => setStep(next);
  const chip = (label, next, subtle = false) => <button type="button" onClick={() => go(next)}
    className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${subtle ? 'border-transparent text-gray-400 hover:text-[#D4AF37]' : 'border-[#D4AF37]/25 text-[#e6d4a2] hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/[0.06]'}`}>{label}</button>;
  return <div className="fixed bottom-5 right-5 z-[80] font-sans">
    {!open ? <button type="button" aria-label="Chat with Brew" onClick={() => setOpen(true)}
      className="flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#14120f] px-4 py-3 text-[#D4AF37] shadow-xl">
      <MessageCircle size={18}/> <span className="text-sm">Ask Brew</span>
    </button> : <section aria-label="Brew, Estate Tea website assistant"
      className="w-[min(370px,calc(100vw-32px))] max-h-[min(580px,calc(100dvh-40px))] overflow-y-auto rounded-2xl border border-[#D4AF37]/25 bg-[#100f0d] text-gray-200 shadow-2xl">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#100f0d] px-4 py-3">
        <div><p className="text-sm font-semibold text-[#D4AF37]">Brew · Estate Tea</p><p className="text-[11px] text-gray-500">Your tea experience starts here</p></div>
        <button type="button" aria-label="Close Brew" onClick={() => setOpen(false)} className="p-2 text-gray-400 hover:text-white"><X size={17}/></button>
      </header>
      <div className="space-y-4 px-4 py-5 text-sm leading-7">
        {step === 'home' && <p>Welcome to Estate Tea. I'm Brew, and I'd be delighted to help you discover your next favourite cup. What would you like to explore?</p>}
        {step === 'explore' && <div className="space-y-4">
          <div className="space-y-4 rounded-xl border border-[#D4AF37]/25 bg-gradient-to-b from-[#D4AF37]/[0.065] to-[#D4AF37]/[0.015] px-5 py-5 shadow-[inset_0_1px_0_rgba(212,175,55,0.08)]">
            <p>There's something special about a cup of tea that brings a little more to your everyday routine.</p>
            <p>Estate Tea brings you <strong className="text-[#e6d4a2]">premium black CTC tea powder from the Nilgiris</strong>, with a rich aroma, a beautifully full-bodied character and a refreshing finish.</p>
            <p>Made for those who appreciate a satisfying cup, whether it's a comforting morning chai or a quiet afternoon tea.</p>
          </div>
          <p className="px-1 pt-1 text-[13px] leading-6 tracking-[0.01em] text-[#e6d4a2]">Would you like to explore our packet sizes and prices?</p>
        </div>}
        {step === 'prices' && <><p>A little everyday luxury, in the size that suits you.</p>
          <div className="grid grid-cols-2 gap-2">
            {[['250 g','₹180'],['500 g','₹360']].map(([size,price]) => <div key={size} className="rounded-xl border border-white/10 bg-white/[.035] p-3">
              <p className="text-xs text-gray-400">Estate Tea</p><p className="font-medium">{size}</p><p className="text-lg text-[#D4AF37]">{price}</p></div>)}
          </div><p>Would you like to place an order?</p></>}
        {step === 'order' && <><p>Wonderful. Choose your preferred packet size and quantity in our store, then complete your delivery details through Estate Tea's secure checkout.</p>
          <p className="text-xs text-gray-400">Our retail packets are available in 250 g and 500 g sizes.</p></>}
        {step === 'existing' && <div className="space-y-3">
          <p>Already placed an order? Enter your Estate Tea order number and the email address used at checkout to check its progress.</p>
          <form className="space-y-3" onSubmit={async e => {
            e.preventDefault(); setOrderLookup(null); setOrderLookupLoading(true);
            try {
              const response = await fetch('/api/website-orders/lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estate_order_number: orderNumber.trim().toUpperCase(), email: orderEmail.trim() }) });
              const data = await response.json().catch(() => ({}));
              if (!response.ok) throw new Error(data.error || data.detail || 'We could not find that order. Check the order number and email address.');
              setOrderLookup(data);
            } catch (error) { setOrderLookup({ error: error.message || 'Order lookup is temporarily unavailable. Please try again.' }); }
            finally { setOrderLookupLoading(false); }
          }}>
            <label className="block text-xs text-gray-400">Estate Tea order number
              <input required value={orderNumber} onChange={e=>setOrderNumber(e.target.value)} placeholder="ET-0001" autoCapitalize="characters" className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 p-2.5 text-white placeholder:text-gray-600 focus:border-[#D4AF37] focus:outline-none"/>
            </label>
            <label className="block text-xs text-gray-400">Email used for the order
              <input required type="email" value={orderEmail} onChange={e=>setOrderEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 p-2.5 text-white placeholder:text-gray-600 focus:border-[#D4AF37] focus:outline-none"/>
            </label>
            <button type="submit" disabled={orderLookupLoading || !orderNumber.trim() || !orderEmail.trim()} className="w-full rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-2.5 text-sm font-medium text-[#e6d4a2] disabled:opacity-50">{orderLookupLoading ? 'Checking order…' : 'Check order progress'}</button>
          </form>
          {orderLookup?.error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-200">{orderLookup.error}</p>}
          {orderLookup && !orderLookup.error && <div className="space-y-2 rounded-lg border border-[#D4AF37]/25 bg-white/[.03] p-3">
            <p className="font-semibold text-[#D4AF37]">Order {orderLookup.estate_order_number}</p>
            <p className="text-xs text-gray-300">Order status: <strong>{orderLookup.order_status || 'Being processed'}</strong></p>
            <p className="text-xs text-gray-300">Payment status: <strong>{orderLookup.payment_status || 'Awaiting confirmation'}</strong></p>
            {orderLookup.created_at && <p className="text-xs text-gray-500">Placed: {new Date(orderLookup.created_at).toLocaleDateString('en-IN')}</p>}
            <p className="text-xs text-gray-400">If you need help, contact Estate Tea and quote this order number.</p>
          </div>}
          <p className="text-[11px] leading-5 text-gray-500">For your privacy, order details are only shown after your email is verified against the order.</p>
        </div>}
        {step === 'bulk' && <><p>Planning to serve Estate Tea on a larger scale? We welcome bulk enquiries from 10 kg onwards.</p>
          <p className="text-xs text-gray-400">You can prepare an enquiry below. No order or price is confirmed until our team reviews it.</p>
          <label className="block text-xs text-gray-400">Name<input value={bulkName} onChange={e=>setBulkName(e.target.value)} className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 p-2 text-white"/></label>
          <label className="block text-xs text-gray-400">Contact<input value={bulkContact} onChange={e=>setBulkContact(e.target.value)} className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 p-2 text-white"/></label>
          <label className="block text-xs text-gray-400">Quantity (kg)<input type="number" min="10" value={bulkQuantity} onChange={e=>setBulkQuantity(e.target.value)} className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 p-2 text-white"/></label></>}
        {step === 'later' && <p>Of course. Take your time exploring Estate Tea. Whenever you're ready, I'll be here to help.</p>}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {step === 'home' && MENU.map(([id,label])=><span key={id}>{chip(label,id)}</span>)}
          {step === 'explore' && <>{chip('Yes, show prices →','prices')}{chip('Not now','later',true)}</>}
          {step === 'prices' && <>{chip('Place an order →','order')}{chip('Maybe later','later',true)}</>}
          {step === 'order' && <button type="button" onClick={()=>{setOpen(false);document.getElementById('shop-tea')?.scrollIntoView({behavior:'smooth',block:'start'});}} className="rounded-full border border-[#D4AF37]/35 px-3 py-1.5 text-xs text-[#e6d4a2] hover:bg-[#D4AF37]/10">Explore packets in store <ArrowRight size={12} className="inline"/></button>}
          {step === 'bulk' && <button type="button" disabled={!bulkName.trim() || !bulkContact.trim() || !(Number(bulkQuantity)>=10)} onClick={()=>{const body=`Estate Tea bulk enquiry\nName: ${bulkName}\nContact: ${bulkContact}\nQuantity: ${bulkQuantity} kg`;if(navigator.clipboard?.writeText){navigator.clipboard.writeText(body).then(()=>window.alert('Enquiry copied. Please share it with Estate Tea through your preferred contact channel.')).catch(()=>window.prompt('Copy your enquiry:',body));}else{window.prompt('Copy your enquiry:',body);}}} className="rounded-full border border-[#D4AF37]/35 px-3 py-1.5 text-xs text-[#e6d4a2] disabled:opacity-40">Copy bulk enquiry</button>}
          {step !== 'home' && <button type="button" onClick={()=>go('home')} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-gray-400 hover:text-[#D4AF37]"><ArrowLeft size={12}/> Main menu</button>}
        </div>
      </div>
    </section>}
  </div>;
}
