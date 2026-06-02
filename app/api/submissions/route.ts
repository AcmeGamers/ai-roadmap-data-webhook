// SQL migration required:
// ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status text DEFAULT 'in_progress';
// ALTER TABLE submissions ADD COLUMN IF NOT EXISTS received_slides_url text;
// ALTER TABLE submissions ADD COLUMN IF NOT EXISTS received_doc_url text;
// ALTER TABLE submissions ADD COLUMN IF NOT EXISTS webhook_ids text[] DEFAULT '{}';

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    pricingType,
    slidesURL,
    docsURL,
    feasibilitySheetURL,
    enrichedInputSheetURL,
    webhookIds,
  } = body;

  const { data: submission, error } = await supabase
    .from("submissions")
    .insert({
      user_id: user.id,
      pricing_type: pricingType,
      slides_url: slidesURL,
      docs_url: docsURL,
      feasibility_sheet_url: feasibilitySheetURL,
      enriched_input_sheet_url: enrichedInputSheetURL,
      status: "in_progress",
      webhook_ids: webhookIds ?? [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const baseUrl = forwardedHost
    ? `${forwardedProto?.split(",")[0] ?? "https"}://${forwardedHost}`
    : new URL(req.url).origin;
  const callbackUrl = new URL(
    "/api/webhooks/receive?id=" + submission.id,
    baseUrl,
  ).toString();

  for (const webhookId of webhookIds ?? []) {
    const { data: webhook } = await supabase
      .from("webhook_configs")
      .select("*")
      .eq("id", webhookId)
      .eq("user_id", user.id)
      .single();

    if (webhook) {
      fetch(webhook.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: submission.id,
          pricing_type: submission.pricing_type,
          slides_url: submission.slides_url,
          docs_url: submission.docs_url,
          feasibilitySheetURL: submission.feasibility_sheet_url,
          enrichedInputSheetURL: submission.enriched_input_sheet_url,
          callback_url: callbackUrl,
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.json(submission, { status: 201 });
}
