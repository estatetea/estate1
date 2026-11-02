import subprocess,re,json,sys
v=sys.argv[1]; f=f'full-{v}.wav'
lines=[x['text'] for x in json.load(open('lines.json'))]
sil=subprocess.run(['ffmpeg','-i',f,'-af','silencedetect=n=-40dB:d=0.18','-f','null','-'],capture_output=True,text=True).stderr
st=[float(x) for x in re.findall(r'silence_start: ([0-9.]+)',sil)]; en=[float(x) for x in re.findall(r'silence_end: ([0-9.]+)',sil)]
gaps=[((s+e)/2, e-s) for s,e in zip(st,en) if s>0.05]
total=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]))
# expected boundary times from line lengths (characters, plus a pause per line)
w=[len(x)+12 for x in lines]; cum=[sum(w[:i+1])/sum(w)*total for i in range(len(w)-1)]
cuts=[]; last=0
for target in cum:
    cands=[g for g in gaps if g[0]>last+0.5]
    best=min(cands,key=lambda g: abs(g[0]-target) - 0.6*min(g[1],1.2))   # near the expected point, prefer longer pauses
    cuts.append(best[0]); last=best[0]
b=[0]+cuts+[total]
for i in range(len(lines)):
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',f,'-af',f'atrim={b[i]}:{b[i+1]},asetpts=PTS-STARTPTS,silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse',f'l{i+1}.wav'],check=True)
    d=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f'l{i+1}.wav']))
    print(f'l{i+1}',round(d,2),'expected ~',round((w[i])/sum(w)*total-0.9,1))
