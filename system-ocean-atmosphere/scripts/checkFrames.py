# -*- coding: utf-8 -*-

import argparse
import datetime
from multiprocessing import Pool
from multiprocessing.dummy import Pool as ThreadPool
import os
from PIL import Image
from pprint import pprint
import sys

parser = argparse.ArgumentParser()

parser.add_argument('-in', dest="INPUT_DIR", default="/Volumes/youaremyjoy/HoPE/metatest_2018-04-10/frames", help="Input pngs files")

args = parser.parse_args()

INPUT_DIR = args.INPUT_DIR

filenames = []
for file in os.listdir(INPUT_DIR):
    if file.endswith(".png") and not file.startswith('.'):
        filenames.append(INPUT_DIR + "/" + file)

def readImageFile(filename):
    try:
        im = Image.open(filename)
        verified = im.verify()
    except IOError as e:
        print "Error with %s" % filename

count = len(filenames)
print "Verifying %s files..." % len(filenames)
# pool = ThreadPool()
# data = pool.map(readImageFile, filenames)
# pool.close()
# pool.join()
# print "Done reading files"

for i, filename in enumerate(filenames):
    readImageFile(filename)
    sys.stdout.write('\r')
    sys.stdout.write("%s%%" % round(1.0*(i+1)/count*100,1))
    sys.stdout.flush()

print "Done."
