<script lang="ts">
  import { api } from '$lib/api'
  import type { Member } from '$lib/types'
  import { getMemberInitial } from '$lib/utils'

  let members = $state<Member[]>([])
  let loading = $state(true)
  let showModal = $state(false)
  let editTarget = $state<Member | null>(null)
  let submitting = $state(false)
  let searchQuery = $state('')

  let form = $state({ name: '', phone: '', goal: '', memo: '' })

  async function loadMembers() {
    loading = true
    try {
      members = await api.members.list()
    } catch {
      /* ignore */
    } finally {
      loading = false
    }
  }

  $effect(() => {
    loadMembers()
  })

  let filtered = $derived(
    members.filter(
      (m) =>
        searchQuery === '' ||
        m.name.includes(searchQuery) ||
        (m.phone ?? '').includes(searchQuery)
    )
  )

  function openCreate() {
    editTarget = null
    form = { name: '', phone: '', goal: '', memo: '' }
    showModal = true
  }

  function openEdit(m: Member) {
    editTarget = m
    form = { name: m.name, phone: m.phone ?? '', goal: m.goal ?? '', memo: m.memo ?? '' }
    showModal = true
  }

  async function submit() {
    if (!form.name.trim()) return
    submitting = true
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone || undefined,
        goal: form.goal || undefined,
        memo: form.memo || undefined
      }
      if (editTarget) {
        await api.members.update(editTarget.id, payload)
      } else {
        await api.members.create(payload)
      }
      showModal = false
      await loadMembers()
    } catch {
      alert('저장에 실패했습니다')
    } finally {
      submitting = false
    }
  }

  async function deleteMember(id: number, name: string) {
    if (!confirm(`${name} 회원을 삭제할까요?`)) return
    try {
      await api.members.delete(id)
      await loadMembers()
    } catch {
      alert('삭제에 실패했습니다')
    }
  }
</script>

<div class="page">
  <header class="page-header">
    <h1 class="page-title">회원</h1>
    <button class="btn btn-primary btn-sm" onclick={openCreate}>+ 추가</button>
  </header>

  <div class="search-wrap">
    <input
      type="search"
      class="form-input"
      placeholder="이름, 연락처 검색"
      bind:value={searchQuery}
    />
  </div>

  {#if loading}
    <div class="loading">불러오는 중...</div>
  {:else if filtered.length === 0}
    <div class="empty-state">
      <span class="empty-icon">👥</span>
      <p>{searchQuery ? '검색 결과가 없습니다' : '등록된 회원이 없습니다'}</p>
    </div>
  {:else}
    <div class="member-list">
      {#each filtered as m (m.id)}
        <a href="/members/{m.id}" class="member-card">
          <div class="avatar">{getMemberInitial(m.name)}</div>
          <div class="member-info">
            <div class="member-name">{m.name}</div>
            {#if m.phone}
              <div class="member-sub">{m.phone}</div>
            {/if}
            {#if m.goal}
              <div class="member-goal">{m.goal}</div>
            {/if}
          </div>
          <div class="member-actions">
            <button
              class="btn-icon"
              onclick={(e) => { e.preventDefault(); openEdit(m) }}
              aria-label="수정"
            >✏️</button>
            <button
              class="btn-icon"
              onclick={(e) => { e.preventDefault(); deleteMember(m.id, m.name) }}
              aria-label="삭제"
            >🗑️</button>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

{#if showModal}
  <div class="modal-overlay" role="dialog" aria-modal="true">
    <div class="modal">
      <div class="modal-handle"></div>
      <div class="modal-header">
        <h2 class="modal-title">{editTarget ? '회원 수정' : '회원 추가'}</h2>
        <button class="modal-close" onclick={() => (showModal = false)}>✕</button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); submit() }}>
        <div class="form-group">
          <label class="form-label" for="name">이름 <span class="required">*</span></label>
          <input id="name" type="text" class="form-input" bind:value={form.name} placeholder="홍길동" required />
        </div>

        <div class="form-group">
          <label class="form-label" for="phone">연락처</label>
          <input id="phone" type="tel" class="form-input" bind:value={form.phone} placeholder="010-0000-0000" />
        </div>

        <div class="form-group">
          <label class="form-label" for="goal">목표</label>
          <input id="goal" type="text" class="form-input" bind:value={form.goal} placeholder="체중감량, 근력 향상 등" />
        </div>

        <div class="form-group">
          <label class="form-label" for="memo">메모</label>
          <textarea id="memo" class="form-textarea" bind:value={form.memo} placeholder="부상 이력, 주의사항 등"></textarea>
        </div>

        <button type="submit" class="btn btn-primary btn-full" disabled={submitting || !form.name.trim()}>
          {submitting ? '저장 중...' : '저장'}
        </button>
      </form>
    </div>
  </div>
{/if}

<style>
  .search-wrap {
    padding: 12px 16px 8px;
  }

  .member-list {
    display: flex;
    flex-direction: column;
  }

  .member-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
    text-decoration: none;
    color: inherit;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.1s;
  }

  .member-card:active {
    background: var(--surface);
  }

  .member-info {
    flex: 1;
    min-width: 0;
  }

  .member-name {
    font-size: 1rem;
    font-weight: 700;
  }

  .member-sub {
    font-size: 0.8125rem;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .member-goal {
    font-size: 0.8125rem;
    color: var(--accent);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .member-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .required {
    color: var(--danger);
  }
</style>
