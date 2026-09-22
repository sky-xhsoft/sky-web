<template>
  <div class="user-center-page">
    <a-card :bordered="false" class="wrapper-card">
      <div class="user-layout">
        <!-- 左侧：用户信息侧卡 -->
        <div class="user-sidebar">
          <a-card :bordered="false" class="user-info-card">
            <div class="avatar-wrap">
              <a-avatar :size="64" :style="{ background: avatarColor }" class="user-avatar">
                {{ avatarText }}
              </a-avatar>
            </div>
            <div class="user-nick">{{ userNick }}</div>
            <div class="user-account">{{ userAccount }}</div>
            <a-tag class="role-tag" :color="isAdmin ? 'arcoblue' : 'gray'">
              {{ isAdmin ? t('userCenter.admin') : t('userCenter.member') }}
            </a-tag>

            <a-divider class="divider" />

            <div class="user-meta">
              <div class="meta-item">
                <span class="meta-icon"><icon-user /></span>
                <span class="meta-label">{{ t('userCenter.company') }}</span>
                <span class="meta-value">{{ companyName || '--' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-icon"><icon-phone /></span>
                <span class="meta-label">{{ t('userCenter.phone') }}</span>
                <span class="meta-value">{{ userPhone || '--' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-icon"><icon-email /></span>
                <span class="meta-label">{{ t('userCenter.email') }}</span>
                <span class="meta-value">{{ userEmail || '--' }}</span>
              </div>
            </div>
          </a-card>
        </div>

        <!-- 右侧：Tabs 内容 -->
        <div class="user-content">
          <a-card :bordered="false">
            <a-tabs v-model:active-key="activeTab" type="line" size="large">
              <a-tab-pane key="profile" :title="t('userCenter.profile')">
                <UserProfile />
              </a-tab-pane>
              <a-tab-pane key="company" :title="t('userCenter.companyConfig')">
                <CompanyConfig />
              </a-tab-pane>
            </a-tabs>
          </a-card>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../stores/auth'
import { V2PageHeader } from '../../components/ui'
import UserProfile from '../../pages/system/UserProfile.vue'
import CompanyConfig from '../../pages/system/CompanyConfig.vue'

const { t } = useI18n()
const authStore = useAuthStore()

const activeTab = ref('profile')

const user = computed(() => authStore.user)
const company = computed(() => authStore.company)

const userNick = computed(() => user.value?.trueName || user.value?.username || '--')
const userAccount = computed(() => user.value?.username || '--')
const userPhone = computed(() => user.value?.phone || '')
const userEmail = computed(() => user.value?.email || '')
const companyName = computed(() => company.value?.name || '--')
const isAdmin = computed(() => !!user.value?.isAdmin && user.value.isAdmin !== '0')

const avatarText = computed(() => (user.value?.trueName?.charAt(0) || user.value?.username?.charAt(0) || 'U').toUpperCase())
const avatarColor = computed(() => {
  const palettes = ['#165DFF', '#0FC6C2', '#FF7D00', '#F53F3F', '#722ED1']
  const idx = (user.value?.id || 0) % palettes.length
  return palettes[idx]
})
</script>

<style scoped lang="scss">
.user-center-page {
  height: 100%;
  overflow: auto;
  background: #f2f3f5;

  .wrapper-card {
    border-radius: 0;
    min-height: 100%;
  }

  .user-layout {
    display: flex;
    gap: 16px;
    padding: 16px;

    .user-sidebar {
      width: 320px;
      flex-shrink: 0;

      .user-info-card {
        background: linear-gradient(180deg, #fff 0%, #f7f8fa 100%);
        text-align: center;
        padding: 24px 16px;

        .avatar-wrap {
          margin-bottom: 12px;

          .user-avatar {
            font-size: 24px;
            font-weight: 600;
          }
        }

        .user-nick {
          font-size: 18px;
          font-weight: 600;
          color: #1d2129;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-account {
          font-size: 14px;
          color: #86909c;
          margin-bottom: 12px;
        }

        .role-tag {
          border-radius: 12px;
        }

        .divider {
          margin: 20px 0 16px;
        }

        .user-meta {
          text-align: left;

          .meta-item {
            display: flex;
            align-items: center;
            padding: 8px 0;
            font-size: 14px;

            .meta-icon {
              color: #86909c;
              margin-right: 10px;
              display: flex;
              align-items: center;
            }

            .meta-label {
              color: #86909c;
              width: 48px;
              flex-shrink: 0;
            }

            .meta-value {
              color: #1d2129;
              flex: 1;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
        }
      }
    }

    .user-content {
      flex: 1;
      min-width: 0;

      :deep(.arco-card-body) {
        padding: 8px 16px 16px;
      }
    }
  }
}
</style>