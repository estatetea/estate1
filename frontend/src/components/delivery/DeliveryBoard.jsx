import { useMemo, useState } from 'react';
import { AlertCircle, BookmarkPlus, Rows3, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { DeliverySummary, SUMMARY_BUCKETS, inBucket } from './DeliverySummary';
import { DeliveryToolbar } from './DeliveryToolbar';
import { DeliveryRow } from './DeliveryRow';
import { DeliveryPanel } from './DeliveryPanel';
import { orderNumber, recipientName, isPaymentVerified } from '@/lib/delivery-status';

const keyOf = o => o.internal_order_id || o.order_id || o.id;

function applyFilters(orders, { query, status, payment, bucket }) {
  const q = query.trim().toLowerCase();
  const b = SUMMARY_BUCKETS.find(x => x.id === bucket);
  return orders.filter(o =>
    (!q || [orderNumber(o), recipientName(o), o.customer_name].some(v => v && String(v).toLowerCase().includes(q))) &&
    (status === 'all' || (status === 'none' ? !o.delivery_status : o.delivery_status === status)) &&
    (payment === 'all' || (payment === 'verified') === isPaymentVerified(o)) &&
    (!b || inBucket(b, o)));
}

export const DeliveryBoard = ({ orders, loading, error, headers, reload }) => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [payment, setPayment] = useState('all');
  const [bucket, setBucket] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);\n  const [compact,setCompact] = useState(false);\n  const [preferencesLoaded,setPreferencesLoaded] = useState(false);\n  const [savedViews,setSavedViews] = useState([]);\n  const [viewName,setViewName] = useState('');\n  useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem('estate-owner-delivery-views')||'[]');if(Array.isArray(saved))setSavedViews(saved);setCompact(localStorage.getItem('estate-owner-delivery-compact')==='true')}catch{}finally{setPreferencesLoaded(true)}},[]);\n  useEffect(()=>{if(!preferencesLoaded)return;try{localStorage.setItem('estate-owner-delivery-views',JSON.stringify(savedViews));localStorage.setItem('estate-owner-delivery-compact',String(compact))}catch{}},[savedViews,compact,preferencesLoaded]);\n  const applyView=v=>{setQuery(v.query||'');setStatus(v.status||'all');setPayment(v.payment||'all');setBucket(v.bucket||null);setCompact(Boolean(v.compact));};\n  const saveView=()=>{const name=viewName.trim();if(!name)return toast.error('Name this view first');if(savedViews.some(v=>v.name.toLowerCase()===name.toLowerCase()))return toast.error('A view with that name already exists');setSavedViews(old=>[...old,{name,query,status,payment,bucket,compact}]);setViewName('');toast.success('View saved on this device')};\n
  const visible = useMemo(() => applyFilters(orders, { query, status, payment, bucket }), [orders, query, status, payment, bucket]);
  const selected = orders.find(o => keyOf(o) === selectedKey) || null;

  return (
    <div className="space-y-5" data-testid="admin-orders-section">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]/70">Fulfilment</p>
          <h2 className="font-['Cormorant_Garamond'] text-3xl font-light text-white sm:text-4xl">Deliveries</h2>
        </div>
        <p className="pb-1 text-xs text-gray-500" data-testid="delivery-visible-count">{visible.length} of {orders.length} orders</p>
      </div>
      <DeliverySummary orders={orders} active={bucket} onSelect={setBucket} />
      <div className="flex flex-wrap items-center gap-2" data-testid="delivery-saved-views"><span className="mr-1 text-[10px] uppercase tracking-wider text-gray-600">Quick views</span><button onClick={()=>applyView({})} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-400 hover:text-white">All orders</button><button onClick={()=>applyView({bucket:'exceptions'})} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-400 hover:border-amber-300/30 hover:text-amber-100">Exceptions</button><button onClick={()=>applyView({payment:'unverified'})} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-400 hover:text-white">Payment unverified</button><button onClick={()=>applyView({status:'OUT_FOR_DELIVERY'})} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-400 hover:text-white">In transit</button><button onClick={()=>setCompact(v=>!v)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-400 hover:text-[#d5b56a]">{compact?<LayoutGrid className="h-3.5 w-3.5"/>:<Rows3 className="h-3.5 w-3.5"/>}{compact?'Comfortable rows':'Compact rows'}</button></div>
      <div className="flex flex-col gap-2 sm:flex-row"><input value={viewName} onChange={e=>setViewName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&saveView()} placeholder="Name current filters to save a view" className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-gray-300 placeholder:text-gray-600"/><button onClick={saveView} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d5b56a]/20 px-3 py-2 text-xs text-[#d5b56a]"><BookmarkPlus className="h-3.5 w-3.5"/>Save current view</button>{savedViews.map(v=><div key={v.name} className="flex items-center gap-1"><button onClick={()=>applyView(v)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 hover:border-[#d5b56a]/30">{v.name}</button><button onClick={()=>setSavedViews(old=>old.filter(x=>x.name!==v.name))} aria-label={`Delete ${v.name} saved view`} className="rounded-lg p-2 text-gray-600 hover:text-red-300">×</button></div>)}</div>
      <DeliveryToolbar query={query} setQuery={setQuery} status={status} setStatus={setStatus} payment={payment} setPayment={setPayment} onRefresh={reload} loading={loading} />
      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-red-400/30 bg-red-500/[0.06] p-3 text-sm text-red-200" data-testid="delivery-load-error">
          <AlertCircle className="h-4 w-4 shrink-0" /><p className="flex-1">{error}</p>
          <button type="button" onClick={reload} className="rounded-lg border border-red-300/30 px-3 py-1.5 text-xs hover:bg-red-400/10" data-testid="delivery-retry-button">Retry</button>
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0a]" data-testid="delivery-list">
        {loading && !orders.length && [0, 1, 2].map(i => <div key={i} className="h-[76px] animate-pulse border-b border-white/[0.06] bg-white/[0.015]" />)}
        {!loading && !visible.length && <p className="px-5 py-12 text-center text-sm text-gray-500" data-testid="delivery-empty">{orders.length ? 'No orders match these filters.' : 'No orders yet.'}</p>}
        {visible.map((order, i) => <DeliveryRow key={keyOf(order) || i} order={order} index={i} compact={compact} onOpen={o => setSelectedKey(keyOf(o))} />)}
      </div>
      {selected && <DeliveryPanel order={selected} headers={headers} onClose={() => setSelectedKey(null)} onSaved={reload} />}
    </div>
  );
};
