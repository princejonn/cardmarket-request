import os from "os";
import fs from "fs";
import path from "path";
import Crypto from "crypto";
import cloneDeep from "lodash/cloneDeep";
import includes from "lodash/includes";
import isBoolean from "lodash/isBoolean";
import isObject from "lodash/isObject";
import isString from "lodash/isString";
import PercentEncode from "oauth-percent-encode";
import request from "request";
import UUIDv4 from "uuid/v4";
import Logger from "utils/Logger";

/*
 * Debug Levels:
 *
 * 0 - Off
 * 1 - Request logged to console
 * 2 - Response logged to console
 * 3 - Request to API turned off & all returns logged to console
 */

export default class CardMarketRequest {
  /**
   * @param {object} options
   * @param {string} options.appToken
   * @param {string} options.appSecret
   * @param {string} [options.accessToken]
   * @param {string} [options.accessSecret]
   * @param {boolean} [options.debug]
   * @param {boolean} [options.sandbox]
   * @param {string} [options.responseType]
   * @param {string} [options.workDir]
   */
  constructor(options) {
    if (!isObject(options)) {
      throw new Error(`options undefined [ ${options} ]`);
    }
    if (!isString(options.appToken)) {
      throw new Error(`appToken undefined [ ${options.appToken} ]`);
    }
    if (!isString(options.appSecret)) {
      throw new Error(`appSecret undefined [ ${options.appSecret} ]`);
    }
    if (options.accessToken && !isString(options.accessToken)) {
      throw new Error(`accessToken incorrect [ ${options.accessToken} ]`);
    }
    if (options.accessSecret && !isString(options.accessSecret)) {
      throw new Error(`accessSecret incorrect [ ${options.accessSecret} ]`);
    }
    if (options.debug && !isBoolean(options.debug)) {
      throw new Error(`debug incorrect [ ${options.debug} ]`);
    }
    if (options.sandbox && !isBoolean(options.sandbox)) {
      throw new Error(`sandbox incorrect [ ${options.sandbox} ]`);
    }
    if (options.responseType && !isString(options.responseType)) {
      throw new Error(`responseType incorrect [ ${options.responseType} ]`);
    }
    if (options.workDir && !isString(options.workDir)) {
      throw new Error(`workDir incorrect [ ${options.workDir} ]`);
    }

    this._logger = Logger.getContextLogger("request");

    this._appToken = options.appToken;
    this._appSecret = options.appSecret;

    this._accessToken = options.accessToken;
    this._accessSecret = options.accessSecret;

    this._debug = options.debug || false;
    this._sandbox = options.sandbox || false;
    this._responseType = options.responseType || "json";
    this._workDir = options.workDir || path.join(os.homedir(), ".cardmarket-request");

    if (!fs.existsSync(this._workDir)) {
      fs.mkdirSync(this._workDir, { recursive: true });
    }
  }

  /**
   * @param {string} route
   * @param {object} [queryParameters]
   * @returns {Promise<string>}
   */
  async get(route, queryParameters) {
    return await this.request({
      method: "GET",
      route,
      queryParameters,
    });
  }

  /**
   * Makes request to a path that contains a response with a base64 encoded file.
   * Creates the file with content and returns the file path.
   *
   * @param {string} route
   * @returns {Promise<string>}
   */
  async download(route) {
    this._logger.debug("downloading from route", route);

    const body = await this.get(route);
    const ignoredKeys = [ "mime", "links" ];

    if (this._debug) {
      return null;
    }

    let base64Key;
    let base64String;

    for (const key in body) {
      if (!body.hasOwnProperty(key)) continue;
      if (includes(ignoredKeys, key)) continue;
      base64Key = key;
    }

    base64String = body[base64Key];

    const binaryBuffer = Buffer.from(base64String, "base64");
    const fileName = `${base64Key}.csv.gz`;

    const writePath = path.join(this._workDir, fileName);

    return new Promise((resolve, reject) => {
      fs.writeFile(writePath, binaryBuffer, (err) => {
        if (err) return reject(err);
        resolve(writePath);
      });
    });
  }

