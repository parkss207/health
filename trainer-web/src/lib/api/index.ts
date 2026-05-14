import type { Member, Exercise, WorkoutSession, WorkoutSet, Schedule } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  members: {
    list: () => request<Member[]>('/api/members'),
    get: (id: number) => request<Member>(`/api/members/${id}`),
    create: (data: Omit<Member, 'id' | 'created_at'>) =>
      request<{ id: number }>('/api/members', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: number, data: Partial<Omit<Member, 'id' | 'created_at'>>) =>
      request<{ success: boolean }>(`/api/members/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/api/members/${id}`, { method: 'DELETE' }),
    sessions: (id: number) => request<WorkoutSession[]>(`/api/members/${id}/sessions`)
  },

  exercises: {
    list: (bodyPart?: string) =>
      request<Exercise[]>(
        `/api/exercises${bodyPart ? `?body_part=${encodeURIComponent(bodyPart)}` : ''}`
      ),
    get: (id: number) => request<Exercise>(`/api/exercises/${id}`)
  },

  workouts: {
    list: (memberId?: number) =>
      request<WorkoutSession[]>(
        `/api/workouts${memberId ? `?member_id=${memberId}` : ''}`
      ),
    get: (id: number) =>
      request<WorkoutSession & { sets: WorkoutSet[] }>(`/api/workouts/${id}`),
    create: (data: { member_id: number; date: string; body_parts: string[]; memo?: string }) =>
      request<{ id: number }>('/api/workouts', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    saveSets: (sessionId: number, sets: Omit<WorkoutSet, 'id' | 'session_id'>[]) =>
      request<{ success: boolean }>(`/api/workouts/${sessionId}/sets`, {
        method: 'POST',
        body: JSON.stringify({ sets })
      }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/api/workouts/${id}`, { method: 'DELETE' })
  },

  schedules: {
    today: () => request<Schedule[]>('/api/schedules/today'),
    byDate: (date: string) => request<Schedule[]>(`/api/schedules/date/${date}`),
    list: (month?: string) =>
      request<Schedule[]>(`/api/schedules${month ? `?month=${month}` : ''}`),
    create: (
      data: Omit<Schedule, 'id' | 'created_at' | 'member_name' | 'member_phone' | 'status'>
    ) =>
      request<{ id: number }>('/api/schedules', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: number, data: Partial<Omit<Schedule, 'id' | 'created_at' | 'member_name' | 'member_phone'>>) =>
      request<{ success: boolean }>(`/api/schedules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    updateStatus: (id: number, status: Schedule['status']) =>
      request<{ success: boolean }>(`/api/schedules/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/api/schedules/${id}`, { method: 'DELETE' })
  }
}
