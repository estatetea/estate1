import base64, json, sys, subprocess, urllib.request, os, wave
MODEL = os.environ.get("TTS_MODEL", "gemini-2.5-pro-preview-tts")
def tts(text, voice, out, style="Read this like a premium brand advert: warm, friendly, confident and unhurried, with a gentle smile in the voice."):
    body = {"contents": [{"parts": [{"text": f"{style}\n\n{text}"}]}],
            "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
                                 data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    d = json.load(urllib.request.urlopen(req, timeout=180))
    part = d["candidates"][0]["content"]["parts"][0]["inlineData"]
    pcm = base64.b64decode(part["data"])
    rate = int(part.get("mimeType", "rate=24000").split("rate=")[-1].split(";")[0]) if "rate=" in part.get("mimeType", "") else 24000
    with wave.open(out, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(pcm)
    return out
if __name__ == "__main__":
    text, voice, out = sys.argv[1], sys.argv[2], sys.argv[3]
    print(tts(text, voice, out))
