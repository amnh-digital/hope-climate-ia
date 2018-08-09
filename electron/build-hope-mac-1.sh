#!/usr/bin/env bash

set -o errexit # Exit on error

# Copy over main files
rsync -avz electron/main.js -avz electron/hope-mac-1/main.js
rsync -avz electron/package.json -avz electron/hope-mac-1/package.json
cd electron/hope-mac-1
sed -i .bak 's/APP_NAME/hope-mac-1/g' package.json # replace app name in package

# install dependencies
npm install
npm rebuild --runtime=electron --target=2.0.7 --disturl=https://atom.io/download/atom-shell --abi=48 # for robotjs, we need to indicate the electron version
cd ../..
electron-packager electron/hope-mac-1 hope-mac-1 --platform=darwin --arch=x64 --out=build/mac/ --overwrite

# Copy app files over
mkdir -p build/mac/hope-mac-1-darwin-x64/hope-mac-1.app/Contents/Resources/app/shared
mkdir -p build/mac/hope-mac-1-darwin-x64/hope-mac-1.app/Contents/Resources/app/utilities
mkdir -p build/mac/hope-mac-1-darwin-x64/hope-mac-1.app/Contents/Resources/app/consequences-change
cp -i electron/hope-mac-1/controls.json build/mac/hope-mac-1-darwin-x64/hope-mac-1.app/Contents/Resources/app/controls.json
cp -a shared/. build/mac/hope-mac-1-darwin-x64/hope-mac-1.app/Contents/Resources/app/shared/
cp -a utilities/. build/mac/hope-mac-1-darwin-x64/hope-mac-1.app/Contents/Resources/app/utilities/
cp -a consequences-change/. build/mac/hope-mac-1-darwin-x64/hope-mac-1.app/Contents/Resources/app/consequences-change/
