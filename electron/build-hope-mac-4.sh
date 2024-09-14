#!/usr/bin/env bash

set -o errexit # Exit on error

# Copy over main files
rsync -avz electron/main.js -avz electron/hope-mac-4/main.js
rsync -avz electron/package.json -avz electron/hope-mac-4/package.json
cd electron/hope-mac-4
sed -i .bak 's/APP_NAME/hope-mac-4/g' package.json # replace app name in package
sed -i .bak 's/APP_VERSION/3.2.0/g' package.json # replace app version in package

# install dependencies
sudo npm install --unsafe-perm=true --allow-root
cd ../..
electron-packager electron/hope-mac-4 hope-mac-4 --platform=darwin --arch=x64 --out=build/mac/ --overwrite

# Copy app files over
rm -f build/mac/hope-mac-4-darwin-x64/hope-mac-4.app/Contents/Resources/app/controls.json
mkdir -p build/mac/hope-mac-4-darwin-x64/hope-mac-4.app/Contents/Resources/app/shared
mkdir -p build/mac/hope-mac-4-darwin-x64/hope-mac-4.app/Contents/Resources/app/utilities
mkdir -p build/mac/hope-mac-4-darwin-x64/hope-mac-4.app/Contents/Resources/app/sleepers
mkdir -p build/mac/hope-mac-4-darwin-x64/hope-mac-4.app/Contents/Resources/app/temperature-regions
mkdir -p build/mac/hope-mac-4-darwin-x64/hope-mac-4.app/Contents/Resources/app/temperature-forcings
mkdir -p build/mac/hope-mac-4-darwin-x64/hope-mac-4.app/Contents/Resources/app/composites
cp -i electron/hope-mac-4/controls.json build/mac/hope-mac-4-darwin-x64/hope-mac-4.app/Contents/Resources/app/controls.json
cp -a shared/. build/mac/hope-mac-4-darwin-x64/hope-mac-4.app/Contents/Resources/app/shared/
cp -a utilities/. build/mac/hope-mac-4-darwin-x64/hope-mac-4.app/Contents/Resources/app/utilities/
cp -a sleepers/. build/mac/hope-mac-4-darwin-x64/hope-mac-4.app/Contents/Resources/app/sleepers/
cp -a temperature-regions/. build/mac/hope-mac-4-darwin-x64/hope-mac-4.app/Contents/Resources/app/temperature-regions/
cp -a temperature-forcings/. build/mac/hope-mac-4-darwin-x64/hope-mac-4.app/Contents/Resources/app/temperature-forcings/
cp -a composites/. build/mac/hope-mac-4-darwin-x64/hope-mac-4.app/Contents/Resources/app/composites/
