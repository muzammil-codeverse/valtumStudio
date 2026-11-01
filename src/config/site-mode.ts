/** The frontend profile ships public presentation routes without backend dependencies. */
export function isFrontendOnly(): boolean {
  return process.env["VALTUM_SITE_MODE"] === "frontend";
}
