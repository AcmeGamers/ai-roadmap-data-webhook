'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LogOut, FileText, Clock, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navLinks = [
  { href: '/', icon: FileText, label: 'New Submission' },
  { href: '/history', icon: Clock, label: 'History' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export default function Nav() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="w-56 bg-slate-900 text-white p-4 flex flex-col shrink-0">
      <div className="mb-6">
        <h1 className="text-lg font-bold leading-tight">Roadmap</h1>
        <p className="text-xs text-slate-400">Automation</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {navLinks.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut size={16} className="mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
