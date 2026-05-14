import { Hono } from 'hono'
import type { Bindings, Variables } from '../types'

const member = new Hono<{ Bindings: Bindings; Variables: Variables }>()

member.get('/', async (c) => {
  const db = c.get('db')
  const result = await db.execute('SELECT * FROM members ORDER BY name')
  return c.json(result.rows)
})

member.get('/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  const result = await db.execute({
    sql: 'SELECT * FROM members WHERE id = ?',
    args: [id]
  })

  if (result.rows.length === 0) {
    return c.json({ error: 'Member not found' }, 404)
  }

  return c.json(result.rows[0])
})

member.post('/', async (c) => {
  const db = c.get('db')
  const body = await c.req.json()
  const { name, phone, goal, memo } = body

  if (!name) {
    return c.json({ error: 'Name is required' }, 400)
  }

  const result = await db.execute({
    sql: 'INSERT INTO members (name, phone, goal, memo) VALUES (?, ?, ?, ?)',
    args: [name, phone ?? null, goal ?? null, memo ?? null]
  })

  return c.json({ id: Number(result.lastInsertRowid) }, 201)
})

member.put('/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  const body = await c.req.json()
  const { name, phone, goal, memo } = body

  if (!name) {
    return c.json({ error: 'Name is required' }, 400)
  }

  await db.execute({
    sql: 'UPDATE members SET name = ?, phone = ?, goal = ?, memo = ? WHERE id = ?',
    args: [name, phone ?? null, goal ?? null, memo ?? null, id]
  })

  return c.json({ success: true })
})

member.delete('/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  await db.execute({ sql: 'DELETE FROM members WHERE id = ?', args: [id] })
  return c.json({ success: true })
})

member.get('/:id/sessions', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  const result = await db.execute({
    sql: `SELECT ws.*,
          (SELECT COUNT(*) FROM workout_sets wset WHERE wset.session_id = ws.id) as set_count
          FROM workout_sessions ws
          WHERE ws.member_id = ?
          ORDER BY ws.date DESC`,
    args: [id]
  })

  const sessions = result.rows.map((row) => ({
    ...row,
    body_parts: JSON.parse(row.body_parts as string)
  }))

  return c.json(sessions)
})

export default member
