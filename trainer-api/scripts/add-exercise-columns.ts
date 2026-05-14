import { createClient } from '@libsql/client'

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN
})

try {
  await db.execute("ALTER TABLE exercises ADD COLUMN tips TEXT")
  console.log('✅ tips 컬럼 추가')
} catch { console.log('⚠️  tips 이미 존재') }

try {
  await db.execute("ALTER TABLE exercises ADD COLUMN difficulty TEXT DEFAULT '중급'")
  console.log('✅ difficulty 컬럼 추가')
} catch { console.log('⚠️  difficulty 이미 존재') }

try {
  await db.execute("ALTER TABLE exercises ADD COLUMN muscles TEXT")
  console.log('✅ muscles 컬럼 추가')
} catch { console.log('⚠️  muscles 이미 존재') }

console.log('✅ 스키마 업데이트 완료')
db.close()
