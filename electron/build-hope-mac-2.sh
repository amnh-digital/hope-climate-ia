#!/usr/bin/env bash

set -o errexit # Exit on error

# Copy over main files
rsync -avz electron/main.js -avz electron/hope-mac-2/main.js
rsync -avz electron/package.json -avz electron/hope-mac-2/package.json
cd electron/hope-mac-2
sed -i .bak 's/APP_NAME/hope-mac-2/g' package.json # replace app name in package

# install dependencies
npm install
cd ../..
electron-packager electron/hope-mac-2 hope-mac-2 --platform=darwin --arch=x64 --out=build/mac/ --overwrite

# Copy app files over
mkdir -p build/mac/hope-mac-2-darwin-x64/hope-mac-2.app/Contents/Resources/app/shared
mkdir -p build/mac/hope-mac-2-darwin-x64/hope-mac-2.app/Contents/Resources/app/utilities
mkdir -p build/mac/hope-mac-2-darwin-x64/hope-mac-2.app/Contents/Resources/app/sleepers
mkdir -p build/mac/hope-mac-2-darwin-x64/hope-mac-2.app/Contents/Resources/app/consequences-mitigation
mkdir -p build/mac/hope-mac-2-darwin-x64/hope-mac-2.app/Contents/Resources/app/consequences-cascading
cp -i controls.json build/mac/hope-mac-2-darwin-x64/hope-mac-2.app/Contents/Resources/app/controls.json
cp -a shared/. build/mac/hope-mac-2-darwin-x64/hope-mac-2.app/Contents/Resources/app/shared/
cp -a utilities/. build/mac/hope-mac-2-darwin-x64/hope-mac-2.app/Contents/Resources/app/utilities/
cp -a sleepers/. build/mac/hope-mac-2-darwin-x64/hope-mac-2.app/Contents/Resources/app/sleepers/
cp -a consequences-mitigation/. build/mac/hope-mac-2-darwin-x64/hope-mac-2.app/Contents/Resources/app/consequences-mitigation/
cp -a consequences-cascading/. build/mac/hope-mac-2-darwin-x64/hope-mac-2.app/Contents/Resources/app/consequences-cascading/
