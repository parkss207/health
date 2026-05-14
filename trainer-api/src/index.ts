import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import exercise from './routes/exercise'
import member from './routes/member'
import workout from './routes/workout'
import schedule from './routes/schedule'

const app = new Hono()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowHeaders: ['Content-Type']
  })
)

app.get('/health', (c) => c.json({ ok: true }))

app.route('/api/exercises', exercise)
app.route('/api/members', member)
app.route('/api/workouts', workout)
app.route('/api/schedules', schedule)

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch
}
