# -*- coding: utf-8 -*-

# python gribjsonToCsv.py -in data/troposphere_wind/gfsanl_4_20160101_0000_000.json -out data/troposphere_wind/gfsanl_4_20160101_0000_000.json.csv

import argparse
import csv
import json
import math
import os
from pprint import pprint
import sys
# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="path/to/file.json", help="Input file")
parser.add_argument('-level', dest="LEVEL", type=float, default=100000.0, help="Input file")
parser.add_argument('-out', dest="OUTPUT_FILE", default="path/to/file.csv", help="Output file")
args = parser.parse_args()

print("Reading JSON...")
data = {}
with open(args.INPUT_FILE) as f:
    data = json.load(f)

tData = []
uData = []
vData = []
nx = 0
ny = 0

# labels = list(set([d["header"]['surface1TypeName'] for d in data]))
# labels = sorted(list(set([d["header"]['surface1Value'] for d in data if d["header"]['surface1TypeName']=="Specified height level above ground"]))) # [2.0,...,6000.0]
# labels = sorted(list(set([d["header"]['surface1Value'] for d in data if d["header"]['surface1TypeName']=="Isobaric surface"]))) # [1000.0,...,100000.0]
# labels = sorted(list(set([d["header"]['parameterNumberName'] for d in data if d["header"]['surface1TypeName']=="Isobaric surface"])))
# pprint(labels)
# sys.exit(1)

for d in data:
    info = d["header"]

    if info['surface1TypeName'] == 'Isobaric surface' and info['surface1Value'] == args.LEVEL:

        if info['parameterNumberName'] == 'U-component_of_wind':
            uData = d["data"]
            nx = info["nx"]
            ny = info["ny"]

        elif info['parameterNumberName'] == 'V-component_of_wind':
            vData = d["data"]

        elif info['parameterNumberName'] == 'Temperature':
            tData = d["data"]



if len(uData) == len(vData) and len(uData) == len(tData) and nx > 0 and ny > 0:

    umin = 999
    umax = 0
    vmin = 999
    vmax = 0

    # calculate wind speed
    rows = []
    for y in range(ny):
        row = []
        for x in range(nx):
            i = y * nx + x
            t = tData[i]
            u = uData[i]
            v = vData[i]

            if u > umax:
                umax = u
            if u < umin:
                umin = u
            if v > vmax:
                vmax = v
            if v < vmin:
                vmin = v

            row.append(":".join([str(t), str(u), str(v)]))
        rows.append(row)
    print(f"U range: [{umin}, {umax}]") 
    print(f"V range: [{vmin}, {vmax}]")

    with open(args.OUTPUT_FILE, 'w') as f:
        w = csv.writer(f, delimiter=',')
        w.writerows(rows)
        print(f"Successfully converted to {args.OUTPUT_FILE}")

else:
    print("Could not find UV data for level")
