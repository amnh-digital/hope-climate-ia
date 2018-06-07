This section is highly tailored to the needs of the AMNH HoPE Climate Wall kiosks, but can be modified for similar setups. These scripts wraps specific apps into Electron apps, so they could be run an Mac Mini computers like a kiosk using physical controls (sliders, spinners, buttons, etc).

There are 5 apps that correspond to the five computers that run the interactives. Computers 2, 4, and 5 are running dualscreen monitors with one interactive on each screen. This is set up this way so the two interactives can communicate with one another so there can be imagery that bleeds across the screens. These apps can be built using the following commands (currently Mac only):

```
npm run build:mac1
npm run build:mac2
npm run build:mac3
npm run build:mac4
npm run build:mac5
```

Prepend these commands with `sudo` if you run into permissions issues. The resulting apps can be found in ./build/mac/
