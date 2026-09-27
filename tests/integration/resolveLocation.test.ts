import { describe, expect, it } from "vitest";
import { resolveLocation } from "@/lib/db/queries/locations";
import { createAdminClient } from "@/lib/supabase/admin";

describe("resolveLocation", () => {
  it("resolves an exact Indonesia country/province/city match", async () => {
    const result = await resolveLocation({
      countryName: "Indonesia",
      provinceName: "Daerah Khusus Ibukota Jakarta",
      cityName: "Kota Administrasi Jakarta Selatan",
    });
    expect(result.matched).toBe("city");
    expect(result.locationId).not.toBeNull();
  });

  it("falls back to province level when no city is given", async () => {
    const result = await resolveLocation({
      countryName: "Indonesia",
      provinceName: "Bali",
    });
    expect(result.matched).toBe("province");
  });

  it("fuzzy-matches a province given as a partial/colloquial name", async () => {
    // "Jakarta" alone should still find "Daerah Khusus Ibukota Jakarta" via
    // the ILIKE %term% fallback, even though it isn't the official name.
    const result = await resolveLocation({
      countryName: "Indonesia",
      provinceName: "Jakarta",
    });
    expect(result.matched).not.toBe("none");
  });

  it("returns none for a nonsense country", async () => {
    const result = await resolveLocation({ countryName: "Not A Real Country XYZ" });
    expect(result.matched).toBe("none");
    expect(result.locationId).toBeNull();
  });

  it("creates an on-demand city row for a non-Indonesia country, and reuses it on a second call", async () => {
    const cityName = `Test City ${Date.now()}`;
    const first = await resolveLocation({ countryName: "Singapore", cityName });
    expect(first.matched).toBe("created");
    expect(first.locationId).not.toBeNull();

    const second = await resolveLocation({ countryName: "Singapore", cityName });
    expect(second.locationId).toBe(first.locationId);

    // Cleanup: remove the on-demand row so repeated test runs don't
    // accumulate duplicate "Test City" rows under Singapore.
    const supabase = createAdminClient();
    await supabase.from("locations").delete().eq("id", first.locationId!);
  });
});
