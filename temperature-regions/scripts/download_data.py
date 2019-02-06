# -*- coding: utf-8 -*-

# download gridded data in NetCDF format from https://data.giss.nasa.gov/gistemp/maps/

import argparse
import os
import subprocess
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-start', dest="DATE_START", type=int, default=2016, help="Start year")
parser.add_argument('-end', dest="DATE_END", type=int, default=2017, help="End year")
parser.add_argument('-bstart', dest="BASE_START", type=int, default=1901, help="Start base period")
parser.add_argument('-bend', dest="BASE_END", type=int, default=2000, help="End base period")
parser.add_argument('-out', dest="OUTPUT_FILE", default="../oversize-assets/giss/amaps_%s.nc", help="Output dir")
parser.add_argument('-url', dest="URL", default="https://data.giss.nasa.gov/cgi-bin/gistemp/amaps_netcdf.cgi?id=GHCN_GISS_ERSSTv5_1200km_Anom112_%s_%s_%s_%s_100__180_90_0__2_", help="URL")
args = parser.parse_args()

DATE_START = args.DATE_START
DATE_END = args.DATE_END
BASE_START = args.BASE_START
BASE_END = args.BASE_END
OUTPUT_FILE = args.OUTPUT_FILE
URL = args.URL

d = DATE_START

while d <= DATE_END:

    url = URL % (d, d, BASE_START, BASE_END)
    filename = OUTPUT_FILE % d

    if not os.path.isfile(filename):
        print "Downloading %s" % url
        command = ['curl', '-o', filename, url]
        finished = subprocess.check_call(command)
    else:
        print "Already downloaded %s" % filename

    d += 1
