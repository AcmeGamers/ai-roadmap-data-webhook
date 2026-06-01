import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const submissionId = searchParams.get('submissionId');

  let query = supabase
    .from('webhook_logs')
    .select(
      `*,
      submissions!inner(user_id)`
    )
    .eq('submissions.user_id', user.id)
    .order('created_at', { ascending: false });

  if (submissionId) {
    query = query.eq('submission_id', submissionId);
  }

  const { data, error } = await query.limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
