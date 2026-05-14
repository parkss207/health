import { Hono } from 'hono'
import { db } from '../db/client'

const schedule = new Hono()

const parseSchedule = (row: Record<string, unknown>) => ({
  ...row,
  body_parts: row.body_parts ? JSON.parse(row.body_parts as string) : []
})

const VALID_STATUSES = ['scheduled', 'inprogress', 'done', 'cancelled']

schedule.get('/today', async (c) => {
  const today = new Date().toISOString().split('T')[0]
  const result = await db.execute({
    sql: `SELECT s.*, m.name as member_name, m.phone as member_phone
          FROM schedules s
          JOIN members m ON s.member_id = m.id
          WHERE s.scheduled_date = ?
          ORDER BY s.start_time`,
    args: [today]
  })
  return c.json(result.rows.map(parseSchedule))
})

schedule.get('/date/:date', async (c) => {
  const date = c.req.param('date')
  const result = await db.execute({
    sql: `SELECT s.*, m.name as member_name, m.phone as member_phone
          FROM schedules s
          JOIN members m ON s.member_id = m.id
          WHERE s.scheduled_date = ?
          ORDER BY s.start_time`,
    args: [date]
  })
  return c.json(result.rows.map(parseSchedule))
})

schedule.get('/', async (c) => {
  const month = c.req.query('month')
  let sql = `SELECT s.*, m.name as member_name, m.phone as member_phone
             FROM schedules s
             JOIN members m ON s.member_id = m.id`
  const args: string[] = []

  if (month) {
    sql += ' WHERE s.scheduled_date LIKE ?'
    args.push(`${month}%`)
  }

  sql += ' ORDER BY s.scheduled_date, s.start_time'

  const result = await db.execute({ sql, args })
  return c.json(result.rows.map(parseSchedule))
})

schedule.post('/', async (c) => {
  const body = await c.req.json()
  const { member_id, scheduled_date, start_time, duration_min, body_parts, memo } = body

  if (!member_id || !scheduled_date || !start_time) {
    return c.json({ error: 'member_id, scheduled_date, start_time are required' }, 400)
  }

  const result = await db.execute({
    sql: `INSERT INTO schedules (member_id, scheduled_date, start_time, duration_min, body_parts, memo)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      member_id,
      scheduled_date,
      start_time,
      duration_min ?? 60,
      body_parts ? JSON.stringify(body_parts) : null,
      memo ?? null
    ]
  })

  return c.json({ id: Number(result.lastInsertRowid) }, 201)
})

schedule.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { member_id, scheduled_date, start_time, duration_min, body_parts, memo, status } = body

  if (!member_id || !scheduled_date || !start_time) {
    return c.json({ error: 'member_id, scheduled_date, start_time are required' }, 400)
  }

  await db.execute({
    sql: `UPDATE schedules
          SET member_id = ?, scheduled_date = ?, start_time = ?, duration_min = ?,
              body_parts = ?, memo = ?, status = ?
          WHERE id = ?`,
    args: [
      member_id,
      scheduled_date,
      start_time,
      duration_min ?? 60,
      body_parts ? JSON.stringify(body_parts) : null,
      memo ?? null,
      status ?? 'scheduled',
      id
    ]
  })

  return c.json({ success: true })
})

schedule.patch('/:id/status', async (c) => {
  const id = c.req.param('id')
  const { status } = await c.req.json()

  if (!VALID_STATUSES.includes(status)) {
    return c.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, 400)
  }

  await db.execute({
    sql: 'UPDATE schedules SET status = ? WHERE id = ?',
    args: [status, id]
  })

  return c.json({ success: true })
})

schedule.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await db.execute({ sql: 'DELETE FROM schedules WHERE id = ?', args: [id] })
  return c.json({ success: true })
})

export default schedule
