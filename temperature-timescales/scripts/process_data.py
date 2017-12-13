# -*- coding: utf-8 -*-

import json
from lib import *
import math
import os
import sys

# Sources:
    # NOAA / Global Surface Temperature Anomalies / Monthly / (1880 - present)
    # https://www.ncdc.noaa.gov/monitoring-references/faq/anomalies.php
    # Baseline: 20th century average (1901-2000)

# 20the century average temperature in °C
# https://www.ncdc.noaa.gov/sotc/global/201613
BASELINE = 13.9

START_YEAR = 1880
END_YEAR = 2016
MONTHLY_DATA_FILE = "../data/188001-201710.csv"
ANNUAL_DATA_FILE = "../data/1880-2017.csv"
OUTPUT_FILE = "../data/188001-201612.json"
GRADIENT = ["#8ac1f2", "#7c597c", "#ff3f3f"]

# Convert colors to RGB
GRADIENT = [hex2rgb(g) for g in GRADIENT]

# read data
monthlyData = readCSV(MONTHLY_DATA_FILE)
annualData = readCSV(ANNUAL_DATA_FILE)

# sort data
monthlyData = sorted(monthlyData, key=lambda k: k["Date"])
annualData = sorted(annualData, key=lambda k: k["Date"])

# convert from anomaly to absolute
for i,d in enumerate(monthlyData):
    monthlyData[i]["Abs"] = d["Value"] + BASELINE
    monthlyData[i]["Year"] = int(str(d["Date"])[:4])

for i,d in enumerate(annualData):
    annualData[i]["Abs"] = d["Value"] + BASELINE

# filter
monthlyData = [d for d in monthlyData if START_YEAR <= d["Year"] <= END_YEAR]
annualData = [d for d in annualData if START_YEAR <= d["Date"] <= END_YEAR]

# define domain and range
values = [d["Abs"] for d in monthlyData] + [d["Abs"] for d in annualData]
dataDomain = [START_YEAR, END_YEAR]
dataRange = [math.floor(min(values)), math.ceil(max(values))]

# get colors
for i,d in enumerate(monthlyData):
    n = norm(d["Abs"], dataRange[0], dataRange[1])
    monthlyData[i]["Norm"] = n
    monthlyData[i]["Color"] = getColor(GRADIENT, n)

for i,d in enumerate(annualData):
    n = norm(d["Abs"], dataRange[0], dataRange[1])
    annualData[i]["Norm"] = n
    annualData[i]["Color"] = getColor(GRADIENT, n)

# minimize data
monthlyData = [(round(d["Abs"],3), d["Color"]) for d in monthlyData]
annualData = [(round(d["Abs"],3), d["Color"]) for d in annualData]

# format data
jsonData = {
    "monthlyData": monthlyData,
    "annualData": annualData,
    "domain": dataDomain,
    "range": dataRange
}

# Write to file
with open(OUTPUT_FILE, 'w') as f:
    json.dump(jsonData, f)
    print "Wrote %s years to %s" % (len(annualData), OUTPUT_FILE)
