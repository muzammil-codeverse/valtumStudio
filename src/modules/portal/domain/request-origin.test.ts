import { describe, expect, it } from "vitest";

import { isSameOriginJsonRequest } from "./request-origin";

describe("private file API origin protection", () => {
  it("accepts same-origin JSON POST requests", () => {
    const request = new Request(
      "https://valtumstudio.com.au/api/delivery/files/reserve",
      {
        method: "POST",
        headers: {
          Origin: "https://valtumstudio.com.au",
          "Content-Type": "application/json"
        },
        body: "{}"
      }
    );
    expect(isSameOriginJsonRequest(request)).toBe(true);
  });
  it("rejects foreign origin and non-JSON requests", () => {
    const url = "https://valtumstudio.com.au/api/delivery/files/reserve";
    for (const headers of [
      { Origin: "https://attacker.example", "Content-Type": "application/json" },
      { Origin: "https://valtumstudio.com.au", "Content-Type": "text/plain" },
      { "Content-Type": "application/json" }
    ]) {
      expect(
        isSameOriginJsonRequest(
          new Request(url, {
            method: "POST",
            headers,
            body: "{}"
          })
        )
      ).toBe(false);
    }
  });
});
