# -*- coding: utf-8 -*-

import csv
import gzip
import math
import numpy as np
import numpy.ma as ma
import os
from PIL import Image
from pprint import pprint
import pyopencl as cl
import random
import sys

os.environ['PYOPENCL_COMPILER_OUTPUT'] = '1'

def clamp(value, low=0.0, high=1.0):
    if low > high:
        tmp = low
        low = high
        high = tmp
    value = min(value, high)
    value = max(value, low)
    return value

def getColor(gradient, mu, start=0.0, end=1.0):
    gradientLen = len(gradient)
    start = int(round(start * gradientLen))
    end = int(round(end * gradientLen))
    gradient = gradient[start:end]

    index = int(round(mu * (gradientLen-1)))
    rgb = tuple([int(round(v*255.0)) for v in gradient[index]])
    return rgb

def getWrappedData(data, count, start, end):
    wData = []
    if end <= count:
        wData = data[start:end]
    else: # wrap around to the beginning
        d1 = data[start:count]
        d2 = data[0:(end-count)]
        wData = d1[:] + d2[:]
    return wData

def halton(index, base=7):
    result = 0
    f = 1.0 / base
    i = index
    while i > 0:
        result += f * float(i % base)
        i = math.floor(i / base)
        f = f / float(base)
    return result

def lerp(a, b, mu):
    return (b-a) * mu + a

def lineIntersection(line1, line2):
    xdiff = (line1[0][0] - line1[1][0], line2[0][0] - line2[1][0])
    ydiff = (line1[0][1] - line1[1][1], line2[0][1] - line2[1][1])

    def det(a, b):
        return a[0] * b[1] - a[1] * b[0]

    div = det(xdiff, ydiff)
    if div == 0:
       return False

    d = (det(*line1), det(*line2))
    x = det(d, xdiff) / div
    y = det(d, ydiff) / div
    return x, y

def mean(data):
    n = len(data)
    if n < 1:
        return 0
    else:
        return 1.0 * sum(data) / n

def norm(value, a, b, clamp=True, wrap=False):
    n = 1.0 * (value - a) / (b - a)
    if clamp:
        n = min(n, 1)
        n = max(n, 0)
    if wrap and (n < 0 or n > 1.0):
        n = n % 1.0
    return n

def parseNumber(string):
    num = 0
    try:
        num = float(string)
    except ValueError:
        num = 0.0
        print "Value error: %s" % string
    # if num <= -9999 or num >= 9999:
    #     print "Value unknown: %s" % string
    #     num = 0.0
    return num

def pseudoRandom(seed):
    random.seed(seed)
    return random.random()

def wrap(value, a, b):
    if value < a:
        value = b + value
    elif value > b:
        value = a + (value - b)
    return value

def frameToImage(p):
    # Determine the two vector fields to interpolate from
    print "%s: processing data..." % p["fileOut"]
    dataCount = len(p["dates"])
    dataProgress = p["progress"] * (dataCount - 1)
    dataIndexA0 = int(math.floor(dataProgress))
    dataIndexA1 = dataIndexA0 + p["rolling_avg"]
    dataIndexB0 = int(math.ceil(dataProgress))
    dataIndexB1 = dataIndexB0 + p["rolling_avg"]
    mu = dataProgress - dataIndexA0
    f0 = getWrappedData(p["data"], dataCount, dataIndexA0, dataIndexA1)
    f1 = getWrappedData(p["data"], dataCount, dataIndexB0, dataIndexB1)
    offset = int(round(p["lon_range"][0] + 180.0))
    if offset != 0.0:
        offset = int(round(offset / 360.0 * len(f0[0][0])))
    lerpedData = lerpData(f0, f1, mu, offset)

    baseImage = getBaseImage(p["base_images"], p["progress"])

    # Set up temperature background image
    # print "%s: calculating temperature colors" % p["fileOut"]
    tempImage = getTemperatureImage(lerpedData, p)
    tempImage = tempImage.resize((p["width"], p["height"]), resample=Image.BICUBIC)
    # baseImage = baseImage.convert(mode="RGBA")

    # Setup particles
    # print "%s: calculating particles..." % p["fileOut"]
    particles = getParticleData(lerpedData, p)

    print "%s: drawing particles..." % p["fileOut"]
    updatedPx = addParticlesToImage(baseImage, tempImage, particles, p)
    im = Image.fromarray(updatedPx, mode="RGB")

    im.save(p["fileOut"])
    print "%s: finished." % p["fileOut"]

