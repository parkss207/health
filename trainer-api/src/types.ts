import type { Client } from '@libsql/client'

export type Bindings = {
  TURSO_DATABASE_URL: string
  TURSO_AUTH_TOKEN: string
  FRONTEND_URL?: string
}

export type Variables = {
  db: Client
}
