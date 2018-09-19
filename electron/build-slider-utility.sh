#!/usr/bin/env bash

set -o errexit # Exit on error

# Copy over main files
rsync -avz electron/main.js -avz electron/slider-utility/main.js
rsync -avz electron/package.json -avz electron/slider-utility/package.json
cd electron/slider-utility
sed -i .bak 's/APP_NAME/slider-utility/g' package.json # replace app name in package

# install dependencies
npm install
npm rebuild --runtime=electron --target=2.0.7 --disturl=https://atom.io/download/atom-shell --abi=48 # for robotjs, we need to indicate the electron version
cd ../..
electron-packager electron/slider-utility slider-utility --platform=darwin --arch=x64 --out=build/mac/ --overwrite

# Copy app files over
mkdir -p build/mac/slider-utility-darwin-x64/slider-utility.app/Contents/Resources/app/shared
mkdir -p build/mac/slider-utility-darwin-x64/slider-utility.app/Contents/Resources/app/utilities
cp -a shared/. build/mac/slider-utility-darwin-x64/slider-utility.app/Contents/Resources/app/shared/
cp -a utilities/. build/mac/slider-utility-darwin-x64/slider-utility.app/Contents/Resources/app/utilities/
