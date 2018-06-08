# -*- coding: utf-8 -*-

# Gridded Monthly Temperature Anomaly Data
# source: https://data.giss.nasa.gov/gistemp/

import argparse
import datetime
import json
from lib import *
import math
from netCDF4 import Dataset
import gizeh
from pprint import pprint
from pyproj import Proj
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="../../oversize-assets/gistemp1200_ERSSTv5_annual_1901-2000_baseline.nc", help="Temperature input file")
parser.add_argument('-start', dest="START_YEAR", default=1880, type=int, help="Start year")
parser.add_argument('-end', dest="END_YEAR", default=2017, type=int, help="End year")
parser.add_argument('-out', dest="OUTPUT_DIR", default="../img/frames/", help="Output directory")
parser.add_argument('-width', dest="TARGET_WIDTH", default=1024, type=int, help="Target width")
parser.add_argument('-format', dest="IMAGE_FORMAT", default="png", help="Image format")
parser.add_argument('-grad', dest="GRADIENT", default="#00ffed,#65c6c2,#000000,#dd6952,#ff2600", help="Color gradient")
parser.add_argument('-stops', dest="STOPS", default="0.0,0.1,0.5,0.9,1.0", help="Color gradient stops")
args = parser.parse_args()

# config
INPUT_FILE = args.INPUT_FILE
OUTPUT_DIR = args.OUTPUT_DIR
START_YEAR = args.START_YEAR
END_YEAR = args.END_YEAR
TARGET_WIDTH = args.TARGET_WIDTH
IMAGE_FORMAT = args.IMAGE_FORMAT
# GRADIENT = ["#42a6ff", "#89a2b7", "#000000", "#e05050", "#fc0000"]
GRADIENT = args.GRADIENT.split(",")
STOPS = [float(s) for s in args.STOPS.split(",")]

MIN_VALUE = -3.5
MAX_VALUE = 3.5
TARGET_HEIGHT = TARGET_WIDTH / 2
LATLON_OFFSET = 0.8
RADIUS_RANGE = [1.0, 1.8]
ALPHA_RANGE = [0.0, 1.0]

robinsonProj = Proj(ellps='WGS84',proj='robin')

# Convert colors to RGB
GRADIENT = [hex2rgb(g) for g in GRADIENT]

# Open NetCDF file
ds = Dataset(INPUT_FILE, 'r')

# Extract data from NetCDF file
lats = ds.variables['lat'][:] # float: latitude
lons = ds.variables['lon'][:] # float: longitude
times = ds.variables['time'][:] # int: year
w = len(lons)
h = len(lats)
t = len(times)
print "Time: %s x Lon: %s x Lat: %s" % (t, w, h)

# Convert lat/lon to pixels using Robinson projection
coordinates = []
values = []
for y, lat in enumerate(lats):
    for x, lon in enumerate(lons):
        o = LATLON_OFFSET
        p1 = robinsonProj(lon-o, lat-o)
        p2 = robinsonProj(lon+o, lat-o)
        p3 = robinsonProj(lon+o, lat+o)
        p4 = robinsonProj(lon-o, lat+o)
        c = [p1, p2, p3, p4]
        coordinates.append({
            "poly": c,
            "center": robinsonProj(lon, lat)
        })
        values += c
        p = robinsonProj(lon, lat)
cxs = [c[0] for c in values]
cys = [c[1] for c in values]
cbounds = [min(cxs), min(cys), max(cxs), max(cys)]

def c2px(c, bounds, tw, th):
    nx = norm(c[0], cbounds[0], cbounds[2])
    ny = norm(c[1], cbounds[3], cbounds[1])
    x = nx * tw
    y = ny * th
    return (x, y)

for i, c in enumerate(coordinates):
    coordinates[i]["poly"] = [c2px(cc, cbounds, TARGET_WIDTH, TARGET_HEIGHT) for cc in c["poly"]]
    coordinates[i]["center"] = c2px(c["center"], cbounds, TARGET_WIDTH, TARGET_HEIGHT)

tempData = ds.variables['tempanomaly'][:] # float: surface temperature anomaly (C), e.g. tempData[time][lat][lon]
emptyColor = hex2rgb("#000000")
# backgroundImage = Image.open(BACKGROUND_IMAGE)

def tempToColor(v):
    color = emptyColor
    if v != "--":
        if v >= 0:
            n = 1.0 * v / MAX_VALUE * 0.5 + 0.5
        else:
            n = 0.5 - v / MIN_VALUE * 0.5
        # n = norm(v, MIN_VALUE, MAX_VALUE)
        n = clamp(n)
        rgb = getColor(GRADIENT, n, stops=STOPS)
        # n = lerpList(STOPS, n)
        a = abs(n * 2 - 1)
        # a = lerp(ALPHA_RANGE[0], ALPHA_RANGE[1], a)
        rgba = (rgb[0]/255.0, rgb[1]/255.0, rgb[2]/255.0, a)
    return rgba

def tempToRadius(v):
    mult = 0
    if v != "--":
        if v > 0:
            mult = norm(v, 0, MAX_VALUE)
        else:
            mult = norm(abs(v), 0, abs(MIN_VALUE))
        mult = lerp(RADIUS_RANGE[0], RADIUS_RANGE[1], mult)
    return mult

def dataToImg(filename, data):
    surface = gizeh.Surface(width=TARGET_WIDTH, height=TARGET_HEIGHT)
    for y, lat in enumerate(lats):
        for x, lon in enumerate(lons):
            r = y * w + x
            v = data[y, x]
            color = tempToColor(v)
            poly = coordinates[r]["poly"]
            # draw.polygon(poly, fill=color)
            c = coordinates[r]["center"]
            minLen = min([abs(poly[0][0] - poly[1][0]), abs(poly[2][0] - poly[3][0]), abs(poly[1][1] - poly[2][1])])
            # determine size
            rad = tempToRadius(v)
            cellR = minLen * 0.5 * rad
            if cellR > 0:
                circle = gizeh.circle(r=cellR, xy= [c[0],c[1]], fill=color)
                circle.draw(surface)
    # print(filename)
    surface.write_to_png(filename)

print "Generating images..."
years = []
yearData = []
index = 1

# START_YEAR = 2005
# END_YEAR = 2005

for i, year in enumerate(times):
    if START_YEAR <= year <= END_YEAR:
        data = tempData[i]
        filename = "%sframe%s.%s" % (OUTPUT_DIR, year, IMAGE_FORMAT)
        dataToImg(filename, data)
        index += 1
    sys.stdout.write('\r')
    sys.stdout.write("%s%%" % round(1.0*(i+1)/t*100,1))
    sys.stdout.flush()

ds.close()
print "\rDone."
