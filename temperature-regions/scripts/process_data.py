# -*- coding: utf-8 -*-

# Source:
# NASA GISS
# Zonal annual means, 1880-present
# https://data.giss.nasa.gov/gistemp/

import argparse
import csv
from datetime import datetime, timedelta
import json
from lib import *
import math
import numpy as np
from netCDF4 import Dataset
import os
from pprint import pprint
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="../data/gistemp1200_ERSSTv4_annual.nc", help="Temperature input file")
parser.add_argument('-start', dest="START_YEAR", default=1880, type=int, help="Start year")
parser.add_argument('-end', dest="END_YEAR", default=2016, type=int, help="End year")
parser.add_argument('-zones', dest="ZONES", default=9, type=int, help="Number of zones")
parser.add_argument('-out', dest="OUTPUT_FILE", default="../data/1880-2016.json", help="Output file")
args = parser.parse_args()

# config
INPUT_FILE = args.INPUT_FILE
OUTPUT_FILE = args.OUTPUT_FILE
START_YEAR = args.START_YEAR
END_YEAR = args.END_YEAR
ZONES = args.ZONES
RANGE = (-3.5, 3.5) # Celsius
GRAPH_RANGE = (-2, 6)

GRADIENT = ["#42a6ff", "#89a2b7", "#473747", "#e05050", "#fc0000"]

# Convert colors to RGB
GRADIENT = [hex2rgb(g) for g in GRADIENT]

# Open NetCDF file
ds = Dataset(INPUT_FILE, 'r')

# Extract data from NetCDF file
lats = ds.variables['lat'][:] # float: latitude between -90 and 90
lons = ds.variables['lon'][:] # float: longitude between -180 and 180
times = ds.variables['time'][:] # int: year
tempData = ds.variables['tempanomaly'][:] # float: surface temperature anomaly (C), e.g. tempData[time][lat][lon]

if 1.0*len(lats)/ZONES % 1 > 0:
    print "Warning: zones not a divisor of %s" % len(lats)

# retrieve data from each zone
data = []
zoneSize = len(lats) / ZONES
for zone in range(ZONES):
    i0 = zone * zoneSize
    i1 = (zone+1) * zoneSize
    zoneLats = lats[i0:i1]
    zoneData = []
    for j, year in enumerate(times):
        if START_YEAR <= year <= END_YEAR:
            arr = []
            for i, lat in enumerate(zoneLats):
                values = tempData[j][i0+i][:]
                # convert to Fahrenheit
                # values = [v*1.8 for v in values if v != "--"]
                values = [v*1.0 for v in values if v != "--"]
                if len(values) > 0:
                    arr += values
            value = mean(arr)
            # add data
            zoneData.append(value)
    data.append(list(zoneData))
    print "Zone %s complete" % (zone+1)
data = list(reversed(data))
ds.close()

# add colors
for i, zoneData in enumerate(data):
    zoneColors = []
    for j, v in enumerate(zoneData):
        if v >= 0:
            n = 1.0 * v / RANGE[1] * 0.5 + 0.5
        else:
            n = 0.5 - v / RANGE[0] * 0.5
        # n = norm(value, RANGE[0], RANGE[1])
        color = getColor(GRADIENT, n, toInt=True)
        data[i][j] = (v, color)

jsonData = {
    "zoneData": data,
    "domain": [START_YEAR, END_YEAR],
    "range": GRAPH_RANGE
}

# Write to file
with open(args.OUTPUT_FILE, 'w') as f:
    json.dump(jsonData, f)
    print "Wrote %s zones to %s" % (len(data), args.OUTPUT_FILE)
