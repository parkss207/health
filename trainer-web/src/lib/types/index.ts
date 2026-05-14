export interface Member {
  id: number
  name: string
  phone?: string
  goal?: string
  memo?: string
  created_at: string
}

export interface Exercise {
  id: number
  name: string
  body_part: string
  description?: string
}

export interface WorkoutSession {
  id: number
  member_id: number
  member_name?: string
  date: string
  body_parts: string[]
  memo?: string
  created_at: string
  set_count?: number
  sets?: WorkoutSet[]
}

export interface WorkoutSet {
  id: number
  session_id: number
  exercise_id: number
  exercise_name?: string
  body_part?: string
  set_number: number
  weight?: number
  reps?: number
  memo?: string
}

export interface Schedule {
  id: number
  member_id: number
  member_name?: string
  member_phone?: string
  scheduled_date: string
  start_time: string
  duration_min: number
  body_parts: string[]
  memo?: string
  status: 'scheduled' | 'inprogress' | 'done' | 'cancelled'
  created_at: string
}
