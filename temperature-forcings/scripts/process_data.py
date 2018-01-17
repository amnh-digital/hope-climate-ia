# -*- coding: utf-8 -*-

# Source for forcings:
# https://data.giss.nasa.gov/modelforce/
# NASA GISS CMIP5 simulations (1850-2012): https://data.giss.nasa.gov/modelE/ar5/
# Miller et al. (2014): https://pubs.giss.nasa.gov/abs/mi08910y.html

# Source for temperature anomaly
# NOAA / Global Surface Temperature Anomalies / Monthly / (1880 - present)
# https://www.ncdc.noaa.gov/monitoring-references/faq/anomalies.php
# Baseline: 20th century average (1901-2000)

import argparse
import json
from lib import *
import math
import os
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-forcings', dest="FORCINGS_FILE", default="../data/Fi_Miller_et_al14_upd.txt", help="Forcings input file")
parser.add_argument('-net', dest="NET_FORCINGS_FILE", default="../data/Fi_net_Miller_et_al14_upd.txt", help="Net forcings input file")
parser.add_argument('-observed', dest="OBSERVED_FILE", default="../data/1880-2016.csv", help="Observed input file")
parser.add_argument('-out', dest="OUTPUT_FILE", default="../data/forcings1880-2012.json", help="JSON output file")

args = parser.parse_args()

# 20the century average temperature in °C
# https://www.ncdc.noaa.gov/sotc/global/201613
BASELINE = 13.9

START_YEAR = 1880
END_YEAR = 2012
BASELINE_YEAR_START = 1900
BASELINE_YEAR_END = 1999
RANGE = (-1.0, 1.0)
FORCING_HEADERS = {
    "TropAerInd": "aerosols",
    "WMGHG": "ghgs",
    "Land_Use": "land_use",
    "Orbital": "orbital",
    "Ozone": "ozone",
    "Solar": "solar",
    "StratAer": "volcanic"
}

# Retrieve data
observed = readCsv(args.OBSERVED_FILE)
forcings = readTxt(args.FORCINGS_FILE)
netForcings = readTxt(args.NET_FORCINGS_FILE)

# Convert forcings from w/m^2 to celsius
# Fast-feedback sensitivity is 0.75 °C ± 0.125 °C per W m−2
# https://pubs.giss.nasa.gov/docs/2011/2011_Hansen_ha06510a.pdf
#
# Without any feedbacks, a doubling of CO2 (which amounts to a forcing of 3.7 W/m2) would
# result in 1°C global warming, which is easy to calculate and is undisputed.1
# http://www.pik-potsdam.de/~stefan/Publications/Book_chapters/Rahmstorf_Zedillo_2008.pdf
def wm2c(value):
    if value == 0:
        return 0
    m = 1.0
    if value < 0:
        m = -1.0
        value *= -1.0
    # return m * math.sqrt(value) * 0.75
    return m * value / 3.7

for i, f in enumerate(forcings):
    for h in FORCING_HEADERS:
        forcings[i][h] = wm2c(f[h])

for i, f in enumerate(netForcings):
    netForcings[i]["All_Forcings_Together"] = wm2c(f["All_Forcings_Together"])

fBaseline = getBaseline(netForcings, "All_Forcings_Together", BASELINE_YEAR_START, BASELINE_YEAR_END)
oBaseline = getBaseline(observed, "Value", BASELINE_YEAR_START, BASELINE_YEAR_END)
# oBaseline = 0.0 # override this for now

print "Forcings baseline: %s°C" % fBaseline
print "Observed baseline: %s°C" % oBaseline

# process observed data
observedData = getData(observed, "Value", START_YEAR, END_YEAR, oBaseline)
values = observedData[:]

# process forcings data
items = {}
for header in FORCING_HEADERS:
    key = FORCING_HEADERS[header]
    data = getData(forcings, header, START_YEAR, END_YEAR, oBaseline)
    items[key] = {
        "data": data
    }
    values += data[:]

# calculate range
minValue = min(values)
maxValue = max(values)
print "Range: [%s, %s] °C" % (minValue, maxValue)

jsonOut = {
    "domain": (START_YEAR, END_YEAR),
    "range": RANGE,
    "data": items,
    "observed": observedData
}

# Write to file
with open(args.OUTPUT_FILE, 'w') as f:
    json.dump(jsonOut, f)
    print "Wrote %s items to %s" % (len(items), args.OUTPUT_FILE)
