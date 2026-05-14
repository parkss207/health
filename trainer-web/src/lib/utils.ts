export const BODY_PARTS = ['가슴', '등', '하체', '어깨', '팔', '복근', '유산소'] as const
export type BodyPart = (typeof BODY_PARTS)[number]

export const STATUS_LABELS: Record<string, string> = {
  scheduled: '예정',
  inprogress: '진행중',
  done: '완료',
  cancelled: '취소'
}

export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatKoreanDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  }).format(date)
}

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h < 12 ? '오전' : '오후'
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${period} ${displayHour}:${String(m).padStart(2, '0')}`
}

export function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getMemberInitial(name: string): string {
  return name.charAt(0)
}
