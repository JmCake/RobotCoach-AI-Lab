"""Offline renderer. The delivered H.264 files need no rendering dependencies."""
import argparse
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
from functools import partial

import cv2 as cv
from paint import Canvas
from pilot import pilot, PILOT_LENGTH


def encoder():
    path = os.environ.get("FFMPEG") or shutil.which("ffmpeg")
    if path:
        return path
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def export(path, draw, duration, width, fps, audio=None):
    cv.setNumThreads(3)
    c = Canvas(width)
    path = Path(path).resolve()
    path.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(dir=path.parent) as temp:
        out=Path(temp)/"render.mp4"
        command=[encoder(),"-hide_banner","-loglevel","error","-y","-f","rawvideo",
                 "-pix_fmt","rgb24","-s",f"{c.w}x{c.h}","-r",str(fps),"-i","pipe:0"]
        if audio:
            track=Path(temp)/"effects.wav"
            audio(track,duration)
            command+=["-i",str(track),"-c:a","aac","-b:a","160k"]
        command += ["-c:v","libx264","-threads","6","-preset","slow","-crf","19.5",
                    "-vf","scale=out_color_matrix=bt709","-pix_fmt","yuv420p",
                    "-color_primaries","bt709","-color_trc","bt709","-colorspace","bt709",
                    "-x264-params","colorprim=bt709:transfer=bt709:colormatrix=bt709",
                    "-movflags","+faststart",str(out)]
        total=round(duration*fps)
        with subprocess.Popen(command,stdin=subprocess.PIPE) as process:
            try:
                for i in range(total):
                    draw(c,i/fps)
                    process.stdin.write(memoryview(c.rgb))
                    if i%(fps*10)==0:
                        print(f"{i}/{total} frames",flush=True)
            finally:
                process.stdin.close()
            if process.wait():
                raise RuntimeError("FFmpeg failed during encoding.")
        os.replace(out,path)
        print(f"{path.name}: {total} frames, {c.w} x {c.h}, {fps} fps",flush=True)


if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("output")
    p.add_argument("--shot",choices=["pilot","film","film-v2","film-v3"],default="film")
    p.add_argument("--width",type=int,default=1920)
    p.add_argument("--fps",type=int,default=30)
    args=p.parse_args()
    if args.shot=="pilot":
        export(args.output,pilot,PILOT_LENGTH,args.width,args.fps)
    elif args.shot=="film-v2":
        from film import frame, LENGTH
        from sound import soundtrack
        export(args.output,frame,LENGTH,args.width,args.fps,soundtrack)
    elif args.shot=="film-v3":
        from evolution import frame, LENGTH
        from sound import soundtrack
        export(args.output,frame,LENGTH,args.width,args.fps,partial(soundtrack,teaching=True))
    else:
        from classroom import frame, LENGTH
        from sound import soundtrack
        export(args.output,frame,LENGTH,args.width,args.fps,partial(soundtrack,teaching=True,recorded=True))
