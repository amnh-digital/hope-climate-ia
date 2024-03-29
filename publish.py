# -*- coding: utf-8 -*-

# This is a script that will attempt to package one of the web apps into a single html file plus a folder of non-text assets.

# python3 publish.py
# python3 publish.py -app temperature-regions -assets "img/**/*.png,img/*.svg,data/*.json,content/*.json" -oassets "shared/font/*.ttf"
# python3 publish.py -app temperature-forcings -assets "img/*.png,img/*.jpg,img/*.svg,data/*.json,content/*.json" -oassets "shared/audio/orchestral_harp.mp3,shared/font/*.ttf"
# python3 publish.py -app consequences-change -assets "img/*.png,img/*.jpg,data/*.geojson,content/*.json" -oassets "shared/font/*.ttf"


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
parser.add_argument('-app', dest="APP", default="temperature-timescales", help="Name of app")
parser.add_argument('-appf', dest="APP_FILE", default="%s/embed.html", help="Path to webpage.")
parser.add_argument('-aurl', dest="ASSET_URL", default="{{ asset_path }}", help="Base url where the assets will be hosted")
parser.add_argument('-assets', dest="ASSET_DIRS", default="img/*.jpg,data/*.json,content/*.json", help="Comma-separated list of assets or directories of assets relative to app")
parser.add_argument('-oassets', dest="OTHER_ASSETS", default="shared/audio/key.mp3,shared/font/*.ttf", help="Comma-separated list of assets or directories of assets")
parser.add_argument('-view', dest="VIEW_PATH", default="views/Hope/%s.html.twig", help="View path relative to output directory")
parser.add_argument('-pdir', dest="PUBLIC_DIR", default="public/hope/", help="Public path relative to output directory")
parser.add_argument('-out', dest="OUTPUT_DIR", default="/Users/brianfoo/apps/hope-climate-ia-web/", help="Output directory")
a = parser.parse_args()

APP_FILE = a.APP_FILE % a.APP
inputDir = os.path.dirname(APP_FILE)

# Parse the html
soup = None
with open(APP_FILE) as f:
    soup = BeautifulSoup(f, 'html.parser')

# Retrieve stylesheets
links = soup.find_all("link", rel="stylesheet")
cssFilenames = []
for i, link in enumerate(links):
    path = os.path.relpath(inputDir + "/" + link.get('href')) # gets file path relative to script
    newPath = a.ASSET_URL + path
    link['href'] = newPath
    cssFilenames.append(path)

# Retrieve javascripts
scripts = soup.find_all("script", src=True)
jsFilenames = []
for i, script in enumerate(scripts):
    path = os.path.relpath(inputDir + "/" + script.get('src'))
    newPath = a.ASSET_URL + path
    script['src'] = newPath
    jsFilenames.append(path)

# Retrieve images
images = soup.find_all("img", src=True)
imageFilenames = []
for i, img in enumerate(images):
    path = os.path.relpath(inputDir + "/" + img.get('src'))
    newPath = a.ASSET_URL + path
    img['src'] = newPath
    imageFilenames.append(path)

# Retrieve assets from arguments
otherAssets = [a.APP + "/" + p for p in a.ASSET_DIRS.strip().split(",")]
otherAssets += a.OTHER_ASSETS.strip().split(",")
otherFilenames = []
for path in otherAssets:
    pathFiles = []
    if "**" in path:
        pathFiles = glob.glob(path, recursive=True)
    elif "*" in path:
        pathFiles = glob.glob(path)
    elif os.path.isfile(path):
        pathFiles = [path]
    else:
        pathFiles = [os.path.join(path, f) for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))]
    otherFilenames += pathFiles

# add config files
configFiles = [inputDir + "/config/base.json", inputDir + "/config/embed.json"]

# these are all our assets we need to copy over
allFilenames = list(set(cssFilenames + jsFilenames + imageFilenames + otherFilenames + configFiles))

# insert javascript var into body
newTag = soup.new_tag("script")
jsStr = "var ASSET_URL = '%s';" % (a.ASSET_URL + a.APP + "/")
newTag.string = jsStr
body = soup.find('body')
body.insert(0, newTag)

def makeDir(path):
    dirname = os.path.dirname(path)
    if not os.path.exists(dirname):
        os.makedirs(dirname)

# Write HTML file
outputStr = soup.prettify()
viewPath = a.OUTPUT_DIR + a.VIEW_PATH % a.APP
makeDir(viewPath)
with open(viewPath, "wb") as f:
    f.write(outputStr.encode('utf-8'))

# Write assets
for fn in allFilenames:
    fromFile = fn
    toFile = a.OUTPUT_DIR + a.PUBLIC_DIR + fn
    makeDir(toFile)
    shutil.copyfile(fromFile, toFile)

    # replace asset urls in config files
    jsonFiles = [fn for fn in allFilenames if fn.endswith(".json")]
    if fn in jsonFiles:
        fileStr = ""
        with open(toFile, 'r') as f:
            fileStr = f.read()
        for assetPath in otherFilenames:
            matchPath = assetPath
            if assetPath.startswith(a.APP + "/"):
                matchPath = matchPath[len(a.APP + "/"):]
            pattern = "\"[^\"]*[\.\/]*"+matchPath+"\""
            fileStr = re.sub(pattern, "\""+a.ASSET_URL+assetPath+"\"", fileStr)
        with open(toFile, 'w') as f:
            f.write(fileStr)
