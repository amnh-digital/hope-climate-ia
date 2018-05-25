# -*- coding: utf-8 -*-

# Given an input NetCDF file with the wrong anomaly baseline and a set of NetCDF files with the correct baseline, output a new NetCDF file with the correct baseline

import argparse
import datetime
import math
from netCDF4 import Dataset
import numpy as np
from pprint import pprint
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="../data/gistemp1200_ERSSTv5_annual.nc", help="Temperature input file with wrong baseline")
parser.add_argument('-ref', dest="REF_FILE", default="../data/giss/amaps_%s.nc", help="Reference input file with target baseline")
parser.add_argument('-start', dest="START_YEAR", default=1880, type=int, help="Start year")
parser.add_argument('-ryears', dest="REF_YEARS", default="2017,2016,2015,2014,2013,2012,2011,2010", help="Reference years")
parser.add_argument('-out', dest="OUTPUT_FILE", default="../data/gistemp1200_ERSSTv5_annual_1901-2000_baseline.nc", help="Output file")
args = parser.parse_args()

# config
INPUT_FILE = args.INPUT_FILE
REF_FILE = args.REF_FILE
START_YEAR = args.START_YEAR
REF_YEARS = [int(y) for y in args.REF_YEARS.split(",")]
OUTPUT_FILE = args.OUTPUT_FILE

print "Reading data..."
baseData = Dataset(INPUT_FILE, 'r')

refDatas = []
for y in REF_YEARS:
    refData = Dataset(REF_FILE % y, 'r')
    refDatas.append(refData)

baseLats = len(baseData.variables['lat']) # float: latitude between -90 and 90
baseLons = len(baseData.variables['lon'])  # float: longitude between -180 and 180
baseTimes = baseData.variables['time'][:] # int: year
baseTemp = baseData.variables['tempanomaly'][:] # float: surface temperature anomaly (C), e.g. tempData[time][lat][lon]

refLats = len(refDatas[0].variables['lat']) # float: latitude between -90 and 90
refLons = len(refDatas[0].variables['lon']) # float: longitude between -180 and 180

if baseLats != refLats or baseLons != refLons:
    print "Spatial resolution mismatch"
    sys.exit(1)

# initialize a diff matrix
print "Finding differences..."
diffTemp = np.zeros((baseLats, baseLons), dtype=float)
missingCount = 0
for lat in range(baseLats):
    for lon in range(baseLons):
        diffValue = False

        for i, y in enumerate(REF_YEARS):
            refYearIndex = y - START_YEAR
            baseValue = baseTemp[refYearIndex][lat][lon]
            refValue = refDatas[i].variables['TEMPANOMALY'][lat][lon]

            # value is missing, try another ref file
            if np.ma.is_masked(refValue):
                continue
            else:
                diffValue = refValue - baseValue
                break

        if diffValue is not False:
            diffTemp[lat][lon] = diffValue
        else:
            diffTemp[lat][lon] = False
            missingCount += 1

print "Missing %s values" % missingCount

print "Writing results to output file..."
dsout = Dataset(OUTPUT_FILE, "w", format="NETCDF4")
latD = dsout.createDimension("lat", baseLats)
lonD = dsout.createDimension("lon", baseLons)
timeD = dsout.createDimension("time", len(baseTimes))

latV = dsout.createVariable("lat","f4",("lat",))
lonV = dsout.createVariable("lon","f4",("lon",))
timeV = dsout.createVariable("time","i2",("time",))
tempV = dsout.createVariable("tempanomaly","f4",("time","lat","lon",),zlib=True,least_significant_digit=2)

latV[:] = baseData.variables['lat'][:]
lonV[:] = baseData.variables['lon'][:]
timeV[:] = baseData.variables['time'][:]

for t in range(len(baseTimes)):
    for lat in range(baseLats):
        for lon in range(baseLons):
            baseValue = baseTemp[t][lat][lon]
            diffValue = diffTemp[lat][lon]
            if diffValue is not False and baseValue != 0.0:
                tempV[t, lat, lon] = baseValue + diffValue
            else:
                tempV[t, lat, lon] = 0.0
dsout.close()

print "Done."
