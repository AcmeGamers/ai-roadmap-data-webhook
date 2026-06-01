import { processWebhookRetries } from '@/lib/webhook-service';
import { NextRequest, NextResponse } from 'next/server';

// This endpoint is called periodically to process pending webhook retries
// In production, you'd want to use a cron job service instead
export async function GET(req: NextRequest) {
  // Verify the request is coming from a trusted source
  const authHeader = req.headers.get('authorization');
  const expectedToken = process.env.WEBHOOK_RETRY_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await processWebhookRetries();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error in retry route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
