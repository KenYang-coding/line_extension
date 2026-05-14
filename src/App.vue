<template>
  <div class="app-container">
    <div class="tab-bar">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-item', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </div>
    </div>
    <div class="tab-content">
      <AssistantPage v-if="activeTab === 'assistant'" />
      <SettingsPage v-else-if="activeTab === 'settings'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AssistantPage from '@/components/assistant/index.vue'
import SettingsPage from '@/components/settings/index.vue'
import { useGlobalData } from '@/hooks/use-global-data'

const { t, locale } = useI18n()
const { loadConfig, initMessageListener } = useGlobalData()

const activeTab = ref('assistant')

const tabs = computed(() => [
  { key: 'assistant', label: t('tabs.assistant') },
  { key: 'settings', label: t('tabs.settings') },
])

onMounted(async () => {
  await loadConfig()
  initMessageListener()
  // sync locale from global state after loadConfig
  const { globalState } = await import('@/hooks/use-global-data')
  if (globalState.locale) locale.value = globalState.locale
})
</script>

<style lang="less">
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  color: #333;
  background: #fff;
}

.app-container {
  width: 360px;
  height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-bar {
  display: flex;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 13px;
  font-weight: 500;
  color: #888;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;

  &:hover {
    color: #333;
  }

  &.active {
    color: #06c755;
    border-bottom-color: #06c755;
  }
}

.tab-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
