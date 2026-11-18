"""Generate the front page's narration as audio/stepN.mp3.

Two engines. Default is Kokoro (one preset British voice). With --cloned, each sentence is read by
the person it belongs to, using Qwen3-TTS voice clones kept in ~/.cache/voice-clone/refs/ (rich.*,
bruce.*). Those references never leave that machine; only the finished MP3s are committed.

The text comes from index.html via tools/narration-text.js, so rerun this whenever the
step wording changes. Any audio/stepN.mp3 can be swapped for a real recording later.

Setup (once):
    python3.12 -m venv venv && venv/bin/pip install kokoro soundfile
    brew install espeak-ng          # Kokoro uses it to work out pronunciation
Run from the repo root:
    venv/bin/python tools/make-narration.py            # Kokoro
    ~/.cache/voice-clone/venv/bin/python tools/make-narration.py --cloned   # Rich + Bruce
Needs node and ffmpeg on PATH. The voice model (about 330 MB) downloads on first run.
"""
import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
RATE = 24000  # Kokoro's output sample rate

# Words the voice gets wrong, rewritten only for speech.
SAY = {
    "FSH": "F S H",
}


def spoken(text: str) -> str:
    for word, say in SAY.items():
        text = text.replace(word, say)
    return text


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="bf_isabella", help="Kokoro voice name (b* voices are British)")
    ap.add_argument("--speed", type=float, default=0.95, help="speaking speed; below 1 is slower")
    ap.add_argument("--pause", type=float, default=0.45, help="seconds of silence between sentences")
    ap.add_argument("--steps", help="comma-separated step numbers (default: all)")
    ap.add_argument("--cloned", action="store_true", help="read with the Rich/Bruce voice clones instead of Kokoro")
    ap.add_argument("--refs", default=str(Path.home() / ".cache" / "voice-clone" / "refs"), help="folder holding <name>.wav and <name>.txt per voice")
    args = ap.parse_args()

    script = json.loads(subprocess.check_output(["node", str(ROOT / "tools" / "narration-text.js")]))
    only = {int(s) for s in args.steps.split(",")} if args.steps else None
    if args.cloned:
        import torch
        from qwen_tts import Qwen3TTSModel
        model = Qwen3TTSModel.from_pretrained("Qwen/Qwen3-TTS-12Hz-1.7B-Base", device_map="cpu", dtype=torch.float32)
        refs = Path(args.refs)
        prompts = {}
        def speak(text, voice):
            if voice not in prompts:
                prompts[voice] = model.create_voice_clone_prompt(ref_audio=str(refs / f"{voice}.wav"), ref_text=(refs / f"{voice}.txt").read_text().strip())
            wavs, sr = model.generate_voice_clone(text=text, language="English", voice_clone_prompt=prompts[voice])
            assert sr == RATE, sr
            return [np.asarray(wavs[0], dtype=np.float32)]
    else:
        from kokoro import KPipeline
        pipeline = KPipeline(lang_code="b")  # British English
        def speak(text, voice):
            return [a.numpy().astype(np.float32) for _, _, a in pipeline(text, voice=args.voice, speed=args.speed)]
    gap = np.zeros(int(RATE * args.pause), dtype=np.float32)
    out_dir = ROOT / "audio"
    out_dir.mkdir(exist_ok=True)

    for step in script:
        n = step["step"]
        if only and n not in only:
            continue
        parts = []
        for i, item in enumerate(step["sentences"]):
            text, voice = (item["text"], item["voice"]) if isinstance(item, dict) else (item, "rich")
            parts.extend(speak(spoken(text), voice))
            # a longer pause after the title
            parts.append(gap if i else np.concatenate([gap, gap]))
        pcm = np.concatenate(parts)
        # a temp folder, not NamedTemporaryFile: Windows won't let ffmpeg open a file we hold open
        with tempfile.TemporaryDirectory() as tmpdir:
            wav = str(Path(tmpdir) / f"step{n}.wav")
            sf.write(wav, pcm, RATE)
            mp3 = out_dir / f"step{n}.mp3"
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", wav,
                            "-ac", "1", "-b:a", "64k", str(mp3)], check=True)
        secs = len(pcm) / RATE
        print(f"{mp3.relative_to(ROOT)}: {secs:.0f}s, {mp3.stat().st_size // 1024} KB", file=sys.stderr)


if __name__ == "__main__":
    main()
