<script lang="ts">
  import { api } from '$lib/api'
  import type { Exercise } from '$lib/types'
  import { BODY_PARTS } from '$lib/utils'

  let exercises = $state<Exercise[]>([])
  let loading = $state(true)
  let selectedPart = $state<string>('전체')
  let searchQuery = $state('')
  let selected = $state<Exercise | null>(null)

  async function loadExercises() {
    loading = true
    try {
      exercises = await api.exercises.list()
    } catch {
      /* ignore */
    } finally {
      loading = false
    }
  }

  $effect(() => { loadExercises() })

  let filtered = $derived(
    exercises.filter((e) => {
      const matchPart = selectedPart === '전체' || e.body_part === selectedPart
      const matchSearch =
        searchQuery === '' ||
        e.name.includes(searchQuery) ||
        (e.description ?? '').includes(searchQuery)
      return matchPart && matchSearch
    })
  )

  let grouped = $derived(() => {
    if (selectedPart !== '전체') return [[selectedPart, filtered] as [string, Exercise[]]]
    const map = new Map<string, Exercise[]>()
    for (const e of filtered) {
      const arr = map.get(e.body_part) ?? []
      arr.push(e)
      map.set(e.body_part, arr)
    }
    return [...map.entries()]
  })

  const ALL_PARTS = ['전체', ...BODY_PARTS]

  const DIFFICULTY_COLOR: Record<string, string> = {
    '초급': 'green',
    '중급': 'orange',
    '고급': 'red'
  }
</script>

