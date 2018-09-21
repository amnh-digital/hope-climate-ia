# -*- coding: utf-8 -*-

import argparse
import datetime
import gzip
import json
from lib import *
import math
from multiprocessing import Pool
from multiprocessing.dummy import Pool as ThreadPool
from netCDF4 import Dataset
import os
from pprint import pprint
import shutil
import sys

parser = argparse.ArgumentParser()
# Source: https://podaac.jpl.nasa.gov/dataset/OSCAR_L4_OC_third-deg
# Doc: ftp://podaac-ftp.jpl.nasa.gov/allData/oscar/preview/L4/oscar_third_deg/docs/oscarthirdguide.pdf
    # 577,681-point (1201x481) 20 to 420° lon, 80 to -80° lat, 72 measurements per year (~5 day interval)
parser.add_argument('-in', dest="INPUT_FILE", default="../../oversize-assets/oscar_vel2016.nc", help="Input NetCDF file")
parser.add_argument('-intemp', dest="INPUT_TEMPERATURE_FILE", default="../../oversize-assets/MYD28M_2016/MYD28M_2016-%s.CSV.gz", help="Input CSV temperature files")
parser.add_argument('-out', dest="OUTPUT_FILE", default="../../oversize-assets/oscar_vel2016/oscar_vel2016_%s.csv", help="Output file pattern")
parser.add_argument('-start', dest="DATE_START", default="2016-01-01", help="Date start")
parser.add_argument('-end', dest="DATE_END", default="2016-12-31", help="Date end")
parser.add_argument('-lon', dest="LON_RANGE", default="20,420", help="Longitude range")
parser.add_argument('-lat', dest="LAT_RANGE", default="80,-80", help="Latitude range")

args = parser.parse_args()

INPUT_FILE = args.INPUT_FILE
INPUT_TEMPERATURE_FILE = args.INPUT_TEMPERATURE_FILE
OUTPUT_FILE = args.OUTPUT_FILE
DATE_START = [int(d) for d in args.DATE_START.split("-")]
DATE_END = [int(d) for d in args.DATE_END.split("-")]
LON_RANGE = [float(d) for d in args.LON_RANGE.strip().split(",")]
LAT_RANGE = [float(d) for d in args.LAT_RANGE.strip().split(",")]

dateStart = datetime.date(DATE_START[0], DATE_START[1], DATE_START[2])
dateEnd = datetime.date(DATE_END[0], DATE_END[1], DATE_END[2])

params = {}

# Read temperature data
filenames = [INPUT_TEMPERATURE_FILE % str(month+1).zfill(2) for month in range(12)]

print "Reading %s files asyncronously..." % len(filenames)
pool = ThreadPool()
tData = pool.map(readSSTCSVData, filenames)
pool.close()
pool.join()
print "%s Temperature measurements found with %s degrees (lng) by %s degrees (lat)" % (len(tData), len(tData[0][0]), len(tData[0]))

# read the data
ds = Dataset(INPUT_FILE, 'r')

# Extract data from NetCDF file
uData = ds.variables['u'][:]
vData = ds.variables['v'][:]
depth = 0

timeCount = len(uData) # this should be 72, i.e. ~5 day interval
lats = len(uData[0][depth]) # this should be 481
lons = len(uData[0][depth][0]) # this should be 1201;
total = lats * lons
print "%s UV measurements found with %s degrees (lng) by %s degrees (lat)" % (timeCount, lons, lats)

