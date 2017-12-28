# -*- coding: utf-8 -*-

# Gridded Monthly Temperature Anomaly Data
# source: https://data.giss.nasa.gov/gistemp/

# Convert to annual
# python nc_monthly_to_annual.py
# inspect: ncdump -h data/gistemp1200_ERSSTv4.nc

import argparse
import datetime
import json
import math
from netCDF4 import Dataset
import numpy
from pprint import pprint
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="../data/gistemp1200_ERSSTv4.nc", help="Temperature input file")
parser.add_argument('-out', dest="OUTPUT_FILE", default="../data/gistemp1200_ERSSTv4_annual.nc", help="Output file")
args = parser.parse_args()

# config
INPUT_FILE = args.INPUT_FILE
OUTPUT_FILE = args.OUTPUT_FILE

# Mean of list
def mean(data):
    n = len(data)
    if n < 1:
        return 0
    else:
        return 1.0 * sum(data) / n

# Open NetCDF file
ds = Dataset(INPUT_FILE, 'r')

# Extract data from NetCDF file
lats = ds.variables['lat'][:] # float: latitude
lons = ds.variables['lon'][:] # float: longitude
times = ds.variables['time'][:] # int: days since 1/1/1800
w = len(lons)
h = len(lats)
t = len(times)
print "Time: %s x Lon: %s x Lat: %s" % (t, w, h)

tempData = ds.variables['tempanomaly'][:] # short: surface temperature anomaly (K), e.g. tempData[time][lat][lon]
baseDate = "1800-01-01"
bd = datetime.datetime.strptime(baseDate, "%Y-%m-%d")

print "Grouping data by year..."
years = []
yearData = []
for i, days in enumerate(times):
    theDate = bd + datetime.timedelta(days=int(days))
    theYear = theDate.year
    theMonth = theDate.month
    data = tempData[i]
    if theYear in years:
        yi = years.index(theYear)
        yearData[yi].append(data)
    else:
        years.append(theYear)
        yearData.append([data])
    sys.stdout.write('\r')
    sys.stdout.write("%s%%" % round(1.0*(i+1)/t*100,1))
    sys.stdout.flush()

aggData = []
print "\Aggregating data..."
for yi, yd in enumerate(yearData):
    yvalues = []
    for y, lat in enumerate(lats):
        for x, lon in enumerate(lons):
            values = []
            for d in yd:
                value = d[y][x]
                if value != "--":
                    values.append(value)
            value = mean(values)
            yvalues.append(value)
    aggData.append(yvalues)
    sys.stdout.write('\r')
    sys.stdout.write("%s%%" % round(1.0*(yi+1)/len(yearData)*100,1))
    sys.stdout.flush()
ds.close()

print "\rPreparing output file"
dsout = Dataset(OUTPUT_FILE, "w", format="NETCDF4")
latD = dsout.createDimension("lat", h)
lonD = dsout.createDimension("lon", w)
timeD = dsout.createDimension("time", len(years))

latV = dsout.createVariable("lat","f4",("lat",))
lonV = dsout.createVariable("lon","f4",("lon",))
timeV = dsout.createVariable("time","i2",("time",))
tempV = dsout.createVariable("tempanomaly","f4",("time","lat","lon",),zlib=True,least_significant_digit=2)

latV[:] = lats
lonV[:] = lons
timeV[:] = numpy.array([int(year) for year in years])

for yi, year in enumerate(years):
    for y, lat in enumerate(lats):
        for x, lon in enumerate(lons):
            index = y * w + x
            value = aggData[yi][index]
            # print "%s, %s, %s, %s" % (yi, y, x, value)
            tempV[yi, y, x] = value

dsout.close()

print "\rDone."
