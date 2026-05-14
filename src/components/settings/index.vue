<template>
  <div class="settings-page">
    <div class="section">
      <div class="section-title">{{ t('settings.apiKey') }}</div>
      <div class="api-key-row">
        <a-input
          v-if="editing"
          v-model:value="inputApiKey"
          :placeholder="t('settings.apiKeyPlaceholder')"
          class="api-key-input"
        />
        <a-input-password
          v-else
          :value="maskedApiKey"
          disabled
          class="api-key-input"
        />
        <a-button v-if="!editing" type="text" @click="startEdit">{{ t('settings.edit') }}</a-button>
        <a-button v-if="editing" type="primary" :loading="saving" @click="handleSave">
          {{ t('settings.integrate') }}
        </a-button>
        <a-button v-if="editing" type="text" @click="cancelEdit">{{ t('settings.cancel') }}</a-button>
      </div>
      <div class="status-row">
        <span :class="['status-dot', isConfigured ? 'active' : 'inactive']" />
        <span class="status-text">
          {{ isConfigured ? t('settings.integrated') : t('settings.notIntegrated') }}
        </span>
        <a-button v-if="isConfigured && !editing" type="text" danger size="small" @click="handleClear">
          {{ t('settings.clear') }}
        </a-button>
      </div>
    </div>

    <div class="section" v-if="isConfigured">
      <div class="section-title">{{ t('settings.webhookUrl') }}</div>
      <div class="webhook-row">
        <a-input :value="webhookUrl" disabled class="webhook-input" />
        <a-button type="text" @click="copyWebhook">
          <template #icon><copy-outlined /></template>
        </a-button>
      </div>
      <div class="hint">{{ t('settings.webhookUrlHint') }}</div>
    </div>

    <div class="section">
      <div class="section-title">{{ t('settings.language') }}</div>
      <a-select
        :value="currentLocale"
        class="locale-select"
        @change="handleLocaleChange"
      >
        <a-select-option v-for="opt in localeOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </a-select-option>
      </a-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { CopyOutlined } from '@ant-design/icons-vue'
import { globalState, useGlobalData } from '@/hooks/use-global-data'
import { LOCALE_OPTIONS } from '@/i18n'

const { t, locale } = useI18n()
const { saveConfig, saveLocale, isConfigured } = useGlobalData()

const editing = ref(false)
const saving = ref(false)
const inputApiKey = ref('')

const maskedApiKey = computed(() => {
  const key = globalState.config.api_key
  if (!key) return ''
  if (key.length <= 8) return '****'
  return key.slice(0, 4) + '****' + key.slice(-4)
})

const webhookUrl = computed(() => {
  const key = globalState.config.api_key
  if (!key) return ''
  // The webhook URL is provided by GPTBots when the API key is configured
  // This is a placeholder - actual URL comes from the platform
  return `https://api-prod.gptbots.ai/v1/browser/extension/webhook/${key.slice(0, 8)}...`
})

const currentLocale = computed(() => globalState.locale)
const localeOptions = LOCALE_OPTIONS

function startEdit() {
  inputApiKey.value = globalState.config.api_key
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  inputApiKey.value = ''
}

async function handleSave() {
  if (!inputApiKey.value.trim()) {
    message.warning(t('settings.apiKeyPlaceholder'))
    return
  }
  saving.value = true
  try {
    await saveConfig({ api_key: inputApiKey.value.trim() })
    editing.value = false
    message.success(t('common.success'))
  } finally {
    saving.value = false
  }
}

async function handleClear() {
  await saveConfig({ api_key: '' })
  message.success(t('settings.clear'))
}

async function copyWebhook() {
  try {
    await navigator.clipboard.writeText(webhookUrl.value)
    message.success(t('common.copied'))
  } catch {
    message.error(t('common.error'))
  }
}

async function handleLocaleChange(val: string) {
  await saveLocale(val)
  locale.value = val
}
</script>

<style lang="less" scoped>
.settings-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.api-key-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.api-key-input {
  flex: 1;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  &.active { background: #52c41a; }
  &.inactive { background: #d9d9d9; }
}

.status-text {
  color: #666;
}

.webhook-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.webhook-input {
  flex: 1;
  font-size: 12px;
}

.hint {
  font-size: 11px;
  color: #999;
  line-height: 1.4;
}

.locale-select {
  width: 160px;
}
</style>
