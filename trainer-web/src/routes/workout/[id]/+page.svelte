<script lang="ts">
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { api } from '$lib/api'
  import type { Schedule, Exercise, WorkoutSet } from '$lib/types'
  import { BODY_PARTS, toLocalDateString } from '$lib/utils'

  const scheduleId = $derived(Number(page.params.id))

  let schedule = $state<Schedule | null>(null)
  let exercises = $state<Exercise[]>([])
  let loading = $state(true)
  let saving = $state(false)
  let error = $state<string | null>(null)

  // Sets organized per exercise: { exerciseId -> SetRow[] }
  interface SetRow {
    key: number
    weight: string
    reps: string
  }

  let exerciseSets = $state<Map<number, SetRow[]>>(new Map())
  let selectedExercises = $state<number[]>([])
  let showExPicker = $state(false)
  let pickerPart = $state('가슴')

  let nextKey = 0
  function newSetRow(): SetRow {
    return { key: nextKey++, weight: '', reps: '' }
  }

  async function loadData() {
    loading = true
    error = null
    try {
      const [sched, exList] = await Promise.all([
        api.schedules.byDate(toLocalDateString()).then((arr) =>
          arr.find((s) => s.id === scheduleId)
        ),
        api.exercises.list()
      ])

      if (!sched) {
        // Try fetching the workout session directly for "view" mode
        const session = await api.workouts.get(scheduleId)
        exercises = exList
        // Populate from saved sets
        const byEx = new Map<number, SetRow[]>()
        for (const set of session.sets ?? []) {
          const arr = byEx.get(set.exercise_id) ?? []
          arr.push({ key: nextKey++, weight: String(set.weight ?? ''), reps: String(set.reps ?? '') })
          byEx.set(set.exercise_id, arr)
          if (!selectedExercises.includes(set.exercise_id)) {
            selectedExercises = [...selectedExercises, set.exercise_id]
          }
        }
        exerciseSets = byEx
      } else {
        schedule = sched
        exercises = exList
        // Pre-select exercises from schedule's body_parts
        if (sched.body_parts.length > 0) {
          pickerPart = sched.body_parts[0]
        }
      }
    } catch {
      error = '데이터를 불러오지 못했습니다'
    } finally {
      loading = false
    }
  }

  $effect(() => {
    if (scheduleId) loadData()
  })

  function partExercises(part: string) {
    return exercises.filter((e) => e.body_part === part)
  }

  function toggleExercise(exId: number) {
    if (selectedExercises.includes(exId)) {
      selectedExercises = selectedExercises.filter((id) => id !== exId)
      exerciseSets.delete(exId)
      exerciseSets = new Map(exerciseSets)
    } else {
      selectedExercises = [...selectedExercises, exId]
      if (!exerciseSets.has(exId)) {
        exerciseSets = new Map(exerciseSets).set(exId, [newSetRow()])
      }
    }
  }

  function addSet(exId: number) {
    const arr = exerciseSets.get(exId) ?? []
    exerciseSets = new Map(exerciseSets).set(exId, [...arr, newSetRow()])
  }

  function removeSet(exId: number, key: number) {
    const arr = (exerciseSets.get(exId) ?? []).filter((r) => r.key !== key)
    if (arr.length === 0) {
      exerciseSets = new Map(exerciseSets).set(exId, [newSetRow()])
    } else {
      exerciseSets = new Map(exerciseSets).set(exId, arr)
    }
  }

  function updateSet(exId: number, key: number, field: 'weight' | 'reps', val: string) {
    const arr = (exerciseSets.get(exId) ?? []).map((r) =>
      r.key === key ? { ...r, [field]: val } : r
    )
    exerciseSets = new Map(exerciseSets).set(exId, arr)
  }

  async function save() {
    if (selectedExercises.length === 0) {
      alert('운동을 선택해주세요')
      return
    }

    saving = true
    try {
      let sessionId: number

      if (schedule) {
        const res = await api.workouts.create({
          member_id: schedule.member_id,
          date: schedule.scheduled_date,
          body_parts: schedule.body_parts,
          memo: schedule.memo
        })
        sessionId = res.id
        await api.schedules.updateStatus(schedule.id, 'done')
      } else {
        sessionId = scheduleId
      }

      const sets: Omit<WorkoutSet, 'id' | 'session_id'>[] = []
      for (const exId of selectedExercises) {
        const rows = exerciseSets.get(exId) ?? []
        rows.forEach((row, idx) => {
          sets.push({
            exercise_id: exId,
            set_number: idx + 1,
            weight: row.weight ? Number(row.weight) : undefined,
            reps: row.reps ? Number(row.reps) : undefined
          })
        })
      }

      await api.workouts.saveSets(sessionId, sets)
      goto('/')
    } catch {
      alert('저장에 실패했습니다')
    } finally {
      saving = false
    }
  }

  function exName(id: number) {
    return exercises.find((e) => e.id === id)?.name ?? ''
  }
</script>

