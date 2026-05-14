<script lang="ts">
  import '../app.css'
  import { page } from '$app/state'

  const tabs = [
    { href: '/', icon: '🏠', label: '홈' },
    { href: '/schedule', icon: '📅', label: '일정' },
    { href: '/members', icon: '👥', label: '회원' },
    { href: '/exercises', icon: '💪', label: '운동' }
  ]

  let { children } = $props()

  function isActive(href: string) {
    if (href === '/') return page.url.pathname === '/'
    return page.url.pathname.startsWith(href)
  }
</script>

<div class="app">
  <main class="main-content">
    {@render children()}
  </main>

  <nav class="bottom-nav">
    {#each tabs as tab}
      <a href={tab.href} class="tab-item" class:active={isActive(tab.href)}>
        <span class="tab-icon">{tab.icon}</span>
        <span class="tab-label">{tab.label}</span>
      </a>
    {/each}
  </nav>
</div>

<style>
  .app {
    max-width: 430px;
    margin: 0 auto;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    position: relative;
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 64px;
  }

  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 430px;
    display: flex;
    background: var(--surface);
    border-top: 1px solid var(--border);
    height: 60px;
    z-index: 100;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    text-decoration: none;
    color: var(--text-muted);
    transition: color 0.15s;
    -webkit-tap-highlight-color: transparent;
  }

  .tab-item.active {
    color: var(--accent);
  }

  .tab-icon {
    font-size: 1.25rem;
    line-height: 1;
  }

  .tab-label {
    font-size: 0.6875rem;
    font-weight: 500;
  }
</style>
