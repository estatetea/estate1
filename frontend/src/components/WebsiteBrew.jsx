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
  const go = next => setStep(next);
  const chip = (label, next, subtle = false) => <button type="button" onClick={() => go(next)}
    className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${subtle ? 'border-transparent text-gray-400 hover:text-[#D4AF37]' : 'border-[#D4AF37]/35 text-[#e6d4a2] hover:bg-[#D4AF37]/10'}`}>{label}</button>;
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
        {step === 'explore' && <><p>There's something special about a cup of tea that brings a little more to your everyday routine.</p>
          <p>Estate Tea brings you <strong className="text-[#e6d4a2]">premium black CTC tea powder from the Nilgiris</strong>, with a rich aroma, a beautifully full-bodied character and a refreshing finish.</p>
          <p>Made for those who appreciate a satisfying cup, whether it's a comforting morning chai or a quiet afternoon tea.</p>
          <p>Would you like to explore our packet sizes and prices?</p></>}
        {step === 'prices' && <><p>A little everyday luxury, in the size that suits you.</p>
          <div className="grid grid-cols-2 gap-2">
            {[['250 g','₹180'],['500 g','₹360']].map(([size,price]) => <div key={size} className="rounded-xl border border-white/10 bg-white/[.035] p-3">
              <p className="text-xs text-gray-400">Estate Tea</p><p className="font-medium">{size}</p><p className="text-lg text-[#D4AF37]">{price}</p></div>)}
          </div><p>Would you like to place an order?</p></>}
        {step === 'order' && <><p>Wonderful. Choose your preferred packet size and quantity in our store, then complete your delivery details through Estate Tea's secure checkout.</p>
          <p className="text-xs text-gray-400">Our retail packets are available in 250 g and 500 g sizes.</p></>}
        {step === 'existing' && <><p>Already placed an order? We're happy to help you check its progress.</p>
          <p>Our standard delivery window is 3–5 days from order placement, and we aim to deliver sooner wherever possible. To protect your information, we'll verify your order before sharing its status.</p>
          <p className="text-xs text-gray-400">Live order tracking through Brew is not available yet. Please use your existing order confirmation or contact Estate Tea for assistance.</p></>}
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
          {step === 'order' && <button type="button" onClick={()=>{setOpen(false);navigate('store')}} className="rounded-full border border-[#D4AF37]/35 px-3 py-1.5 text-xs text-[#e6d4a2] hover:bg-[#D4AF37]/10">Explore packets in store <ArrowRight size={12} className="inline"/></button>}
          {step === 'bulk' && <button type="button" disabled={!bulkName.trim() || !bulkContact.trim() || !(Number(bulkQuantity)>=10)} onClick={()=>{const body=`Estate Tea bulk enquiry\nName: ${bulkName}\nContact: ${bulkContact}\nQuantity: ${bulkQuantity} kg`;if(navigator.clipboard?.writeText){navigator.clipboard.writeText(body).then(()=>window.alert('Enquiry copied. Please share it with Estate Tea through your preferred contact channel.')).catch(()=>window.prompt('Copy your enquiry:',body));}else{window.prompt('Copy your enquiry:',body);}}} className="rounded-full border border-[#D4AF37]/35 px-3 py-1.5 text-xs text-[#e6d4a2] disabled:opacity-40">Copy bulk enquiry</button>}
          {step !== 'home' && <button type="button" onClick={()=>go('home')} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-gray-400 hover:text-[#D4AF37]"><ArrowLeft size={12}/> Main menu</button>}
        </div>
      </div>
    </section>}
  </div>;
}
