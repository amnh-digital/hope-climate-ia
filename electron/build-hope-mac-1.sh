#!/usr/bin/env bash

set -o errexit # Exit on error

# Copy over main files
rsync -avz electron/main.js -avz electron/hope-mac-1/main.js
rsync -avz electron/package.json -avz electron/hope-mac-1/package.json
cd electron/hope-mac-1
sed -i .bak 's/APP_NAME/hope-mac-1/g' package.json # replace app name in package
sed -i .bak 's/APP_VERSION/3.2.0/g' package.json # replace app version in package

# install dependencies
sudo npm install --unsafe-perm=true --allow-root
cd ../..
electron-packager electron/hope-mac-1 hope-mac-1 --platform=darwin --arch=x64 --out=build/mac/ --overwrite

# Copy app files over
rm -f build/mac/hope-mac-1-darwin-x64/hope-mac-1.app/Contents/Resources/app/controls.json
mkdir -p build/mac/hope-mac-1-darwin-x64/hope-mac-1.app/Contents/Resources/app/shared
mkdir -p build/mac/hope-mac-1-darwin-x64/hope-mac-1.app/Contents/Resources/app/utilities
mkdir -p build/mac/hope-mac-1-darwin-x64/hope-mac-1.app/Contents/Resources/app/consequences-change
cp -i electron/hope-mac-1/controls.json build/mac/hope-mac-1-darwin-x64/hope-mac-1.app/Contents/Resources/app/controls.json
cp -a shared/. build/mac/hope-mac-1-darwin-x64/hope-mac-1.app/Contents/Resources/app/shared/
cp -a utilities/. build/mac/hope-mac-1-darwin-x64/hope-mac-1.app/Contents/Resources/app/utilities/
cp -a consequences-change/. build/mac/hope-mac-1-darwin-x64/hope-mac-1.app/Contents/Resources/app/consequences-change/
