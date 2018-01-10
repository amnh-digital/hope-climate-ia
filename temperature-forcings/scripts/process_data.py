# -*- coding: utf-8 -*-

# Sources:
# https://data.giss.nasa.gov/modelforce/
# NASA GISS ModelE2: https://data.giss.nasa.gov/modelE/
# Via: https://www.bloomberg.com/graphics/2015-whats-warming-the-world/

import argparse
import json
from lib import *
import os
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-forcings', dest="FORCINGS_FILE", default="../data/forcings.csv", help="Forcings input file")
parser.add_argument('-observed', dest="OBSERVED_FILE", default="../data/observed.csv", help="Observed input file")
parser.add_argument('-out', dest="OUTPUT_FILE", default="../data/forcings1880-2005.json", help="JSON output file")

args = parser.parse_args()

START_YEAR = 1880
END_YEAR = 2005
BASELINE_YEAR_START = 1880
BASELINE_YEAR_END = 1910
RANGE = (-1, 2)
FORCING_HEADERS = {
    "Anthropogenic tropospheric aerosol": "aerosols",
    "Greenhouse gases": "ghgs",
    "Land use": "land_use",
    "Orbital changes": "orbital",
    "Ozone": "ozone",
    "Solar": "solar",
    "Volcanic": "volcanic"
}

# Retrieve data
observed = readCSV(args.OBSERVED_FILE)
forcings = readCSV(args.FORCINGS_FILE)

# convert celsius to fahrenheit
# for i, r in enumerate(observed):
#     observed[i]["Annual_Mean"] = (9.0/5.0 * r["Annual_Mean"] + 32)

# convert kelvin to fahrenheit
for i, r in enumerate(forcings):
    headers = ["All forcings"] + [h for h in FORCING_HEADERS]
    for h in headers:
        forcings[i][h] = r[h] - 273.15

fBaseline = getBaseline(forcings, "All forcings", BASELINE_YEAR_START, BASELINE_YEAR_END)
oBaseline = getBaseline(observed, "Annual_Mean", BASELINE_YEAR_START, BASELINE_YEAR_END)

# process data
items = {}
items["observed"] = {
    "data": getData(observed, "Annual_Mean", START_YEAR, END_YEAR, oBaseline)
}
for header in FORCING_HEADERS:
    key = FORCING_HEADERS[header]
    items[key] = {
        "data": getData(forcings, header, START_YEAR, END_YEAR, fBaseline)
    }

jsonOut = {
    "domain": (START_YEAR, END_YEAR),
    "range": RANGE,
    "data": items
}

# Write to file
with open(args.OUTPUT_FILE, 'w') as f:
    json.dump(jsonOut, f)
    print "Wrote %s items to %s" % (len(items), args.OUTPUT_FILE)