def combineData(tData, uData, vData, uvLonRange, uvLatRange, mu):
    depth = 0
    tLen = len(tData)
    uvLen = len(uData)
    th = len(tData[0])
    tw = len(tData[0][0])
    uvh = len(uData[0][depth])
    uvw = len(uData[0][depth][0])
    uvlon0, uvlon1 = uvLonRange
    uvlat0, uvlat1 = uvLatRange

    tData = np.array(tData, dtype=np.float32)
    uData = np.array(uData)
    vData = np.array(vData)

    # remove nan values
    uData = np.nan_to_num(uData)
    vData = np.nan_to_num(vData)

    uData = uData.astype(np.float32)
    vData = vData.astype(np.float32)

    # convert to 1-dimension
    tData = tData.reshape(-1)
    uData = uData.reshape(-1)
    vData = vData.reshape(-1)

    w = int(uvw * (360.0/(uvlon1-uvlon0)))
    h = w / 2
    dim = 3
    shape = (h, w, dim)
    result = np.empty(h * w * dim, dtype=np.float32)

    # the kernel function
    src = """
    static bool isBetween(float value, float a, float b) {
        return (value > a && value < b);
    }

    static float lerpT(float a, float b, float mu) {
        return (b - a) * mu + a;
    }

    static float normLat(float value, float a, float b) {
        return (value - a) / (b - a);
    }

    static float normLon(float value, float a, float b) {
        float mvalue = value;
        if (value < a) {
            mvalue = value + 360.0;
        }
        if (value > b) {
            mvalue = value - 360.0;
        }
        return (mvalue - a) / (b - a);
    }

    __kernel void combineData(__global float *tdata, __global float *udata, __global float *vdata, __global float *result){
        int tLen = %d;
        int uvLen = %d;
        int uvw = %d;
        int uvh = %d;
        int tw = %d;
        int th = %d;
        int w = %d;
        int h = %d;
        int dim = %d;
        float uvlon0 = %f;
        float uvlon1 = %f;
        float uvlat0 = %f;
        float uvlat1 = %f;
        float mu = %f;

        // get current position
        int posx = get_global_id(1);
        int posy = get_global_id(0);

        // get position in float
        float xf = (float) posx / (float) (w-1);
        float yf = (float) posy / (float) (h-1);
        float tf = mu;

        // get interpolated temperature
        int tposx = (int) round(xf * (tw-1));
        int tposy = (int) round(yf * (th-1));
        float tpostf = tf * (float) (tLen-1);
        int tposta = (int) floor(tpostf);
        int tpostb = (int) ceil(tpostf);
        if (tpostb >= (tLen-1)) { // wrap around to the beginning
            tpostb = 0;
        }
        float tmu = tpostf - floor(tpostf);
        int i0 = tposta * tw * th + tposy * tw + tposx;
        int i1 = tpostb * tw * th + tposy * tw + tposx;
        float t0 = tdata[i0];
        float t1 = tdata[i1];
        float tValue = 0.0;
        // don't interpolate between invalid values
        if (!isBetween(t0, -9999.0, 9999.0)) {
            tValue = t0;
        } else if (!isBetween(t1, -9999.0, 9999.0)) {
            tValue = t1;
        } else {
            tValue = lerpT(t0, t1, tmu);
        }

        // convert position from lon 20,420 to -180,180 and lat 80,-80 to 90,-90
        float lat = lerpT(90.0, -90.0, yf);
        float lon = lerpT(-180.0, 180.0, xf);
        float latn = normLat(lat, uvlat0, uvlat1);
        float lonn = normLon(lon, uvlon0, uvlon1);
        float uValue = 0.0;
        float vValue = 0.0;

        // check for invalid latitudes
        if (latn >= 0.0 && latn <= 1.0) {
            // interpolate uv data
            float uvf = tf * (float) (uvLen-1);
            int uva = (int) floor(uvf);
            int uvb = (int) ceil(uvf);
            if (uvb >= (uvLen-1)) { // wrap around to the beginning
                uvb = 0;
            }
            float uvmu = uvf - floor(uvf);

            int posUVx = (int) round(lonn * (float) (uvw-1));
            int posUVy = (int) round(latn * (float) (uvh-1));
            int uvia = uva * uvw * uvh + posUVy * uvw + posUVx;
            int uvib = uvb * uvw * uvh + posUVy * uvw + posUVx;
            float ua = udata[uvia];
            float ub = udata[uvib];
            float va = vdata[uvia];
            float vb = vdata[uvib];

            // don't interpolate between invalid values
            if (isBetween(ua, -9999.0, 9999.0) && isBetween(ub, -9999.0, 9999.0)) {
                uValue = lerpT(ua, ub, uvmu);
            }
            if (isBetween(va, -9999.0, 9999.0) && isBetween(vb, -9999.0, 9999.0)) {
                vValue = lerpT(va, vb, uvmu);
            }
        }

        int i = posy * w * dim + posx * dim;
        result[i] = tValue;
        result[i+1] = uValue;
        result[i+2] = vValue;
    }
    """ % (tLen, uvLen, uvw, uvh, tw, th, w, h, dim, uvlon0, uvlon1, uvlat0, uvlat1, mu)

    # Get platforms, both CPU and GPU
    plat = cl.get_platforms()
    GPUs = plat[0].get_devices(device_type=cl.device_type.GPU)
    CPU = plat[0].get_devices()

    # prefer GPUs
    if GPUs and len(GPUs) > 0:
        ctx = cl.Context(devices=GPUs)
    else:
        print "Warning: using CPU"
        ctx = cl.Context(CPU)

    # Create queue for each kernel execution
    queue = cl.CommandQueue(ctx)
    mf = cl.mem_flags

    # Kernel function instantiation
    prg = cl.Program(ctx, src).build()

    inT =  cl.Buffer(ctx, mf.READ_ONLY | mf.COPY_HOST_PTR, hostbuf=tData)
    inU =  cl.Buffer(ctx, mf.READ_ONLY | mf.COPY_HOST_PTR, hostbuf=uData)
    inV =  cl.Buffer(ctx, mf.READ_ONLY | mf.COPY_HOST_PTR, hostbuf=vData)
    outResult = cl.Buffer(ctx, mf.WRITE_ONLY, result.nbytes)

    prg.combineData(queue, [h, w], None , inT, inU, inV, outResult)

    # Copy result
    cl.enqueue_copy(queue, result, outResult)

    result = result.reshape(shape)
    result.astype(float)
    result = result.tolist()

    return result

