<script lang="ts">
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { api } from '$lib/api'
  import type { Member, WorkoutSession } from '$lib/types'
  import { formatKoreanDate, getMemberInitial } from '$lib/utils'

  const memberId = $derived(Number(page.params.id))

  let member = $state<Member | null>(null)
  let sessions = $state<WorkoutSession[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)

  async function loadData() {
    loading = true
    error = null
    try {
      const [m, s] = await Promise.all([
        api.members.get(memberId),
        api.members.sessions(memberId)
      ])
      member = m
      sessions = s
    } catch {
      error = '회원 정보를 불러오지 못했습니다'
    } finally {
      loading = false
    }
  }

  $effect(() => {
    if (memberId) loadData()
  })

  let totalSessions = $derived(sessions.length)
  let recentSessions = $derived(sessions.slice(0, 20))

  // Group sessions by month
  let byMonth = $derived(() => {
    const map = new Map<string, WorkoutSession[]>()
    for (const s of sessions) {
      const month = s.date.slice(0, 7)
      const arr = map.get(month) ?? []
      arr.push(s)
      map.set(month, arr)
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a))
  })

  function monthLabel(m: string) {
    const [y, mo] = m.split('-')
    return `${y}년 ${parseInt(mo)}월`
  }
</script>

<div class="page">
  <header class="page-header">
    <button class="back-btn" onclick={() => goto('/members')}>‹</button>
    <h1 class="page-title">회원 상세</h1>
    <div style="width:32px"></div>
  </header>

  {#if loading}
    <div class="loading">불러오는 중...</div>
  {:else if error}
    <div class="error-msg">{error}</div>
  {:else if member}
    <!-- Profile -->
    <div class="profile-section">
      <div class="avatar avatar-lg">{getMemberInitial(member.name)}</div>
      <div class="profile-info">
        <h2 class="profile-name">{member.name}</h2>
        {#if member.phone}
          <a href="tel:{member.phone}" class="profile-phone">{member.phone}</a>
        {/if}
      </div>
    </div>

    {#if member.goal || member.memo}
      <div class="section">
        {#if member.goal}
          <div class="info-row">
            <span class="info-label">목표</span>
            <span class="info-value accent">{member.goal}</span>
          </div>
        {/if}
        {#if member.memo}
          <div class="info-row">
            <span class="info-label">메모</span>
            <span class="info-value">{member.memo}</span>
          </div>
        {/if}
      </div>
      <div class="divider"></div>
    {/if}

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-value">{totalSessions}</span>
        <span class="stat-label">총 세션</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">
          {sessions.length > 0 ? formatKoreanDate(sessions[0].date).replace('요일', '') : '-'}
        </span>
        <span class="stat-label">최근 PT</span>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Session history -->
    <div class="section">
      <div class="section-title">운동 기록</div>

      {#if sessions.length === 0}
        <div class="empty-state">
          <span class="empty-icon">📋</span>
          <p>아직 운동 기록이 없습니다</p>
        </div>
      {:else}
        {#each byMonth() as [month, items]}
          <div class="month-group">
            <div class="month-label">{monthLabel(month)}</div>
            {#each items as s (s.id)}
              <a href="/workout/{s.id}" class="session-card">
                <div class="session-date">{formatKoreanDate(s.date)}</div>
                <div class="session-parts">
                  {#each s.body_parts as part}
                    <span class="tag tag-accent">{part}</span>
                  {/each}
                </div>
                {#if s.set_count}
                  <span class="session-sets">{s.set_count}세트</span>
                {/if}
                <span class="chevron">›</span>
              </a>
            {/each}
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .back-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    width: 32px;
  }

  .profile-section {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px 16px;
  }

  .avatar-lg {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--surface-2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--accent);
    flex-shrink: 0;
  }

  .profile-info {
    flex: 1;
  }

  .profile-name {
    font-size: 1.5rem;
    font-weight: 800;
    margin-bottom: 4px;
  }

  .profile-phone {
    font-size: 0.9375rem;
    color: var(--text-muted);
    text-decoration: none;
  }

  .info-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 8px 0;
  }

  .info-label {
    font-size: 0.8125rem;
    color: var(--text-muted);
    min-width: 40px;
    flex-shrink: 0;
    padding-top: 1px;
  }

  .info-value {
    font-size: 0.9375rem;
    flex: 1;
  }

  .info-value.accent {
    color: var(--accent);
    font-weight: 600;
  }

  .stats-row {
    display: flex;
    padding: 16px;
    gap: 0;
  }

  .stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .stat-item + .stat-item {
    border-left: 1px solid var(--border);
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--accent);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .month-group {
    margin-bottom: 20px;
  }

  .month-label {
    font-size: 0.8125rem;
    color: var(--text-muted);
    font-weight: 600;
    margin-bottom: 8px;
  }

  .session-card {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    background: var(--surface);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    margin-bottom: 8px;
    text-decoration: none;
    color: inherit;
    -webkit-tap-highlight-color: transparent;
  }

  .session-card:active {
    opacity: 0.75;
  }

  .session-date {
    font-size: 0.875rem;
    font-weight: 600;
    min-width: 90px;
    flex-shrink: 0;
  }

  .session-parts {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    flex: 1;
  }

  .session-sets {
    font-size: 0.75rem;
    color: var(--text-muted);
    white-space: nowrap;
  }

  .chevron {
    color: var(--text-muted);
    font-size: 1.25rem;
  }
</style>
