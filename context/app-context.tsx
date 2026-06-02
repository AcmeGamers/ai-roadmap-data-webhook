'use client'

import { createContext, useContext, useRef, useState, useCallback, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Webhook, Submission, SubmissionFormData } from '@/types'

interface AppState {
  // data
  webhooks: Webhook[]
  submissions: Submission[]
  // template (copy from history → home)
  template: SubmissionFormData | null
  setTemplate: (data: SubmissionFormData | null) => void
  // loaders (no-op if already loaded)
  loadWebhooks: () => Promise<void>
  loadSubmissions: () => Promise<void>
  // mutations
  addWebhook: (name: string, url: string) => Promise<Webhook | null>
  updateWebhook: (id: string, name: string, url: string) => Promise<boolean>
  removeWebhook: (id: string) => Promise<boolean>
  addSubmission: (data: SubmissionFormData) => Promise<Submission | null>
  refreshSubmissions: () => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [template, setTemplate] = useState<SubmissionFormData | null>(null)
  const webhooksLoaded = useRef(false)
  const submissionsLoaded = useRef(false)

  // Real-time: update submission in state when DB row changes (e.g. n8n callback)
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('submissions-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'submissions' }, payload => {
        setSubmissions(prev => prev.map(s => s.id === payload.new.id ? payload.new as Submission : s))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const loadWebhooks = useCallback(async () => {
    if (webhooksLoaded.current) return
    webhooksLoaded.current = true
    const res = await fetch('/api/webhook-configs')
    const data = await res.json()
    if (Array.isArray(data)) setWebhooks(data)
  }, [])

  const loadSubmissions = useCallback(async () => {
    if (submissionsLoaded.current) return
    submissionsLoaded.current = true
    const res = await fetch('/api/submissions')
    const data = await res.json()
    if (Array.isArray(data)) setSubmissions(data)
  }, [])

  const refreshSubmissions = useCallback(async () => {
    const res = await fetch('/api/submissions')
    const data = await res.json()
    if (Array.isArray(data)) setSubmissions(data)
  }, [])

  const addWebhook = useCallback(async (name: string, url: string): Promise<Webhook | null> => {
    const res = await fetch('/api/webhook-configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url }),
    })
    const data = await res.json()
    if (!res.ok) return null
    setWebhooks(prev => [data, ...prev])
    return data
  }, [])

  const updateWebhook = useCallback(async (id: string, name: string, url: string): Promise<boolean> => {
    const res = await fetch(`/api/webhook-configs?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url }),
    })
    if (!res.ok) return false
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, name, url } : w))
    return true
  }, [])

  const removeWebhook = useCallback(async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/webhook-configs?id=${id}`, { method: 'DELETE' })
    if (!res.ok) return false
    setWebhooks(prev => prev.filter(w => w.id !== id))
    return true
  }, [])

  const addSubmission = useCallback(async (formData: SubmissionFormData): Promise<Submission | null> => {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    const data = await res.json()
    if (!res.ok) return null
    setSubmissions(prev => [data, ...prev])
    return data
  }, [])

  return (
    <AppContext.Provider value={{
      webhooks, submissions,
      template, setTemplate,
      loadWebhooks, loadSubmissions, refreshSubmissions,
      addWebhook, updateWebhook, removeWebhook, addSubmission,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
