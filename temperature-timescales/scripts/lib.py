import csv
from datetime import datetime, timedelta
import math
import numpy as np
import os
import sys

def clamp(value, low=0.0, high=1.0):
    if value < low:
        value = low
    if value > high:
        value = high
    return value

def dateToSeconds(date):
    (year, month, day) = date
    dt = datetime(int(year), month, day)
    unix = datetime(1970,1,1)
    return (dt - unix).total_seconds()

# Mean of list
def mean(data):
    n = len(data)
    if n < 1:
        return 0
    else:
        return 1.0 * sum(data) / n

def parseDate(string):
    year = 0
    month = 1
    # a year
    if len(string) <= 4:
        year = int(string)
    # a year and month
    else:
        year = int(string[:4])
        month = int(string[4:])
    return (year, month, 1)

def parseNumber(string):
    try:
        num = float(string)
        if "." not in string:
            num = int(string)
        return num
    except ValueError:
        return string

def parseRows(arr):
    for i, item in enumerate(arr):
        for key in item:
            arr[i][key] = parseNumber(item[key])
    return arr

def readCSV(filename, skipInitialLines=4):
    rows = []
    if os.path.isfile(filename):
        with open(filename, 'r') as f:
            lines = list(f)
            lines = lines[skipInitialLines:]
            lines = [line for line in lines if not line.startswith("#")]
            reader = csv.DictReader(lines, skipinitialspace=True)
            rows = list(reader)
            rows = parseRows(rows)
    return rows

def getColor(grad, amount):
    # gradLen = len(grad)
    # i = (gradLen-1) * amount
    # remainder = i % 1
    # rgb = (0,0,0)
    # rgb = grad[int(round(i))]

    # HARDCODE: just make either hot or cold color
    rgb = grad[1]
    if amount >= 0.5:
        rgb = grad[-2]
    return int(rgb2hex(rgb), 16)

# Add colors
def hex2rgb(hex):
  # "#FFFFFF" -> [255,255,255]
  return tuple([int(hex[i:i+2], 16) for i in range(1,6,2)])

def rgb2hex(rgb):
  # [255,255,255] -> "0xFFFFFF"
  rgb = [int(x) for x in list(rgb)]
  return "0x"+"".join(["0{0:x}".format(v) if v < 16 else "{0:x}".format(v) for v in rgb]).upper()

def lerp(a, b, amount):
    return (b-a) * amount + a

def lerpColor(s, f, amount):
    rgb = [
      int(s[j] + amount * (f[j]-s[j]))
      for j in range(3)
    ]
    return tuple(rgb)

def norm(value, a, b):
    n = 1.0 * (value - a) / (b - a)
    n = min(n, 1)
    n = max(n, 0)
    return n

def savitzkyGolay(y, window_size, order=3, deriv=0, rate=1):
    try:
        window_size = np.abs(np.int(window_size))
        order = np.abs(np.int(order))
    except ValueError:
        raise ValueError("window_size and order have to be of type int")
    if window_size % 2 != 1 or window_size < 1:
        raise TypeError("window_size size must be a positive odd number")
    if window_size < order + 2:
        raise TypeError("window_size is too small for the polynomials order")
    y = np.array(y)
    order_range = range(order+1)
    half_window = (window_size -1) // 2
    # precompute coefficients
    b = np.mat([[k**i for i in order_range] for k in range(-half_window, half_window+1)])
    m = np.linalg.pinv(b).A[deriv] * rate**deriv * math.factorial(deriv)
    # pad the signal at the extremes with
    # values taken from the signal itself
    firstvals = y[0] - np.abs( y[1:half_window+1][::-1] - y[0] )
    lastvals = y[-1] + np.abs(y[-half_window-1:-1][::-1] - y[-1])
    y = np.concatenate((firstvals, y, lastvals))
    return np.convolve( m[::-1], y, mode='valid')
