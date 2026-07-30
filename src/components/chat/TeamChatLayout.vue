<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="team-chat">
    <aside class="team-chat__sidebar">
      <div class="team-chat__sidebar-head">
        <p class="team-chat__sidebar-label">Canales</p>
      </div>
      <nav class="team-chat__sidebar-nav">
        <slot name="sidebar" />
      </nav>
    </aside>

    <main class="team-chat__main">
      <header class="team-chat__header">
        <slot name="header-icon" />
        <div class="team-chat__header-text">
          <h2 class="team-chat__title">{{ title }}</h2>
          <p v-if="subtitle" class="team-chat__subtitle">{{ subtitle }}</p>
        </div>
        <slot name="header-actions" />
      </header>

      <div class="team-chat__messages scroll-thin">
        <slot />
      </div>

      <footer class="team-chat__footer">
        <slot name="composer" />
      </footer>
    </main>
  </div>
</template>

<style scoped>
.team-chat {
  display: flex;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid rgba(9, 30, 66, 0.08);
  background: #fff;
  box-shadow:
    0 1px 2px rgba(9, 30, 66, 0.04),
    0 8px 32px rgba(23, 43, 77, 0.06);
}

.team-chat__sidebar {
  display: none;
  width: 13.5rem;
  flex-shrink: 0;
  flex-direction: column;
  border-right: 1px solid rgba(9, 30, 66, 0.08);
  background: linear-gradient(180deg, #f3f4f8 0%, #eceef4 100%);
}

@media (min-width: 768px) {
  .team-chat__sidebar {
    display: flex;
  }
}

.team-chat__sidebar-head {
  padding: 1rem 1rem 0.625rem;
}

.team-chat__sidebar-label {
  margin: 0;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #626f86;
}

.team-chat__sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0 0.5rem 0.75rem;
}

.team-chat__main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.team-chat__header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid rgba(9, 30, 66, 0.08);
  background: #fff;
}

.team-chat__header-text {
  min-width: 0;
  flex: 1;
}

.team-chat__title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #172b4d;
  line-height: 1.3;
}

.team-chat__title::before {
  content: '#';
  margin-right: 0.125rem;
  color: #97a0af;
  font-weight: 500;
}

.team-chat__subtitle {
  margin: 0.125rem 0 0;
  font-size: 0.75rem;
  color: #626f86;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-chat__messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background:
    radial-gradient(ellipse at top, rgba(45, 126, 184, 0.04) 0%, transparent 55%),
    #f7f8fa;
}

.team-chat__footer {
  flex-shrink: 0;
  padding: 0.875rem 1rem 1rem;
  border-top: 1px solid rgba(9, 30, 66, 0.08);
  background: #fff;
}

.team-chat__sidebar :deep(.team-chat__channel) {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  padding: 0.5rem 0.625rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #44546f;
  text-align: left;
  transition: background 0.12s ease, color 0.12s ease;
}

.team-chat__sidebar :deep(.team-chat__channel--active) {
  background: #fff;
  color: #172b4d;
  box-shadow: 0 1px 3px rgba(9, 30, 66, 0.1);
}

.team-chat__sidebar :deep(.team-chat__channel:not(.team-chat__channel--active):hover) {
  background: rgba(255, 255, 255, 0.55);
}
</style>
