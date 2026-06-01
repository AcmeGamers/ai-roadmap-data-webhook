#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env.local not found at project root')
    process.exit(1)
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

function parseArgs() {
  const args = {}
  const argv = process.argv.slice(2)
  for (let i = 0; i < argv.length; i++) {
    const match = argv[i].match(/^--([^=]+)=(.+)$/)
    if (match) {
      args[match[1]] = match[2]
    } else if (argv[i].startsWith('--') && argv[i + 1] && !argv[i + 1].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1]
      i++
    }
  }
  return args
}

async function main() {
  loadEnv()

  const { username } = parseArgs()

  if (!username) {
    console.error('Usage: node scripts/verify-user.js --username="email@example.com"')
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
    process.exit(1)
  }

  let createClient
  try {
    createClient = require('@supabase/supabase-js').createClient
  } catch {
    console.error('Error: @supabase/supabase-js not found. Run: pnpm add @supabase/supabase-js')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // List users and find by email (admin API doesn't have getUserByEmail directly)
  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.error('Failed:', error.message)
    process.exit(1)
  }

  const user = data.users.find(u => u.email === username)

  if (!user) {
    console.log(`User not found: ${username}`)
    process.exit(1)
  }

  const confirmed = !!user.email_confirmed_at
  const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'never'

  console.log(`User found: ${username}`)
  console.log(`  ID:             ${user.id}`)
  console.log(`  Email:          ${user.email}`)
  console.log(`  Confirmed:      ${confirmed ? 'yes' : 'no'}`)
  console.log(`  Created:        ${new Date(user.created_at).toLocaleString()}`)
  console.log(`  Last sign in:   ${lastSignIn}`)
  if (user.user_metadata && Object.keys(user.user_metadata).length > 0) {
    console.log(`  Metadata:       ${JSON.stringify(user.user_metadata)}`)
  }
}

main()
