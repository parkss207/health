import { Hono } from 'hono'
import { db } from '../db/client'

const workout = new Hono()

workout.get('/', async (c) => {
  const memberId = c.req.query('member_id')
  let sql = `
    SELECT ws.*, m.name as member_name
    FROM workout_sessions ws
    JOIN members m ON ws.member_id = m.id
  `
  const args: (string | number)[] = []

  if (memberId) {
    sql += ' WHERE ws.member_id = ?'
    args.push(memberId)
  }

  sql += ' ORDER BY ws.date DESC, ws.created_at DESC LIMIT 50'

  const result = await db.execute({ sql, args })
  return c.json(
    result.rows.map((row) => ({
      ...row,
      body_parts: JSON.parse(row.body_parts as string)
    }))
  )
})

workout.get('/:id', async (c) => {
  const id = c.req.param('id')

  const sessionResult = await db.execute({
    sql: `SELECT ws.*, m.name as member_name
          FROM workout_sessions ws
          JOIN members m ON ws.member_id = m.id
          WHERE ws.id = ?`,
    args: [id]
  })

  if (sessionResult.rows.length === 0) {
    return c.json({ error: 'Session not found' }, 404)
  }

  const session = {
    ...sessionResult.rows[0],
    body_parts: JSON.parse(sessionResult.rows[0].body_parts as string)
  }

  const setsResult = await db.execute({
    sql: `SELECT wset.*, e.name as exercise_name, e.body_part
          FROM workout_sets wset
          JOIN exercises e ON wset.exercise_id = e.id
          WHERE wset.session_id = ?
          ORDER BY e.name, wset.set_number`,
    args: [id]
  })

  return c.json({ ...session, sets: setsResult.rows })
})

workout.post('/', async (c) => {
  const body = await c.req.json()
  const { member_id, date, body_parts, memo } = body

  if (!member_id || !date || !body_parts) {
    return c.json({ error: 'member_id, date, body_parts are required' }, 400)
  }

  const result = await db.execute({
    sql: 'INSERT INTO workout_sessions (member_id, date, body_parts, memo) VALUES (?, ?, ?, ?)',
    args: [member_id, date, JSON.stringify(body_parts), memo ?? null]
  })

  return c.json({ id: Number(result.lastInsertRowid) }, 201)
})

workout.post('/:id/sets', async (c) => {
  const sessionId = c.req.param('id')
  const body = await c.req.json()
  const { sets } = body

  if (!Array.isArray(sets)) {
    return c.json({ error: 'sets array is required' }, 400)
  }

  await db.execute({
    sql: 'DELETE FROM workout_sets WHERE session_id = ?',
    args: [sessionId]
  })

  for (const set of sets) {
    await db.execute({
      sql: `INSERT INTO workout_sets (session_id, exercise_id, set_number, weight, reps, memo)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        sessionId,
        set.exercise_id,
        set.set_number,
        set.weight ?? null,
        set.reps ?? null,
        set.memo ?? null
      ]
    })
  }

  return c.json({ success: true })
})

workout.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await db.execute({ sql: 'DELETE FROM workout_sets WHERE session_id = ?', args: [id] })
  await db.execute({ sql: 'DELETE FROM workout_sessions WHERE id = ?', args: [id] })
  return c.json({ success: true })
})

export default workout