def addParticlesToImage(base, temperature, particles, p):
    basePx = np.array(base)
    basePx = basePx.astype(np.uint8)

    tempPx = np.array(temperature)
    tempPx = tempPx.astype(np.uint8)

    shape = basePx.shape
    h, w, dim = shape

    basePx = basePx.reshape(-1)
    tempPx = tempPx.reshape(-1)
    particles = particles.reshape(-1)

    # the kernel function
    src = """
    __kernel void addParticles(__global uchar *base, __global uchar *colors, __global uchar *particles, __global uchar *result){
        int w = %d;
        int dim = %d;
        float power = 1.0 - %f; // lower number = more visible lines

        int posx = get_global_id(1);
        int posy = get_global_id(0);
        int i = posy * w * dim + posx * dim;
        int j = posy * w + posx;

        float alpha = (float) particles[j] / 255.0;
        int r = colors[i];
        int g = colors[i+1];
        int b = colors[i+2];
        int baseR = base[i];
        int baseG = base[i+1];
        int baseB = base[i+2];

        // temp hack, convert to grayscale
        //float count = 3.0;
        //int baseAvg = (int) round((float) ((float) baseR + (float) baseG + (float) baseB) / count);
        //baseR = baseAvg;
        //baseG = baseAvg;
        //baseB = baseAvg;

        if (alpha > 0) {
            alpha = pow(alpha*alpha + alpha*alpha, power);
            if (alpha > 1.0) {
                alpha = 1.0;
            }
            //r = (int) round((r * alpha));
            //g = (int) round((g * alpha));
            //b = (int) round((b * alpha));
            float inv = 1.0 - alpha;
            r = (int) round(((float) r * alpha) + ((float) baseR * inv));
            g = (int) round(((float) g * alpha) + ((float) baseG * inv));
            b = (int) round(((float) b * alpha) + ((float) baseB * inv));
        } else {
            r = baseR;
            g = baseG;
            b = baseB;
        }

        result[i] = r;
        result[i+1] = g;
        result[i+2] = b;
    }
    """ % (w, dim, p["line_visibility"])

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

    inA =  cl.Buffer(ctx, mf.READ_ONLY | mf.COPY_HOST_PTR, hostbuf=basePx)
    inB =  cl.Buffer(ctx, mf.READ_ONLY | mf.COPY_HOST_PTR, hostbuf=tempPx)
    inC =  cl.Buffer(ctx, mf.READ_ONLY | mf.COPY_HOST_PTR, hostbuf=particles)
    outResult = cl.Buffer(ctx, mf.WRITE_ONLY, basePx.nbytes)

    prg.addParticles(queue, [h, w], None , inA, inB, inC, outResult)

    # Copy result
    result = np.empty_like(basePx)
    cl.enqueue_copy(queue, result, outResult)

    result = result.reshape(shape)
    return result

