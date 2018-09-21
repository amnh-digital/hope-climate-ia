# -*- coding: utf-8 -*-

# python generateGradient.py -grad "#0087ff,#00caab,#cdb300,#ff9d00,#fc0000" -out "../data/colorGradientRainbowSaturated.json"
# python generateGradient.py -grad "#42a6ff,#5994af,#9e944f,#c17700,#fc0000" -out "../data/colorGradientRainbow.json"
# python generateGradient.py -grad "#8196cc,#ffffff" -out "../data/colorGradientOcean.json"

import argparse
import json
from pprint import pprint
import sys

parser = argparse.ArgumentParser()
parser.add_argument('-grad', dest="GRADIENT", default="#be9cd6,#827de5,#47d0c8,#ced73a,#d7933a,#d73a3a,#f10c0c", help="Color gradient")
parser.add_argument('-width', dest="STEPS", type=int, default=100, help="Steps in gradient")
parser.add_argument('-out', dest="OUTPUT_FILE", default="../data/colorGradientRainbowLong.json", help="Output JSON file")

args = parser.parse_args()

def getColor(grad, amount):
    gradLen = len(grad)
    i = (gradLen-1) * amount
    remainder = i % 1
    rgb = (0,0,0)
    if remainder > 0:
        rgb = lerpColor(grad[int(i)], grad[int(i)+1], remainder)
    else:
        rgb = grad[int(i)]
    return rgb

# Add colors
def hex2rgb(hex):
  # "#FFFFFF" -> [1,1,1]
  return [round(int(hex[i:i+2], 16)/255.0, 6) for i in range(1,6,2)]

def lerp(a, b, amount):
    return (b-a) * amount + a

def lerpColor(s, f, amount):
    rgb = [
      round(s[j] + amount * (f[j]-s[j]), 6)
      for j in range(3)
    ]
    return rgb

GRADIENT = args.GRADIENT.split(",")
STEPS = args.STEPS

GRADIENT = [hex2rgb(g) for g in GRADIENT]

grad = []

for i in range(STEPS):
    mu = 1.0 * i / (STEPS-1)
    grad.append(getColor(GRADIENT, mu))

# pprint(grad)

# Write to file
print "Writing data to file..."
with open(args.OUTPUT_FILE, 'w') as f:
    json.dump(grad, f)
    print "Wrote data to %s" % args.OUTPUT_FILE
