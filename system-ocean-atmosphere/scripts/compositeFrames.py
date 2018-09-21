# -*- coding: utf-8 -*-

# python compositeFrames.py -width 2048 -out "../output/composite_highres/frame%s.png"
# ffmpeg -framerate 30/1 -i ../output/composite/frame%04d.png -c:v libx264 -r 30 -pix_fmt yuv420p -q:v 1 ../output/composite.mp4
# ffmpeg -framerate 30/1 -i ../output/composite_highres/frame%04d.png -c:v libx264 -r 30 -pix_fmt yuv420p -q:v 1 ../output/composite_highres.mp4

import argparse
import math
from multiprocessing import Pool
from multiprocessing.dummy import Pool as ThreadPool
import os
from PIL import Image
from pprint import pprint
import sys

parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="../output/atmosphere/frame%s.png,../output/ocean/frame%s.png", help="Input image files")
parser.add_argument('-out', dest="OUTPUT_FILE", default="../output/composite/frame%s.png", help="Output image file")
parser.add_argument('-frames', dest="FRAMES", type=int, default=3600, help="Number of frames")
parser.add_argument('-width', dest="WIDTH", type=int, default=1024, help="Target width")

args = parser.parse_args()

INPUT_FILE = args.INPUT_FILE.split(",")
OUTPUT_FILE = args.OUTPUT_FILE
FRAMES = args.FRAMES
WIDTH = args.WIDTH
HEIGHT = args.WIDTH

# Make sure output dirs exist
outDir = os.path.dirname(OUTPUT_FILE)
if not os.path.exists(outDir):
    os.makedirs(outDir)

pad = len(str(FRAMES))
params = []
for f in range(FRAMES):
    frame = str(f+1).zfill(pad)
    fnames = [ff % frame for ff in INPUT_FILE]
    params.append({
        "w": WIDTH,
        "h": HEIGHT,
        "fnames": fnames,
        "fout": OUTPUT_FILE % frame
    })

def compositeFiles(p):
    fname1 = p["fnames"][0]
    fname2 = p["fnames"][1]
    w = p["w"]
    h = p["h"]
    hh = h / 2

    im1 = Image.open(fname1)
    im2 = Image.open(fname2)

    sw, sh = im1.size
    if sw != w:
        im1 = im1.resize((w, hh), resample=Image.BICUBIC)
        im2 = im2.resize((w, hh), resample=Image.BICUBIC)

    comp = Image.new('RGB', (p["w"], p["h"]))
    comp.paste(im1)
    comp.paste(im2, box=(0, hh))
    comp.save(p["fout"])

    print "Saved %s" % p["fout"]

print "Processing %s frames asyncronously..." % len(params)
pool = ThreadPool()
data = pool.map(compositeFiles, params)
pool.close()
pool.join()
print "Done."

# compositeFiles(params[0])
