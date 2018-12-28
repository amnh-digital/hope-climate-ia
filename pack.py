# -*- coding: utf-8 -*-

# This is a script that will attempt to package one of the web apps into a single html file plus a folder of non-text assets.

import argparse
from bs4 import BeautifulSoup
import os
from pprint import pprint
import re
import shutil
import sys

parser = argparse.ArgumentParser()
parser.add_argument('-app', dest="APP", default="temperature-timescales/index.html", help="Path to webpage.")
parser.add_argument('-aurl', dest="ASSET_URL", default="https://amnh.org/assets/", help="Base url where the assets will be hosted")
parser.add_argument('-ap', dest="ASSET_PREFIX", default="ww1_", help="Adds a prefix to all asset files")
parser.add_argument('-ad', dest="ASSET_DIRS", default="temperature-timescales/img/", help="Comma-separated list of directories of assets")
parser.add_argument('-out', dest="OUTPUT_DIR", default="packages/temperature-timescales/", help="Output directory")
args = parser.parse_args()

APP = args.APP
ASSET_URL = args.ASSET_URL.strip()
ASSET_PREFIX = args.ASSET_PREFIX.strip()
ASSET_DIRS = args.ASSET_DIRS.strip().split(",")
OUTPUT_DIR = args.OUTPUT_DIR.strip()
ASSET_DIR = OUTPUT_DIR + "assets/"

inputDir = os.path.dirname(APP)
cssAssetPattern = re.compile("url\(\"?\'?([a-zA-Z\/\.]*\/)([a-zA-Z0-9\-\_]+\.[a-z]+)\"?\'?\)")
assets = []

# Make output directory
assetDir = os.path.dirname(ASSET_DIR)
if not os.path.exists(assetDir):
    os.makedirs(assetDir)

# Parse the html
soup = None
with open(APP) as f:
    soup = BeautifulSoup(f, 'html.parser')

def cssFileToString(filename):
    global assets
    global cssAssetPattern
    global inputDir

    fileDir = os.path.dirname(filename)
    cssStr = ""
    with open(filename, 'r') as f:
        cssStr = f.read()
    for match in cssAssetPattern.finditer(cssStr):
        matchDir, matchFile = match.groups()
        path = os.path.relpath(fileDir + "/" + matchDir + matchFile)
        assets.append(path)
        # print("%s + %s = %s" % (matchDir, matchFile, path))
        # TODO: replace relative urls absolute urls
    return cssStr

def jsFileToString(filename):
    jsStr = ""
    with open(filename, 'r') as f:
        jsStr = f.read()
    return jsStr

# Parse stylesheets
cssStrs = []
links = soup.find_all("link", rel="stylesheet")
linkCount = len(links)
for i, link in enumerate(links):
    path = os.path.relpath(inputDir + "/" + link.get('href')) # gets file path relative to script
    cssStr = cssFileToString(path)
    cssStrs.append(cssStr)
    # remove link from tree
    if i < linkCount-1:
        link.decompose()
    # if the last, replace it with the css string
    else:
        newTag = soup.new_tag("style")
        newTag.string = "\n".join(cssStrs)
        link.replace_with(newTag)

# Parse javascript
jsStrs = []
scripts = soup.find_all("script", src=True)
scriptCount = len(scripts)
for i, script in enumerate(scripts):
    path = os.path.relpath(inputDir + "/" + script.get('src'))
    # TODO: check for common vendors and link to cdn
    jsStr = jsFileToString(path)
    jsStrs.append(jsStr)
    # remove link from tree
    if i < scriptCount-1:
        script.decompose()
    # if the last, replace it with the js string
    else:
        newTag = soup.new_tag("script")
        newTag.string = "\n".join(jsStrs)
        script.replace_with(newTag)

# Write HTML file
outputStr = soup.prettify('latin-1')
with open(OUTPUT_DIR + "index.html", "w") as f:
    f.write(outputStr)

# Retrieve assets
for dir in ASSET_DIRS:
    files = [os.path.join(dir, f) for f in os.listdir(dir) if os.path.isfile(os.path.join(dir, f))]
    assets += files
assets = list(set(assets))

# Empty asset folder
for f in os.listdir(assetDir):
    path = os.path.join(assetDir, f)
    if os.path.isfile(path):
        os.unlink(path)

# Write assets
for asset in assets:
    dest = ASSET_DIR + ASSET_PREFIX + os.path.basename(asset)
    shutil.copyfile(asset, dest)

print("Done.")
