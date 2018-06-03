# -*- coding: utf-8 -*-

# python processData.py -graph 1
# python processData.py -in "../config/slr.json" -graph 1
# python processData.py -in "../config/greenland.json" -graph 1

import argparse
import inspect
import json
import math
import os
import sys
from utils import *

# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="../config/co2.json", help="JSON file that contains manifest and config")
parser.add_argument('-graph', dest="SHOW_GRAPH", type=int, default=0, help="Display graph")
args = parser.parse_args()

INPUT_FILE = args.INPUT_FILE
SHOW_GRAPH = args.SHOW_GRAPH > 0
CONFIG = {}

# load config
with open(INPUT_FILE) as f:
    CONFIG = json.load(f)

# load data
data = readTxt(CONFIG["file"])

# map data
data = [{
    "time": d[CONFIG["timeKey"]],
    "value": d[CONFIG["valueKey"]]
} for d in data]

# filter data by time
data = [d for d in data if CONFIG["startTime"] <= d["time"] < CONFIG["endTime"]]

# sort data by time
data = sorted(data, key=lambda d: d["time"])

# find range
values = [d["value"] for d in data]
minValue = min(values)
maxValue = max(values)

# group the data by year
years = []
groupedData = []

for d in data:
    year = int(d["time"])
    x = d["time"] - year
    y = norm(d["value"], minValue, maxValue)
    if year not in years:
        years.append(year)
        groupedData.append([(x, y)])
    else:
        groupedData[-1].append((x, y))

if SHOW_GRAPH:
    showGraph(groupedData)

else:
    with open(CONFIG["outfile"], 'w') as f:
        json.dump(groupedData, f)
        print "Wrote %s items to %s" % (len(groupedData), CONFIG["outfile"])
