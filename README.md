# HoPE Climate Wall I/A

_Under construction... please come back later_

Hall of Planet Earth - Climate Wall interactives: [use them online](https://amnh-digital.github.io/hope-climate-ia/)

## Running the interactives locally

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
-- physical.html    # the physical exhibit version of the interactive
```
