import { createClient } from '@/lib/supabase/server';

const RETRY_DELAYS = [1, 5, 15, 60]; // minutes
const MAX_RETRIES = RETRY_DELAYS.length;

export async function sendWebhook(
  webhookUrl: string,
  data: any,
  submissionId: string,
  webhookType: string
) {
  const supabase = await createClient();

  try {
    // Create initial log entry
    const { data: logEntry, error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        submission_id: submissionId,
        webhook_type: webhookType,
        webhook_url: webhookUrl,
        status: 'pending',
      })
      .select()
      .single();

    if (logError) {
      console.error('[v0] Error creating webhook log:', logError);
      return;
    }

    // Send webhook
    await attemptWebhookSend(
      webhookUrl,
      data,
      submissionId,
      webhookType,
      logEntry.id
    );
  } catch (err) {
    console.error('[v0] Error in sendWebhook:', err);
  }
}

async function attemptWebhookSend(
  webhookUrl: string,
  data: any,
  submissionId: string,
  webhookType: string,
  logId: string,
  attemptNumber: number = 1
) {
  const supabase = await createClient();

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionId,
        type: webhookType,
        data,
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (response.ok) {
      // Success
      const responseBody = await response.text();
      await supabase
        .from('webhook_logs')
        .update({
          status: 'success',
          response_status: response.status,
          response_body: responseBody,
          attempt_number: attemptNumber,
        })
        .eq('id', logId);

      console.log('[v0] Webhook delivered successfully to', webhookUrl);
      return;
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';

    if (attemptNumber < MAX_RETRIES) {
      // Schedule retry
      const delayMinutes = RETRY_DELAYS[attemptNumber - 1];
      const nextRetryAt = new Date(
        Date.now() + delayMinutes * 60 * 1000
      ).toISOString();

      await supabase
        .from('webhook_logs')
        .update({
          status: 'retrying',
          error_message: errorMessage,
          attempt_number: attemptNumber,
          next_retry_at: nextRetryAt,
        })
        .eq('id', logId);

      console.log(
        `[v0] Webhook retry scheduled in ${delayMinutes} minutes for ${webhookUrl}`
      );
    } else {
      // Final failure
      await supabase
        .from('webhook_logs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          attempt_number: attemptNumber,
        })
        .eq('id', logId);

      console.error('[v0] Webhook delivery failed after all retries:', webhookUrl);
      // TODO: Send error notification
    }
  }
}

export async function processWebhookRetries() {
  const supabase = await createClient();

  try {
    // Get all pending retries
    const { data: logs, error } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('status', 'retrying')
      .lte('next_retry_at', new Date().toISOString());

    if (error) {
      console.error('[v0] Error fetching retries:', error);
      return;
    }

    if (!logs || logs.length === 0) {
      return;
    }

    console.log(`[v0] Processing ${logs.length} webhook retries`);

    for (const log of logs) {
      const { data: submission } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', log.submission_id)
        .single();

      if (!submission) continue;

      const submissionData = {
        pricingType: submission.pricing_type,
        slidesURL: submission.slides_url,
        docsURL: submission.docs_url,
        feasibilitySheetURL: submission.feasibility_sheet_url,
        enrichedInputSheetURL: submission.enriched_input_sheet_url,
      };

      await attemptWebhookSend(
        log.webhook_url,
        submissionData,
        log.submission_id,
        log.webhook_type,
        log.id,
        log.attempt_number + 1
      );
    }
  } catch (err) {
    console.error('[v0] Error processing webhook retries:', err);
  }
}