<div class="page">
  <header class="page-header">
    <h1 class="page-title">운동 가이드</h1>
    <span class="count-badge">{exercises.length}종목</span>
  </header>

  <div class="search-wrap">
    <input
      type="search"
      class="form-input"
      placeholder="운동 이름 검색"
      bind:value={searchQuery}
    />
  </div>

  <div class="filter-scroll">
    {#each ALL_PARTS as part}
      <button
        class="filter-chip"
        class:active={selectedPart === part}
        onclick={() => (selectedPart = part)}
      >{part}</button>
    {/each}
  </div>

  {#if loading}
    <div class="loading">불러오는 중...</div>
  {:else if filtered.length === 0}
    <div class="empty-state">
      <span class="empty-icon">🔍</span>
      <p>검색 결과가 없습니다</p>
    </div>
  {:else}
    <div class="section">
      {#each grouped() as [part, items]}
        <div class="part-group">
          <div class="part-header">
            <span class="part-name">{part}</span>
            <span class="part-count">{items.length}개</span>
          </div>
          {#each items as ex (ex.id)}
            <button class="ex-row" onclick={() => (selected = ex)}>
              <div class="ex-main">
                <div class="ex-info">
                  <span class="ex-name">{ex.name}</span>
                  {#if ex.muscles}
                    <span class="ex-muscles">{ex.muscles.split(',')[0].trim()} 외</span>
                  {/if}
                </div>
                <div class="ex-right">
                  {#if ex.difficulty}
                    <span class="diff-badge diff-{DIFFICULTY_COLOR[ex.difficulty] ?? 'orange'}">{ex.difficulty}</span>
                  {/if}
                  <span class="chevron">›</span>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- 바텀시트 -->
{#if selected}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="sheet-backdrop" onclick={() => (selected = null)}></div>
  <div class="sheet">
    <div class="sheet-handle"></div>

    <div class="sheet-header">
      <div class="sheet-title-row">
        <h2 class="sheet-title">{selected.name}</h2>
        <span class="part-tag">{selected.body_part}</span>
        {#if selected.difficulty}
          <span class="diff-badge diff-{DIFFICULTY_COLOR[selected.difficulty] ?? 'orange'}">{selected.difficulty}</span>
        {/if}
      </div>
      <button class="sheet-close" onclick={() => (selected = null)}>✕</button>
    </div>

    <div class="sheet-body">
      {#if selected.description}
        <div class="info-block">
          <div class="info-label">📋 수행 방법</div>
          <p class="info-text">{selected.description}</p>
        </div>
      {/if}

      {#if selected.muscles}
        <div class="info-block">
          <div class="info-label">💪 주요 근육</div>
          <div class="muscle-tags">
            {#each selected.muscles.split(',') as m}
              <span class="muscle-tag">{m.trim()}</span>
            {/each}
          </div>
        </div>
      {/if}

      {#if selected.tips}
        <div class="info-block">
          <div class="info-label">⚠️ 주의사항</div>
          <ul class="tips-list">
            {#each selected.tips.split('\n') as tip}
              <li class="tip-item">{tip.replace(/^[①②③]\s*/, '')}</li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if selected.video_url}
        <a class="video-btn" href={selected.video_url} target="_blank" rel="noopener">
          ▶ 영상으로 보기
        </a>
      {/if}
    </div>
  </div>
{/if}

<style>
  .count-badge {
    font-size: 0.8125rem;
    color: var(--text-muted);
    background: var(--surface-2);
    padding: 4px 10px;
    border-radius: 20px;
  }

  .search-wrap { padding: 12px 16px 8px; }

  .filter-scroll {
    display: flex;
    gap: 8px;
    padding: 0 16px 12px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .filter-scroll::-webkit-scrollbar { display: none; }

  .filter-chip {
    padding: 6px 14px;
    border-radius: 20px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-muted);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
  }
  .filter-chip.active {
    background: var(--accent-dim);
    border-color: var(--accent);
    color: var(--accent);
  }

  .part-group { margin-bottom: 20px; }
  .part-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .part-name {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 0.05em;
  }
  .part-count { font-size: 0.75rem; color: var(--text-muted); }

  .ex-row {
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 12px 14px;
    text-align: left;
    cursor: pointer;
    color: var(--text);
    margin-bottom: 6px;
    transition: background 0.1s;
  }
  .ex-row:active { background: var(--surface-2); }

  .ex-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .ex-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  .ex-name { font-size: 0.9375rem; font-weight: 600; }
  .ex-muscles { font-size: 0.75rem; color: var(--text-muted); }
  .ex-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

  .diff-badge {
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
  }
  .diff-green  { background: #dcfce7; color: #16a34a; }
  .diff-orange { background: #ffedd5; color: #ea580c; }
  .diff-red    { background: #fee2e2; color: #dc2626; }

  .chevron { color: var(--text-muted); font-size: 1.25rem; }

  /* 바텀시트 */
  .sheet-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 100;
  }
  .sheet {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: var(--surface);
    border-radius: 20px 20px 0 0;
    z-index: 101;
    max-height: 80vh;
    overflow-y: auto;
    padding-bottom: env(safe-area-inset-bottom, 16px);
  }
  .sheet-handle {
    width: 40px; height: 4px;
    background: var(--border);
    border-radius: 2px;
    margin: 12px auto 0;
  }
  .sheet-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 16px 20px 12px;
    border-bottom: 1px solid var(--border);
    gap: 12px;
  }
  .sheet-title-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    flex: 1;
  }
  .sheet-title { font-size: 1.125rem; font-weight: 700; margin: 0; }
  .part-tag {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 12px;
    background: var(--accent-dim);
    color: var(--accent);
  }
  .sheet-close {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1.1rem;
    cursor: pointer;
    padding: 4px;
    flex-shrink: 0;
  }

  .sheet-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 20px; }

  .info-block { display: flex; flex-direction: column; gap: 8px; }
  .info-label { font-size: 0.8125rem; font-weight: 700; color: var(--text-muted); }
  .info-text {
    font-size: 0.9375rem;
    line-height: 1.7;
    color: var(--text);
    margin: 0;
  }
  .tips-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .tip-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: var(--surface-2);
    border-left: 3px solid #f59e0b;
    border-radius: 0 8px 8px 0;
    padding: 10px 12px;
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--text);
  }
  .tip-item::before {
    content: counter(tip-counter);
    counter-increment: tip-counter;
    background: #f59e0b;
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .tips-list {
    counter-reset: tip-counter;
  }

  .muscle-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .muscle-tag {
    font-size: 0.8125rem;
    padding: 4px 12px;
    background: var(--surface-2);
    border-radius: 20px;
    color: var(--text);
  }

  .video-btn {
    display: block;
    text-align: center;
    padding: 12px;
    background: var(--accent);
    color: white;
    border-radius: var(--radius-sm);
    font-weight: 600;
    font-size: 0.9375rem;
    text-decoration: none;
  }
</style>
