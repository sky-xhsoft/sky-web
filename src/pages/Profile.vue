<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Form, Radio, Card, Button, Message, Avatar, Space, Tag, Descriptions, Tabs } from '@arco-design/web-vue'
import { IconUser, IconLanguage, IconSettings, IconInfoCircle, IconApps } from '@arco-design/web-vue/es/icon'
import { useAuthStore } from '../stores/auth'
import { changeLanguage, getCurrentLanguage } from '../locales'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const { t, locale } = useI18n()

// 表单数据
const formData = ref({
  language: getCurrentLanguage(),
})

// 加载状态
const loading = ref(false)

// 语言选项
const languageOptions = [
  { label: '简体中文', value: 'zh-CN', icon: '🇨🇳' },
  { label: 'English', value: 'en-US', icon: '🇺🇸' },
]

// 当前用户信息
const userInfo = computed(() => {
  return {
    username: authStore.user?.username || t('profile.user'),
    email: authStore.user?.email || '-',
    loginType: authStore.loginType || 'live',
    userId: authStore.user?.id || '-',
  }
})

// 系统名称映射
const systemNameMap = computed(() => ({
  live: t('profile.systemLive') || '直播系统',
  cloud: t('profile.systemCloud') || '云盘系统',
  all: t('profile.systemAll') || '综合系统',
}))

// 快速设置列表
const quickSettings = computed(() => [
  {
    key: 'language',
    title: t('profile.language') || '语言设置',
    description: t('profile.languageDesc') || '切换系统界面语言',
    icon: IconLanguage,
    color: '#165dff',
    hasAction: true,
  },
])

/**
 * 保存设置
 */
async function handleSave() {
  loading.value = true
  try {
    // 切换语言
    changeLanguage(formData.value.language)
    locale.value = formData.value.language

    Message.success(t('profile.saveSuccess') || '设置已保存')
  } catch (error) {
    Message.error(t('profile.saveFailed') || '保存失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 初始化语言设置
  formData.value.language = getCurrentLanguage()
})
</script>

<template>
  <div class="profile-page">
    <div class="page-header">
      <h2>
        <IconUser :size="20" />
        {{ t('profile.userProfile') || '个人中心' }}
      </h2>
    </div>

    <div class="page-content">
      <!-- 用户信息卡片 -->
      <div class="profile-card user-card">
        <div class="user-card__inner">
          <div class="user-avatar-section">
            <Avatar :size="72">
              <IconUser :size="36" />
            </Avatar>
            <div class="user-basic-info">
              <h3 class="username">{{ userInfo.username }}</h3>
              <Tag color="blue" size="large">
                {{ systemNameMap.value[userInfo.loginType as keyof typeof systemNameMap.value] || userInfo.loginType }}
              </Tag>
            </div>
          </div>

          <Descriptions class="user-details" :column="2" border>
            <Descriptions.Item :label="t('profile.userId') || '用户ID'">
              {{ userInfo.userId }}
            </Descriptions.Item>
            <Descriptions.Item :label="t('profile.email') || '邮箱'">
              {{ userInfo.email }}
            </Descriptions.Item>
            <Descriptions.Item :label="t('profile.system')">
              <Tag color="green">
                {{ systemNameMap.value[userInfo.loginType as keyof typeof systemNameMap.value] || userInfo.loginType }}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item :label="t('profile.language') || '当前语言'">
              <Tag color="arcoblue">
                {{ languageOptions.find(opt => opt.value === formData.language)?.label }}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>

      <!-- 设置面板 -->
      <div class="settings-section">
        <div class="section-header">
          <h3 class="section-title">
            <IconSettings :size="18" />
            {{ t('profile.preferences') || '偏好设置' }}
          </h3>
        </div>

        <div class="settings-grid">
          <!-- 语言设置卡片 -->
          <Card class="setting-card language-card" bordered>
            <template #title>
              <div class="setting-card__title">
                <span class="setting-icon" style="background: rgba(22, 93, 255, 0.1); color: #165dff">
                  <IconLanguage :size="18" />
                </span>
                <span>{{ t('profile.languageSettings') || '语言设置' }}</span>
              </div>
            </template>

            <Form :model="formData" layout="vertical" class="language-form">
              <Form.Item :label="t('profile.selectLanguage') || '选择界面语言'">
                <Radio.Group v-model="formData.language" type="button">
                  <Radio
                    v-for="option in languageOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    <span class="language-option-inner">
                      <span class="language-flag">{{ option.icon }}</span>
                      <span class="language-name">{{ option.label }}</span>
                    </span>
                  </Radio>
                </Radio.Group>
              </Form.Item>

              <div class="form-actions">
                <Button type="primary" :loading="loading" @click="handleSave">
                  {{ t('profile.save') || '保存设置' }}
                </Button>
              </div>
            </Form>
          </Card>

          <!-- 关于卡片 -->
          <Card class="setting-card about-card" bordered>
            <template #title>
              <div class="setting-card__title">
                <span class="setting-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981">
                  <IconInfoCircle :size="18" />
                </span>
                <span>{{ t('profile.about') || '关于系统' }}</span>
              </div>
            </template>

            <div class="about-content">
              <div class="about-item">
                <span class="label">{{ t('profile.version') || '版本' }}</span>
                <span class="value">1.0.0</span>
              </div>
              <div class="about-item">
                <span class="label">{{ t('profile.platform') || '平台' }}</span>
                <span class="value">AI Live Data Center</span>
              </div>
              <div class="about-item about-item--full">
                <span class="label">{{ t('profile.description') || '描述' }}</span>
                <span class="value description">
                  {{ t('profile.platformDesc') || '集直播管理、云盘存储、数据管理于一体的企业级综合平台' }}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100%;
  background: #f5f6fa;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 用户信息卡片 */
.profile-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.user-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.user-card__inner {
  padding: 24px;
}

.user-avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 20px;
}

