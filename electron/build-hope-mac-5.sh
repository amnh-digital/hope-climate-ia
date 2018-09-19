#!/usr/bin/env bash

set -o errexit # Exit on error

# Copy over main files
rsync -avz electron/main.js -avz electron/hope-mac-5/main.js
rsync -avz electron/package-v3.json -avz electron/hope-mac-5/package.json
cd electron/hope-mac-5
sed -i .bak 's/APP_NAME/hope-mac-5/g' package.json # replace app name in package

# install dependencies
npm install
npm rebuild --runtime=electron --target=3.0.0 --disturl=https://atom.io/download/atom-shell --abi=48 # for robotjs, we need to indicate the electron version
cd ../..
electron-packager electron/hope-mac-5 hope-mac-5 --platform=darwin --arch=x64 --out=build/mac/ --overwrite

# Copy app files over
rm -f build/mac/hope-mac-5-darwin-x64/hope-mac-5.app/Contents/Resources/app/controls.json
mkdir -p build/mac/hope-mac-5-darwin-x64/hope-mac-5.app/Contents/Resources/app/shared
mkdir -p build/mac/hope-mac-5-darwin-x64/hope-mac-5.app/Contents/Resources/app/utilities
mkdir -p build/mac/hope-mac-5-darwin-x64/hope-mac-5.app/Contents/Resources/app/sleepers
mkdir -p build/mac/hope-mac-5-darwin-x64/hope-mac-5.app/Contents/Resources/app/system-ocean-atmosphere
mkdir -p build/mac/hope-mac-5-darwin-x64/hope-mac-5.app/Contents/Resources/app/system-quiz
mkdir -p build/mac/hope-mac-5-darwin-x64/hope-mac-5.app/Contents/Resources/app/composites
cp -i electron/hope-mac-5/controls.json build/mac/hope-mac-5-darwin-x64/hope-mac-5.app/Contents/Resources/app/controls.json
cp -a shared/. build/mac/hope-mac-5-darwin-x64/hope-mac-5.app/Contents/Resources/app/shared/
cp -a utilities/. build/mac/hope-mac-5-darwin-x64/hope-mac-5.app/Contents/Resources/app/utilities/
cp -a sleepers/. build/mac/hope-mac-5-darwin-x64/hope-mac-5.app/Contents/Resources/app/sleepers/
cp -a system-ocean-atmosphere/. build/mac/hope-mac-5-darwin-x64/hope-mac-5.app/Contents/Resources/app/system-ocean-atmosphere/
cp -a system-quiz/. build/mac/hope-mac-5-darwin-x64/hope-mac-5.app/Contents/Resources/app/system-quiz/
cp -a composites/. build/mac/hope-mac-5-darwin-x64/hope-mac-5.app/Contents/Resources/app/composites/
