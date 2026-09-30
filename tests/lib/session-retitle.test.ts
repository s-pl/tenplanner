import { describe, expect, it } from "vitest";
import { retitleForDate, titleForCopy } from "@/lib/sessions/retitle";

const mon = new Date(2026, 9, 5, 17, 0);
const tue = new Date(2026, 9, 6, 17, 0);

describe("retitleForDate", () => {
  it("updates the date of an automatic code title", () => {
    expect(retitleForDate("261005_Galácticas", mon, tue)).toBe(
      "261006_Galácticas"
    );
    expect(retitleForDate("261005", mon, tue)).toBe("261006");
  });

  it("leaves hand-written titles and edited codes alone", () => {
    expect(retitleForDate("Adultos iniciación", mon, tue)).toBeNull();
    expect(retitleForDate("261001_Galácticas", mon, tue)).toBeNull();
  });
});

describe("titleForCopy", () => {
  it("retitles code titles", () => {
    expect(titleForCopy("261005_Galácticas", mon, tue)).toBe(
      "261006_Galácticas"
    );
  });
  it("keeps the title on another day and marks same-day copies", () => {
    expect(titleForCopy("Adultos", mon, tue)).toBe("Adultos");
    expect(titleForCopy("Adultos", mon, mon)).toBe("Adultos (copia)");
  });
});