# Interpolate between two datasets using GPU
def lerpData(dataA, dataB, mu, offset=0):
    dataLen = len(dataA)
    if dataLen != len(dataB):
        print "Warning: data length mismatch"
    shape = (len(dataA[0]), len(dataA[0][0]), 3)
    h, w, dim = shape
    result = np.empty(h * w * dim, dtype=np.float32)

    # read data as floats
    dataA = np.array(dataA)
    dataA = dataA.astype(np.float32)
    dataB = np.array(dataB)
    dataB = dataB.astype(np.float32)

    # convert to 1-dimension
    dataA = dataA.reshape(-1)
    dataB = dataB.reshape(-1)

    # the kernel function
    src = """

    static bool isValid(float value) {
        return (value > -999.0 && value < 999.0);
    }

    __kernel void lerpData(__global float *a, __global float *b, __global float *result){
        int dlen = %d;
        int h = %d;
        int w = %d;
        int dim = %d;
        float mu = %f;
        int offsetX = %d;

        // get current position
        int posx = get_global_id(1);
        int posy = get_global_id(0);

        // convert position from 0,360 to -180,180
        int posxOffset = posx;
        if (offsetX > 0 || offsetX < 0) {
            if (posx < offsetX) {
                posxOffset = posxOffset + offsetX;
            } else {
                posxOffset = posxOffset - offsetX;
            }
        }

        // get indices
        int j = posy * w * dim + posx * dim;

        // get the mean values for a and b datasets
        float a1 = 0;
        float a2 = 0;
        float a3 = 0;
        float b1 = 0;
        float b2 = 0;
        float b3 = 0;
        float a1count = 0;
        float a2count = 0;
        float a3count = 0;
        float b1count = 0;
        float b2count = 0;
        float b3count = 0;
        for(int k=0; k<dlen; k++) {
            int i = k * h * w * dim + posy * w * dim + posxOffset * dim;
            if (isValid(a[i])) {
                a1 = a1 + a[i];
                a1count = a1count + 1.0;
            }
            if (isValid(a[i+1])) {
                a2 = a2 + a[i+1];
                a2count = a2count + 1.0;
            }
            if (isValid(a[i+2])) {
                a3 = a3 + a[i+2];
                a3count = a3count + 1.0;
            }
            if (isValid(b[i])) {
                b1 = b1 + b[i];
                b1count = b1count + 1.0;
            }
            if (isValid(b[i+1])) {
                b2 = b2 + b[i+1];
                b2count = b2count + 1.0;
            }
            if (isValid(b[i+2])) {
                b3 = b3 + b[i+2];
                b3count = b3count + 1.0;
            }
        }
        if (a1count > 0) { a1 = a1 / a1count; }
        // else { a1 = -9999.0; }
        if (a2count > 0) { a2 = a2 / a2count; }
        if (a3count > 0) { a3 = a3 / a3count; }
        if (b1count > 0) { b1 = b1 / b1count; }
        // else { b1 = -9999.0; }
        if (b2count > 0) { b2 = b2 / b2count; }
        if (b3count > 0) { b3 = b3 / b3count; }

        // set result
        float t = a1 + mu * (b1-a1);
        float u = a2 + mu * (b2-a2);
        float v = a3 + mu * (b3-a3);
        // if (a1 <= -9999.0 || b1 <= -9999.0) t = -9999.0;
        result[j] = t;
        result[j+1] = u;
        result[j+2] = v;
    }
    """ % (dataLen, h, w, dim, mu, offset)

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

    inA =  cl.Buffer(ctx, mf.READ_ONLY | mf.COPY_HOST_PTR, hostbuf=dataA)
    inB =  cl.Buffer(ctx, mf.READ_ONLY | mf.COPY_HOST_PTR, hostbuf=dataB)
    outResult = cl.Buffer(ctx, mf.WRITE_ONLY, result.nbytes)

    prg.lerpData(queue, [h, w], None , inA, inB, outResult)

    # Copy result
    cl.enqueue_copy(queue, result, outResult)

    result = result.reshape(shape)
    return result;

