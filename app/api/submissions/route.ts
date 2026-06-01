import { createClient } from '@/lib/supabase/server';
import { sendWebhook } from '@/lib/webhook-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      user_id: user.id,
      pricing_type: body.pricingType,
      slides_url: body.slidesURL,
      docs_url: body.docsURL,
      feasibility_sheet_url: body.feasibilitySheetURL,
      enriched_input_sheet_url: body.enrichedInputSheetURL,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Trigger webhook sending asynchronously
  triggerWebhooks(data.id, user.id, body);

  return NextResponse.json(data, { status: 201 });
}

async function triggerWebhooks(
  submissionId: string,
  userId: string,
  submissionData: any
) {
  try {
    const supabase = await createClient();

    // Get webhook configs for this user
    const { data: configs, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('webhook_type', 'data');

    if (error || !configs || configs.length === 0) {
      console.log('[v0] No webhook configs found for user');
      return;
    }

    // Send webhooks for each config
    for (const config of configs) {
      // Non-blocking webhook send
      sendWebhook(
        config.webhook_url,
        submissionData,
        submissionId,
        'data'
      ).catch((err) => {
        console.error('[v0] Error in triggerWebhooks:', err);
      });
    }
  } catch (err) {
    console.error('[v0] Error triggering webhooks:', err);
  }
}
