<template>
  <div class="assistant-page">
    <!-- Service Status -->
    <div class="service-bar">
      <div class="service-status">
        <span :class="['status-dot', serviceInfo.enabled ? 'active' : 'inactive']" />
        <span class="status-label">{{ t('assistant.serviceStatus') }}:</span>
        <span :class="['status-text', serviceInfo.enabled ? 'active' : 'inactive']">
          {{ serviceInfo.enabled ? t('assistant.serviceOn') : t('assistant.serviceOff') }}
        </span>
      </div>
      <a-button
        v-if="!serviceInfo.enabled"
        type="primary"
        size="small"
        @click="handleStart"
      >
        {{ t('assistant.start') }}
      </a-button>
      <a-button
        v-else
        type="default"
        size="small"
        danger
        @click="handleStop"
      >
        {{ t('assistant.stop') }}
      </a-button>
    </div>

    <!-- Current Conversation -->
    <div class="section current-conversation">
      <div class="section-title">{{ t('assistant.currentConversation') }}</div>

      <!-- No LINE page open -->
      <div v-if="!currentUser" class="empty-state">
        {{ t('assistant.notOnLinePage') }}
      </div>

      <!-- User selected -->
      <div v-else class="current-user-card">
        <div class="user-info">
          <a-avatar :src="currentUser.avatar" :size="36">
            {{ currentUser.name?.charAt(0) ?? '?' }}
          </a-avatar>
          <span class="user-name">{{ currentUser.name || currentUser.user_id }}</span>
        </div>

        <!-- State: already in pending queue (passive takeover active) -->
        <div v-if="isUserInQueue(currentUser.user_id!)" class="takeover-status queue">
          <span class="queue-badge">{{ t('assistant.alreadyInQueue') }}</span>
        </div>

        <!-- State: force takeover is active -->
        <div v-else-if="isTakeoverActive(currentUser.user_id!)" class="takeover-status active">
          <span class="active-badge">● {{ t('assistant.humanServiceActive') }}</span>
          <a-button
            type="primary"
            size="small"
            danger
            @click="handleEndService(currentUser.user_id!)"
          >
            {{ t('assistant.endService') }}
          </a-button>
        </div>

        <!-- State: available for force takeover -->
        <div v-else class="takeover-action">
          <a-button
            type="primary"
            size="small"
            :loading="takeoverLoading"
            @click="handleForceTakeover(currentUser.user_id!)"
          >
            {{ takeoverLoading ? t('assistant.takingOver') : t('assistant.takeover') }}
          </a-button>
        </div>
      </div>
    </div>

    <!-- Pending Queue -->
    <div class="section pending-section">
      <div class="section-header">
        <span class="section-title">{{ t('assistant.pendingQueue') }}</span>
        <a-button
          v-if="pendingUsers.data.length > 0"
          type="text"
          size="small"
          danger
          @click="confirmClearAll"
        >
          {{ t('assistant.clearAll') }}
        </a-button>
      </div>

      <div v-if="pendingUsers.data.length === 0" class="empty-queue">
        —
      </div>

      <div
        v-for="user in pendingUsers.data"
        :key="user.conversation_id"
        class="pending-user-item"
      >
        <div class="user-row" @click="handleSwitchChat(user)">
          <a-avatar :src="user.avatar" :size="32" class="user-avatar">
            {{ user.user_name?.charAt(0) ?? '?' }}
          </a-avatar>
          <div class="user-details">
            <div class="user-name-row">
              <span class="user-name">{{ user.user_name ?? user.user_id ?? 'Unknown' }}</span>
              <span class="platform-tag">LINE</span>
              <span class="time">{{ formatTime(user.time) }}</span>
            </div>
            <div class="message-preview">{{ user.message }}</div>
          </div>
        </div>
        <div class="user-actions">
          <a-tooltip :title="t('assistant.copyName')">
            <copy-outlined class="action-icon" @click.stop="copyName(user)" />
          </a-tooltip>
          <a-tooltip :title="t('assistant.remove')">
            <minus-circle-filled
              class="action-icon danger"
              @click.stop="handleRemovePendingUser(user)"
            />
          </a-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import { CopyOutlined, MinusCircleFilled } from '@ant-design/icons-vue'
import { globalState } from '@/hooks/use-global-data'
import { useAssistant } from './use-assistant'
import type { PendingUser } from '@/types/api'

const { t } = useI18n()

const {
  serviceInfo,
  pendingUsers,
  takeoverLoading,
  loadPersistedData,
  handleStart,
  handleStop,
  handleForceTakeover,
  handleEndService,
  handleRemovePendingUser,
  handleClearAllPendingUsers,
  handleSwitchChat,
  isUserInQueue,
  isTakeoverActive,
  formatTime,
} = useAssistant()

const currentUser = computed(() => globalState.userInfo)

onMounted(() => {
  loadPersistedData()
})

function confirmClearAll() {
  Modal.confirm({
    title: t('assistant.clearAllConfirm'),
    onOk: handleClearAllPendingUsers,
  })
}

async function copyName(user: PendingUser) {
  const name = user.user_name ?? user.user_id ?? ''
  try {
    await navigator.clipboard.writeText(name)
    message.success(t('common.copied'))
  } catch {
    message.error(t('common.error'))
  }
}
</script>

<style lang="less" scoped>
.assistant-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.service-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f7f9fa;
  border-bottom: 1px solid #e8e8e8;
}

.service-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  &.active {
    background: #52c41a;
    box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.3);
  }
  &.inactive { background: #d9d9d9; }
}

.status-label { color: #666; }
.status-text {
  font-weight: 500;
  &.active { color: #52c41a; }
  &.inactive { color: #aaa; }
}

.section {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.current-conversation {
  flex-shrink: 0;
}

.empty-state {
  font-size: 13px;
  color: #bbb;
  text-align: center;
  padding: 8px 0;
}

.current-user-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.takeover-status {
  display: flex;
  align-items: center;
  gap: 8px;

  &.queue .queue-badge {
    font-size: 11px;
    color: #888;
    background: #f0f0f0;
    padding: 2px 8px;
    border-radius: 10px;
  }

  &.active .active-badge {
    font-size: 12px;
    color: #52c41a;
    font-weight: 500;
  }
}

.pending-section {
  flex: 1;
  overflow-y: auto;
  border-bottom: none;
}

.empty-queue {
  font-size: 13px;
  color: #ccc;
  text-align: center;
  padding: 16px 0;
}

.pending-user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;

  &:last-child { border-bottom: none; }

  &:hover .user-actions { opacity: 1; }
}

.user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.user-avatar { flex-shrink: 0; }

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.platform-tag {
  font-size: 10px;
  background: #06c755;
  color: white;
  padding: 1px 5px;
  border-radius: 3px;
  flex-shrink: 0;
}

.time {
  font-size: 11px;
  color: #aaa;
  flex-shrink: 0;
}

.message-preview {
  font-size: 12px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;
  padding-left: 8px;
}

.action-icon {
  font-size: 16px;
  color: #ccc;
  cursor: pointer;
  transition: color 0.2s;

  &:hover { color: #999; }
  &.danger:hover { color: #ff4d4f; }
}
</style>
