import { describe, expect, it } from "vitest";

import { isSafeSettingKey } from "./registry";
describe("settings registry", () => {
  it("allows approved groups only", () => {
    expect(isSafeSettingKey("identity")).toBe(true);
    expect(isSafeSettingKey("databasePassword")).toBe(false);
    expect(isSafeSettingKey("made-up")).toBe(false);
  });
});
