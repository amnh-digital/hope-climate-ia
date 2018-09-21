# What’s Causing Climate Change?

## Data sources

- [CMIP5 GISS-E2 Global Radiative Forcings (Fi) Miller et al (2014)](https://data.giss.nasa.gov/modelforce/Miller_et_2014/Fi_Miller_et_al14_upd.txt)
- Source: [NASA GISS](https://data.giss.nasa.gov/modelforce/)
- Temporal coverage: 1851 - 2012
- Temporal resolution: annual
- Geographic coverage/resolution: global

## Updating data

Download the forcings and net forcings data from the [NASA GISS](https://data.giss.nasa.gov/modelforce/) website manually or via the following lines:

```
wget -O data/Fi_Miller_et_al14_upd.txt "https://data.giss.nasa.gov/modelforce/Miller_et_2014/Fi_Miller_et_al14_upd.txt"
wget -O data/Fi_net_Miller_et_al14_upd.txt "https://data.giss.nasa.gov/modelforce/Miller_et_2014/Fi_net_Miller_et_al14_upd.txt"
```

Then download the latest observed temperature anomaly data from [NOAA](https://www.ncdc.noaa.gov/monitoring-references/faq/anomalies.php) (you can also just do this manually)

```
wget -O data/1880-2018.csv "https://www.ncdc.noaa.gov/cag/global/time-series/globe/land_ocean/ytd/12/1880-2018.csv"
```

Now run the script to process these three files:

```
cd scripts
python process_data.py -forcings ../data/Fi_Miller_et_al14_upd.txt -net ../data/Fi_net_Miller_et_al14_upd.txt -observed ../data/1880-2018.csv -start 1880 -end 2012
```

This will process the new data through 2012 and create a new `./data/current.json` file that the app will read. Locally, you can view this here: [localhost:8080/temperature-forcings](http://localhost:8080/temperature-forcings/).
