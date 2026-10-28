import { useEffect, useState } from 'react';

// The rules every Estate Tea agent follows: what they never share, who they answer to, honesty, money and conduct.
export function AgentPolicy({ headers }) {
  const auth = headers?.Authorization;
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!open || data) return;
    fetch('/api/admin/agent-policy', { headers: { Authorization: auth }, cache: 'no-store' })
      .then(r => r.ok ? r.json() : null).then(setData).catch(() => {});
  }, [open, data, auth]);
  return <div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6">
    <button onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between text-left">
      <span><span className="block text-xl text-[#efbd63]">Agent policy</span><span className="mt-1 block text-xs text-gray-500">The rules every agent follows: what they never share, who they answer to, honesty and money.</span></span>
      <span className="text-xs text-gray-400">{open ? 'Hide' : 'Read'}</span>
    </button>
    {open && <div className="mt-4">
      {data?.policy ? <><p className="text-[11px] text-gray-500">Version {data.version}</p>
        <pre className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/[.06] bg-black/30 p-4 font-sans text-xs leading-6 text-gray-300">{data.policy}</pre></>
        : <p className="text-xs text-gray-500">Loading…</p>}
    </div>}
  </div>;
}
