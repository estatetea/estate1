'use client';
import {useEffect,useRef,useState} from 'react';
import {Mic,Volume2,Square,X,Send,Loader2,ArrowUp} from 'lucide-react';
import {toast} from 'sonner';
import {notifyAegisChatUpdated,sendAegisChat} from '@/lib/aegis-chat';
import {Scribe,CommitStrategy,RealtimeEvents} from '@elevenlabs/client';

export default function AegisRealtimeVoice({token}){
 const [state,setState]=useState('idle'),[open,setOpen]=useState(false),[onChatPage,setOnChatPage]=useState(false),[exchange,setExchange]=useState(null),[readyToken,setReadyToken]=useState(null),[draftTranscript,setDraftTranscript]=useState(''),[typed,setTyped]=useState('');
 const connectionRef=useRef(null),sendNowRef=useRef(null),busyRef=useRef(false),ctxRef=useRef(null),sourceRef=useRef(null),requestRef=useRef(null),chatRequestRef=useRef(null),audioRef=useRef(null),audioUnlockedRef=useRef(false),readerRef=useRef(null),playbackGenerationRef=useRef(0),stoppedRef=useRef(false);
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
 const stopAudio=()=>{stoppedRef.current=true;playbackGenerationRef.current+=1;requestRef.current?.abort?.();requestRef.current=null;try{readerRef.current?.cancel?.()}catch{}readerRef.current=null;try{sourceRef.current?.stop()}catch{}sourceRef.current=null;try{const a=audioRef.current;if(a){a.pause();a.removeAttribute('src');a.load();a.currentTime=0}}catch{}try{window.speechSynthesis?.cancel()}catch{}setState(s=>['speaking','preparing'].includes(s)?'idle':s)};
 const stopListening=()=>{try{connectionRef.current?.close()}catch{}connectionRef.current=null;setDraftTranscript('');setState(s=>s==='listening'||s==='transcribing'||s==='connecting'?'idle':s)};
 const browserSpeak=text=>new Promise((resolve,reject)=>{try{if(!window.speechSynthesis)return reject(new Error('Audio playback is unavailable'));window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-IN';u.rate=0.96;u.pitch=1;u.onend=resolve;u.onerror=()=>reject(new Error('Audio playback failed'));setState('speaking');window.speechSynthesis.speak(u)}catch(e){reject(e)}});
 useEffect(()=>{let alive=true;const warm=async()=>{try{const r=await fetch('/api/admin/aegis/transcribe-token',{method:'POST',headers});const b=await r.json();if(alive&&r.ok&&b.token)setReadyToken(b.token)}catch{}};const id=window.setTimeout(warm,250);return()=>{alive=false;window.clearTimeout(id);stopListening();stopAudio();ctxRef.current?.close?.().catch(()=>{})}},[]);
 const speak=async text=>{if(!text)return;stopAudio();stoppedRef.current=false;const generation=playbackGenerationRef.current;const controller=new AbortController();requestRef.current=controller;let objectUrl=null;try{setState('preparing');const r=await fetch('/api/admin/aegis/voice',{method:'POST',headers,body:JSON.stringify({text}),signal:controller.signal});if(!r.ok){const b=await r.json().catch(()=>({}));throw new Error(b.error||b.detail||'Aegis voice is unavailable')}// Start playback from the response stream when MediaSource supports MP3.
  // This removes the old wait for the complete ElevenLabs file before Aegis speaks.
  const audio=audioRef.current||document.createElement('audio');audioRef.current=audio;audio.playsInline=true;
  if(r.body&&window.MediaSource&&MediaSource.isTypeSupported('audio/mpeg')){
   const ms=new MediaSource();objectUrl=URL.createObjectURL(ms);audio.src=objectUrl;audio.currentTime=0;
   await new Promise((resolve,reject)=>{ms.addEventListener('sourceopen',resolve,{once:true});ms.addEventListener('error',reject,{once:true})});
   const sb=ms.addSourceBuffer('audio/mpeg'),reader=r.body.getReader();readerRef.current=reader;let started=false;
   const append=chunk=>new Promise((resolve,reject)=>{const done=()=>{sb.removeEventListener('updateend',done);sb.removeEventListener('error',fail);resolve()};const fail=()=>{sb.removeEventListener('updateend',done);sb.removeEventListener('error',fail);reject(new Error('Audio stream failed'))};sb.addEventListener('updateend',done);sb.addEventListener('error',fail);sb.appendBuffer(chunk)});
   audio.onended=()=>{setState('idle');if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null}};
   setState('speaking');
   while(true){const {done,value}=await reader.read();if(done)break;if(controller.signal.aborted||generation!==playbackGenerationRef.current){reader.cancel();return}if(value?.length){await append(value);if(!started&&generation===playbackGenerationRef.current){started=true;await audio.play();audioUnlockedRef.current=true}}}
   readerRef.current=null;if(ms.readyState==='open'&&!sb.updating)ms.endOfStream();
   return;
  }
  const blob=await r.blob();if(controller.signal.aborted||generation!==playbackGenerationRef.current)return;
  objectUrl=URL.createObjectURL(blob);audio.src=objectUrl;audio.currentTime=0;
  audio.onended=()=>{setState('idle');if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null}};
  audio.onerror=()=>{};
  try{setState('speaking');await audio.play();audioUnlockedRef.current=true;return}catch(mediaError){
    // Second choice: resumed Web Audio. This also covers browsers where the
    // HTML media element cannot consume the returned TTS blob.
    const ctx=unlockAudio();if(!ctx)throw mediaError;if(ctx.state==='suspended')await ctx.resume();
    const bytes=await blob.arrayBuffer();const buffer=await ctx.decodeAudioData(bytes.slice(0));if(controller.signal.aborted||generation!==playbackGenerationRef.current)return;const src=ctx.createBufferSource();src.buffer=buffer;src.connect(ctx.destination);sourceRef.current=src;src.onended=()=>{if(sourceRef.current===src)sourceRef.current=null;setState('idle');if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null}};setState('speaking');src.start(0)
  }}catch(e){if(e?.name==='AbortError'||stoppedRef.current)return;if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null}try{await browserSpeak(text);setState('idle')}catch{setState('idle');toast.error(e.message||'Aegis voice is unavailable')}}finally{if(requestRef.current===controller)requestRef.current=null}};

 const askAegis=async text=>{text=String(text||'').trim();if(!text||busyRef.current)return;busyRef.current=true;setState('thinking');setExchange({you:text,aegis:null});const chatController=new AbortController();chatRequestRef.current=chatController;try{const {answer}=await sendAegisChat({token,message:text,signal:chatController.signal});setExchange({you:text,aegis:answer});notifyAegisChatUpdated();setState('idle');await speak(answer)}catch(e){setState('idle');if(e?.name!=='AbortError'){setExchange({you:text,aegis:null,error:e.message||'Aegis could not respond'})}}finally{if(chatRequestRef.current===chatController)chatRequestRef.current=null;busyRef.current=false}};
 useEffect(()=>{const onSection=e=>setOnChatPage(e.detail==='chat');const onOpen=()=>{unlockAudio();setOpen(true)};window.addEventListener('aegis:section',onSection);window.addEventListener('aegis:open-voice',onOpen);return()=>{window.removeEventListener('aegis:section',onSection);window.removeEventListener('aegis:open-voice',onOpen)}},[]);
 const refreshToken=()=>fetch('/api/admin/aegis/transcribe-token',{method:'POST',headers}).then(r=>r.ok?r.json():null).then(b=>{if(b?.token)setReadyToken(b.token)}).catch(()=>{});
 // Spoken email addresses come back as "sarah . lee@gmail.com"; join them up.
 const normalize=t=>t.replace(/([A-Za-z](?:[ -]?[A-Za-z]){2,})\s*\.\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g,(m,left,right)=>left.replace(/[ -]/g,'').toLowerCase()+'.'+right.toLowerCase());
 const start=async()=>{if(state!=='idle')return;stoppedRef.current=false;if(!navigator.mediaDevices?.getUserMedia)return toast.error('Microphone access is not available on this browser');unlockAudio();setExchange(null);let watchdog=null;try{setDraftTranscript('');setState('connecting');
  let scribeToken=readyToken;setReadyToken(null);if(!scribeToken){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);try{const tr=await fetch('/api/admin/aegis/transcribe-token',{method:'POST',headers,signal:controller.signal});const tb=await tr.json();if(!tr.ok||!tb.token)throw new Error(tb.error||tb.detail||'Voice input is unavailable right now');scribeToken=tb.token}finally{clearTimeout(timer)}}
  let committed='',partial='',heard=false,commitTimer=null,sessionTimer=null;
  const connection=Scribe.connect({token:scribeToken,modelId:'scribe_v2_realtime',commitStrategy:CommitStrategy.VAD,vadSilenceThresholdSecs:0.8,vadThreshold:0.3,minSpeechDurationMs:80,minSilenceDurationMs:80,languageCode:'en',keyterms:['Aegis','Estate Tea','Scout','Brew','Steward','Ledger','Muse','Nilgiris','Kotagiri'],microphone:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});connectionRef.current=connection;
  const clear=()=>{[watchdog,commitTimer,sessionTimer].forEach(t=>t&&clearTimeout(t));watchdog=commitTimer=sessionTimer=null};
  // Send what has been heard so far: the Send button, a natural pause, or the 60 s limit.
  const finishTurn=()=>{if(connectionRef.current!==connection)return;const text=normalize([committed,partial].filter(Boolean).join(' ').trim());clear();try{connection.close()}catch{}connectionRef.current=null;sendNowRef.current=null;setDraftTranscript('');if(!text){setState('idle');toast.error("I didn't catch that. Tap the mic and try again.");return}setState('thinking');askAegis(text);refreshToken()};
  sendNowRef.current=finishTurn;
  connection.on(RealtimeEvents.SESSION_STARTED,()=>{setState('listening');watchdog=setTimeout(()=>{if(!heard&&connectionRef.current===connection){clear();try{connection.close()}catch{}connectionRef.current=null;sendNowRef.current=null;setState('idle');toast.error("I couldn't hear anything. Tap the mic and try again.")}},12000);sessionTimer=setTimeout(finishTurn,60000)});
  connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT,d=>{const t=String(d?.text||'').trim();if(!t)return;heard=true;partial=t;if(watchdog){clearTimeout(watchdog);watchdog=null}if(commitTimer){clearTimeout(commitTimer);commitTimer=null}setDraftTranscript([committed,t].filter(Boolean).join(' '))});
  connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT,d=>{const t=String(d?.text||'').trim();if(!t)return;heard=true;partial='';committed=[committed,t].filter(Boolean).join(' ').trim();setDraftTranscript(committed);if(commitTimer)clearTimeout(commitTimer);commitTimer=setTimeout(finishTurn,1800)});
  connection.on(RealtimeEvents.ERROR,()=>{clear();try{connection.close()}catch{}connectionRef.current=null;sendNowRef.current=null;setState('idle');toast.error('Voice input had a problem. Please try again, or type your message.')})
 }catch(e){if(watchdog)clearTimeout(watchdog);setState('idle');toast.error(e?.name==='AbortError'?'Opening the microphone timed out. Please try again.':e.message||'Could not start voice input')}};
 const cancelListening=()=>{sendNowRef.current=null;stopListening()};
 const orb=()=>{unlockAudio();if(state==='listening'){sendNowRef.current?.();return}if(state==='speaking'||state==='preparing'){stopAudio();return}if(state==='thinking'){chatRequestRef.current?.abort?.();chatRequestRef.current=null;busyRef.current=false;setState('idle');return}if(state==='idle')start()};
 const close=()=>{cancelListening();stopAudio();if(state==='thinking'){chatRequestRef.current?.abort?.();busyRef.current=false;setState('idle')}setOpen(false)};
 const sendTyped=e=>{e?.preventDefault?.();const t=typed.trim();if(!t||busyRef.current)return;unlockAudio();setTyped('');askAegis(t)};
 const status={idle:exchange?'Tap to ask something else':'Tap to talk',connecting:'Opening the microphone…',listening:'Listening — tap Send when you’re done',thinking:'Aegis is thinking…',preparing:'Aegis is about to speak…',speaking:'Aegis is speaking — tap to stop'}[state]||'';
 const listening=state==='listening',busy=state==='thinking'||state==='connecting'||state==='preparing';

 if(!open&&onChatPage)return null;
 if(!open)return <button onClick={()=>{unlockAudio();setOpen(true)}} aria-label="Talk to Aegis" className="fixed bottom-[5.5rem] lg:bottom-6 right-5 z-[70] grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#f3d27c] to-[#c9983c] text-black shadow-[0_10px_30px_rgba(212,175,55,.35)] transition-transform active:scale-95"><Mic className="h-6 w-6" strokeWidth={1.8}/></button>;

 return <div className="fixed inset-0 z-[80] flex items-end lg:items-end lg:justify-end">
  <div onClick={close} className="absolute inset-0 bg-black/60 backdrop-blur-[2px] lg:bg-black/30"/>
  <div role="dialog" aria-label="Talk to Aegis" className="relative w-full lg:m-6 lg:w-[400px] rounded-t-[28px] lg:rounded-[28px] border border-white/[.08] bg-gradient-to-b from-[#151310] to-[#0b0b0b] px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white shadow-[0_-20px_60px_rgba(0,0,0,.5)]">
   <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 lg:hidden"/>
   <div className="flex items-center justify-between">
    <div><p className="text-[10px] uppercase tracking-[.3em] text-[#a9823e]">Estate Tea</p><h2 className="mt-1 text-xl font-light text-[#f1cf8b]">Aegis</h2></div>
    <button onClick={close} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-gray-400 hover:text-white"><X className="h-4 w-4"/></button>
   </div>

   <div className="mt-6 min-h-[120px] max-h-[34vh] overflow-y-auto">
    {listening||state==='connecting'?<p className={`text-[19px] leading-relaxed font-light ${draftTranscript?'text-white':'text-gray-500'}`}>{draftTranscript||'Go ahead, I’m listening…'}</p>
    :exchange?<div className="space-y-4">
      <p className="text-sm leading-relaxed text-gray-400">{exchange.you}</p>
      {exchange.aegis?<p className="text-[17px] leading-relaxed font-light text-[#f6e3b4]">{exchange.aegis}</p>
      :exchange.error?<p className="text-sm text-red-300">{exchange.error}</p>
      :<p className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin"/>Thinking…</p>}
    </div>
    :<p className="text-[17px] leading-relaxed font-light text-gray-400">Ask about stock, sales or orders, or tell me what to do: “We got 10 kg in”, “How are sales today?”, “Tell Brew to follow up with Michelle.”</p>}
   </div>

   <div className="mt-6 flex flex-col items-center">
    <div className="relative grid place-items-center">
     {listening&&<><span className="absolute h-28 w-28 rounded-full bg-[#efbd63]/10 animate-ping"/><span className="absolute h-24 w-24 rounded-full bg-[#efbd63]/10"/></>}
     <button onClick={orb} disabled={state==='connecting'} aria-label={listening?'Send':state==='speaking'||state==='preparing'?'Stop speaking':state==='thinking'?'Cancel':'Start talking'}
      className={`relative grid h-20 w-20 place-items-center rounded-full transition-all active:scale-95 disabled:opacity-60 ${listening?'bg-[#efbd63] text-black shadow-[0_0_40px_rgba(239,189,99,.45)]':state==='speaking'||state==='preparing'?'bg-white/10 text-[#efbd63] border border-[#efbd63]/40':'bg-gradient-to-br from-[#f3d27c] to-[#c9983c] text-black shadow-[0_10px_30px_rgba(212,175,55,.3)]'}`}>
      {listening?<ArrowUp className="h-8 w-8" strokeWidth={2}/>:busy?<Loader2 className="h-7 w-7 animate-spin"/>:state==='speaking'?<Square className="h-6 w-6"/>:<Mic className="h-8 w-8" strokeWidth={1.7}/>}
     </button>
    </div>
    <p className="mt-4 text-xs text-gray-500">{status}</p>
    {listening&&<div className="mt-4 flex gap-3"><button onClick={cancelListening} className="rounded-full border border-white/10 px-5 py-2 text-xs text-gray-300">Cancel</button><button onClick={()=>sendNowRef.current?.()} disabled={!draftTranscript} className="flex items-center gap-1.5 rounded-full bg-[#efbd63] px-5 py-2 text-xs font-medium text-black disabled:opacity-40"><Send className="h-3.5 w-3.5"/>Send</button></div>}
    {state==='idle'&&exchange?.aegis&&<button onClick={()=>{unlockAudio();speak(exchange.aegis)}} className="mt-3 flex items-center gap-1.5 text-[11px] text-[#efbd63]"><Volume2 className="h-3.5 w-3.5"/>Hear it again</button>}
   </div>

   <form onSubmit={sendTyped} className="mt-6 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 pl-4 pr-1.5 py-1.5">
    <input value={typed} onChange={e=>setTyped(e.target.value)} placeholder="Or type a message…" style={{background:'transparent'}} className="border-0 min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 outline-none"/>
    <button type="submit" disabled={!typed.trim()||busy} aria-label="Send message" className="grid h-9 w-9 place-items-center rounded-full bg-[#efbd63] text-black disabled:opacity-30"><ArrowUp className="h-4 w-4"/></button>
   </form>
  </div>
 </div>;
}
