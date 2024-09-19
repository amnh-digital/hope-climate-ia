# -*- coding: utf-8 -*-

# python -monthly "data/188001-201912.csv" -annual "data/1880-2019.csv" -end 2019

import argparse
import json
from lib import *
import math
import os
from pprint import pprint
import sys

# Sources:
    # NOAA / Global Surface Temperature Anomalies / Monthly / (1880 - present)
    # https://www.ncdc.noaa.gov/monitoring-references/faq/anomalies.php
    # Baseline: 20th century average (1901-2000)

# 20the century average temperature in °C
# https://www.ncdc.noaa.gov/sotc/global/201613

parser = argparse.ArgumentParser()
parser.add_argument('-monthly', dest="MONTHLY_DATA_FILE", default="data/188001-201803.csv", help="Monthly temperature anomaly input file")
parser.add_argument('-annual', dest="ANNUAL_DATA_FILE", default="data/1880-2018.csv", help="Annual temperature anomaly input file")
parser.add_argument('-content', dest="CONTENT_FILE", default="content/content.json", help="JSON Annotations file")
parser.add_argument('-start', dest="START_YEAR", default=1880, type=int, help="Start year")
parser.add_argument('-end', dest="END_YEAR", default=2018, type=int, help="End year")
parser.add_argument('-grad', dest="GRADIENT", default="#58e0dc,#99cccc,#adada3,#d67052,#eb5229,#ff3300", help="Color gradient")
parser.add_argument('-out', dest="OUTPUT_FILE", default="data/current.json", help="Output file")
args = parser.parse_args()

START_YEAR = args.START_YEAR
END_YEAR = args.END_YEAR
MONTHLY_DATA_FILE = args.MONTHLY_DATA_FILE
ANNUAL_DATA_FILE = args.ANNUAL_DATA_FILE
OUTPUT_FILE = args.OUTPUT_FILE
GRADIENT = args.GRADIENT.split(",")
# GRADIENT = ["#42a6ff", "#89a2b7", "#473747", "#e05050", "#fc0000"]

BASELINE = 13.9 # https://www.ncdc.noaa.gov/sotc/global/201613

# Convert colors to RGB
GRADIENT = [hex2rgb(g) for g in GRADIENT]

# read data
monthlyData = readCSV(MONTHLY_DATA_FILE)
annualData = readCSV(ANNUAL_DATA_FILE)

# sort data
monthlyData = sorted(monthlyData, key=lambda k: k["Year"])
annualData = sorted(annualData, key=lambda k: k["Year"])

# convert from anomaly to absolute
for i,d in enumerate(monthlyData):
    monthlyData[i]["Abs"] = d["Value"] + BASELINE
    monthlyData[i]["Month"] = int(str(d["Year"])[4:])
    monthlyData[i]["Year"] = int(str(d["Year"])[:4])

for i,d in enumerate(annualData):
    annualData[i]["Abs"] = d["Value"] + BASELINE

# filter
monthlyData = [d for d in monthlyData if START_YEAR <= d["Year"] <= END_YEAR]
annualData = [d for d in annualData if START_YEAR <= d["Year"] <= END_YEAR]

# define domain and range
values = [d["Value"] for d in annualData]
dataDomain = [START_YEAR, END_YEAR]
dataRange = [math.floor(min(values)), math.ceil(max(values))]

# get colors
for i,d in enumerate(monthlyData):
    v = d["Value"]
    if v >= 0:
        n = v / dataRange[1] * 0.5 + 0.5
    else:
        n = 0.5 - v / dataRange[0] * 0.5
    n = clamp(n)
    monthlyData[i]["Color"] = getColor(GRADIENT, n)

for i,d in enumerate(annualData):
    v = d["Value"]
    if v >= 0:
        n = v / dataRange[1] * 0.5 + 0.5
    else:
        n = 0.5 - v / dataRange[0] * 0.5
    n = clamp(n)
    annualData[i]["Color"] = getColor(GRADIENT, n)

ys = [d["Value"] for d in annualData]
fiveYearTrend = savitzkyGolay(ys, 5)
tenYearTrend = savitzkyGolay(ys, 11)

# minimize monthly data
monthlyData = [(round(d["Value"],3), d["Color"]) for d in monthlyData]

# add monthly data to annual data and minimize
for i,d in enumerate(annualData):
    annualData[i]["monthlyData"] = monthlyData[i*12:i*12+12]
annualDataSmall = [(round(d["Value"],3), d["Color"], d["monthlyData"]) for d in annualData]

# format data
jsonData = {
    "annualData": annualDataSmall,
    # "fiveYearTrend": fiveYearTrend.tolist(),
    "tenYearTrend": tenYearTrend.tolist(),
    "domain": dataDomain,
    "range": dataRange
}

# Write to file
with open(OUTPUT_FILE, 'w') as f:
    json.dump(jsonData, f)
    print("Wrote %s years to %s" % (len(annualData), OUTPUT_FILE))

# Process annotations
# done manually in json file itself (logic/highlights changed)
# content = readJSON(args.CONTENT_FILE)
# hottestAnnotations = [
#     "Hottest year on record",
#     "Second hottest year on record",
#     "Third hottest year on record",
#     "Fourth hottest year on record",
#     "Fifth hottest year on record"
# ]
# annotations = [a for a in content["annotations"] if a["text"] not in hottestAnnotations]
# annualData = sorted(annualData, key=lambda d: -d["Value"])
# for i, text in enumerate(hottestAnnotations):
#     d = annualData[i]
#     annotations.append({
#         "year": d["Year"],
#         "text": text
#     })
# content["annotations"] = annotations
# writeJSON(args.CONTENT_FILE, content)