.user-avatar-section :deep(.arco-avatar) {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.user-basic-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.username {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin: 0;
  line-height: 1.2;
}

.user-details {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  overflow: hidden;
}

.user-details :deep(.arco-descriptions-item-label) {
  color: #6b7280;
  font-weight: 500;
  background: #f9fafb;
}

.user-details :deep(.arco-descriptions-item-value) {
  color: #1f2937;
}

/* 设置区域 */
.settings-section {
  flex: 1;
}

.section-header {
  margin-bottom: 16px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
}

/* 设置卡片通用样式 */
.setting-card {
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.setting-card__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #1f2937;
  font-size: 15px;
}

.setting-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 语言设置卡片 */
.language-card {
  :deep(.arco-card-header) {
    border-bottom: 1px solid #f3f4f6;
  }
}

.language-form {
  padding-top: 8px;
}

.language-option-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
}

.language-flag {
  font-size: 18px;
  line-height: 1;
}

.language-name {
  font-size: 14px;
  font-weight: 500;
}

.form-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

/* 关于卡片 */
.about-card {
  :deep(.arco-card-header) {
    border-bottom: 1px solid #f3f4f6;
  }
}

.about-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
}

.about-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 6px;
  transition: background 0.2s;

  &:hover {
    background: #f3f4f6;
  }

  &--full {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

.about-item .label {
  font-weight: 500;
  color: #6b7280;
  font-size: 14px;
}

.about-item .value {
  color: #1f2937;
  font-weight: 500;
  font-size: 14px;
}

.about-item .value.description {
  max-width: 100%;
  text-align: left;
  line-height: 1.6;
  font-weight: 400;
  color: #4b5563;
}

/* 响应式 */
@media (max-width: 900px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .user-avatar-section {
    flex-direction: column;
    text-align: center;
  }

  .user-details :deep(.arco-descriptions-item) {
    display: flex;
    flex-direction: column;
  }
}
</style>
