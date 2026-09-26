import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Public reference data for the onboarding location picker (country → province
// → city cascade). Matches the locations_select_all RLS policy, but uses the
// admin client since this route has no session context to scope to anyway.
export async function GET(request: NextRequest) {
  const level = request.nextUrl.searchParams.get("level");
  const country = request.nextUrl.searchParams.get("country");
  const province = request.nextUrl.searchParams.get("province");

  const supabase = createAdminClient();

  if (level === "country") {
    const { data, error } = await supabase
      .from("locations")
      .select("id, country_code, country_name")
      .is("province_code", null)
      .is("city_code", null)
      .order("country_name");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(
      data.map((c) => ({ id: c.id, code: c.country_code, name: c.country_name }))
    );
  }

  if (level === "province" && country) {
    const { data, error } = await supabase
      .from("locations")
      .select("id, province_code, province_name")
      .eq("country_code", country)
      .not("province_code", "is", null)
      .is("city_code", null)
      .order("province_name");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(
      data.map((p) => ({ id: p.id, code: p.province_code, name: p.province_name }))
    );
  }

  if (level === "city" && province) {
    const { data, error } = await supabase
      .from("locations")
      .select("id, city_code, city_name")
      .eq("province_code", province)
      .not("city_code", "is", null)
      .order("city_name");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(
      data.map((c) => ({ id: c.id, code: c.city_code, name: c.city_name }))
    );
  }

  return NextResponse.json({ error: "invalid query" }, { status: 400 });
}
