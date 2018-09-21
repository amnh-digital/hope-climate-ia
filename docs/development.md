# Developing and updating HoPE apps

## Running the interactive apps locally

1. Install [Node.js](https://nodejs.org/en/)
1. Clone and install this repository:

   ```
   git clone https://github.com/amnh-digital/hope-climate-ia.git`
   cd hope-climate-ia
   npm install
   ```

1. Run the application

   ```
   npm start
   ```

1. Go to `http://localhost:8080` in your browser

## File structure

Each interactive is contained in its own sub-directory, however, there are some shared files in `./shared`.  Each interactive has this file structure

```
interactive-name/
-- config/          # config files in .json format
-- content/         # editorial content (e.g. annotations) in .json format
-- css/             # CSS stylesheets
-- data/            # datasets used in interactive
-- scripts/         # scripts for pre-processing data for use in interactive
-- index.html       # the web version of the interactive
-- physical.html    # the version of the interactive that uses physical controls (e.g. sliders, knobs, buttons)
```

## Updating app with new data

Some apps are built with data that should be updated periodically. You will need [Python](https://www.python.org/) installed for processing data. Here's an example workflow for one of the interactives.

```
cd temperature-timescales
```

The following lines downloads the latest monthly and annual temperature anomaly data from [NOAA](https://www.ncdc.noaa.gov/monitoring-references/faq/anomalies.php) (you can also just do this manually)

```
wget -O data/188001-201808.csv "https://www.ncdc.noaa.gov/cag/global/time-series/globe/land_ocean/p12/12/1880-2018.csv"
wget -O data/1880-2018.csv "https://www.ncdc.noaa.gov/cag/global/time-series/globe/land_ocean/ytd/12/1880-2018.csv"
```

Now process the new data

```
cd scripts
python process_data.py -monthly "data/188001-201808.csv" -annual "data/1880-2018.csv" -end 2018
```

This will process the new data and create a new `./data/current.json` file that the app will read. Locally, you can view this here: [localhost:8080/temperature-timescales](http://localhost:8080/temperature-timescales).  You can deploy this interactive as an Electron app like this:

```
sudo npm run build:mac3
```

See the [deployment document](deployment.md) for more details. Also, each interactive has a README in its directory for specific instructions for updating data when applicable.

## Updating Electron

First, update the Electron version in [./electron/package.json](../electron/package.json). Since one of the dependencies ([robot.js](https://github.com/Robot/robot-js)) requires us to specify the specific Electron version, we must also update the Electron version in each of the shell scripts that build the Electron app, e.g. [./electron/build-hope-mac-1.sh](../electron/build-hope-mac-1.sh).  Once you do that, whenever you run a build command (e.g. `sudo npm run build:mac1`), it will build the Electron app with the specified version.

## Updating colors

Since everything is created without compilers, all the configuration is in static files. Unfortunately this means there are two places you need to update color configuration: one in the [CSS](../shared/css/base.css) and one in the [Javascript](../shared/js/config.js):

```
./shared/css/base.css
./shared/js/config.js
```
