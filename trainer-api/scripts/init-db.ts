import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url) {
  console.error('❌ TURSO_DATABASE_URL이 설정되지 않았습니다.')
  console.error('   .env 파일에 TURSO_DATABASE_URL과 TURSO_AUTH_TOKEN을 설정하세요.')
  process.exit(1)
}

const db = createClient({ url, authToken })

async function runSqlFile(filePath: string, label: string) {
  console.log(`\n⏳ ${label} 실행 중...`)
  const sql = readFileSync(filePath, 'utf-8')

  // Split by semicolons, filter empty statements
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'))

  let count = 0
  for (const stmt of statements) {
    try {
      await db.execute(stmt)
      count++
    } catch (err) {
      console.warn(`  ⚠️  건너뜀: ${stmt.slice(0, 60)}...`)
    }
  }
  console.log(`  ✅ ${count}개 구문 완료`)
}

async function checkExisting() {
  try {
    const res = await db.execute('SELECT COUNT(*) as cnt FROM exercises')
    const cnt = Number(res.rows[0].cnt)
    if (cnt > 0) {
      console.log(`\n⚠️  exercises 테이블에 이미 ${cnt}개 데이터가 있습니다.`)
      const proceed = process.argv.includes('--force')
      if (!proceed) {
        console.log('   시드 데이터를 다시 넣으려면: bun run db:init -- --force')
        return false
      }
      console.log('   --force 플래그로 계속 진행합니다.')
    }
  } catch {
    // Table doesn't exist yet, proceed
  }
  return true
}

async function main() {
  console.log('🚀 Turso DB 초기화 시작')
  console.log(`   URL: ${url?.split('//')[1]?.split('.')[0]}...`)

  const root = join(import.meta.dir, '..')

  // 1. Schema
  await runSqlFile(join(root, 'schema.sql'), 'schema.sql (테이블 생성)')

  // 2. Check before seeding
  const shouldSeed = await checkExisting()

  // 3. Seed
  if (shouldSeed) {
    await runSqlFile(join(root, 'seed.sql'), 'seed.sql (기초 데이터)')
  }

  // 4. Verify
  console.log('\n📊 데이터 확인:')
  const tables = ['members', 'exercises', 'schedules', 'workout_sessions']
  for (const table of tables) {
    try {
      const res = await db.execute(`SELECT COUNT(*) as cnt FROM ${table}`)
      console.log(`   ${table}: ${res.rows[0].cnt}개`)
    } catch {
      console.log(`   ${table}: ❌ 테이블 없음`)
    }
  }

  console.log('\n✅ DB 초기화 완료!')
  process.exit(0)
}

main().catch((err) => {
  console.error('\n❌ 오류:', err.message)
  process.exit(1)
})