def processData(p):
    gzFilename = p["fileOut"] + ".gz"
    if os.path.isfile(gzFilename):
        print "%s: skipped." % p["fileOut"]
        return

    # Determine the two vector fields to interpolate from
    print "%s: processing data..." % p["fileOut"]
    data = combineData(p["tData"], p["uData"], p["vData"], tuple(p["lonRange"]), tuple(p["latRange"]), p["progress"])

    # Write to csv
    print "%s: writing data to csv..." % p["fileOut"]
    rows = [None for d in range(len(data))]
    for i, row in enumerate(data):
        cols = [None for d in range(len(row))]
        for j, triple in enumerate(row):
            value = ":".join([str(t) for t in triple])
            cols[j] = value
        rows[i] = cols

    with open(p["fileOut"], 'wb') as f:
        w = csv.writer(f, delimiter=',')
        w.writerows(rows)

    print "%s: compressing csv file..." % p["fileOut"]
    with open(p["fileOut"], 'rb') as f_in, gzip.open(gzFilename, 'wb') as f_out:
        shutil.copyfileobj(f_in, f_out)
    os.remove(p["fileOut"])

    print "%s: Done." % p["fileOut"]

params = []
delta = (dateEnd-dateStart).days
print "Delta = %s days" % delta
d = dateStart
i = 0
while d <= dateEnd:
    params.append({
        "fileOut": OUTPUT_FILE % d.strftime("%Y%m%d"),
        "progress": 1.0 * i / (delta-1),
        "tData": tData,
        "uData": uData,
        "vData": vData,
        "lonRange": LON_RANGE,
        "latRange": LAT_RANGE
    })
    d += datetime.timedelta(days=1)
    i += 1

print "Processing %s files asyncronously..." % delta
pool = ThreadPool()
data = pool.map(processData, params)
pool.close()
pool.join()
print "Done."

# print "Processing %s files syncronously..." % delta
# for p in params:
#     processData(p)
