# Rising Global Temperature

## Data sources

- [Global Land and Ocean Temperature Anomalies](https://www.ncdc.noaa.gov/cag/global/time-series/globe/land_ocean/p12/12/1880-2018.csv)
- Source: [NOAA NCDC](https://www.ncdc.noaa.gov/monitoring-references/faq/anomalies.php) (click "Anomalies and Index Data")
- Temporal coverage: 1880 - present
- Temporal resolution: monthly and annual
- Geographic coverage/resolution:   global
- Baseline: 20th century average (1901-2000)

## Updating data

The following lines downloads the latest monthly and annual temperature anomaly data from [NOAA](https://www.ncdc.noaa.gov/monitoring-references/faq/anomalies.php) (you can also just do this manually)

```
wget -O data/188001-201812.csv "https://www.ncdc.noaa.gov/cag/global/time-series/globe/land_ocean/p12/12/1880-2018.csv"
wget -O data/1880-2018.csv "https://www.ncdc.noaa.gov/cag/global/time-series/globe/land_ocean/ytd/12/1880-2018.csv"
```

Now process the new data

```
python scripts/process_data.py -monthly "data/188001-201812.csv" -annual "data/1880-2018.csv" -end 2018
```

This will process the new data through 2018 and create a new `./data/current.json` file that the app will read. Locally, you can view this here: [localhost:8080/temperature-timescales](http://localhost:8080/temperature-timescales/).
