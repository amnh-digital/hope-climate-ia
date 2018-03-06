# -*- coding: utf-8 -*-

import argparse
import json
import io
from lib import *
from pprint import pprint
from pyproj import Proj
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="../content/content.json", help="JSON input file")
args = parser.parse_args()

# config
INPUT_FILE = args.INPUT_FILE

dataIn = {}
with open(INPUT_FILE, 'r') as f:
    dataIn = json.load(f)

robinsonProj = Proj(ellps='WGS84',proj='robin')

cities = []
for i, city in enumerate(dataIn["cities"]):
    point = robinsonProj(city["lon"], city["lat"])
    # normalize point
    city["x"] = norm(point[0], -16986889.765199486, 16986889.765199486)
    city["y"] = norm(point[1], 8619370.860731091, -8619370.860731091)
    city["name"] = city["name"].encode("utf-8")
    cities.append(city)

cities = sorted(cities, key=lambda k: k['lon'])
cities = sorted(cities, key=lambda k: k['lat'])
dataOut = dataIn
dataOut["cities"] = cities

# Write to file
with open(INPUT_FILE, 'w') as f:
    json.dump(dataOut, f, indent=2, ensure_ascii=False)
