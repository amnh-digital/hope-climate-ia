# -*- coding: utf-8 -*-

# This is a script that will attempt to package one of the web apps into a single html file plus a folder of non-text assets.

import argparse
from bs4 import BeautifulSoup
import csv
import glob
import os
from pprint import pprint
import re
import shutil
import sys

parser = argparse.ArgumentParser()
parser.add_argument('-app', dest="APP", default="temperature-timescales/index.html", help="Path to webpage.")
parser.add_argument('-aurl', dest="ASSET_URL", default="https://amnh.org/assets/", help="Base url where the assets will be hosted")
parser.add_argument('-ap', dest="ASSET_PREFIX", default="", help="Adds a prefix to all asset files")
parser.add_argument('-ad', dest="ASSET_DIRS", default="temperature-timescales/img/,temperature-timescales/data/*.json,temperature-timescales/config/*.json,temperature-timescales/content/*.json", help="Comma-separated list of directories of assets")
parser.add_argument('-am', dest="ASSET_MAP", default="packages/temperature-timescales-assets.csv", help="CSV file with mapping from filename to url or javascript variable")
parser.add_argument('-out', dest="OUTPUT_DIR", default="packages/temperature-timescales/", help="Output directory")
args = parser.parse_args()

APP = args.APP
ASSET_URL = args.ASSET_URL.strip()
ASSET_PREFIX = args.ASSET_PREFIX.strip()
ASSET_DIRS = args.ASSET_DIRS.strip().split(",")
OUTPUT_DIR = args.OUTPUT_DIR.strip()
ASSET_MAP = args.ASSET_MAP.strip()
ASSET_DIR = OUTPUT_DIR + "assets/"

vendorCdns = [
    {"match": ".*shared/css/vendor/normalize\-([0-9\.]+)\.min\.css", "replace": "https://cdnjs.cloudflare.com/ajax/libs/normalize/%s/normalize.min.css"},
    {"match": ".*shared/css/vendor/plyr\-([0-9\.]+)\.css", "replace": "https://cdnjs.cloudflare.com/ajax/libs/plyr/%s/plyr.css"},
    {"match": ".*shared/js/vendor/jquery\-([0-9\.]+)\.min\.js", "replace": "https://code.jquery.com/jquery-%s.min.js"},
    {"match": ".*shared/js/vendor/underscore\-([0-9\.]+)\.min\.js", "replace": "https://cdnjs.cloudflare.com/ajax/libs/underscore.js/%s/underscore-min.js"},
    {"match": ".*shared/js/vendor/pixi\-([0-9\.]+)\.min\.js", "replace": "https://cdnjs.cloudflare.com/ajax/libs/pixi.js/%s/pixi.js"},
    {"match": ".*shared/js/vendor/three\-([0-9\.]+)\.min\.js", "replace": "https://cdnjs.cloudflare.com/ajax/libs/three.js/%s/three.min.js"},
    {"match": ".*shared/js/vendor/howler\-([0-9\.]+)\.min\.js", "replace": "https://cdnjs.cloudflare.com/ajax/libs/howler/%s/howler.min.js"},
    {"match": ".*shared/js/vendor/plyr\-([0-9\.]+)\.min\.js", "replace": "https://cdnjs.cloudflare.com/ajax/libs/plyr/%s/plyr.min.js"}
]

inputDir = os.path.dirname(APP)
cssAssetPattern = re.compile("url\(\"?\'?([a-zA-Z\/\.]*\/)([a-zA-Z0-9\-\_]+\.[a-z]+)\"?\'?\)")
assetMap = {}
assetVars = []
assets = []

# Make output directory
assetDir = os.path.dirname(ASSET_DIR)
if not os.path.exists(assetDir):
    os.makedirs(assetDir)

