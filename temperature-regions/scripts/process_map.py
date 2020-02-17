# -*- coding: utf-8 -*-

# Shapefile source: http://www.naturalearthdata.com/downloads/110m-physical-vectors/

# python process_map.py -land "#2b5b62" -water "#000000" -out "../img/map_resting.svg"
# python process_map.py -land "#333333" -water "#000000" -out "../img/map.svg"
# python process_map.py -land "#555555" -water "#000000" -out "../img/map_highlight.svg"

import argparse
from lib import *
import os
from pprint import pprint
from pyproj import Proj
import shapefile # https://github.com/GeospatialPython/pyshp
import svgwrite
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="data/ne_110m_land/ne_110m_land", help="Temperature input file")
parser.add_argument('-width', dest="WIDTH", default=1024, type=int, help="Width of SVG")
parser.add_argument('-land', dest="LAND_COLOR", default="#ffffff", help="Land color")
parser.add_argument('-water', dest="WATER_COLOR", default="#000000", help="Water color")
parser.add_argument('-out', dest="OUTPUT_FILE", default="data/ne_110m_land.svg", help="Output file")
args = parser.parse_args()

# config
INPUT_FILE = args.INPUT_FILE
WIDTH = args.WIDTH
HEIGHT = WIDTH / 2
LAND_COLOR = args.LAND_COLOR
WATER_COLOR = args.WATER_COLOR
OUTPUT_FILE = args.OUTPUT_FILE

def shapeToGeojson(sfname):
    # convert shapefile to geojson
    sf = shapefile.Reader(sfname)
    fields = sf.fields[1:]
    field_names = [field[0] for field in fields]
    features = []
    for sr in sf.shapeRecords():
        atr = dict(zip(field_names, sr.record))
        geom = sr.shape.__geo_interface__
        features.append({
            "type": "Feature",
            "geometry": geom,
            "properties": atr
        })
    geojson = {"type": "FeatureCollection", "features": features}
    return geojson

geojson = shapeToGeojson(INPUT_FILE)
robinsonProj = Proj(ellps='WGS84',proj='robin')

x0 = -16986889.765199486
x1 = 16986889.765199486
y0 = 8619370.860731091
y1 = -8619370.860731091

polygons = []
for i, feature in enumerate(geojson["features"]):
    for coord in feature["geometry"]["coordinates"]:
        polygon = []
        for lonlat in coord:
            point = robinsonProj(lonlat[0], lonlat[1])
            x = norm(point[0], x0, x1) * WIDTH
            y = norm(point[1], y0, y1) * HEIGHT
            polygon.append((x, y))
        # add closure
        polygon.append(polygon[0])
        polygons.append(polygon)

print("%s polygons found" % len(polygons))

dwg = svgwrite.Drawing(OUTPUT_FILE, size=(WIDTH, HEIGHT), profile='full')
dwg.add(dwg.rect(id="bg", insert=(0,0), size=(WIDTH, HEIGHT), fill=WATER_COLOR))

dwgLand = dwg.g(id="land")
for points in polygons:
    dwgLand.add(dwg.polygon(points=points, fill=LAND_COLOR))
dwg.add(dwgLand)

# Save
dwg.save()
print("Saved %s" % OUTPUT_FILE)
