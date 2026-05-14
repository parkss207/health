import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createDb } from './db/client'
import type { Bindings, Variables } from './types'
import exercise from './routes/exercise'
import member from './routes/member'
import workout from './routes/workout'
import schedule from './routes/schedule'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use('*', logger())

app.use('*', async (c, next) => {
  const url = c.env?.TURSO_DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? ''
  const token = c.env?.TURSO_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN
  c.set('db', createDb(url, token))
  await next()
})

app.use('*', async (c, next) => {
  const raw = c.env?.FRONTEND_URL ?? process.env.FRONTEND_URL ?? 'http://localhost:5173'
  const allowed = raw.split(',').map((o) => o.trim())
  return cors({
    origin: (origin) => (allowed.includes(origin) ? origin : allowed[0]),
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowHeaders: ['Content-Type']
  })(c, next)
})

app.get('/health', (c) => c.json({ ok: true }))

app.route('/api/exercises', exercise)
app.route('/api/members', member)
app.route('/api/workouts', workout)
app.route('/api/schedules', schedule)

export default app
