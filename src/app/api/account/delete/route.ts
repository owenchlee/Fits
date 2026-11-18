import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
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

  const unavailable = () =>
    NextResponse.json({ error: "We couldn't reach the server. Please try again in a moment." }, { status: 503 });
  // Bound every Supabase call so an unresponsive backend can't hang the request.
  const bounded = <T,>(p: Promise<T>) => {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("timeout")), 2000);
    });
    return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
  };

  try {
    const { data, error: userError } = await bounded(
      bearer ? admin.auth.getUser(bearer) : createServerClient().then((c) => c.auth.getUser())
    );
    if (userError && (isAuthRetryableFetchError(userError) || (userError.status ?? 0) >= 500)) return unavailable();
    const user = data.user;

    if (userError || !user) {
      return NextResponse.json({ error: "Your session has expired. Log out, log back in, and try again." }, { status: 401 });
    }

    const { error: deleteError } = await bounded(admin.auth.admin.deleteUser(user.id));

    if (deleteError) {
      if (isAuthRetryableFetchError(deleteError)) return unavailable();
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return unavailable();
  }
}
