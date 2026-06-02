// DB migration:
// ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status text DEFAULT 'in_progress';
// ALTER TABLE submissions ADD COLUMN IF NOT EXISTS received_sheets_url text;
// ALTER TABLE submissions ADD COLUMN IF NOT EXISTS received_doc_url text;
// ALTER TABLE submissions ADD COLUMN IF NOT EXISTS webhook_ids text[] DEFAULT '{}';
// ALTER TABLE webhook_configs ADD COLUMN IF NOT EXISTS name text DEFAULT '';

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json();
  const { slides_url, doc_url } = body;

  // Use service role key — this endpoint has no user session (called by n8n)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("submissions")
    .update({ status: "done", received_sheets_url: slides_url, received_doc_url: doc_url })
    .eq("id", id)
    .select("id");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0)
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
