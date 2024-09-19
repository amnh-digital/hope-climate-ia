# Mapping Change

## Data sources

- [Land-Ocean Temperature Index, ERSSTv5, 1200km smoothing](https://data.giss.nasa.gov/gistemp/) (Compressed NetCDF files)
- Source: [NASA GISS](https://data.giss.nasa.gov/gistemp/)
- Temporal coverage: 1880 - present
- Temporal resolution: monthly
- Geographic coverage: global
- Geographic resolution: 2° lon/lat
- Baseline: 1951-1980 mean

## Updating data

If you don't have it already, you'll need to install [NetCDF](https://www.unidata.ucar.edu/software/netcdf/) and [netcdf4-python](http://unidata.github.io/netcdf4-python/) for processing netCDF version 4 files.

```
brew install netcdf    (if Mac, otherwise download .exe from URL)
pip3 install netCDF4
```

Download and unpack the latest "Land-Ocean Temperature Index, ERSSTv5, 1200km smoothing" data from [NASA GISS](https://data.giss.nasa.gov/gistemp/) (you can also just do this manually).
```
cd temperature-regions
wget -O ../oversize-assets/gistemp1200_GHCNv4_ERSSTv5.nc.gz "https://data.giss.nasa.gov/pub/gistemp/gistemp1200_GHCNv4_ERSSTv5.nc.gz"
gunzip ../oversize-assets/gistemp1200_GHCNv4_ERSSTv5.nc.gz
rm ../oversize-assets/gistemp1200_GHCNv4_ERSSTv5.nc.gz
```

If you'd like to inspect the file, you can run:

```
ncdump -h ../oversize-assets/gistemp1200_GHCNv4_ERSSTv5.nc
```

Since the visualization shows annual data, we need to convert monthly data to annual data:

```
python3 scripts/nc_monthly_to_annual.py -in ../oversize-assets/gistemp1200_GHCNv4_ERSSTv5.nc -out ../oversize-assets/gistemp1200_GHCNv4_ERSSTv5_annual.nc
```

Since the baseline is 1951-1980 mean by default, we need to change the baseline to 20th century.

```
python3 scripts/process_baseline.py -in ../oversize-assets/gistemp1200_GHCNv4_ERSSTv5_annual.nc -out ../oversize-assets/gistemp1200_GHCNv4_ERSSTv5_annual_1901-2000_baseline.nc
```

The above script uses reference files with the correct baseline generated from the [GISS Maps interface](https://data.giss.nasa.gov/gistemp/maps/)) to create new data with the correct baseline. Now, we can process the data for use in the interface.  
**NOTE**: replace YYYY with whatever the latest (fully available) year you are processing:

```
python3 scripts/process_data.py -in ../oversize-assets/gistemp1200_ERSSTv5_annual_1901-2000_baseline.nc -start 1880 -end YYYY
```

This will process the new data through 2018 and create a new `./data/current.json` file that the app will read.

You'll need to install a couple other dependencies for generating the maps:

```
brew install py3cairo
pip3 install gizeh
pip3 install pyproj
```

Lastly, you generate new images by running (again, replace **YYYY** with whatever the latest year you are processing):

```
python3 scripts/process_images.py -in ../oversize-assets/gistemp1200_ERSSTv5_annual_1901-2000_baseline.nc -start 1880 -end YYYY
```

Now locally, you can view this here: [localhost:8080/temperature-regions](http://localhost:8080/temperature-regions/).
