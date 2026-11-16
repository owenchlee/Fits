import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Deletes the signed-in user's Supabase auth account (Guideline 5.1.1(v)).
// Runs server-side because deleting another user's own auth.users row needs
// the service-role key, which must never reach the client.
//
// The native app keeps its session in Capacitor Preferences rather than cookies (see
// src/lib/supabase/client.ts), so the cookie-based server client sees no user there. Callers
// send their access token as a Bearer header instead; cookies remain the fallback for web.
export async function POST(request: NextRequest) {
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Account deletion is temporarily unavailable. Please contact support." }, { status: 500 });
  }

  const { data, error: userError } = bearer
    ? await admin.auth.getUser(bearer)
    : await (await createServerClient()).auth.getUser();
  const user = data.user;

  if (userError || !user) {
    return NextResponse.json({ error: "Your session has expired. Log out, log back in, and try again." }, { status: 401 });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
