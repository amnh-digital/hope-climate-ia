# HoPE-specific instructions

This is an internal document that is specific to the AMNH HoPE installation and maintenance.

## 1. Troubleshooting apps

For any issues with the software, usually a restart of the computer will fix the problems. The apps will automatically load shortly after booting up (~15 seconds).

For any issues with the hardware (e.g. sliders not working), you will need to contact A/V to potentially replace the slider or board.

## 2. Overview of setup

The HoPE wall interactives are configured like so:

[![Climate wall controls](img/wall_diagrams_inputs.png)](img/wall_diagrams_inputs.png)

- There are 5 Mac Minis running 8 interactives
   - Internally, we refer to them numbered from left to right: `climate-wall-mini-01`, `climate-wall-mini-02`,... `climate-wall-mini-05`
- 3 of the Macs are running dual screen outputs (`climate-wall-mini-02`, `climate-wall-mini-04`, `climate-wall-mini-05`)
- 3 of the Macs have audio output (`climate-wall-mini-02`, `climate-wall-mini-03`, `climate-wall-mini-04`)
- All of the Macs have inputs from [physical controls](controls.md) via USB
- There is a single machine (Brightsign) that is simply looping video with no input or audio output

All macs are configured to restart overnight, every night at 3:45am.

## 3. Updating apps

The apps should be pretty stable in the current machines as configured. The main reason the apps need to be updated is if there is new content or data that needs to be added. I will outline here how to do that for the apps that require regular updates.

### 3.a. Requirements

In order to update the apps, you will need:

1. A Mac. These instructions are specifically written for Mac (and the machines in the hall are Mac Minis).  Though it's possible to make this work for PCs or Linux, that will not be covered here.
2. [Git](https://git-scm.com/) installed (or some Git client that installs git for you) to pull in the latest code from Github.
3. [Node.js](https://nodejs.org/en/) installed.
    - This app was developed using Node.JS version 10; to avoid conflicts when building, install this version:
      ```
      brew install node@10
      ```
      and if necessary, add this to your bash profile, e.g.:
      ```
      echo 'export PATH="/usr/local/Cellar/node@10/10.24.1_1/bin:$PATH"' >> ~/.bash_profile
      ```
4. [Electron packager](https://github.com/electron/electron-packager). If you installed Node, you can run: `npm install electron-packager -g`. [Electron](https://www.electronjs.org/) is used to wrap the web apps into executable desktop apps.
5. [Python 3](https://www.python.org/) installed. (This is only required if you are processing new data for the apps)
    - And if you don't already have it installed, NumPY: `pip install numpy`

### 3.b. The codebase

The code for all 8 interactives are contained in a [single Github repository here](https://github.com/amnh-digital/hope-climate-ia). Where each subfolder (e.g. `consequences-cascading`, `consequences-change`, ...) contains code for a single app. Each app is 100% HTML/Javascript/CSS that can run in a browser with no server-side code.

Pull and install the development dependencies of the apps like this:

```
git clone https://github.com/amnh-digital/hope-climate-ia.git
cd hope-climate-ia
npm install
npm start
```

The final command will load a simple server on your machine that can be accessed at [localhost:8080](http://localhost:8080/)

### 3.c. Updating apps with new annual data

Every year around the beginning of February, NASA and NOAA release new annual data from the previous year. That is when we update the apps that rely on new data.

The two apps that need to be updated are:

1. ["Rising Global Temperature"](https://amnh-digital.github.io/hope-climate-ia/temperature-timescales/embed.html) which is in the [./temperature-timescales/](https://github.com/amnh-digital/hope-climate-ia/tree/master/temperature-timescales) directory and on machine `climate-wall-mini-03`.
    1. You can follow the [instructions for updating this app here](https://github.com/amnh-digital/hope-climate-ia/tree/master/temperature-timescales#rising-global-temperature)
2. ["Mapping Change"](https://amnh-digital.github.io/hope-climate-ia/temperature-regions/embed.html) which is in the [./temperature-regions/](https://github.com/amnh-digital/hope-climate-ia/tree/master/temperature-regions) directory and one of two interactives on machine `climate-wall-mini-04`.
    1. You can follow the [instructions for updating this app here](https://github.com/amnh-digital/hope-climate-ia/tree/master/temperature-regions#mapping-change)

Once you process new data and assets, and confirm that everything looks good locally, you can now check it back into Github.

```
git add .
git commit -m "Updated apps with new data"
git push origin master
```

### 3.d. Deploying updated apps into the hall

Now all you need to do is "build" the individual apps that were updated into executable desktop apps that can be dropped into the computers in the hall. This is done using [Electron](https://www.electronjs.org/) and the [Electron packager](https://github.com/electron/electron-packager)

For "Rising Global Temperature" ([./temperature-timescales/](https://github.com/amnh-digital/hope-climate-ia/tree/master/temperature-timescales)), you will need to build for `climate-wall-mini-03` by running:

```
sudo npm run build:mac3
```

And for "Mapping Change" ([./temperature-regions/](https://github.com/amnh-digital/hope-climate-ia/tree/master/temperature-regions)), you will need to build for `climate-wall-mini-04` by running:

```
sudo npm run build:mac4
```

These commands will create two executable apps in the `.build/` directory, e.g. `./build/mac/hope-mac-3-darwin-x64/hope-mac-3.app` and `./build/mac/hope-mac-4-darwin-x64/hope-mac-4.app`

Once you build these on your machine:

1. Do a Mac screenshare to each of the relevant Macs (e.g. `climate-wall-mini-03` and `climate-wall-mini-04`). Talk to someone in RCE to get access to these machines.
2. `Cmd+Q` to quit the current app
3. Drag-and-drop the appropriate app (e.g. `hope-mac-3`) onto the desktop of the corresponding machine (e.g. `climate-wall-mini-03`).
4. Go to `/Applications` directory and remove the current app (e.g. `hope-mac-3`)
5. Drag the new app from the desktop to the `/Applications` directory
6. Restart the computer
7. Disconnect from screenshare (it's important to explicitly disconnect since there may be a warning dialog box for unclosed screenshare connections on the machine)

There's one exception for the 2nd mac (`hope-mac-2`.) It also has another app that is running called `hope-mac-2-checker` which periodically checks if `hope-mac-2` is running. This app also needs to be quitted after step 2, otherwise, `hope-mac-2-checker` will automatically restart the computer after some time. You can read the [provisioning](provisioning.md) document for more details about this.
