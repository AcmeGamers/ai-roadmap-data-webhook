// DB migration:
// ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status text DEFAULT 'in_progress';
// ALTER TABLE submissions ADD COLUMN IF NOT EXISTS received_sheets_url text;
// ALTER TABLE submissions ADD COLUMN IF NOT EXISTS received_doc_url text;
// ALTER TABLE submissions ADD COLUMN IF NOT EXISTS webhook_ids text[] DEFAULT '{}';
// ALTER TABLE webhook_configs ADD COLUMN IF NOT EXISTS name text DEFAULT '';

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body = await req.json()
  const { sheets_url, doc_url } = body

  const supabase = await createClient()
  const { error } = await supabase
    .from('submissions')
    .update({ status: 'done', received_sheets_url: sheets_url, received_doc_url: doc_url })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
