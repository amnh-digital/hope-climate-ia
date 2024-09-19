#!/usr/bin/env bash

set -o errexit # Exit on error

# Copy over main files
rsync -avz electron/main.js -avz electron/test-mouselock/main.js
rsync -avz electron/package-v1.json -avz electron/test-mouselock/package.json
cd electron/test-mouselock
sed -i .bak 's/APP_NAME/test-mouselock/g' package.json # replace app name in package

# install dependencies
npm install
cd ../..
npx electron-packager electron/test-mouselock test-mouselock --platform=darwin --arch=x64 --out=build/mac/ --overwrite

# Copy app files over
mkdir -p build/mac/test-mouselock-darwin-x64/test-mouselock.app/Contents/Resources/app/shared
mkdir -p build/mac/test-mouselock-darwin-x64/test-mouselock.app/Contents/Resources/app/utilities
cp -a shared/. build/mac/test-mouselock-darwin-x64/test-mouselock.app/Contents/Resources/app/shared/
cp -a utilities/. build/mac/test-mouselock-darwin-x64/test-mouselock.app/Contents/Resources/app/utilities/
