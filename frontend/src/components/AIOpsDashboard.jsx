import { useState } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { toast } from 'sonner';
import AIOpsPanel from './AIOpsPanel';

export default function AIOpsDashboard({ navigate }) {
  const [token, setToken] = useState(null);
  const [password, setPassword] = useState('');
  const [logging, setLogging] = useState(false);

  const login = async () => {
    setLogging(true);
    try {
      const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      if (!r.ok) throw new Error();
      setToken((await r.json()).token);
      toast.success('Connected to Estate Tea AI');
    } catch { toast.error('Wrong password'); }
    finally { setLogging(false); }
  };

  if (!token) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4"><div className="card-surface rounded-2xl p-6 sm:p-8 max-w-sm w-full border border-white/10"><div className="text-center mb-6"><div className="mx-auto w-14 h-14 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mb-4"><Lock className="w-6 h-6 text-[#D4AF37]"/></div><h1 className="text-2xl font-light gold-text">Estate Tea AI</h1><p className="text-xs text-gray-500 mt-1">Owner Operations</p></div><input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} placeholder="Enter admin password" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none"/><button onClick={login} disabled={logging||!password} className="mt-4 w-full bg-[#D4AF37] disabled:bg-gray-700 text-black font-medium py-3 rounded-xl text-sm">{logging?'Connecting…':'Open AI Operations'}</button></div></div>;

  return <div className="min-h-screen bg-[#0a0a0a]"><header className="glass-surface border-b border-white/10 sticky top-0 z-50"><div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between"><div className="flex items-center gap-3"><button onClick={()=>navigate('store')} className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5"/></button><div><h1 className="text-lg font-light gold-text">Estate Tea AI</h1><p className="text-[10px] text-gray-600">Owner Command Center</p></div></div><button onClick={()=>{setToken(null);setPassword('')}} className="text-xs text-gray-500 hover:text-red-400">Logout</button></div></header><main className="max-w-6xl mx-auto px-4 py-6"><AIOpsPanel token={token}/></main></div>;
}
