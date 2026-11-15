"""Generate the front page's narration as audio/stepN.mp3 with Piper (local, free TTS).

The text comes from index.html via tools/narration-text.js, so rerun this whenever the
step wording changes. Any audio/stepN.mp3 can be swapped for a real recording later.

Setup (once):
    python3.12 -m venv venv && venv/bin/pip install piper-tts
    venv/bin/python -m piper.download_voices --data-dir voices en_GB-cori-high
Run from the repo root:
    venv/bin/python tools/make-narration.py --voice voices/en_GB-cori-high.onnx
Needs node and ffmpeg on PATH.
"""
import argparse
import json
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

from piper import PiperVoice, SynthesisConfig

ROOT = Path(__file__).resolve().parent.parent

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
    ap.add_argument("--voice", required=True, help="path to a Piper .onnx voice")
    ap.add_argument("--pace", type=float, default=1.08, help="length_scale; above 1 is slower")
    ap.add_argument("--pause", type=float, default=0.45, help="seconds of silence between sentences")
    ap.add_argument("--steps", help="comma-separated step numbers (default: all)")
    args = ap.parse_args()

    script = json.loads(subprocess.check_output(["node", str(ROOT / "tools" / "narration-text.js")]))
    only = {int(s) for s in args.steps.split(",")} if args.steps else None
    voice = PiperVoice.load(args.voice)
    rate = voice.config.sample_rate
    cfg = SynthesisConfig(length_scale=args.pace)
    gap = b"\x00\x00" * int(rate * args.pause)
    out_dir = ROOT / "audio"
    out_dir.mkdir(exist_ok=True)

    for step in script:
        n = step["step"]
        if only and n not in only:
            continue
        pcm = bytearray()
        for i, sentence in enumerate(step["sentences"]):
            for chunk in voice.synthesize(spoken(sentence), syn_config=cfg):
                pcm += chunk.audio_int16_bytes
            # a longer pause after the title
            pcm += gap * (2 if i == 0 else 1)
        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
            with wave.open(tmp.name, "wb") as w:
                w.setnchannels(1)
                w.setsampwidth(2)
                w.setframerate(rate)
                w.writeframes(bytes(pcm))
            mp3 = out_dir / f"step{n}.mp3"
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", tmp.name,
                            "-ac", "1", "-b:a", "64k", str(mp3)], check=True)
        secs = len(pcm) / 2 / rate
        print(f"{mp3.relative_to(ROOT)}: {secs:.0f}s, {mp3.stat().st_size // 1024} KB", file=sys.stderr)


if __name__ == "__main__":
    main()
