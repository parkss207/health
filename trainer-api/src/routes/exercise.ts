import { Hono } from 'hono'
import type { Bindings, Variables } from '../types'

const exercise = new Hono<{ Bindings: Bindings; Variables: Variables }>()

exercise.get('/', async (c) => {
  const db = c.get('db')
  const bodyPart = c.req.query('body_part')
  let sql = 'SELECT * FROM exercises'
  const args: string[] = []

  if (bodyPart) {
    sql += ' WHERE body_part = ?'
    args.push(bodyPart)
  }

  sql += ' ORDER BY body_part, name'

  const result = await db.execute({ sql, args })
  return c.json(result.rows)
})

exercise.get('/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  const result = await db.execute({
    sql: 'SELECT * FROM exercises WHERE id = ?',
    args: [id]
  })

  if (result.rows.length === 0) {
    return c.json({ error: 'Exercise not found' }, 404)
  }

  return c.json(result.rows[0])
})

export default exercise
