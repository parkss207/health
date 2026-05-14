import { createClient } from '@libsql/client'

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN
})

await db.execute('DELETE FROM workout_sets')
await db.execute('DELETE FROM workout_sessions')
await db.execute('DELETE FROM schedules')
await db.execute('DELETE FROM members')
await db.execute('DELETE FROM exercises')

console.log('✅ 전체 데이터 삭제 완료')
db.close()