# Read asset map file if exists
if len(ASSET_MAP) and os.path.isfile(ASSET_MAP):
    with open(ASSET_MAP, 'rb') as f:
        lines = list(f)
        reader = csv.DictReader(lines, skipinitialspace=True)
        rows = list(reader)
        mapRows = [r for r in rows if "filename" in r and len(r["filename"]) > 0]
        varRows = [r for r in rows if "var" in r and len(r["var"]) > 0]
        assetMap = dict([(r["filename"], r["url"]) for r in mapRows])
        assetVars = [(r["var"], r["url"]) for r in varRows]


# Parse the html
soup = None
with open(APP) as f:
    soup = BeautifulSoup(f, 'html.parser')

def cssFileToString(filename):
    global assets
    global cssAssetPattern
    global inputDir
    global assetMap

    fileDir = os.path.dirname(filename)
    cssStr = ""
    with open(filename, 'r') as f:
        cssStr = f.read()
    for match in cssAssetPattern.finditer(cssStr):
        matchDir, matchFile = match.groups()
        path = os.path.relpath(fileDir + "/" + matchDir + matchFile)
        assets.append(path)
        # print("%s + %s = %s" % (matchDir, matchFile, path))
        # Replace relative urls absolute urls
        assetUrl = assetMap[matchFile] if matchFile in assetMap else ASSET_URL+ASSET_PREFIX+matchFile
        cssStr = re.sub(r'url\(\"?\'?'+matchDir+matchFile+'\"?\'?\)', "url("+assetUrl+")", cssStr)
    return cssStr

def jsFileToString(filename):
    jsStr = ""
    with open(filename, 'r') as f:
        jsStr = f.read()
    return jsStr

def matchCdn(path, cdns):
    foundMatch = None
    for cdn in cdns:
        pattern = cdn["match"]
        replace = cdn["replace"]
        matches = re.match(pattern, path)
        if matches:
            version = matches.group(1)
            foundMatch = replace % version
            break
    return foundMatch

# Parse stylesheets
links = soup.find_all("link", rel="stylesheet")
newTags = []
for i, link in enumerate(links):
    path = os.path.relpath(inputDir + "/" + link.get('href')) # gets file path relative to script
    # check for common vendors and link to cdn
    cdnMatch = matchCdn(path, vendorCdns)
    cssStr = cssFileToString(path) if not cdnMatch else ""
    newTag = soup.new_tag("style")
    if cdnMatch:
        newTag = soup.new_tag("link")
        newTag["href"] = cdnMatch
        newTag["rel"] = "stylesheet"
        newTag["type"] = "text/css"
        newTag["crossorigin"] = "anonymous"
    newTag.string = cssStr
    # link.replace_with(newTag)
    link.decompose()
    newTags.insert(0, newTag)

# Prepend style tags to the body tag
body = soup.find('body')
for newTag in newTags:
    body.insert(0, newTag)

# Parse javascript
scripts = soup.find_all("script", src=True)
varsAdded = False
for i, script in enumerate(scripts):
    path = os.path.relpath(inputDir + "/" + script.get('src'))
    # check for common vendors and link to cdn
    cdnMatch = matchCdn(path, vendorCdns)
    jsStr = ""
    # if we're at the first non-vendor tag, prepend variables that we want to insert in the javascript
    if not varsAdded and not cdnMatch:
        for name, value in assetVars:
            jsStr += "var %s = \"%s\";\n" % (name, value)
        varsAdded = True
    jsStr = jsStr + jsFileToString(path) if not cdnMatch else jsStr
    # replace the tag with a new one
    newTag = soup.new_tag("script")
    if cdnMatch:
        newTag["src"] = cdnMatch
        newTag["crossorigin"] = "anonymous"
    newTag.string = jsStr
    script.replace_with(newTag)

# Write HTML file
outputStr = soup.prettify('latin-1')
with open(OUTPUT_DIR + "index.html", "w") as f:
    f.write(outputStr)

# Retrieve assets
for dir in ASSET_DIRS:
    files = []
    if "*" in dir:
        files = glob.glob(dir)
    else:
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