# Interpolate between two images using GPU
def lerpImage(imA, imB, mu):
    # read pixels and floats
    pxA = np.array(imA)
    pxA = pxA.astype(np.uint8)
    pxB = np.array(imB)
    pxB = pxB.astype(np.uint8)

    shape = pxA.shape
    h, w, dim = shape

    pxA = pxA.reshape(-1)
    pxB = pxB.reshape(-1)

    # the kernel function
    src = """
    __kernel void lerpImage(__global uchar *a, __global uchar *b, __global float *mu, __global uchar *result){
        int w = %d;
        int dim = %d;
        float m = *mu;
        int posx = get_global_id(1);
        int posy = get_global_id(0);
        int i = posy * w * dim + posx * dim;
        result[i] = a[i] + m * (b[i]-a[i]);
        result[i+1] = a[i+1] + m * (b[i+1]-a[i+1]);
        result[i+2] = a[i+2] + m * (b[i+2]-a[i+2]);
    }
    """ % (w, dim)

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

    inA =  cl.Buffer(ctx, mf.READ_ONLY | mf.COPY_HOST_PTR, hostbuf=pxA)
    inB =  cl.Buffer(ctx, mf.READ_ONLY | mf.COPY_HOST_PTR, hostbuf=pxB)
    inMu = cl.Buffer(ctx, mf.READ_ONLY | mf.COPY_HOST_PTR, hostbuf=np.float32(mu))
    outResult = cl.Buffer(ctx, mf.WRITE_ONLY, pxA.nbytes)

    prg.lerpImage(queue, shape, None , inA, inB, inMu, outResult)

    # Copy result
    result = np.empty_like(pxA)
    cl.enqueue_copy(queue, result, outResult)

    result = result.reshape(shape)
    imOut = Image.fromarray(result, mode="RGB")
    return imOut

def getBaseImage(images, progress):
    imageCount = len(images)
    index = 1.0 * imageCount * progress
    indexA = int(math.floor(index))
    indexB = int(math.ceil(index))
    mu = index - indexA
    image = False

    if indexA >= imageCount:
        indexA = 0
    if indexB >= imageCount:
        indexB = 0

    # no lerping required, just return the image data
    if indexA == indexB:
        image = images[indexA]

    # lerp the images
    else:
        image = lerpImage(images[indexA], images[indexB], mu)

    return image

