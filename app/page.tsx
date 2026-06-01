'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Loader2, Send, CheckCircle2 } from 'lucide-react'
import Nav from '@/components/nav'
import type { Webhook, SubmissionFormData } from '@/types'

const defaultFormData: SubmissionFormData = {
  pricingType: 'AUD',
  slidesURL: '',
  docsURL: '',
  feasibilitySheetURL: '',
  enrichedInputSheetURL: '',
  webhookIds: [],
}

export default function NewSubmissionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [formData, setFormData] = useState<SubmissionFormData>(defaultFormData)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/auth/login')
        return
      }

      try {
        const res = await fetch('/api/webhook-configs')
        if (res.ok) {
          const data: Webhook[] = await res.json()
          setWebhooks(data)
        }
      } catch {
        // ignore fetch errors on load
      }

      setLoading(false)
    }

    init()
  }, [router])

  const toggleWebhook = (id: string) => {
    setFormData((prev) => {
      const already = prev.webhookIds.includes(id)
      return {
        ...prev,
        webhookIds: already
          ? prev.webhookIds.filter((wid) => wid !== id)
          : [...prev.webhookIds, id],
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setSuccess(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Nav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-2xl mx-auto">
          {success ? (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <CardTitle className="text-green-800">Submission sent</CardTitle>
                </div>
                <CardDescription className="text-green-700">
                  Your data has been submitted successfully.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSuccess(false)
                    setFormData(defaultFormData)
                  }}
                >
                  Submit another
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">New Submission</h1>
                <p className="text-slate-500 mt-1">
                  Fill in the details and select where to send the data
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Pricing Type */}
                <div className="space-y-2">
                  <Label>Pricing Type</Label>
                  <div className="flex gap-2">
                    {(['AUD', 'USD'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, pricingType: type }))
                        }
                        className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                          formData.pricingType === type
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* URL Fields */}
                <div className="space-y-2">
                  <Label htmlFor="slidesURL">Template Slides URL</Label>
                  <Input
                    id="slidesURL"
                    type="url"
                    placeholder="https://..."
                    value={formData.slidesURL}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slidesURL: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="docsURL">Template Docs URL</Label>
                  <Input
                    id="docsURL"
                    type="url"
                    placeholder="https://..."
                    value={formData.docsURL}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, docsURL: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feasibilitySheetURL">Feasibility Sheet URL</Label>
                  <Input
                    id="feasibilitySheetURL"
                    type="url"
                    placeholder="https://..."
                    value={formData.feasibilitySheetURL}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        feasibilitySheetURL: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enrichedInputSheetURL">Enriched Input Sheet URL</Label>
                  <Input
                    id="enrichedInputSheetURL"
                    type="url"
                    placeholder="https://..."
                    value={formData.enrichedInputSheetURL}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        enrichedInputSheetURL: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Send To */}
                <div className="space-y-3">
                  <Label>Send to</Label>
                  {webhooks.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No webhooks configured.{' '}
                      <Link
                        href="/settings"
                        className="text-slate-900 underline underline-offset-2 hover:text-slate-600"
                      >
                        Go to Settings
                      </Link>{' '}
                      to add one.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {webhooks.map((webhook) => {
                        const selected = formData.webhookIds.includes(webhook.id)
                        return (
                          <div
                            key={webhook.id}
                            onClick={() => toggleWebhook(webhook.id)}
                            className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                              selected
                                ? 'bg-slate-50 border-slate-300'
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {/* Checkbox visual */}
                            <div
                              className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                selected
                                  ? 'bg-slate-900 border-slate-900'
                                  : 'border-slate-400'
                              }`}
                            >
                              {selected && (
                                <svg
                                  className="h-3 w-3 text-white"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <polyline points="2,6 5,9 10,3" />
                                </svg>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm text-slate-900">
                                {webhook.name}
                              </p>
                              <p className="text-slate-500 text-sm truncate">
                                {webhook.url}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || formData.webhookIds.length === 0}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send to n8n
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
