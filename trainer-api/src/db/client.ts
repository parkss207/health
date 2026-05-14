import { createClient, type Client } from '@libsql/client/web'

export function createDb(url: string, authToken?: string): Client {
  // @libsql/client/web requires https://, not libsql://
  const httpUrl = url.replace(/^libsql:\/\//, 'https://')
  return createClient({ url: httpUrl, authToken })
}
