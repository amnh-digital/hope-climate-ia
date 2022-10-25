# Ocean and Air Currents

## Data sources

### Ocean data

- [OSCAR third degree resolution ocean surface currents](https://podaac-tools.jpl.nasa.gov/drive/files/allData/oscar/preview/L4/oscar_third_deg) (Compressed NetCDF files)
- Source: [NASA JPL PODACC](https://podaac-tools.jpl.nasa.gov/drive/files/allData/oscar/preview/L4/oscar_third_deg)
- Temporal coverage: 1992 - present
- Temporal resolution: 5 days (120 hours)
- Geographic coverage: 66° to -66° lat
- Geographic resolution: 0.33° lon/lat

This is combined with sea surface temperature:

- [Sea surface temperature (AQUA/MODIS)](https://neo.gsfc.nasa.gov/archive/csv/MYD28M/) (CSV files)
- Source: [NASA Earth Observations, GSFC](https://neo.sci.gsfc.nasa.gov/)
- Temporal coverage: 2002 - present
- Temporal resolution: 8 days or 1 month
- Geographic coverage: Global
- Geographic resolution: 0.1° lon/lat

### Atmosphere data

- [GFS Analysis](https://nomads.ncdc.noaa.gov/data/gfsanl/) - gives both wind vector data (in meters/second) and absolute temperature in degrees Kelvin (GRIB2 files)
- Source: [NOAA NCDC - Global Forecast System](https://www.ncdc.noaa.gov/data-access/model-data/model-datasets/global-forcast-system-gfs)
- Temporal coverage: 2004 - present
- Temporal resolution: 6 hours
- Geographic coverage: global
- Geographic resolution: 0.5° lon/lat

## Updating data

_Note that this process takes a really long time due to the size of the data and the amount of graphics processing involved._

First, download and unpack the ocean NetCDF data manually from [NASA JPL FTP site](ftp://podaac-ftp.jpl.nasa.gov/allData/oscar/preview/L4/oscar_third_deg).  In this example, we'll use the 2017 file and save to `./oversize-assets/oscar_vel2017.nc.gz`.

Now we must download the sea surface temperature CSV data from [NASA FTP site](ftp://neoftp.sci.gsfc.nasa.gov/csv/MYD28M/). In this case, we need to download each month of the year, e.g. `MYD28M_2017-01.CSV.gz` to `MYD28M_2017-12.CSV.gz`. For this example, we'll place the files in `./oversize-assets/MYD28M_2017/`. Next we will pre-process and combine the ocean data with the following command:

```
cd scripts
python preprocessOcean.py -in "../../oversize-assets/oscar_vel2017.nc" -intemp "../../oversize-assets/MYD28M_2017/MYD28M_2017-%s.CSV.gz" -out "../../oversize-assets/oscar_vel2017/oscar_vel2017_%s.csv" -start "2017-01-01" -end "2017-12-31"
```

Lastly, we'll need to download and process the atmospheric GRIB2 data from [NOAA GFS](https://nomads.ncdc.noaa.gov/data/gfsanl/). Instead of doing this manually, there is a script for automatically downloading the files and converting them to .csv format. This requires a command-line utility [grib2json](https://github.com/cambecc/grib2json) to convert GRIB2 to JSON (which will subsequently be converted to CSV). Then, run the command:

```
python downloadWeatherData.py -level 100000.0 -start "2017-01-01" -end "2017-12-31" -out "../../oversize-assets/atmosphere_100000"
```

This will download 2017 weather data at 1000 millibars, or just above the surface. This may take a while because the files are pretty large since they contain data for all levels of the atmosphere.

Now we can start processing the frames for atmosphere globe:

```
python generateFrames.py -in "../../oversize-assets/atmosphere_100000/gfsanl_4_%s_0000_000.csv.gz" -out "../output/atmosphere/frame%s.png"
```

And then process the frames for the ocean globe:

```
python generateFrames.py -in "../../oversize-assets/oscar_vel2017/oscar_vel2017_%s.csv.gz" -out "../output/ocean/frame%s.png" -vel 0.6 -ppp 240 -particles 36000 -mag " 0.0,1.0" -line 0.8 -unit Celsius -lon " -180,180"
```

And then composite the two frame sets together:

```
python compositeFrames.py -width 2048 -out "../output/composite/frame%s.png"
```

Finally, we'll use [ffmpeg](https://www.ffmpeg.org/) to compile the frames into a video file:

```
ffmpeg -framerate 30/1 -i ../output/composite/frame%04d.png -c:v libx264 -r 30 -pix_fmt yuv420p -q:v 1 ../video/ocean_atmosphere.mp4
```

Now you can view the updated globes locally: [localhost:8080/system-ocean-atmosphere](http://localhost:8080/system-ocean-atmosphere/).
