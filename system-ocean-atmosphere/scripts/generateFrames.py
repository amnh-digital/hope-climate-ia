# -*- coding: utf-8 -*-

# caffeinate -i python generateFrames.py
# python generateFrames.py -in ../data/raw/ocean/oscar_vel2016_%s.csv.gz -out ../output/ocean/frame%s.png -vel 0.6 -ppp 240 -particles 36000 -mag " 0.0,1.0" -line 0.8 -unit Celsius -lon " -180,180" -debug 1
# python generateFrames.py -debug 1
# python generateFrames.py -debug 1 -out "../output/meta%s.png" -width 17280 -height 8640 -vel 0.2 -ppp 480 -particles 18000

# ffmpeg -framerate 30/1 -i ../output/atmosphere/frame%04d.png -c:v libx264 -r 30 -pix_fmt yuv420p -q:v 1 ../output/atmosphere_sample.mp4
# ffmpeg -framerate 30/1 -i ../output/ocean/frame%04d.png -c:v libx264 -r 30 -pix_fmt yuv420p -q:v 1 ../output/ocean_sample.mp4

import argparse
import datetime
import json
from lib import *
import math
from multiprocessing import Pool
from multiprocessing.dummy import Pool as ThreadPool
import os
from PIL import Image, ImageDraw, ImageEnhance
from pprint import pprint
import random
import sys

parser = argparse.ArgumentParser()

parser.add_argument('-in', dest="INPUT_FILE", default="../../oversize-assets/atmosphere_100000/gfsanl_4_%s_0000_000.csv.gz", help="Input CSV files")
parser.add_argument('-out', dest="OUTPUT_FILE", default="../../oversize-assets/output/atmosphere/frame%s.png", help="Output image file")
parser.add_argument('-base', dest="BASE_IMAGE", default="../data/earth_base_small.png", help="Base image file")
parser.add_argument('-brightness', dest="BASE_IMAGE_BRIGHTNESS", default=0.4, help="Base image brightness")
parser.add_argument('-saturation', dest="BASE_IMAGE_SATURATION", default=0.5, help="Base image saturation")
parser.add_argument('-grad', dest="GRADIENT_FILE", default="../data/colorGradientRainbowLong.json", help="Color gradient json file")
parser.add_argument('-start', dest="DATE_START", default="2016-01-01", help="Date start")
parser.add_argument('-end', dest="DATE_END", default="2016-12-31", help="Date end")
parser.add_argument('-lon', dest="LON_RANGE", default="0,360", help="Longitude range")
parser.add_argument('-lat', dest="LAT_RANGE", default="90,-90", help="Latitude range")
parser.add_argument('-ppp', dest="POINTS_PER_PARTICLE", type=int, default=72, help="Points per particle")
parser.add_argument('-vel', dest="VELOCITY_MULTIPLIER", type=float, default=0.08, help="Number of pixels per degree of lon/lat")
parser.add_argument('-particles', dest="PARTICLES", type=int, default=24000, help="Number of particles to display")
parser.add_argument('-range', dest="TEMPERATURE_RANGE", default="-19.0,40.0", help="Temperature range used for color gradient")
parser.add_argument('-width', dest="WIDTH", type=int, default=2048, help="Target image width")
parser.add_argument('-height', dest="HEIGHT", type=int, default=1024, help="Target image height")
parser.add_argument('-lw', dest="LINE_WIDTH_RANGE", default="2.0,3.0", help="Line width range")
parser.add_argument('-lwt', dest="LINE_WIDTH_LAT_RANGE", default="1.0,2.0", help="Line width range based on latitude")
parser.add_argument('-mag', dest="MAGNITUDE_RANGE", default="0.0,12.0", help="Magnitude range")
parser.add_argument('-alpha', dest="ALPHA_RANGE", default="0.0,255.0", help="Alpha range (0-255)")
parser.add_argument('-avg', dest="ROLLING_AVERAGE", type=int, default=30, help="Do a rolling average of x data points")
parser.add_argument('-dur', dest="DURATION", type=int, default=120, help="Duration in seconds")
parser.add_argument('-fps', dest="FPS", type=int, default=30, help="Frames per second")
parser.add_argument('-anim', dest="ANIMATION_DUR", type=int, default=2000, help="How many milliseconds each particle should animate over")
parser.add_argument('-line', dest="LINE_VISIBILITY", type=float, default=0.5, help="Higher = more visible lines")
parser.add_argument('-debug', dest="DEBUG", type=int, default=0, help="If debugging, only output a subset of frames")
parser.add_argument('-unit', dest="TEMPERATURE_UNIT", default="Kelvin", help="Temperature unit")


args = parser.parse_args()

INPUT_FILE = args.INPUT_FILE
OUTPUT_FILE = args.OUTPUT_FILE
BASE_IMAGE = args.BASE_IMAGE
GRADIENT_FILE = args.GRADIENT_FILE
DATE_START = [int(d) for d in args.DATE_START.split("-")]
DATE_END = [int(d) for d in args.DATE_END.split("-")]
DURATION = args.DURATION
FPS = args.FPS
DEBUG = args.DEBUG
TEMPERATURE_UNIT = args.TEMPERATURE_UNIT
print(f"Start Date {DATE_START}")
print(f"End Date {DATE_END}")
# Make sure output dirs exist
outDir = os.path.dirname(OUTPUT_FILE)
if not os.path.exists(outDir):
    os.makedirs(outDir)