def getParticleData(data, p):
    h = p["particles"]
    w = p["points_per_particle"]
    dim = 4 # four points: x, y, alpha, width

    offset = 1.0 - p["animationProgress"]
    tw = p["width"]
    th = p["height"]
    dh = len(data)
    dw = len(data[0])

    result = np.zeros(tw * th, dtype=np.float32)

    # print "%s x %s x %s = %s" % (w, h, dim, len(result))

    fData = np.array(data)
    fData = fData.astype(np.float32)
    fData = fData.reshape(-1)

    # print "%s x %s x 3 = %s" % (dw, dh, len(fData))

    pData = np.array(p["particleProperties"])
    pData = pData.astype(np.float32)
    pData = pData.reshape(-1)

    # print "%s x 3 = %s" % (h, len(pData))

    # the kernel function
    src = """

    static float lerp(float a, float b, float mu) {
        return (b - a) * mu + a;
    }

    static float det(float a0, float a1, float b0, float b1) {
        return a0 * b1 - a1 * b0;
    }

    static float2 lineIntersection(float x0, float y0, float x1, float y1, float x2, float y2, float x3, float y3) {
        float xd0 = x0 - x1;
        float xd1 = x2 - x3;
        float yd0 = y0 - y1;
        float yd1 = y2 - y3;

        float div = det(xd0, xd1, yd0, yd1);

        float2 intersection;
        intersection.x = -1.0;
        intersection.y = -1.0;

        if (div != 0.0) {
            float d1 = det(x0, y0, x1, y1);
            float d2 = det(x2, y2, x3, y3);
            intersection.x = det(d1, d2, xd0, xd1) / div;
            intersection.y = det(d1, d2, yd0, yd1) / div;
        }

        return intersection;
    }


    static float norm(float value, float a, float b) {
        float n = (value - a) / (b - a);
        if (n > 1.0) {
            n = 1.0;
        }
        if (n < 0.0) {
            n = 0.0;
        }
        return n;
    }

    static float wrap(float value, float a, float b) {
        if (value < a) {
            value = b - (a - value);
        } else if (value > b) {
            value = a + (value - b);
        }
        return value;
    }

    void drawLine(__global float *p, int x0, int y0, int x1, int y1, int w, int h, float alpha, int thickness);
    void drawSingleLine(__global float *p, int x0, int y0, int x1, int y1, int w, int h, float alpha);

    void drawLine(__global float *p, int x0, int y0, int x1, int y1, int w, int h, float alpha, int thickness) {
        int dx = abs(x1-x0);
        int dy = abs(y1-y0);

        if (dx==0 && dy==0) {
            return;
        }

        // draw the first line
        drawSingleLine(p, x0, y0, x1, y1, w, h, alpha);

        thickness--;
        if (thickness < 1) return;

        int stepX = 0;
        int stepY = 0;
        if (dx > dy) stepY = 1;
        else stepX = 1;

        // loop through thickness
        int offset = 1;
        for (int i=0; i<thickness; i++) {
            int xd = stepX * offset;
            int yd = stepY * offset;

            drawSingleLine(p, x0+xd, y0+yd, x1+xd, y1+yd, w, h, alpha);

            // alternate above and below
            offset *= -1;
            if (offset > 0) {
                offset++;
            }
        }


    }

    void drawSingleLine(__global float *p, int x0, int y0, int x1, int y1, int w, int h, float alpha) {
        // clamp
        x0 = clamp(x0, 0, w-1);
        x1 = clamp(x1, 0, w-1);
        y0 = clamp(y0, 0, h-1);
        y1 = clamp(y1, 0, h-1);

        int dx = abs(x1-x0);
        int dy = abs(y1-y0);

        if (dx==0 && dy==0) {
            return;
        }

        int sy = 1;
        int sx = 1;
        if (y0>=y1) {
            sy = -1;
        }
        if (x0>=x1) {
            sx = -1;
        }
        int err = dx/2;
        if (dx<=dy) {
            err = -dy/2;
        }
        int e2 = err;

        int x = x0;
        int y = y0;
        for(int i=0; i<w; i++){
            p[y*w+x] = alpha;
            if (x==x1 && y==y1) {
                break;
            }
            e2 = err;
            if (e2 >-dx) {
                err -= dy;
                x += sx;
            }
            if (e2 < dy) {
                err += dx;
                y += sy;
            }
        }
    }

    __kernel void getParticles(__global float *data, __global float *pData, __global float *result){
        int points = %d;
        int dw = %d;
        int dh = %d;
        float tw = %f;
        float th = %f;
        float offset = %f;
        float magMin = %f;
        float magMax = %f;
        float alphaMin = %f;
        float alphaMax = %f;
        float velocityMult = %f;
        float lineWidthMin = %f;
        float lineWidthMax = %f;
        float lineWidthLatMin = %f;
        float lineWidthLatMax = %f;

        // get current position
        int i = get_global_id(0);
        float dx = pData[i*3];
        float dy = pData[i*3+1];
        float doffset = pData[i*3+2];

        // set starting position
        float x = dx * (tw-1);
        float y = dy * (th-1);

        for(int j=0; j<points; j++) {
            // get UV value
            int lon = (int) round(dx * (dw-1));
            int lat = (int) round(dy * (dh-1));
            int dindex = lat * dw * 3 + lon * 3;
            float u = data[dindex+1];
            float v = data[dindex+2];

            // check for invalid values
            if (u >= 999.0 || u <= -999.0) {
                u = 0.0;
            }
            if (v >= 999.0 || v <= -999.0) {
                v = 0.0;
            }

            // calc magnitude
            float mag = sqrt(u * u + v * v);
            mag = norm(mag, magMin, magMax);

            // determine alpha transparency/thickness based on magnitude and offset
            float jp = (float) j / (float) (points-1);
            float progressMultiplier = (jp + offset + doffset) - floor(jp + offset + doffset);
            float alpha = lerp(alphaMin, alphaMax, mag * progressMultiplier);
            float thickness = lerp(lineWidthMin, lineWidthMax, mag * progressMultiplier);

            // adjust thickness based on latitude
            float latMultiplier = (float) abs(lat - (dh/2)) / (float) (dh/2);
            float thicknessMultiplier = lerp(lineWidthLatMin, lineWidthLatMax, latMultiplier);
            thickness *= thicknessMultiplier;
            if (thickness < 1.0) thickness = 1.0;

            float x1 = x + u * velocityMult;
            float y1 = y + (-v) * velocityMult;

            // clamp y
            if (y1 < 0.0) {
                y1 = 0.0;
            }
            if (y1 > (th-1.0)) {
                y1 = th-1.0;
            }

            // check for no movement
            if (x==x1 && y==y1) {
                break;

            // check for invisible line
            } else if (alpha < 1.0) {
                // continue

            // wrap from left to right
            } else if (x1 < 0) {
                float2 intersection = lineIntersection(x, y, x1, y1, (float) 0.0, (float) 0.0, (float) 0.0, th);
                if (intersection.y > 0.0) {
                    drawLine(result, (int) round(x), (int) round(y), 0, (int) intersection.y, (int) tw, (int) th, round(alpha), (int) thickness);
                    drawLine(result, (int) round((float) (tw-1.0) + x1), (int) round(y), (int) (tw-1.0), (int) intersection.y, (int) tw, (int) th, round(alpha), (int) thickness);
                }

            // wrap from right to left
            } else if (x1 > tw-1.0) {
                float2 intersection = lineIntersection(x, y, x1, y1, (float) (tw-1.0), (float) 0.0, (float) (tw-1.0), th);
                if (intersection.y > 0.0) {
                    drawLine(result, (int) round(x), (int) round(y), (int) (tw-1.0), (int) intersection.y, (int) tw, (int) th, round(alpha), (int) thickness);
                    drawLine(result, (int) round((float) x1 - (float)(tw-1.0)), (int) round(y), 0, (int) intersection.y, (int) tw, (int) th, round(alpha), (int) thickness);
                }

            // draw it normally
            } else {
                drawLine(result, (int) round(x), (int) round(y), (int) round(x1), (int) round(y1), (int) tw, (int) th, round(alpha), (int) thickness);
            }

            // wrap x
            x1 = wrap(x1, 0.0, tw-1);
            dx = x1 / tw;
            dy = y1 / th;

            x = x1;
            y = y1;
        }
    }
    """ % (w, dw, dh, tw, th, offset, p["mag_range"][0], p["mag_range"][1], p["alpha_range"][0], p["alpha_range"][1], p["velocity_multiplier"], p["linewidth_range"][0], p["linewidth_range"][1], p["linewidth_lat_range"][0], p["linewidth_lat_range"][1])

    # Get platforms, both CPU and GPU
    plat = cl.get_platforms()
    GPUs = plat[0].get_devices(device_type=cl.device_type.GPU)
    CPU = plat[0].get_devices()

    # prefer GPUs
    if GPUs and len(GPUs) > 0:
        # print "Using GPU"
        ctx = cl.Context(devices=GPUs)
    else:
        print "Warning: using CPU"
        ctx = cl.Context(CPU)

    # Create queue for each kernel execution
    queue = cl.CommandQueue(ctx)
    mf = cl.mem_flags

    # Kernel function instantiation
    prg = cl.Program(ctx, src).build()

    inData =  cl.Buffer(ctx, mf.READ_ONLY | mf.COPY_HOST_PTR, hostbuf=fData)
    inPData =  cl.Buffer(ctx, mf.READ_ONLY | mf.COPY_HOST_PTR, hostbuf=pData)
    outResult = cl.Buffer(ctx, mf.WRITE_ONLY, result.nbytes)

    prg.getParticles(queue, (h, ), None, inData, inPData, outResult)

    # Copy result
    cl.enqueue_copy(queue, result, outResult)

    result = result.reshape((th, tw))
    result = result.astype(np.uint8)

    return result;

