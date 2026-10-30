'use client';
import { useState } from 'react';
import { Info } from 'lucide-react';

// A small ⓘ that explains a choice: shows on hover, or on tap on a phone.
export function WhyInfo({ text, className = '' }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  return (
    <span className={`group relative inline-flex align-middle ${className}`}>
      <button type="button" aria-label="Why?" onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o); }} onBlur={() => setOpen(false)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-gray-500 hover:text-[#efbd63] focus:text-[#efbd63] outline-none">
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span role="tooltip"
        className={`pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-60 max-w-[70vw] -translate-x-1/2 rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-left text-[11px] font-normal normal-case leading-4 tracking-normal text-gray-200 shadow-xl transition-opacity ${open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {text}
      </span>
    </span>
  );
}
