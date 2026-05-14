<script lang="ts">
  import { api } from '$lib/api'
  import type { Schedule, Member } from '$lib/types'
  import {
    toLocalDateString,
    formatKoreanDate,
    formatTime,
    STATUS_LABELS,
    BODY_PARTS,
    currentYearMonth
  } from '$lib/utils'

  let month = $state(currentYearMonth())
  let schedules = $state<Schedule[]>([])
  let members = $state<Member[]>([])
  let loading = $state(true)
  let showModal = $state(false)
  let editTarget = $state<Schedule | null>(null)
  let submitting = $state(false)

  // Form state
  let form = $state({
    member_id: 0,
    scheduled_date: toLocalDateString(),
    start_time: '10:00',
    duration_min: 60,
    body_parts: [] as string[],
    memo: ''
  })

  async function loadData() {
    loading = true
    try {
      const [s, m] = await Promise.all([api.schedules.list(month), api.members.list()])
      schedules = s
      members = m
    } catch {
      /* ignore */
    } finally {
      loading = false
    }
  }

  $effect(() => {
    loadData()
  })

  function openCreate() {
    editTarget = null
    form = {
      member_id: members[0]?.id ?? 0,
      scheduled_date: toLocalDateString(),
      start_time: '10:00',
      duration_min: 60,
      body_parts: [],
      memo: ''
    }
    showModal = true
  }

  function openEdit(s: Schedule) {
    editTarget = s
    form = {
      member_id: s.member_id,
      scheduled_date: s.scheduled_date,
      start_time: s.start_time,
      duration_min: s.duration_min,
      body_parts: [...s.body_parts],
      memo: s.memo ?? ''
    }
    showModal = true
  }

  function toggleBodyPart(part: string) {
    if (form.body_parts.includes(part)) {
      form.body_parts = form.body_parts.filter((p) => p !== part)
    } else {
      form.body_parts = [...form.body_parts, part]
    }
  }

  async function submit() {
    if (!form.member_id || !form.scheduled_date || !form.start_time) return
    submitting = true
    try {
      const payload = { ...form, memo: form.memo || undefined }
      if (editTarget) {
        await api.schedules.update(editTarget.id, payload)
      } else {
        await api.schedules.create(payload)
      }
      showModal = false
      await loadData()
    } catch {
      alert('저장에 실패했습니다')
    } finally {
      submitting = false
    }
  }

  async function deleteSchedule(id: number) {
    if (!confirm('일정을 삭제할까요?')) return
    try {
      await api.schedules.delete(id)
      await loadData()
    } catch {
      alert('삭제에 실패했습니다')
    }
  }

  // Group by date
  let grouped = $derived(() => {
    const map = new Map<string, Schedule[]>()
    for (const s of schedules) {
      const arr = map.get(s.scheduled_date) ?? []
      arr.push(s)
      map.set(s.scheduled_date, arr)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  })

  function monthLabel(m: string) {
    const [y, mo] = m.split('-')
    return `${y}년 ${parseInt(mo)}월`
  }

  function prevMonth() {
    const [y, m2] = month.split('-').map(Number)
    const d = new Date(y, m2 - 2, 1)
    month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  function nextMonth() {
    const [y, m2] = month.split('-').map(Number)
    const d = new Date(y, m2, 1)
    month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  function statusClass(status: string) {
    return `status-${status}`
  }
</script>

<div class="page">
  <header class="page-header">
    <h1 class="page-title">일정</h1>
    <button class="btn btn-primary btn-sm" onclick={openCreate}>+ 추가</button>
  </header>

  <div class="month-nav">
    <button class="btn-icon" onclick={prevMonth}>‹</button>
    <span class="month-label">{monthLabel(month)}</span>
    <button class="btn-icon" onclick={nextMonth}>›</button>
  </div>

  {#if loading}
    <div class="loading">불러오는 중...</div>
  {:else if schedules.length === 0}
    <div class="empty-state">
      <span class="empty-icon">📅</span>
      <p>이 달 일정이 없습니다</p>
    </div>
  {:else}
    <div class="section">
      {#each grouped() as [date, items]}
        <div class="date-group">
          <div class="date-label">{formatKoreanDate(date)}</div>
          {#each items as s (s.id)}
            <div class="schedule-row card">
              <div class="row-left">
                <span class="row-time">{formatTime(s.start_time)}</span>
                <div>
                  <div class="row-name">{s.member_name}</div>
                  {#if s.body_parts.length > 0}
                    <div class="tags">
                      {#each s.body_parts as part}
                        <span class="tag">{part}</span>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
              <div class="row-right">
                <span class="status-badge {statusClass(s.status)}">{STATUS_LABELS[s.status]}</span>
                <div class="row-actions">
                  <button class="btn-icon" onclick={() => openEdit(s)}>✏️</button>
                  <button class="btn-icon" onclick={() => deleteSchedule(s.id)}>🗑️</button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if showModal}
  <div class="modal-overlay" role="dialog" aria-modal="true">
    <div class="modal">
      <div class="modal-handle"></div>
      <div class="modal-header">
        <h2 class="modal-title">{editTarget ? '일정 수정' : '일정 추가'}</h2>
        <button class="modal-close" onclick={() => (showModal = false)}>✕</button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); submit() }}>
        <div class="form-group">
          <label class="form-label" for="member">회원</label>
          <select id="member" class="form-select" bind:value={form.member_id}>
            {#each members as m}
              <option value={m.id}>{m.name}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="date">날짜</label>
          <input id="date" type="date" class="form-input" bind:value={form.scheduled_date} />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="time">시작 시간</label>
            <input id="time" type="time" class="form-input" bind:value={form.start_time} />
          </div>
          <div class="form-group">
            <label class="form-label" for="dur">시간(분)</label>
            <input id="dur" type="number" class="form-input" bind:value={form.duration_min} min="10" max="180" step="10" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">운동 부위</label>
          <div class="chip-group">
            {#each BODY_PARTS as part}
              <button
                type="button"
                class="chip"
                class:selected={form.body_parts.includes(part)}
                onclick={() => toggleBodyPart(part)}
              >
                {part}
              </button>
            {/each}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="memo">메모</label>
          <textarea id="memo" class="form-textarea" bind:value={form.memo} placeholder="특이사항, 주의사항 등"></textarea>
        </div>

        <button type="submit" class="btn btn-primary btn-full" disabled={submitting}>
          {submitting ? '저장 중...' : '저장'}
        </button>
      </form>
    </div>
  </div>
{/if}

<style>
  .month-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
  }

  .month-label {
    font-size: 1rem;
    font-weight: 700;
    min-width: 100px;
    text-align: center;
  }

  .date-group {
    margin-bottom: 20px;
  }

  .date-label {
    font-size: 0.8125rem;
    color: var(--text-muted);
    font-weight: 600;
    margin-bottom: 8px;
  }

  .schedule-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }

  .row-left {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .row-time {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--accent);
    white-space: nowrap;
    margin-top: 2px;
  }

  .row-name {
    font-size: 0.9375rem;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .row-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    flex-shrink: 0;
  }

  .row-actions {
    display: flex;
    gap: 4px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
</style>
