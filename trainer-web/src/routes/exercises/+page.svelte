<script lang="ts">
  import { api } from '$lib/api'
  import type { Exercise } from '$lib/types'
  import { BODY_PARTS } from '$lib/utils'

  let exercises = $state<Exercise[]>([])
  let loading = $state(true)
  let selectedPart = $state<string>('전체')
  let searchQuery = $state('')

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

  $effect(() => {
    loadExercises()
  })

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

  let expandedId = $state<number | null>(null)

  function toggleExpand(id: number) {
    expandedId = expandedId === id ? null : id
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
      >
        {part}
      </button>
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
            <button class="ex-row" onclick={() => toggleExpand(ex.id)}>
              <div class="ex-main">
                <span class="ex-name">{ex.name}</span>
                <span class="chevron" class:open={expandedId === ex.id}>›</span>
              </div>
              {#if expandedId === ex.id && ex.description}
                <p class="ex-desc">{ex.description}</p>
              {/if}
            </button>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .count-badge {
    font-size: 0.8125rem;
    color: var(--text-muted);
    background: var(--surface-2);
    padding: 4px 10px;
    border-radius: 20px;
  }

  .search-wrap {
    padding: 12px 16px 8px;
  }

  .filter-scroll {
    display: flex;
    gap: 8px;
    padding: 0 16px 12px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .filter-scroll::-webkit-scrollbar {
    display: none;
  }

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

  .part-group {
    margin-bottom: 20px;
  }

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
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .part-count {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

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

  .ex-row:active {
    background: var(--surface-2);
  }

  .ex-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .ex-name {
    font-size: 0.9375rem;
    font-weight: 600;
  }

  .chevron {
    color: var(--text-muted);
    font-size: 1.25rem;
    transition: transform 0.2s;
    display: inline-block;
  }

  .chevron.open {
    transform: rotate(90deg);
  }

  .ex-desc {
    font-size: 0.8125rem;
    color: var(--text-muted);
    margin-top: 8px;
    line-height: 1.6;
  }
</style>
