import math
import os
import sys

def norm(value, a, b):
    return 1.0 * (value - a) / (b - a)

def parseNumber(string):
    try:
        num = float(string)
        return num
    except ValueError:
        return False

def parseNumbers(arr):
    for i, item in enumerate(arr):
        for key in item:
            arr[i][key] = parseNumber(item[key])
    return arr

def readTxt(filename):
    rows = []
    if os.path.isfile(filename):
        with open(filename, 'rb') as f:
            lines = [line.split() for line in f if not line.startswith("#")]
            header = lines.pop(0)
            rows = []
            for line in lines:
                row = {}
                for i,h in enumerate(header):
                    try:
                        row[h] = line[i]
                    except IndexError:
                        print "Index Error %s" % filename
                        sys.exit(1)
                rows.append(row)
            rows = parseNumbers(rows)
    return rows

def rounddown(x, nearest):
    return int(math.floor(1.0 * x / nearest)) * nearest

def roundto(x, nearest):
    return int(round(1.0 * x / nearest)) * nearest

def roundup(x, nearest):
    return int(math.ceil(1.0 * x / nearest)) * nearest

def showGraph(groupedData):
    import matplotlib.pyplot as plt

    flattened = []
    for i, g in enumerate(groupedData):
        for d in g:
            flattened.append((d[0]+i, d[1]))
    xs = [d[0] for d in flattened]
    ys = [d[1] for d in flattened]

    plt.plot(xs, ys)
    plt.show()
