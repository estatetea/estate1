'use client';
import {useEffect,useRef,useState} from 'react';
import {Mic,MicOff,Volume2,Square,ChevronDown,ChevronUp} from 'lucide-react';
import {toast} from 'sonner';
import {Scribe,AudioFormat,CommitStrategy,RealtimeEvents} from '@elevenlabs/client';

export default function AegisRealtimeVoice({token}){
 const [state,setState]=useState('idle'),[turns,setTurns]=useState([]),[collapsed,setCollapsed]=useState(false),[readyToken,setReadyToken]=useState(null);
 const connectionRef=useRef(null),busyRef=useRef(false),ctxRef=useRef(null),sourceRef=useRef(null),requestRef=useRef(null),audioRef=useRef(null),audioUnlockedRef=useRef(false);
 const headers={'Content-Type':'application/json',Authorization:`Bearer ${token}`};
 const unlockAudio=()=>{try{
  // iOS requires media playback permission to originate inside the user's tap.
  // Keep one HTMLAudioElement alive for the whole session instead of creating
  // playback only after Aegis's asynchronous TTS request returns.
  let audio=audioRef.current;
  if(!audio){audio=document.createElement('audio');audio.preload='auto';audio.playsInline=true;audio.setAttribute('playsinline','');audioRef.current=audio}
  if(!audioUnlockedRef.current){
    // Tiny silent WAV. play() is intentionally called synchronously from the tap.
    audio.src='data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAACA';
    const p=audio.play();
    if(p?.then)p.then(()=>{audio.pause();audio.currentTime=0;audioUnlockedRef.current=true}).catch(()=>{});
  }
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
  const ctx=ctxRef.current||new AC();ctxRef.current=ctx;if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  const b=ctx.createBuffer(1,1,22050),s=ctx.createBufferSource();s.buffer=b;s.connect(ctx.destination);s.start(0);return ctx
 }catch{return null}};
 const stopAudio=()=>{requestRef.current?.abort?.();requestRef.current=null;try{sourceRef.current?.stop()}catch{}sourceRef.current=null;try{const a=audioRef.current;if(a){a.pause();a.currentTime=0}}catch{}try{window.speechSynthesis?.cancel()}catch{}setState(s=>s==='speaking'||s==='preparing'?'idle':s)};
 const stopListening=()=>{try{connectionRef.current?.close()}catch{}connectionRef.current=null;setState(s=>s==='listening'||s==='transcribing'||s==='connecting'?'idle':s)};
 const browserSpeak=text=>new Promise((resolve,reject)=>{try{if(!window.speechSynthesis)return reject(new Error('Audio playback is unavailable'));window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-IN';u.rate=0.96;u.pitch=1;u.onend=resolve;u.onerror=()=>reject(new Error('Audio playback failed'));setState('speaking');window.speechSynthesis.speak(u)}catch(e){reject(e)}});
 useEffect(()=>{let alive=true;const warm=async()=>{try{const r=await fetch('/api/admin/aegis/transcribe-token',{method:'POST',headers});const b=await r.json();if(alive&&r.ok&&b.token)setReadyToken(b.token)}catch{}};const id=window.setTimeout(warm,250);return()=>{alive=false;window.clearTimeout(id);stopListening();stopAudio();ctxRef.current?.close?.().catch(()=>{})}},[]);
 const speak=async text=>{if(!text)return;stopAudio();const controller=new AbortController();requestRef.current=controller;let objectUrl=null;try{setState('preparing');const r=await fetch('/api/admin/aegis/voice',{method:'POST',headers,body:JSON.stringify({text}),signal:controller.signal});if(!r.ok){const b=await r.json().catch(()=>({}));throw new Error(b.error||b.detail||'Aegis voice is unavailable')}// Start playback from the response stream when MediaSource supports MP3.
  // This removes the old wait for the complete ElevenLabs file before Aegis speaks.
  const audio=audioRef.current||document.createElement('audio');audioRef.current=audio;audio.playsInline=true;
  if(r.body&&window.MediaSource&&MediaSource.isTypeSupported('audio/mpeg')){
   const ms=new MediaSource();objectUrl=URL.createObjectURL(ms);audio.src=objectUrl;audio.currentTime=0;
   await new Promise((resolve,reject)=>{ms.addEventListener('sourceopen',resolve,{once:true});ms.addEventListener('error',reject,{once:true})});
   const sb=ms.addSourceBuffer('audio/mpeg'),reader=r.body.getReader();let started=false;
   const append=chunk=>new Promise((resolve,reject)=>{const done=()=>{sb.removeEventListener('updateend',done);sb.removeEventListener('error',fail);resolve()};const fail=()=>{sb.removeEventListener('updateend',done);sb.removeEventListener('error',fail);reject(new Error('Audio stream failed'))};sb.addEventListener('updateend',done);sb.addEventListener('error',fail);sb.appendBuffer(chunk)});
   audio.onended=()=>{setState('idle');if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null}};
   setState('speaking');
   while(true){const {done,value}=await reader.read();if(done)break;if(controller.signal.aborted){reader.cancel();return}if(value?.length){await append(value);if(!started){started=true;await audio.play();audioUnlockedRef.current=true}}}
   if(ms.readyState==='open'&&!sb.updating)ms.endOfStream();
   return;
  }
  const blob=await r.blob();if(controller.signal.aborted)return;
  objectUrl=URL.createObjectURL(blob);audio.src=objectUrl;audio.currentTime=0;
  audio.onended=()=>{setState('idle');if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null}};
  audio.onerror=()=>{};
  try{setState('speaking');await audio.play();audioUnlockedRef.current=true;return}catch(mediaError){
    // Second choice: resumed Web Audio. This also covers browsers where the
    // HTML media element cannot consume the returned TTS blob.
    const ctx=unlockAudio();if(!ctx)throw mediaError;if(ctx.state==='suspended')await ctx.resume();
    const bytes=await blob.arrayBuffer();const buffer=await ctx.decodeAudioData(bytes.slice(0));if(controller.signal.aborted)return;const src=ctx.createBufferSource();src.buffer=buffer;src.connect(ctx.destination);sourceRef.current=src;src.onended=()=>{if(sourceRef.current===src)sourceRef.current=null;setState('idle');if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null}};setState('speaking');src.start(0)
  }}catch(e){if(e?.name==='AbortError')return;if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null}try{await browserSpeak(text);setState('idle')}catch{setState('idle');toast.error(e.message||'Aegis voice is unavailable')}}finally{if(requestRef.current===controller)requestRef.current=null}};
 const askAegis=async text=>{text=String(text||'').trim();if(!text||busyRef.current)return;busyRef.current=true;setState('thinking');setTurns(t=>[...t,{role:'owner',text}]);try{const r=await fetch('/api/admin/aegis/chat',{method:'POST',headers,body:JSON.stringify({message:text})});const b=await r.json();if(!r.ok)throw new Error(b.detail||b.error||'Aegis could not respond');const answer=String(b.response||'').trim();if(answer)setTurns(t=>[...t,{role:'aegis',text:answer}]);setState('idle');if(answer)await speak(answer)}catch(e){setState('idle');toast.error(e.message||'Aegis could not respond')}finally{busyRef.current=false}};
 const start=async()=>{if(state!=='idle')return;if(!navigator.mediaDevices?.getUserMedia)return toast.error('Microphone access is not available');unlockAudio();try{setState('connecting');let scribeToken=readyToken;setReadyToken(null);if(!scribeToken){const tr=await fetch('/api/admin/aegis/transcribe-token',{method:'POST',headers});const tb=await tr.json();if(!tr.ok||!tb.token)throw new Error(tb.error||tb.detail||'Realtime transcription is unavailable');scribeToken=tb.token}let committed='';const connection=Scribe.connect({token:scribeToken,modelId:'scribe_v2_realtime',audioFormat:AudioFormat.PCM_16000,commitStrategy:CommitStrategy.VAD,vadSilenceThresholdSecs:0.9,vadThreshold:0.4,minSpeechDurationMs:100,minSilenceDurationMs:100,languageCode:'en',keyterms:['Aegis','Estate Tea','Scout','Brew','Steward','Ledger','Muse','Nilgiris','Kotagiri'],microphone:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});connectionRef.current=connection;connection.on(RealtimeEvents.SESSION_STARTED,()=>setState('listening'));connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT,d=>{if(String(d?.text||'').trim())setState('transcribing')});connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT,d=>{const text=String(d?.text||'').trim();if(!text)return;committed=[committed,text].filter(Boolean).join(' ').trim();try{connection.close()}catch{}connectionRef.current=null;askAegis(committed)});connection.on(RealtimeEvents.ERROR,()=>{stopListening();setState('idle');toast.error('Realtime transcription had a problem. Please try again.')})}catch(e){setState('idle');toast.error(e.message||'Could not start realtime voice')}};
 const active=state!=='idle',last=[...turns].reverse().find(t=>t.role==='aegis');
 if(collapsed)return <button onClick={()=>{unlockAudio();setCollapsed(false)}} className="fixed bottom-5 right-5 z-[70] w-14 h-14 rounded-full bg-[#D4AF37] text-black shadow-2xl flex items-center justify-center" aria-label="Open Aegis voice"><Mic className="w-6 h-6"/></button>;
 return <div className="fixed bottom-4 right-4 z-[70] w-[min(360px,calc(100vw-2rem))] max-h-[48vh] overflow-hidden rounded-2xl border border-[#D4AF37]/25 bg-[#0c0c0c]/95 backdrop-blur-xl shadow-2xl p-4 text-white"><div className="flex items-center justify-between gap-3"><div><p className="text-sm text-[#efbd63]">Talk to Aegis</p><p className="text-[10px] text-gray-500">Realtime voice · quick pause</p></div><div className="flex items-center gap-2"><button onClick={()=>setCollapsed(true)} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-500"><ChevronDown className="w-4 h-4"/></button><button onClick={()=>{unlockAudio();active?(state==='speaking'||state==='preparing'?stopAudio:stopListening()):start()}} disabled={state==='thinking'||state==='connecting'} className={`w-11 h-11 rounded-full flex items-center justify-center ${active?'bg-red-400/10 text-red-300 border border-red-400/30':'bg-[#D4AF37] text-black'} disabled:opacity-40`}>{active?(state==='speaking'||state==='preparing'?<Square className="w-4 h-4"/>:<MicOff className="w-5 h-5"/>):<Mic className="w-5 h-5"/>}</button></div></div>{state!=='idle'&&<p className="mt-3 text-[11px] text-gray-400">{state==='connecting'?'Opening microphone…':state==='listening'?'Listening…':state==='transcribing'?'Listening — pause when finished…':state==='thinking'?'Aegis is thinking…':state==='preparing'?'Preparing voice…':'Aegis is speaking…'}</p>}{turns.length>0&&<div className="mt-3 max-h-52 overflow-y-auto pr-1 space-y-2">{turns.slice(-10).map((t,i)=><div key={i} className="text-xs leading-relaxed text-gray-300"><span className={t.role==='aegis'?'text-[#efbd63]':'text-gray-500'}>{t.role==='aegis'?'Aegis':'You'}:</span> {t.text}</div>)}</div>}{last&&<button onClick={()=>{unlockAudio();speak(last.text)}} className="mt-3 flex items-center gap-1.5 text-[11px] text-[#efbd63]"><Volume2 className="w-3.5 h-3.5"/>Speak again</button>}</div>;
}
