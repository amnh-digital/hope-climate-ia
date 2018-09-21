# -*- coding: utf-8 -*-

import csv
import os

# get baseline values
def getBaseline(rows, colName, startYear, endYear):
    values = [r[colName] for r in rows if startYear <= r["Year"] <= endYear]
    return mean(values)

# retrieve data
def getData(rows, colName, startYear, endYear, baseline):
    d = [row[colName]-baseline for row in rows if startYear <= row["Year"] <= endYear]
    return d

# Mean of list
def mean(data):
    n = len(data)
    if n < 1:
        return 0
    else:
        return 1.0 * sum(data) / n

def norm(value, a, b):
    return 1.0 * (value - a) / (b - a)

def parseNumber(string):
    try:
        num = float(string)
        return num
    except ValueError:
        return string

def parseNumbers(arr):
    for i, item in enumerate(arr):
        for key in item:
            arr[i][key] = parseNumber(item[key])
    return arr

def readCSV(filename, skipInitialLines=4):
    rows = []
    if os.path.isfile(filename):
        with open(filename, 'rb') as f:
            lines = list(f)
            lines = lines[skipInitialLines:]
            lines = [line for line in lines if not line.startswith("#")]
            reader = csv.DictReader(lines, skipinitialspace=True)
            rows = list(reader)
            rows = parseRows(rows)
    return rows

def readTxt(filename, skipInitialLines=3):
    rows = []
    if os.path.isfile(filename):
        with open(filename, 'rb') as f:
            lines = list(f)
            lines = lines[skipInitialLines:]
            lines = [line.split() for line in lines if not line.startswith("#")]
            header = lines.pop(0)
            rows = []
            for line in lines:
                row = {}
                for i,h in enumerate(header):
                    row[h] = line[i]
                rows.append(row)
            rows = parseNumbers(rows)
    return rows
