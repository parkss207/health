<script lang="ts">
  import { api } from '$lib/api'
  import type { Schedule } from '$lib/types'
  import { toLocalDateString, formatKoreanDate, formatTime, STATUS_LABELS } from '$lib/utils'
  import { goto } from '$app/navigation'

  let selectedDate = $state(toLocalDateString())
  let schedules = $state<Schedule[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let updatingId = $state<number | null>(null)

  async function loadSchedules() {
    loading = true
    error = null
    try {
      schedules = await api.schedules.byDate(selectedDate)
    } catch {
      error = '일정을 불러오지 못했습니다'
    } finally {
      loading = false
    }
  }

  $effect(() => {
    loadSchedules()
  })

  function dateLabel(dateStr: string) {
    const today = toLocalDateString()
    const tomorrow = toLocalDateString(new Date(Date.now() + 86400000))
    if (dateStr === today) return '오늘'
    if (dateStr === tomorrow) return '내일'
    return formatKoreanDate(dateStr)
  }

  async function updateStatus(id: number, status: Schedule['status']) {
    updatingId = id
    try {
      await api.schedules.updateStatus(id, status)
      await loadSchedules()
    } catch {
      alert('상태 변경에 실패했습니다')
    } finally {
      updatingId = null
    }
  }

  function statusClass(status: string) {
    return `status-${status}`
  }
</script>

<div class="page">
  <header class="page-header">
    <div>
      <h1 class="page-title">Trainer Pro</h1>
      <p class="page-subtitle">{dateLabel(selectedDate)} PT</p>
    </div>
    <input type="date" bind:value={selectedDate} class="date-input" />
  </header>

  <div class="section">
    {#if loading}
      <div class="loading">불러오는 중...</div>
    {:else if error}
      <div class="error-msg">{error}</div>
    {:else if schedules.length === 0}
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <p>예정된 PT 일정이 없습니다</p>
        <a href="/schedule" class="btn btn-secondary btn-sm">일정 추가하기</a>
      </div>
    {:else}
      <div class="schedule-list">
        {#each schedules as s (s.id)}
          <div class="schedule-card" class:done={s.status === 'done'}>
            <div class="time-col">
              <span class="time">{formatTime(s.start_time)}</span>
              <span class="duration">{s.duration_min}분</span>
            </div>

            <div class="info-col">
              <div class="member-row">
                <span class="member-name">{s.member_name}</span>
                <span class="status-badge {statusClass(s.status)}">
                  {STATUS_LABELS[s.status]}
                </span>
              </div>
              {#if s.body_parts.length > 0}
                <div class="tags">
                  {#each s.body_parts as part}
                    <span class="tag tag-accent">{part}</span>
                  {/each}
                </div>
              {/if}
              {#if s.memo}
                <p class="memo-text">{s.memo}</p>
              {/if}

              <div class="action-row">
                {#if s.status === 'scheduled'}
                  <button
                    class="btn btn-primary btn-sm"
                    disabled={updatingId === s.id}
                    onclick={() => updateStatus(s.id, 'inprogress')}
                  >
                    시작
                  </button>
                {:else if s.status === 'inprogress'}
                  <a href="/workout/{s.id}" class="btn btn-primary btn-sm">기록 입력</a>
                  <button
                    class="btn btn-ghost btn-sm"
                    disabled={updatingId === s.id}
                    onclick={() => updateStatus(s.id, 'done')}
                  >
                    완료
                  </button>
                {:else if s.status === 'done'}
                  <a href="/workout/{s.id}" class="btn btn-ghost btn-sm">기록 보기</a>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .schedule-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .schedule-card {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 14px;
    border: 1px solid var(--border);
    display: flex;
    gap: 14px;
    transition: opacity 0.2s;
  }

  .schedule-card.done {
    opacity: 0.55;
  }

  .time-col {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 70px;
    flex-shrink: 0;
    padding-top: 2px;
  }

  .time {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--accent);
    white-space: nowrap;
  }

  .duration {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .info-col {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .member-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .member-name {
    font-size: 1rem;
    font-weight: 700;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .memo-text {
    font-size: 0.8125rem;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .action-row {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }
</style>