<div class="page">
  <header class="page-header">
    <button class="back-btn" onclick={() => goto('/')}>‹</button>
    <h1 class="page-title">운동 기록</h1>
    <div style="width:32px"></div>
  </header>

  {#if loading}
    <div class="loading">불러오는 중...</div>
  {:else if error}
    <div class="error-msg">{error}</div>
  {:else}
    {#if schedule}
      <div class="session-info">
        <span class="info-name">{schedule.member_name}</span>
        <div class="info-parts">
          {#each schedule.body_parts as part}
            <span class="tag tag-accent">{part}</span>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Exercise selector -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">운동 선택</span>
        <button class="btn btn-ghost btn-sm" onclick={() => (showExPicker = !showExPicker)}>
          {showExPicker ? '접기' : '+ 운동 추가'}
        </button>
      </div>

      {#if showExPicker}
        <div class="ex-picker">
          <div class="filter-scroll">
            {#each BODY_PARTS as part}
              <button
                class="filter-chip"
                class:active={pickerPart === part}
                onclick={() => (pickerPart = part)}
              >
                {part}
              </button>
            {/each}
          </div>
          <div class="ex-grid">
            {#each partExercises(pickerPart) as ex (ex.id)}
              <button
                class="ex-chip"
                class:selected={selectedExercises.includes(ex.id)}
                onclick={() => toggleExercise(ex.id)}
              >
                {ex.name}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Sets per exercise -->
    {#if selectedExercises.length > 0}
      <div class="section">
        {#each selectedExercises as exId (exId)}
          <div class="ex-block">
            <div class="ex-block-header">
              <span class="ex-block-name">{exName(exId)}</span>
              <button class="btn-icon small" onclick={() => toggleExercise(exId)}>✕</button>
            </div>

            <div class="sets-header">
              <span>세트</span>
              <span>무게 (kg)</span>
              <span>횟수</span>
              <span></span>
            </div>

            {#each exerciseSets.get(exId) ?? [] as row, i (row.key)}
              <div class="set-row">
                <span class="set-num">{i + 1}</span>
                <input
                  type="number"
                  class="set-input"
                  placeholder="0"
                  min="0"
                  step="0.5"
                  value={row.weight}
                  oninput={(e) => updateSet(exId, row.key, 'weight', (e.target as HTMLInputElement).value)}
                />
                <input
                  type="number"
                  class="set-input"
                  placeholder="0"
                  min="0"
                  value={row.reps}
                  oninput={(e) => updateSet(exId, row.key, 'reps', (e.target as HTMLInputElement).value)}
                />
                <button class="remove-set" onclick={() => removeSet(exId, row.key)}>−</button>
              </div>
            {/each}

            <button class="add-set-btn" onclick={() => addSet(exId)}>+ 세트 추가</button>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-state" style="padding: 32px 16px">
        <p>위에서 운동을 선택하세요</p>
      </div>
    {/if}

    {#if selectedExercises.length > 0}
      <div class="save-area">
        <button class="btn btn-primary btn-full" onclick={save} disabled={saving}>
          {saving ? '저장 중...' : '기록 저장'}
        </button>
      </div>
    {/if}
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

  .session-info {
    padding: 14px 16px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .info-name {
    font-size: 1rem;
    font-weight: 700;
  }

  .info-parts {
    display: flex;
    gap: 4px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .ex-picker {
    background: var(--surface);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    padding: 12px;
    margin-bottom: 12px;
  }

  .filter-scroll {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    scrollbar-width: none;
    margin-bottom: 10px;
  }

  .filter-scroll::-webkit-scrollbar {
    display: none;
  }

  .filter-chip {
    padding: 5px 12px;
    border-radius: 20px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-muted);
    font-size: 0.8125rem;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
  }

  .filter-chip.active {
    background: var(--accent-dim);
    border-color: var(--accent);
    color: var(--accent);
  }

  .ex-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .ex-chip {
    padding: 7px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text-muted);
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .ex-chip.selected {
    background: var(--accent-dim);
    border-color: var(--accent);
    color: var(--accent);
  }

  .ex-block {
    background: var(--surface);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    padding: 14px;
    margin-bottom: 12px;
  }

  .ex-block-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .ex-block-name {
    font-size: 1rem;
    font-weight: 700;
  }

  .btn-icon.small {
    width: 24px;
    height: 24px;
    font-size: 0.875rem;
  }

  .sets-header {
    display: grid;
    grid-template-columns: 32px 1fr 1fr 32px;
    gap: 8px;
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-bottom: 6px;
    text-align: center;
  }

  .set-row {
    display: grid;
    grid-template-columns: 32px 1fr 1fr 32px;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }

  .set-num {
    font-size: 0.875rem;
    color: var(--text-muted);
    text-align: center;
    font-weight: 600;
  }

  .set-input {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 8px;
    color: var(--text);
    font-size: 1rem;
    text-align: center;
    outline: none;
    width: 100%;
  }

  .set-input:focus {
    border-color: var(--accent);
  }

  .remove-set {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1.25rem;
    cursor: pointer;
    text-align: center;
    line-height: 1;
    padding: 0;
  }

  .add-set-btn {
    width: 100%;
    background: none;
    border: 1px dashed var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    padding: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    margin-top: 4px;
    transition: border-color 0.15s, color 0.15s;
  }

  .add-set-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .save-area {
    padding: 0 16px 24px;
  }
</style>
