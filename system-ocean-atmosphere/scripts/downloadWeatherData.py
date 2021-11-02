# -*- coding: utf-8 -*-

# Downloads weather data from Global Forecast System (GFS)
# See: https://github.com/cambecc/earth/blob/master/README.md#getting-weather-data
# Uses command-line utility `grib2json` (https://github.com/cambecc/grib2json) to convert GRIB2 to JSON

# python downloadWeatherData.py -level 100000.0

# Ref:
    # Data: https://www.ncdc.noaa.gov/data-access/model-data/model-datasets/global-forcast-system-gfs
    # Build a URL: http://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl
    # Variables: http://www.nco.ncep.noaa.gov/pmb/docs/on388/table2.html

# 250 mb = 250 millibars = 25,000 bars ~= 10,500 meters above ground (troposphere)
# UGRD = u-component of wind, m/s
# VGRD = v-component of wind, m/s
# HGT = Geopotential height (gpm)
# TMP = Temperature (K)
# RH = Relative humidity (%)
# VVEL = Vertical velocity / pressure (Pa/s)
# ABSV = Absolute vorticity (/s)
# CLWMR = Cloud Mixing Ratio (kg/kg)
# O3MR = Ozone mixing ratio (kg/kg)

import argparse
from datetime import datetime
from datetime import timedelta
import gzip
import os
import shutil
import subprocess
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-start', dest="DATE_START", default="2016-01-01", help="Start date")
parser.add_argument('-end', dest="DATE_END", default="2016-12-31", help="End date")
parser.add_argument('-hour', dest="HOUR", default="00", help="Can be: 00, 06, 12, 18")
parser.add_argument('-level', dest="LEVEL", type=float, default=100000.0, help="bar level")
parser.add_argument('-out', dest="OUTPUT_DIR", default="../../oversize-assets/atmosphere_100000", help="Output dir")
#parser.add_argument('-url', dest="URL", default="https://nomads.ncdc.noaa.gov/data/gfsanl/", help="URL")
parser.add_argument('-url', dest="URL", default="https://www.ncei.noaa.gov/data/global-forecast-system/access/historical/analysis/", help="URL")
args = parser.parse_args()

startDate = datetime.strptime(args.DATE_START, "%Y-%m-%d")
endDate = datetime.strptime(args.DATE_END, "%Y-%m-%d")
HOUR = args.HOUR
LEVEL = args.LEVEL
URL = args.URL

if not os.path.exists(args.OUTPUT_DIR):
    os.makedirs(args.OUTPUT_DIR)

date = startDate
while date < endDate:
    dateString = date.strftime("%Y%m%d")
    basefilename = "gfsanl_4_%s_%s00_000" % (dateString, HOUR)
    filename = args.OUTPUT_DIR + '/' + basefilename + ".grb2"
    leveldir = args.OUTPUT_DIR + "/" + str(int(LEVEL))
    if not os.path.exists(leveldir):
        os.makedirs(leveldir)

    jsonFilename = leveldir + "/" + basefilename +'.json'
    csvFilename = leveldir + "/" + basefilename +'.csv'
    gzFilename = csvFilename + '.gz'

    # Already processed this file
    if not os.path.isfile(gzFilename):

        # Download if file does not exist
        if not os.path.isfile(filename):
            url = URL + date.strftime("%Y%m") + "/" + dateString + "/" + basefilename + ".grb2"
            print("Downloading %s" % url)
            command = ['curl', '-o', filename, url]
            finished = subprocess.check_call(command)
        else:
            print("Already downloaded %s" % filename)

        # if the filesize is small, it probably didn't download properly
        filesize = os.path.getsize(filename)
        if filesize > 1000000:

            if not os.path.isfile(jsonFilename):
                print("Converting grib to json")
                # command = ['./grib2json/bin/grib2json', '-d', '-n', '-o', jsonFilename, filename]
                command = ['grib2json', '-d', '-n', '-o', jsonFilename, filename]
                finished = subprocess.check_call(command)

            if not os.path.isfile(csvFilename):
                command = ['python', 'gribjsonToCsv.py', '-in', jsonFilename, '-out', csvFilename, '-level', str(LEVEL)]
                finished = subprocess.check_call(command)

            print("Compressing CSV file...")
            with open(csvFilename, 'rb') as f_in, gzip.open(gzFilename, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)

            # delete temp files
            # os.remove(filename)
            os.remove(jsonFilename)
            os.remove(csvFilename)

        else:
            print("Error in downloading %s" % filename)

    # increment one day at a time
    date += timedelta(days=1)