# Get gradient
GRADIENT = []
with open(GRADIENT_FILE) as f:
    GRADIENT = json.load(f)

dateStart = datetime.date(DATE_START[0], DATE_START[1], DATE_START[2])
dateEnd = datetime.date(DATE_END[0], DATE_END[1], DATE_END[2])

# # preload base images
# print "Pre-loading base images..."
# baseImages = []
#
# for i in range(12):
#     month = str(i + 1).zfill(2)
#     filename = BASE_IMAGE % month
#     baseImage = Image.open(filename)
#     baseImage = baseImage.resize((args.WIDTH, args.HEIGHT), resample=Image.BICUBIC)
#
#     filter = ImageEnhance.Color(baseImage)
#     baseImage = filter.enhance(args.BASE_IMAGE_SATURATION)
#
#     filter = ImageEnhance.Brightness(baseImage)
#     baseImage = filter.enhance(args.BASE_IMAGE_BRIGHTNESS)
#
#     baseImages.append(baseImage)

# baseImages = [Image.new('RGB', (args.WIDTH, args.HEIGHT), (0, 0, 0))]

baseImage = Image.open(args.BASE_IMAGE)
baseImage = baseImage.resize((args.WIDTH, args.HEIGHT), resample=Image.BICUBIC)
baseImages = [baseImage]

params = {}
params["date_start"] = dateStart
params["date_end"] = dateEnd
params["lon_range"] = [float(d) for d in args.LON_RANGE.strip().split(",")]
params["lat_range"] = [float(d) for d in args.LAT_RANGE.strip().split(",")]
params["points_per_particle"] = args.POINTS_PER_PARTICLE
params["velocity_multiplier"] = args.VELOCITY_MULTIPLIER
params["particles"] = args.PARTICLES
params["temperature_range"] = [float(d) for d in args.TEMPERATURE_RANGE.split(",")]
params["linewidth_range"] = [float(d) for d in args.LINE_WIDTH_RANGE.split(",")]
params["linewidth_lat_range"] = [float(d) for d in args.LINE_WIDTH_LAT_RANGE.split(",")]
params["mag_range"] = [float(d) for d in args.MAGNITUDE_RANGE.split(",")]
params["alpha_range"] = [float(d) for d in args.ALPHA_RANGE.split(",")]
params["width"] = args.WIDTH
params["height"] = args.HEIGHT
params["gradient"] = GRADIENT
params["animation_dur"] = args.ANIMATION_DUR
params["rolling_avg"] = args.ROLLING_AVERAGE
params["line_visibility"] = args.LINE_VISIBILITY
params["base_images"] = baseImages

# Read data
date = dateStart
filenames = []
dates = []
while date <= dateEnd:
    print(INPUT_FILE % date.strftime("%Y%m%d"))
    filename = INPUT_FILE % date.strftime("%Y%m%d")
    if os.path.isfile(filename):
        filenames.append(filename)
        dates.append(date)
    date += datetime.timedelta(days=1)

# if debugging, just process 2 seconds
debugFrames = FPS * 2
if DEBUG:
    filenames = filenames[:40]
    if DEBUG == 1:
        filenames = filenames[:2]

print("Reading %s files asyncronously..." % len(filenames))
fparams = [{"filename": f, "unit": TEMPERATURE_UNIT} for f in filenames]
pool = ThreadPool()
data = pool.map(readCSVData, fparams)
pool.close()
pool.join()
print("Done reading files")

lons = len(data[0])
lats = len(data[0][0])
total = lons * lats
print("Lons (%s) x Lats (%s) = %s" % (lons, lats, total))

dateCount = len(dates)
frames = DURATION * FPS
print("%s frames with duration %s" % (frames, DURATION))

# Initialize particle starting positions
particleProperties = [
    (pseudoRandom(i*3), # a stably random x
     pseudoRandom(i*3+1), # a stably random y
     pseudoRandom(i*3+2)) # a stably random offset
    for i in range(params["particles"])
]

frameParams = []
pad = len(str(frames))
for frame in range(frames):
    p = params.copy()
    ms = 1.0 * frame / FPS * 1000
    filename = OUTPUT_FILE % str(frame+1).zfill(pad)
    if not os.path.isfile(filename) or DEBUG >= 1:
        p.update({
            "progress": 1.0 * frame / (frames-1),
            "animationProgress": (1.0 * ms / params["animation_dur"]) % 1.0,
            "frame": frame,
            "frames": frames,
            "fileOut": filename,
            "dates": dates,
            "data": data,
            "particleProperties": particleProperties
        })
        frameParams.append(p)
    if DEBUG and frame >= debugFrames or DEBUG == 1:
        break

print("Making %s image files asyncronously..." % frames)
pool = ThreadPool()
data = pool.map(frameToImage, frameParams)
pool.close()
pool.join()
print("Done")

# print "Making %s image files syncronously..." % frames
# for p in frameParams:
#     frameToImage(p)
