'use client';
import {useEffect,useRef,useState} from 'react';
import {Mic,MicOff,Volume2,Square} from 'lucide-react';
import {toast} from 'sonner';
import {Scribe,AudioFormat,CommitStrategy,RealtimeEvents} from '@elevenlabs/client';

export default function AegisRealtimeVoice({token}){
  const [state,setState]=useState('idle'),[turns,setTurns]=useState([]);
  const connectionRef=useRef(null),audioRef=useRef(null),busyRef=useRef(false),primedAudioRef=useRef(null);
  const headers={'Content-Type':'application/json',Authorization:`Bearer ${token}`};

  const primeAudio=()=>{
    try{
      const audio=primedAudioRef.current||new Audio();
      audio.playsInline=true;
      audio.volume=1;
      primedAudioRef.current=audio;
      const p=audio.play();
      if(p?.catch)p.catch(()=>{});
      audio.pause();
    }catch{}
  };
  const stopAudio=()=>{if(audioRef.current){audioRef.current.pause();if(audioRef.current.src)URL.revokeObjectURL(audioRef.current.src);audioRef.current=null}setState(s=>s==='speaking'||s==='preparing'?'idle':s)};
  const stopListening=()=>{try{connectionRef.current?.close()}catch{}connectionRef.current=null;setState(s=>s==='listening'||s==='transcribing'?'idle':s)};
  useEffect(()=>()=>{stopListening();stopAudio()},[]);

  const speak=async text=>{
    if(!text)return;
    try{
      stopAudio();setState('preparing');
      const r=await fetch('/api/admin/aegis/voice',{method:'POST',headers,body:JSON.stringify({text})});
      if(!r.ok)throw new Error('Aegis voice is unavailable');
      const blob=await r.blob(),url=URL.createObjectURL(blob);
      const audio=primedAudioRef.current||new Audio();
      primedAudioRef.current=audio;audio.playsInline=true;audio.src=url;audioRef.current=audio;
      audio.onended=()=>{URL.revokeObjectURL(url);audio.removeAttribute('src');audio.load();audioRef.current=null;setState('idle')};
      audio.onerror=()=>{URL.revokeObjectURL(url);audioRef.current=null;setState('idle')};
      setState('speaking');
      await audio.play();
    }catch(e){setState('idle');if(e?.name==='NotAllowedError')toast.error('iPhone blocked automatic audio. Tap Speak again once.');else toast.error(e.message||'Aegis voice is unavailable')}
  };

  const askAegis=async text=>{
    text=String(text||'').trim();if(!text||busyRef.current)return;
    busyRef.current=true;setState('thinking');setTurns(t=>[...t,{role:'owner',text}]);
    try{
      const r=await fetch('/api/admin/aegis/chat',{method:'POST',headers,body:JSON.stringify({message:text})});
      const b=await r.json();if(!r.ok)throw new Error(b.detail||b.error||'Aegis could not respond');
      const answer=String(b.response||'').trim();
      if(answer)setTurns(t=>[...t,{role:'aegis',text:answer}]);
      setState('idle');if(answer)await speak(answer);
    }catch(e){setState('idle');toast.error(e.message||'Aegis could not respond')}finally{busyRef.current=false}
  };

  const start=async()=>{
    if(state!=='idle')return;if(!navigator.mediaDevices?.getUserMedia)return toast.error('Microphone access is not available');
    primeAudio();
    try{
      setState('connecting');
      const tr=await fetch('/api/admin/aegis/transcribe-token',{method:'POST',headers});const tb=await tr.json();
      if(!tr.ok||!tb.token)throw new Error(tb.error||tb.detail||'Realtime transcription is unavailable');
      let committed='';
      const connection=Scribe.connect({token:tb.token,modelId:'scribe_v2_realtime',audioFormat:AudioFormat.PCM_16000,commitStrategy:CommitStrategy.VAD,vadSilenceThresholdSecs:0.9,vadThreshold:0.4,minSpeechDurationMs:100,minSilenceDurationMs:100,languageCode:'en',keyterms:['Aegis','Estate Tea','Scout','Brew','Steward','Ledger','Muse','Nilgiris','Kotagiri'],microphone:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      connectionRef.current=connection;
      connection.on(RealtimeEvents.SESSION_STARTED,()=>setState('listening'));
      connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT,data=>{const text=String(data?.text||'').trim();if(text)setState('transcribing')});
      connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT,data=>{const text=String(data?.text||'').trim();if(!text)return;committed=[committed,text].filter(Boolean).join(' ').trim();try{connection.close()}catch{}connectionRef.current=null;askAegis(committed)});
      connection.on(RealtimeEvents.ERROR,()=>{stopListening();setState('idle');toast.error('Realtime transcription had a problem. Please try again.')});
    }catch(e){setState('idle');toast.error(e.message||'Could not start realtime voice')}
  };

  const active=state!=='idle';const lastAegis=[...turns].reverse().find(t=>t.role==='aegis');
  return <div className="fixed bottom-4 right-4 z-[70] w-[min(360px,calc(100vw-2rem))] max-h-[46vh] overflow-hidden rounded-2xl border border-[#D4AF37]/25 bg-[#0c0c0c]/95 backdrop-blur-xl shadow-2xl p-4 text-white">
    <div className="flex items-center justify-between gap-3"><div><p className="text-sm text-[#efbd63]">Talk to Aegis</p><p className="text-[10px] text-gray-500">ElevenLabs realtime · quick pause</p></div><button onClick={active?(state==='speaking'||state==='preparing'?stopAudio:stopListening):start} disabled={state==='thinking'||state==='connecting'} className={`w-11 h-11 rounded-full flex items-center justify-center ${active?'bg-red-400/10 text-red-300 border border-red-400/30':'bg-[#D4AF37] text-black'} disabled:opacity-40`}>{active?(state==='speaking'||state==='preparing'?<Square className="w-4 h-4"/>:<MicOff className="w-5 h-5"/>):<Mic className="w-5 h-5"/>}</button></div>
    {state!=='idle'&&<p className="mt-3 text-[11px] text-gray-400">{state==='connecting'?'Opening microphone…':state==='listening'?'Listening…':state==='transcribing'?'Listening — pause when you’re finished…':state==='thinking'?'Aegis is thinking…':state==='preparing'?'Preparing voice…':state==='speaking'?'Aegis is speaking…':''}</p>}
    {turns.length>0&&<div className="mt-3 max-h-52 overflow-y-auto pr-1 space-y-2">{turns.slice(-8).map((turn,i)=><div key={`${turn.role}-${i}`} className={`text-xs leading-relaxed ${turn.role==='owner'?'text-gray-300':'text-white'}`}><span className={turn.role==='aegis'?'text-[#efbd63]':'text-gray-500'}>{turn.role==='aegis'?'Aegis':'You'}:</span> {turn.text}</div>)}</div>}
    {lastAegis&&<button onClick={()=>{primeAudio();speak(lastAegis.text)}} className="mt-3 flex items-center gap-1.5 text-[11px] text-[#efbd63]"><Volume2 className="w-3.5 h-3.5"/>Speak again</button>}
  </div>;
}
