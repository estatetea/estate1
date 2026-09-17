'use client';
import {useEffect,useRef,useState} from 'react';
import {Mic,MicOff,Volume2,Square} from 'lucide-react';
import {toast} from 'sonner';
import {Scribe,AudioFormat,CommitStrategy,RealtimeEvents} from '@elevenlabs/client';

export default function AegisRealtimeVoice({token}){
  const [state,setState]=useState('idle'),[transcript,setTranscript]=useState(''),[reply,setReply]=useState('');
  const connectionRef=useRef(null),audioRef=useRef(null),busyRef=useRef(false);
  const headers={'Content-Type':'application/json',Authorization:`Bearer ${token}`};

  const stopAudio=()=>{if(audioRef.current){audioRef.current.pause();if(audioRef.current.src)URL.revokeObjectURL(audioRef.current.src);audioRef.current=null}if(state==='speaking')setState('idle')};
  const stopListening=()=>{try{connectionRef.current?.close()}catch{}connectionRef.current=null;if(state==='listening'||state==='transcribing')setState('idle')};
  useEffect(()=>()=>{stopListening();stopAudio()},[]);

  const speak=async text=>{if(!text)return;try{stopAudio();setState('speaking');const r=await fetch('/api/admin/aegis/voice',{method:'POST',headers,body:JSON.stringify({text})});if(!r.ok)throw new Error('Aegis voice is unavailable');const blob=await r.blob(),url=URL.createObjectURL(blob),audio=new Audio(url);audioRef.current=audio;audio.onended=()=>{URL.revokeObjectURL(url);audioRef.current=null;setState('idle')};audio.onerror=()=>{URL.revokeObjectURL(url);audioRef.current=null;setState('idle')};await audio.play()}catch(e){setState('idle');if(e?.name==='NotAllowedError')toast.error('Tap Speak to hear Aegis');else toast.error(e.message||'Aegis voice is unavailable')}};

  const askAegis=async text=>{text=String(text||'').trim();if(!text||busyRef.current)return;busyRef.current=true;setState('thinking');setTranscript(text);try{const r=await fetch('/api/admin/aegis/chat',{method:'POST',headers,body:JSON.stringify({message:text})});const b=await r.json();if(!r.ok)throw new Error(b.detail||b.error||'Aegis could not respond');const answer=b.response||'';setReply(answer);setState('idle');if(answer)await speak(answer)}catch(e){setState('idle');toast.error(e.message||'Aegis could not respond')}finally{busyRef.current=false}};

  const start=async()=>{if(state!=='idle')return;if(!navigator.mediaDevices?.getUserMedia)return toast.error('Microphone access is not available');setTranscript('');setReply('');try{const tr=await fetch('/api/admin/aegis/transcribe-token',{method:'POST',headers});const tb=await tr.json();if(!tr.ok||!tb.token)throw new Error(tb.error||tb.detail||'Realtime transcription is unavailable');setState('listening');let committed='';const connection=Scribe.connect({token:tb.token,modelId:'scribe_v2_realtime',audioFormat:AudioFormat.PCM_16000,commitStrategy:CommitStrategy.VAD,vadSilenceThresholdSecs:1.8,vadThreshold:0.4,minSpeechDurationMs:100,minSilenceDurationMs:100,microphone:{echoCancellation:true,noiseSuppression:true}});connectionRef.current=connection;connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT,data=>{const text=String(data?.text||'').trim();if(text){setState('transcribing');setTranscript([committed,text].filter(Boolean).join(' '))}});connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT,data=>{const text=String(data?.text||'').trim();if(!text)return;committed=[committed,text].filter(Boolean).join(' ').trim();setTranscript(committed);try{connection.close()}catch{}connectionRef.current=null;askAegis(committed)});connection.on(RealtimeEvents.ERROR,()=>{stopListening();toast.error('Realtime transcription had a problem. Please try again.')})}catch(e){setState('idle');toast.error(e.message||'Could not start realtime voice')}};

  const active=state!=='idle';
  return <div className="fixed bottom-4 right-4 z-[70] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-[#D4AF37]/25 bg-[#0c0c0c]/95 backdrop-blur-xl shadow-2xl p-4 text-white">
    <div className="flex items-center justify-between gap-3"><div><p className="text-sm text-[#efbd63]">Talk to Aegis</p><p className="text-[10px] text-gray-500">ElevenLabs realtime · 1.8s pause</p></div><button onClick={active?(state==='speaking'?stopAudio:stopListening):start} disabled={state==='thinking'} className={`w-11 h-11 rounded-full flex items-center justify-center ${active?'bg-red-400/10 text-red-300 border border-red-400/30':'bg-[#D4AF37] text-black'} disabled:opacity-40`}>{active?(state==='speaking'?<Square className="w-4 h-4"/>:<MicOff className="w-5 h-5"/>):<Mic className="w-5 h-5"/>}</button></div>
    {state!=='idle'&&<p className="mt-3 text-[11px] text-gray-400">{state==='listening'?'Listening…':state==='transcribing'?'Listening — pause when you’re finished…':state==='thinking'?'Aegis is thinking…':state==='speaking'?'Aegis is speaking…':''}</p>}
    {transcript&&<p className="mt-2 text-xs text-gray-300 line-clamp-3">You: {transcript}</p>}
    {reply&&<div className="mt-3 border-t border-white/10 pt-3"><p className="text-xs text-gray-300 line-clamp-4">Aegis: {reply}</p><button onClick={()=>speak(reply)} className="mt-2 flex items-center gap-1.5 text-[11px] text-[#efbd63]"><Volume2 className="w-3.5 h-3.5"/>Speak again</button></div>}
  </div>;
}
