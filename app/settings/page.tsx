'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/context/app-context'
import Nav from '@/components/nav'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Trash2, Plus, Link2, Pencil, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Webhook } from '@/types'

function EditableRow({
  webhook,
  onUpdate,
  onDelete,
}: {
  webhook: Webhook
  onUpdate: (id: string, name: string, url: string) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(webhook.name)
  const [url, setUrl] = useState(webhook.url)
  const [saving, setSaving] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setName(webhook.name)
    setUrl(webhook.url)
    setEditing(true)
    setTimeout(() => nameRef.current?.focus(), 0)
  }

  const cancel = () => {
    setEditing(false)
    setName(webhook.name)
    setUrl(webhook.url)
  }

  const save = async () => {
    if (!name.trim() || !url.trim()) return
    setSaving(true)
    const ok = await onUpdate(webhook.id, name.trim(), url.trim())
    setSaving(false)
    if (ok) {
      toast.success('Webhook updated')
      setEditing(false)
    } else {
      toast.error('Failed to update webhook')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') cancel()
  }

  if (editing) {
    return (
      <li className="flex items-center gap-2 py-2">
        <Link2 className="h-4 w-4 text-slate-400 shrink-0" />
        <Input ref={nameRef} value={name} onChange={e => setName(e.target.value)}
          onKeyDown={handleKeyDown} placeholder="Name" className="h-8 w-36" />
        <Input value={url} onChange={e => setUrl(e.target.value)}
          onKeyDown={handleKeyDown} placeholder="https://..." className="h-8 flex-1" />
        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700"
          onClick={save} disabled={saving}>
          <Check size={15} />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-600"
          onClick={cancel}>
          <X size={15} />
        </Button>
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <Link2 className="h-4 w-4 text-slate-400 shrink-0" />
        <div className="min-w-0">
          <p className="font-medium text-sm">{webhook.name}</p>
          <p className="text-xs text-slate-500 truncate">{webhook.url}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={startEdit}>
          <Pencil size={14} />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600"
          onClick={async () => {
            const ok = await onDelete(webhook.id)
            if (ok) toast.success('Webhook removed')
            else toast.error('Failed to delete webhook')
          }}>
          <Trash2 size={14} />
        </Button>
      </div>
    </li>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { webhooks, loadWebhooks, addWebhook, updateWebhook, removeWebhook } = useApp()
  const [authLoading, setAuthLoading] = useState(true)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      await loadWebhooks()
      setAuthLoading(false)
    }
    init()
  }, [router, loadWebhooks])

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) return
    setAdding(true)
    const result = await addWebhook(name.trim(), url.trim())
    setAdding(false)
    if (!result) {
      toast.error('Failed to add webhook')
      return
    }
    toast.success(`"${name.trim()}" added`)
    setName('')
    setUrl('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
  }

  if (authLoading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )

  return (
    <div className="flex h-screen bg-background">
      <Nav />
      <main className="flex-1 overflow-auto p-8">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Webhooks</CardTitle>
            <CardDescription>Add named webhooks to use when sending submissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 items-end">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="webhook-name">Name</Label>
                <Input id="webhook-name" placeholder="N8N Main" value={name}
                  onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} className="w-36" />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <Label htmlFor="webhook-url">URL</Label>
                <Input id="webhook-url" type="url" placeholder="https://..." value={url}
                  onChange={e => setUrl(e.target.value)} onKeyDown={handleKeyDown} />
              </div>
              <Button onClick={handleAdd} disabled={adding || !name.trim() || !url.trim()}>
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>

            <Separator />

            {webhooks.length === 0 ? (
              <p className="text-slate-500 text-sm py-2">No webhooks yet. Add one above.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {webhooks.map(webhook => (
                  <EditableRow
                    key={webhook.id}
                    webhook={webhook}
                    onUpdate={updateWebhook}
                    onDelete={removeWebhook}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
