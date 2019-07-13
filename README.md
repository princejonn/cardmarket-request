# cardmarket-request
Making Cardmarket API requests simpler for ECMA applications

## Installation
```
npm install cardmarket-request
```

## Example
```javascript
import CardMarketRequest from "cardmarket-request";

const cmr = new CardMarketRequest({
  appToken: "<token>",
  appSecret: "<secret>",
  
  accessToken: "<token>", // optional
  accessSecret: "<secret>", // optional
  
  debug: 1, // default: 0
  sandbox: true, // default: false
});

const body = await cmr.get("/products/265535");
```

## Example with query parameter
```javascript
import CardMarketRequest from "cardmarket-request";

const cmr = new CardMarketRequest({
  appToken: "<token>",
  appSecret: "<secret>",
});

const body = await cmr.get("/products/find", { search: "Edgar Markov" });
```

## Example with download
```javascript
import CardMarketRequest, { FileTool } from "cardmarket-request";

const cmr = new CardMarketRequest({
  appToken: "<token>",
  appSecret: "<secret>",
});

const gzPath = await cmr.download("/priceguide");
const csvPath = await FileTool.unzip(gzPath);
const { path, keys } = await FileTool.createJSON(csvPath);

console.log(path);
## '/Users/<user>/.mtg-tools/downloads/priceguidefile.json'

console.log(keys);
## [
##  'idProduct',
##  'Avg',
##  'Low Price',
##  'Trend Price',
##  'German Pro Low',
##  'Suggested Price',
##  'Foil Sell',
##  'Foil Low',
##  'Foil Trend',
##  'Low Price Ex+'
## ]
```

## What it does
Creates a request to the Cardmarket API, and handles all of the complexities of its OAuth security solution. When making a download request to one of the (currently 3) routes with files, the tool will automatically write the binary to a file and save it in a downloads folder.

## Current limitations
- GET - _enabled_
- POST - _disabled_
- PUT - _disabled_
- DELETE - _disabled_

It's possible to make any requests without body. GET requests and requests with query parameters are enabled. I will enable POST requests once I have it figured out.
