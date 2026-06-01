#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Parse .env.local
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

// Parse --key=value or --key value args
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

  const { username, password, role } = parseArgs()

  if (!username || !password) {
    console.error('Usage: node scripts/add-user.js --username="email@example.com" --password="your-password"')
    console.error('       node scripts/add-user.js --username="email@example.com" --password="your-password" --role="admin"')
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
    process.exit(1)
  }

  // Dynamically resolve @supabase/supabase-js from node_modules
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

  console.log(`Creating user: ${username}`)

  const { data, error } = await supabase.auth.admin.createUser({
    email: username,
    password,
    email_confirm: true,
    ...(role ? { user_metadata: { role } } : {}),
  })

  if (error) {
    console.error('Failed:', error.message)
    process.exit(1)
  }

  console.log('User created successfully')
  console.log(`  ID:    ${data.user.id}`)
  console.log(`  Email: ${data.user.email}`)
  console.log(`  Role:  ${data.user.role}`)
}

main()
