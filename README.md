# cardmarket-request
Making Cardmarket API requests simpler for ECMA applications

## Installation
```
npm install
```

## Usage
```javascript
import MKMRequest from "cardmarket-request";

const mkm = new MKMRequest({
  appToken,
  appSecret,
});

const body = await mkm.get("/products/find", { search: "Edgar Markov" });
const filePath = await mkm.download("/productlist");
```

## What it does
Creates a request to the Cardmarket API, and handles all of the complexities of its OAuth security solution.

### Downloading files
When making a download request to one of the (currently 3) routes with files, the tool will automatically write the binary to a file and save it.

## Current limitations
- GET - _enabled_
- POST - _disabled_
- PUT - _disabled_
- DELETE - _disabled_
It's possible to make any requests without body. GET requests and requests with query parameters are enabled.
