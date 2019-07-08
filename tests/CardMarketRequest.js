const CardMarketRequest = require("../lib");

const appToken = "xFAKEkFAKEL8FAKE";
const appSecret = "kgFAKEfVxp8xFAKENWEaY15FAKE8fM8G";

const method = "GET";
const route = "/route";
const params = {
  oauth_version: "1.0",
  oauth_timestamp: 1562565252,
  oauth_nonce: "64d1da68f05746329c61c9961f6ead85",
  oauth_signature_method: "HMAC-SHA1",
  oauth_consumer_key: appToken,
  oauth_token: "",
};
const queryParams = {
  search: "Edgar Markov",
};

describe("cardmarket-request", () => {

  test("throws errors", () => {
    expect(() => {
      new CardMarketRequest();
    }).toThrow();

    expect(() => {
      new CardMarketRequest({
        appToken: 1234,
        appSecret,
      });
    }).toThrow();

    expect(() => {
      new CardMarketRequest({
        appToken,
        appSecret: undefined,
      });
    }).toThrow();
  });

  test("returns oauth header", () => {
    const cmr = new CardMarketRequest({
      appToken,
      appSecret,
    });

    const result = cmr._getOAuthHeader(method, route);

    expect(result).toContain("OAuth realm");
    expect(result).toContain("api.cardmarket.com");
    expect(result).toContain(route);
    expect(result).toContain(`oauth_consumer_key="${appToken}"`);
    expect(result).toContain("oauth_nonce");
    expect(result).toContain("oauth_signature_method=\"HMAC-SHA1\"");
    expect(result).toContain("oauth_timestamp");
    expect(result).toContain("oauth_token");
    expect(result).toContain("oauth_version=\"1.0\"");
    expect(result).toContain("oauth_signature");
  });

  test("returns api url", () => {
    const cmr = new CardMarketRequest({
      appToken,
      appSecret,
    });

    const result = cmr._getURL(route, queryParams);

    expect(result).toContain("https");
    expect(result).toContain("api.cardmarket.com");
    expect(result).toContain("output.json");
    expect(result).toContain(route);
    expect(result).toContain("?search=Edgar%20Markov");
  });

  test("returns sandbox url", () => {
    const cmr = new CardMarketRequest({
      appToken,
      appSecret,
    });
    cmr.sandbox();

    const result = cmr._getURL(route);

    expect(result).toContain("sandbox.cardmarket.com");
  });

  test("returns signature", () => {
    const cmr = new CardMarketRequest({
      appToken,
      appSecret,
    });

    const result = cmr._getSignature(method, route, params);

    expect(result).toBe("wYva/KLlHCNYbufT302ndIUEviE=");
  });

  test("returns different signature with query parameters", () => {
    const cmr = new CardMarketRequest({
      appToken,
      appSecret,
    });

    const result = cmr._getSignature(method, route, params, queryParams);

    expect(result).toBe("H1lDYCBSNfdQJKSzIKn9S3OooX0=");
  });

  test("returns base string", () => {
    const cmr = new CardMarketRequest({
      appToken,
      appSecret,
    });

    const result = cmr._getBaseString(method, route, params);

    expect(result).toContain("GET");
    expect(result).toContain("api.cardmarket.com");
    expect(result).toContain("output.json");
    expect(result).toContain("oauth_consumer_key%3DxFAKEkFAKEL8FAKE");
    expect(result).toContain("oauth_nonce%3D64d1da68f05746329c61c9961f6ead85");
    expect(result).toContain("oauth_signature_method%3DHMAC-SHA1");
    expect(result).toContain("oauth_timestamp%3D1562565252");
    expect(result).toContain("oauth_version%3D1.0");
  });

  test("returns base string with query parameters", () => {
    const cmr = new CardMarketRequest({
      appToken,
      appSecret,
    });

    const result = cmr._getBaseString(method, route, params, queryParams);

    expect(result).toContain("search%3DEdgar%2520Markov");
  });

  test("returns signature key", () => {
    const cmr = new CardMarketRequest({
      appToken,
      appSecret,
    });

    const result = cmr._getSignatureKey();

    expect(result).toBe("kgFAKEfVxp8xFAKENWEaY15FAKE8fM8G&");
  });

  test("returns params string", () => {
    const cmr = new CardMarketRequest({
      appToken,
      appSecret,
    });

    const result = cmr._getParamsString(params, queryParams);

    expect(result).toContain("oauth_consumer_key=xFAKEkFAKEL8FAKE&");
    expect(result).toContain("oauth_nonce=64d1da68f05746329c61c9961f6ead85&");
    expect(result).toContain("oauth_signature_method=HMAC-SHA1&");
    expect(result).toContain("oauth_timestamp=1562565252&");
    expect(result).toContain("oauth_token=&");
    expect(result).toContain("oauth_version=1.0&");
    expect(result).toContain("search=Edgar%20Markov");
  });

  test("returns validated params object", () => {
    const cmr = new CardMarketRequest({
      appToken,
      appSecret,
    });

    const result = cmr._validateParams(params, queryParams);

    expect(result.oauth_version).toBe(params.oauth_version);
    expect(result.oauth_timestamp).toBe(params.oauth_timestamp);
    expect(result.oauth_nonce).toBe(params.oauth_nonce);
    expect(result.oauth_signature_method).toBe(params.oauth_signature_method);
    expect(result.oauth_consumer_key).toBe(params.oauth_consumer_key);
    expect(result.oauth_token).toBe(params.oauth_token);
  });

  test("returns params object", () => {
    const cmr = new CardMarketRequest({
      appToken,
      appSecret,
    });

    const result = cmr._getParams();

    expect(result.oauth_version).toBe(params.oauth_version);
    expect(result.oauth_timestamp).toBeGreaterThan(0);
    expect(result.oauth_signature_method).toBe(params.oauth_signature_method);
    expect(result.oauth_consumer_key).toBe(params.oauth_consumer_key);
    expect(result.oauth_token).toBe(params.oauth_token);
  });

  test("returns hmac string", () => {
    const result = CardMarketRequest._getHmac(appToken, appSecret);

    expect(result).toBe("NBhSEHjTSiSkfOyafRdYeYxbjzM=");
  });

  test("returns timestamp", () => {
    const result = CardMarketRequest._getTimestamp();

    expect(result).toBeGreaterThan(0);
  });

  test("returns sorted object", () => {
    const result = CardMarketRequest._sortObject({
      b: "b",
      c: "c",
      a: "a",
    });

    const keys = Object.keys(result);

    expect(keys[0]).toBe("a");
    expect(keys[1]).toBe("b");
    expect(keys[2]).toBe("c");
  });

});