# Create image based on temperature data using GPU
def getTemperatureImage(data, p):
    tRange = p["temperature_range"]
    gradient = p["gradient"]

    dataG = np.array(gradient)
    dataG = dataG.astype(np.float32)

    shape = data.shape
    h, w, dim = shape

    data = data.reshape(-1)
    dataG = dataG.reshape(-1)

    # the kernel function
    src = """
    __kernel void lerpImage(__global float *d, __global float *grad, __global uchar *result){
        int w = %d;
        int dim = %d;
        int gradLen = %d;
        float minValue = %f;
        float maxValue = %f;

        // get current position
        int posx = get_global_id(1);
        int posy = get_global_id(0);

        // get index
        int i = posy * w * dim + posx * dim;
        float temperature = d[i];
        int r = 45;
        int g = 50;
        int b = 55;

        // assume large values are invalid
        if (temperature > -99.0 && temperature < 99.0) {
            // normalize the temperature
            float norm = (temperature - minValue) / (maxValue - minValue);
            // clamp
            if (norm > 1.0) {
                norm = 1.0;
            }
            if (norm < 0.0) {
                norm = 0.0;
            }
            // get color from gradient
            int gradientIndex = (int) round(norm * (gradLen-1));
            gradientIndex = gradientIndex * 3;
            r = (int) round(grad[gradientIndex] * 255);
            g = (int) round(grad[gradientIndex+1] * 255);
            b = (int) round(grad[gradientIndex+2] * 255);
        }

        // set the color
        result[i] = r;
        result[i+1] = g;
        result[i+2] = b;
    }
    """ % (w, dim, len(gradient), tRange[0], tRange[1])

    # Get platforms, both CPU and GPU
    plat = cl.get_platforms()
    GPUs = plat[0].get_devices(device_type=cl.device_type.GPU)
    CPU = plat[0].get_devices()

    # prefer GPUs
    if GPUs and len(GPUs) > 0:
        # print "Using GPU"
        ctx = cl.Context(devices=GPUs)
    else:
        print "Warning: using CPU"
        ctx = cl.Context(CPU)

    # Create queue for each kernel execution
    queue = cl.CommandQueue(ctx)
    mf = cl.mem_flags

    # Kernel function instantiation
    prg = cl.Program(ctx, src).build()

    inData =  cl.Buffer(ctx, mf.READ_ONLY | mf.COPY_HOST_PTR, hostbuf=data)
    inG =  cl.Buffer(ctx, mf.READ_ONLY | mf.COPY_HOST_PTR, hostbuf=dataG)
    outResult = cl.Buffer(ctx, mf.WRITE_ONLY, (data.astype(np.uint8)).nbytes)

    prg.lerpImage(queue, [h, w], None, inData, inG, outResult)

    # Copy result
    result = np.empty_like(data)
    result = result.astype(np.uint8)
    cl.enqueue_copy(queue, result, outResult)

    result = result.reshape(shape)
    imOut = Image.fromarray(result, mode="RGB")
    return imOut;

def readCSVData(p):
    filename = p["filename"]
    unit = p["unit"]
    print "Reading %s" % filename
    data = []
    with gzip.open(filename, 'rb') as f:
        rows = list(f)
        rowCount = len(rows)
        data = [None for d in range(rowCount)]
        for i, line in enumerate(rows):
            row = line.split(",")
            for j, triple in enumerate(row):
                triple = triple.split(":")
                delta = 0
                if unit=="Kelvin":
                    delta = 273.15
                triple[0] = parseNumber(triple[0]) - delta # temperature: convert kelvin to celsius if necessary
                triple[1] = parseNumber(triple[1]) # u vector
                triple[2] = parseNumber(triple[2]) # v vector
                row[j] = tuple(triple)
            data[i] = row
    print "Done reading %s" % filename
    return data

def readSSTCSVData(filename):
    print "Reading %s" % filename
    data = []
    with gzip.open(filename, 'rb') as f:
        lines = list(f)
        rows = [0 for i in range(len(lines))]
        for i, line in enumerate(lines):
            row = [float(value) for value in line.split(",")]
            rows[i] = row
        data = rows
    return data
