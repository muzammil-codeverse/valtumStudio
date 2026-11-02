import { describe, expect, it } from "vitest";

import { encodeCsvCell, formatCsvTable } from "./csv-export";

describe("customer CSV security", () => {
  it("quotes commas, quotes, and removes embedded control line breaks", () => {
    expect(encodeCsvCell('Client "One", Ltd\r\nAnother')).toBe(
      '"Client ""One"", Ltd  Another"'
    );
  });

  it.each(["=1+1", "+SUM(A1)", "-2+3", "@sum(A1)", "  =HYPERLINK(A1)"])(
    "neutralises spreadsheet formula cells: %s",
    (value) => {
      const encoded = encodeCsvCell(value);
      expect(encoded).toContain("'" + value);
    }
  );

  it("produces stable comma-separated rows with a BOM for Excel", () => {
    expect(
      formatCsvTable([
        ["Name", "Amount"],
        ["Valtum", 25]
      ])
    ).toBe('\uFEFF"Name","Amount"\r\n"Valtum","25"\r\n');
  });
});