  /**
   * @param {string} method
   * @param {string} route
   * @param {object} [queryParameters]
   * @returns {Promise<string>}
   */
  async request({ method, route, queryParameters }) {
    this._logger.debug("request method", method);
    this._logger.debug("request route", route);

    if (queryParameters) {
      for (const key in queryParameters) {
        if (!queryParameters.hasOwnProperty(key)) continue;
        if (!isString(queryParameters[key])) continue;
        queryParameters[key] = queryParameters[key].replace(/\'/g, " ");
      }
    }

    this._logger.debug("request query parameters", queryParameters);

    const authorization = this._getOAuthHeader(method, route, queryParameters);

    const options = {
      method,
      url: this._getURL(route, queryParameters),
      headers: {Authorization: authorization},
    };

    if (queryParameters) {
      options.data = queryParameters;
    }

    this._logger.debug("full request", options);

    if (this._debug) {
      return null;
    }

    return new Promise((resolve, reject) => {
      request(options, (err, res, body) => {
        if (err) return reject(err);
        if (this._sandbox) {
          this._logger.debug("response", res.toJSON());
        }
        const firstNumber = parseInt(res.statusCode.toString().slice(0, 1));
        if (firstNumber === 4 || firstNumber === 5) {
          return reject(res.toJSON());
        }
        if (this._responseType === "json") {
          body = JSON.parse(body);
        }
        resolve(body);
      });
    });
  }

  /**
   */
  sandbox() {
    this._sandbox = !this._sandbox;
  }

  /**
   */
  expectJSON() {
    this._responseType = "json";
  }

  /**
   */
  expectXML() {
    this._responseType = "xml";
  }

  //
  // Private
  //

  /**
   * @param {string} method
   * @param {string} route
   * @param {object} [queryParameters]
   * @returns {string}
   * @private
   */
  _getOAuthHeader(method, route, queryParameters) {
    const params = this._getParams();

    let header = `OAuth realm="${this._getURL(route)}",`;

    for (const key in params) {
      if (!params.hasOwnProperty(key)) continue;
      header += `${key}="${params[key]}",`;
    }

    const signature = this._getSignature(method, route, params, queryParameters);
    header += `oauth_signature="${signature}"`;

    this._logger.debug("_getOAuthHeader", header);

    return header;
  }

  /**
   * @param {string} route
   * @param {object} [queryParameters]
   * @returns {string}
   * @private
   */
  _getURL(route, queryParameters) {
    const base = this._sandbox ? "sandbox.cardmarket.com" : "api.cardmarket.com";
    const type = `output.${this._responseType}`;

    let url = `https://${base}/ws/v2.0/${type}${route}`;

    if (queryParameters) {
      url += "?";

      const array = [];

      for (const key in queryParameters) {
        if (!queryParameters.hasOwnProperty(key)) continue;
        array.push(`${key}=${encodeURIComponent(queryParameters[key])}`);
      }

      url += array.join("&");
    }

    this._logger.debug("_getURL", url);

    return url;
  }

  /**
   * Returns the signature string
   *
   * @param {string} method
   * @param {string} route
   * @param {object} params
   * @param {object} [queryParameters]
   * @returns {string}
   * @private
   */
  _getSignature(method, route, params, queryParameters) {
    const string = this._getBaseString(method, route, params, queryParameters);
    const signatureKey = this._getSignatureKey();

    const signature = CardMarketRequest._getHmac(string, signatureKey);

    this._logger.debug("_getSignature", signature);

    return signature;
  }

  /**
   * Creates the base string
   *
   * @param {string} method
   * @param {string} route
   * @param {object} params
   * @param {object} [queryParameters]
   * @returns {string}
   * @private
   */
  _getBaseString(method, route, params, queryParameters) {
    const url = this._getURL(route);
    let string = `${method}&${PercentEncode(url)}&`;
    string += PercentEncode(this._getParamsString(params, queryParameters));

    this._logger.debug("_getBaseString", string);

    return string;
  }

  /**
   * Creates a signature key from app secret and access secret
   *
   * @returns {string}
   * @private
   */
  _getSignatureKey() {
    const appSecret = PercentEncode(this._appSecret);
    const accessSecret = this._accessSecret ? PercentEncode(this._accessSecret) : "";
    const signatureKey = `${appSecret}&${accessSecret}`;

    this._logger.debug("_getSignatureKey", signatureKey);

    return signatureKey;
  }

  /**
   * Creates a param string
   *
   * @param {object} params
   * @param {object} [queryParameters]
   * @private
   */
  _getParamsString(params, queryParameters) {
    const validatedParams = this._validateParams(params, queryParameters);
    const strings = [];

    for (const key in validatedParams) {
      if (!validatedParams.hasOwnProperty(key)) continue;
      strings.push(`${key}=${encodeURIComponent(validatedParams[key])}`);
    }

    const string = strings.join("&");

    this._logger.debug("_buildParams", string);

    return string;
  }

  /**
   * Validates params object and inserts data into the validation
   *
   * @param {object} params
   * @param {object} [queryParameters]
   * @returns {object}
   * @private
   */
  _validateParams(params, queryParameters) {
    const required = [
      "oauth_version",
      "oauth_timestamp",
      "oauth_nonce",
      "oauth_consumer_key",
      "oauth_token",
      "oauth_signature_method",
    ];

    const clonedParams = cloneDeep(params);

    for (const key in queryParameters) {
      if (!queryParameters.hasOwnProperty(key)) continue;
      clonedParams[key] = queryParameters[key];
    }

    for (const key of required) {
      if (clonedParams.hasOwnProperty(key)) continue;
      clonedParams[key] = "";
    }

    const sortedParams = CardMarketRequest._sortObject(clonedParams);

    this._logger.debug("_validateParams", sortedParams);

    return sortedParams;
  }

  /**
   * Returns default parameters
   *
   * @returns {object}
   * @private
   */
  _getParams() {
    const params = {
      oauth_version: "1.0",
      oauth_timestamp: CardMarketRequest._getTimestamp(),
      oauth_nonce: CardMarketRequest._getNonce(),
      oauth_signature_method: "HMAC-SHA1",
      oauth_consumer_key: this._appToken,
      oauth_token: this._accessToken || "",
    };

    const sorted = CardMarketRequest._sortObject(params);

    this._logger.debug("_getParams", sorted);

    return sorted;
  }

  //
  // Static
  //

  /**
   * Encrypts key with SHA1 HMAC
   *
   * @param {string} string
   * @param {string} key
   * @returns {string}
   * @private
   */
  static _getHmac(string, key) {
    const hmac = Crypto.createHmac("sha1", key);
    hmac.update(string);
    return hmac.digest("base64");
  }

  /**
   * Returns UNIX timestamp in seconds.
   *
   * @returns {number}
   * @private
   */
  static _getTimestamp() {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Returns 32 random characters.
   *
   * @returns {string}
   * @private
   */
  static _getNonce() {
    return UUIDv4().replace(/\-/g, "");
  }

  /**
   * @param {object} object
   * @returns {object}
   * @private
   */
  static _sortObject(object) {
    const sorted = Object.keys(object)
      .sort((a, b) => {
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
      });

    const result = {};

    for (const key of sorted) {
      result[key] = object[key];
    }

    return result;
  }
}
