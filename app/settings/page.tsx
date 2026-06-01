'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Nav from '@/components/nav'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Trash2, Plus, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Webhook } from '@/types'

export default function SettingsPage() {
  const router = useRouter()
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      await fetchWebhooks()
      setLoading(false)
    }
    init()
  }, [router])

  const fetchWebhooks = async () => {
    const res = await fetch('/api/webhook-configs')
    const data = await res.json()
    if (!res.ok) {
      toast.error(data?.error ?? 'Failed to load webhooks')
      setWebhooks([])
      return
    }
    setWebhooks(Array.isArray(data) ? data : [])
  }

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/webhook-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error ?? 'Failed to add webhook')
        return
      }
      toast.success(`Webhook "${name}" added`)
      await fetchWebhooks()
      setName('')
      setUrl('')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/webhook-configs?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      toast.error(data?.error ?? 'Failed to delete webhook')
      return
    }
    toast.success('Webhook removed')
    setWebhooks((prev) => prev.filter((w) => w.id !== id))
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Nav />
      <main className="flex-1 overflow-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Webhooks</CardTitle>
            <CardDescription>
              Add named webhooks to use when sending submissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add form */}
            <div className="flex flex-row gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="webhook-name">Name</Label>
                <Input
                  id="webhook-name"
                  placeholder="N8N Main"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <Label htmlFor="webhook-url">URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <Button
                onClick={handleAdd}
                disabled={adding || !name.trim() || !url.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            <Separator />

            {/* Webhook list */}
            {webhooks.length === 0 ? (
              <p className="text-slate-500 text-sm py-2">
                No webhooks yet. Add one above.
              </p>
            ) : (
              <ul className="space-y-2">
                {webhooks.map((webhook) => (
                  <li
                    key={webhook.id}
                    className="flex items-center justify-between gap-4 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Link2 className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium">{webhook.name}</p>
                        <p className="text-sm text-slate-500 truncate">
                          {webhook.url}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
