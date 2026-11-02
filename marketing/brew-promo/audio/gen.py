import json,base64,wave,urllib.request,urllib.error,time,subprocess,sys
def call(model,text,out,voice):
    body={'contents':[{'parts':[{'text':text}]}],'generationConfig':{'responseModalities':['AUDIO'],'speechConfig':{'voiceConfig':{'prebuiltVoiceConfig':{'voiceName':voice}}}}}
    for a in range(12):
        try:
            req=urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',data=json.dumps(body).encode(),headers={'Content-Type':'application/json'})
            d=json.load(urllib.request.urlopen(req,timeout=120)); break
        except urllib.error.HTTPError as e:
            if e.code!=429: raise RuntimeError(e.read().decode()[:300])
            time.sleep(21)
    pcm=base64.b64decode(d['candidates'][0]['content']['parts'][0]['inlineData']['data'])
    w=wave.open(out,'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm); w.close()
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',out,'-af','silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse',out.replace('raw-','')],check=True)
    return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',out.replace('raw-','')]))
M='gemini-2.5-flash-preview-tts'
if sys.argv[1]=='lines':
    for L in json.load(open('lines.json')):
        print(L['id'], round(call(M,'Say warmly: '+L['text'],f"raw-{L['id']}.wav",sys.argv[2]),2),'max',L['max'],flush=True)
else:
    T="Meet Brew, Estate Tea's tea concierge, right on WhatsApp. Ask anything, order in one message, and enjoy fresh tea from the Nilgiris, delivered to your door."
    for v in sys.argv[2:]:
        print(v, round(call(M,'Say warmly: '+T,f'raw-sample-{v}.wav',v),2),flush=True)
