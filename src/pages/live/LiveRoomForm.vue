<template>
  <div class="live-room-form">
    <div class="lrf-wrap">
      <!-- 页头：与直播间详情一致 -->
      <div class="lrf-head">
        <div class="lrf-head-main">
          <div class="lrf-crumb">
            <span class="lrf-link" @click="handleCancel">{{ t('liveRoomForm.crumbRooms') }}</span>
            <span>/</span>
            <span>{{ pageTitle }}</span>
          </div>
          <h1 class="lrf-title">{{ pageTitle }}</h1>
        </div>
        <a-button @click="handleCancel">{{ t('liveRoomForm.cancel') }}</a-button>
        <a-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEditMode ? t('liveRoomForm.edit') : t('liveRoomForm.submit') }}
        </a-button>
      </div>

      <!-- 左侧表单，右侧实时预览；窄屏上下排列 -->
      <a-form :model="formData" :rules="rules" ref="formRef" layout="vertical" class="lrf-body">
        <div class="lrf-main">
          <div class="lrf-card">
            <div class="lrf-card-title">{{ t('liveRoomForm.sectionBasic') }}</div>
            <a-form-item :label="t('liveRoomForm.roomName')" field="roomName" required>
              <!-- 直播间名称创建后不能修改：云盘的录制、切片目录按名称建立 -->
              <a-input
                v-model="formData.roomName"
                :disabled="isEditMode"
                :placeholder="t('liveRoomForm.roomNamePlaceholder')"
                :max-length="100"
                show-word-limit
              />
            </a-form-item>
            <div class="lrf-grid2">
              <a-form-item :label="t('liveRoomForm.startTime')" field="startTime" required>
                <a-date-picker v-model="formData.startTime" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
              </a-form-item>
              <a-form-item :label="t('liveRoomForm.endTime')" field="endTime">
                <a-date-picker v-model="formData.endTime" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
              </a-form-item>
            </div>
            <a-form-item :label="t('liveRoomForm.displayMode')" field="displayMode">
              <div class="lrf-modes">
                <div
                  v-for="mode in displayModes"
                  :key="mode.value"
                  :class="['lrf-mode', { 'is-active': formData.displayMode === mode.value }]"
                  @click="formData.displayMode = mode.value"
                >
                  <span :class="['lrf-shape', `is-${mode.value}`]"><i /><i /></span>
                  <span>{{ mode.label }}</span>
                </div>
              </div>
            </a-form-item>
            <a-form-item :label="t('liveRoomForm.description')" field="description">
              <a-textarea
                v-model="formData.description"
                :max-length="1000"
                show-word-limit
                :placeholder="t('liveRoomForm.descriptionPlaceholder')"
              />
            </a-form-item>
          </div>

          <div class="lrf-card">
            <div class="lrf-card-title">{{ t('liveRoomForm.sectionMedia') }}</div>
            <!-- 录制：开关 + 说明 + 存储位置 -->
            <div class="lrf-feature">
              <div class="lrf-feature-top">
                <a-switch v-model="formData.isRecord" :checked-value="'Y'" :unchecked-value="'N'" />
                <div>
                  <div class="lrf-feature-name">{{ t('liveRoomForm.featureRecord') }}</div>
                  <div class="lrf-tip">{{ t('liveRoomForm.isRecordTips') }}</div>
                </div>
              </div>
              <a-form-item
                v-if="formData.isRecord === 'Y'"
                :label="t('liveRoomForm.recordFolder')"
                field="recordFolderId"
                class="lrf-feature-body"
              >
                <div class="lrf-field-col">
                  <CloudFolderSelect
                    v-model="formData.recordFolderId"
                    :root-label="t('liveRoomForm.storageFolderRoot')"
                    :placeholder="t('liveRoomForm.recordFolderPlaceholder')"
                    @path-change="recordFolderPath = $event"
                  />
                  <div class="lrf-tip">{{ t('liveRoomForm.recordFolderTips') }}</div>
                </div>
              </a-form-item>
            </div>
            <!-- 切片：开关 + 说明 + 存储位置 -->
            <div class="lrf-feature">
              <div class="lrf-feature-top">
                <a-switch v-model="formData.isClip" :checked-value="'Y'" :unchecked-value="'N'" />
                <div>
                  <div class="lrf-feature-name">{{ t('liveRoomForm.featureClip') }}</div>
                  <div class="lrf-tip">{{ t('liveRoomForm.isClipTips') }}</div>
                </div>
              </div>
              <a-form-item
                v-if="formData.isClip === 'Y'"
                :label="t('liveRoomForm.clipFolder')"
                field="clipFolderId"
                class="lrf-feature-body"
              >
                <div class="lrf-field-col">
                  <CloudFolderSelect
                    v-model="formData.clipFolderId"
                    :root-label="t('liveRoomForm.storageFolderRoot')"
                    :placeholder="t('liveRoomForm.clipFolderPlaceholder')"
                    @path-change="clipFolderPath = $event"
                  />
                  <div class="lrf-tip">{{ t('liveRoomForm.clipFolderTips') }}</div>
                </div>
              </a-form-item>
            </div>
          </div>

          <div class="lrf-notice">{{ t('liveRoomForm.compliance') }}</div>
        </div>

        <!-- 实时预览：封面上传在此处 -->
        <div class="lrf-card lrf-preview">
          <div class="lrf-card-title">{{ t('liveRoomForm.preview') }}</div>
          <div class="lrf-cover">
            <img v-if="formData.coverImage" :src="formData.coverImage" alt="" />
            <a-upload
              v-else
              :custom-request="handleUpload"
              :show-file-list="false"
              :limit="1"
              accept="image/*"
              class="lrf-cover-upload"
            >
              <template #upload-button>
                <div class="lrf-cover-empty">
                  <icon-plus />
                  <span>{{ t('liveRoomForm.uploadCover') }}</span>
                </div>
              </template>
            </a-upload>
            <span class="lrf-cover-badge">{{ currentModeLabel }}</span>
          </div>
          <div v-if="formData.coverImage" class="lrf-cover-actions">
            <a-upload :custom-request="handleUpload" :show-file-list="false" accept="image/*">
              <template #upload-button>
                <a-button size="mini">
                  <template #icon><icon-swap /></template>
                  {{ t('liveRoomForm.replace') }}
                </a-button>
              </template>
            </a-upload>
            <a-button size="mini" @click="handleRemoveCover">
              <template #icon><icon-delete /></template>
              {{ t('liveRoomForm.delete') }}
            </a-button>
          </div>
          <div class="lrf-preview-name">{{ formData.roomName || t('liveRoomForm.previewNoName') }}</div>
          <div class="lrf-tip">{{ previewStartText }}</div>
          <div class="lrf-preview-list">
            <span class="lrf-preview-key">{{ t('liveRoomForm.featureRecord') }}</span>
            <span class="lrf-preview-val">
              <span :class="['lrf-tag', { 'is-off': formData.isRecord !== 'Y' }]">
                {{ formData.isRecord === 'Y' ? t('liveRoomForm.on') : t('liveRoomForm.off') }}
              </span>
              <span v-if="formData.isRecord === 'Y'" class="lrf-path">{{ folderLabel(recordFolderPath) }}</span>
            </span>
            <span class="lrf-preview-key">{{ t('liveRoomForm.featureClip') }}</span>
            <span class="lrf-preview-val">
              <span :class="['lrf-tag', { 'is-off': formData.isClip !== 'Y' }]">
                {{ formData.isClip === 'Y' ? t('liveRoomForm.on') : t('liveRoomForm.off') }}
              </span>
              <span v-if="formData.isClip === 'Y'" class="lrf-path">{{ folderLabel(clipFolderPath) }}</span>
            </span>
          </div>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onActivated } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { useNavigationStore } from '../../stores/navigation'
import api from '../../api/http'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { listDomains } from '../../api/live'
import CloudFolderSelect from './components/CloudFolderSelect.vue'

const { t } = useI18n()

// 接收 props（从 BasicLayout 传递）
const props = defineProps<{
  roomId?: string
}>()



const navigationStore = useNavigationStore()
const formRef = ref()
const submitting = ref(false)

const isEditMode = computed(() => !!props.roomId)
const pageTitle = computed(() => (isEditMode.value ? t('liveRoomForm.pageTitleEdit') : t('liveRoomForm.pageTitleCreate')))

// 显示方式（示意图卡片）
const displayModes = computed(() => [
  { value: 'landscape', label: t('liveRoomForm.displayModeLandscape') },
  { value: 'portrait', label: t('liveRoomForm.displayModePortrait') },
  { value: 'three_screen', label: t('liveRoomForm.displayModeThree') },
])
const currentModeLabel = computed(() => displayModes.value.find((m) => m.value === formData.displayMode)?.label || '')

// 实时预览：开播时间与存储位置路径
const previewStartText = computed(() =>
  formData.startTime
    ? t('liveRoomForm.previewStartAt', { time: dayjs(formData.startTime).format('MM-DD HH:mm') })
    : t('liveRoomForm.previewNoTime'),
)
const recordFolderPath = ref('')
const clipFolderPath = ref('')
const folderLabel = (path: string) =>
  path === '/' ? t('liveRoomForm.storageFolderRoot') : path || t('liveRoomForm.notSelected')

const formData = reactive({
  roomName: '',
  roomType: 'video',
  broadcastFormat: 'live',
  displayMode: 'landscape',
  roomStage: 'formal',
  viewingMethod: 'public',
  playbackMethod: 'post_end',

  startTime: '',
  endTime: '',
  coverImage: '',
  isRecord: 'Y',
  isClip: 'Y',
  // 录制 / 切片存储位置：云盘文件夹 ID，0 为云盘根目录（提交为空），undefined 为尚未选择
  recordFolderId: undefined as number | undefined,
  clipFolderId: undefined as number | undefined,
  description: '',
})




const rules = {
  roomName: [
    { required: true, message: t('liveRoomForm.validation.roomName') },
    { max: 100, message: t('liveRoomForm.roomNameMaxLength') }
  ],
  startTime: [{ required: true, message: t('liveRoomForm.validation.startTime') }],
  // 仅在开启录制 / 切片时显示，未显示的字段不参与校验
  recordFolderId: [{ required: true, message: t('liveRoomForm.recordFolderRequired') }],
  clipFolderId: [{ required: true, message: t('liveRoomForm.clipFolderRequired') }],
}

// 加载直播间数据（编辑模式）
const loadRoomData = async () => {
  if (!isEditMode.value) return

  try {
    const response = await api.get(`/data/LIVE_ROOM/${props.roomId}`)

    if (response.data?.data) {
      const data = response.data.data
      formData.roomName = data.ROOM_NAME || ''
      formData.roomType = data.ROOM_TYPE || 'video'
      formData.broadcastFormat = data.BROADCAST_FORMAT || 'live'
      formData.displayMode = data.DISPLAY_MODE || 'landscape'
      formData.startTime = data.START_TIME || ''
      formData.endTime = data.END_TIME || ''
      formData.coverImage = data.COVER_IMAGE || ''
      formData.isRecord = data.IS_RECORD || 'Y'
      formData.isClip = data.IS_CLIP || 'Y'
      // 已有直播间未设置存储位置时视为云盘根目录
      formData.recordFolderId = data.RECORD_FOLDER_ID ? Number(data.RECORD_FOLDER_ID) : 0
      formData.clipFolderId = data.CLIP_FOLDER_ID ? Number(data.CLIP_FOLDER_ID) : 0
      formData.description = data.DESCRIPTION || ''
    } else {
      Message.error('加载直播间数据失败')
      navigationStore.goBack()
    }
  } catch (error: any) {
    console.error('加载直播间数据失败:', error)
    Message.error(error.message || '加载直播间数据失败')
    navigationStore.goBack()
  }
}

const handleRemoveCover = () => {
  formData.coverImage = ''
  Message.success(t('liveRoomForm.deleteCoverSuccess'))
}

const handleUpload = async (option: any) => {
  const { fileItem, onSuccess, onError } = option

  try {
    const uploadFormData = new FormData()
    uploadFormData.append('file', fileItem.file)
    uploadFormData.append('category', 'live_cover')

    const response = await api.post('/files/upload', uploadFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data && response.data.code === 0) {
      const fileData = response.data.data
      const imageUrl = fileData.accessUrl
      formData.coverImage = imageUrl
      onSuccess()
      Message.success(t('liveRoomForm.uploadSuccess'))
    } else {
      throw new Error(response.data?.message || '上传失败')
    }
  } catch (error: any) {
    console.error('上传失败:', error)
    onError(error)
    Message.error(error.message || t('liveRoomForm.uploadError'))
  }
}




const handleSubmit = async () => {
  try {
    // Arco 的 validate() 校验失败时返回错误对象而不是抛异常，必须检查返回值
    if (await formRef.value?.validate()) return
    // 新增模式：提交前兜底校验域名是否已配置，防止绕过弹窗直接创建
    if (!isEditMode.value) {
      const configured = await checkDomainConfigured()
      if (!configured) {
        promptConfigureDomain()
        return
      }
    }
    submitting.value = true

    const formatDateTime = (dateTime: string) => {
      if (!dateTime) return null
      return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss')
    }

    const requestData = {
      ROOM_NAME: formData.roomName,
      ROOM_TYPE: formData.roomType || 'video',
      BROADCAST_FORMAT: formData.broadcastFormat || 'live',
      ROOM_STAGE: formData.roomStage || 'formal',
      VIEWING_METHOD: formData.viewingMethod || 'public',
      PLAYBACK_METHOD: formData.playbackMethod || 'post_end',
      DISPLAY_MODE: formData.displayMode,
      START_TIME: formatDateTime(formData.startTime),
      END_TIME: formatDateTime(formData.endTime),
      COVER_IMAGE: formData.coverImage,
      IS_RECORD: formData.isRecord,
      IS_CLIP: formData.isClip,
      RECORD_FOLDER_ID: formData.recordFolderId || null,
      CLIP_FOLDER_ID: formData.clipFolderId || null,
      DESCRIPTION: formData.description,    }
    if (isEditMode.value) {
      // 编辑时不动这些通用/状态字段，避免重置直播阶段/观看·回放方式/状态；直播间名称不允许修改
      delete (requestData as any).ROOM_NAME
      delete (requestData as any).ROOM_STAGE
      delete (requestData as any).VIEWING_METHOD
      delete (requestData as any).PLAYBACK_METHOD
      delete (requestData as any).STATUS
    } else {
      ;(requestData as any).STATUS = 'draft'
    }

    if (isEditMode.value) {
      await api.put(`/data/LIVE_ROOM/${props.roomId}`, requestData)
      Message.success(t('liveRoomForm.editSuccess'))
    } else {
      await api.post('/data/LIVE_ROOM', requestData)
      Message.success(t('liveRoomForm.submitSuccess'))
    }

    navigationStore.goBack()
  } catch (error: any) {
    console.error('操作失败:', error)
    Message.error(error.message || (isEditMode.value ? t('liveRoomForm.editError') : t('liveRoomForm.submitError')))
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  navigationStore.goBack()
}

// 检查当前公司是否已配置直播域名
// 同时查推流域名(type=0)和播放域名(type=1)，任一存在即视为已配置
const checkDomainConfigured = async (): Promise<boolean> => {
  try {
    const [pushRes, playRes] = await Promise.all([listDomains(0), listDomains(1)])
    const pushDomains = pushRes?.data?.data?.domains || []
    const playDomains = playRes?.data?.data?.domains || []
    return pushDomains.length > 0 || playDomains.length > 0
  } catch (error: any) {
      console.error('检查域名配置失败:', error)
      // 查询失败（如公司未配置腾讯云/域名拉取报错）同样视为"未配置域名"，引导先配置
      return false
    }
}

// 未配置域名时的提示 + 引导跳转域名配置页
const promptConfigureDomain = () => {
  Modal.warning({
    title: t('liveRoomForm.domainNotConfiguredTitle'),
    content: t('liveRoomForm.domainNotConfigured'),
    okText: t('liveRoomForm.configureDomain'),
    cancelText: t('common.cancel') || '取消',
    onOk: () => {
      navigationStore.navigateTo('LiveDomain', '域名管理')
    },
  })
}

// keep-alive 下 onActivated 每次激活都会触发（含首次挂载）；
// 仅新增模式且尚未提示过才检查域名配置
let domainChecked = false
onMounted(() => {
  loadRoomData()
})

onActivated(async () => {
  // 新增模式：进入表单时检查是否已配置域名（keep-alive 缓存复用下也会触发）
  if (!isEditMode.value && !domainChecked) {
    domainChecked = true
    if (!(await checkDomainConfigured())) {
      promptConfigureDomain()
    }
  }
})
</script>

<style scoped lang="scss">
.live-room-form {
  height: 100%;
  padding: 8px;
  overflow-y: auto;
}

.lrf-wrap {
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lrf-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
}

.lrf-head-main {
  flex: 1;
  min-width: 0;
}

.lrf-crumb {
  display: flex;
  gap: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.lrf-link {
  color: var(--brand-blue);
  cursor: pointer;
}

.lrf-title {
  margin: 4px 0 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.lrf-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 12px;
  align-items: start;
}

.lrf-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.lrf-card {
  padding: 16px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);

  :deep(.arco-form-item) {
    margin-bottom: 14px;
  }

  :deep(.arco-form-item:last-child) {
    margin-bottom: 0;
  }
}

.lrf-card-title {
  margin-bottom: 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.lrf-grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.lrf-field-col {
  width: 100%;
}

.lrf-tip {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 显示方式：示意图卡片 */
.lrf-modes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
}

.lrf-mode {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    border-color: var(--brand-blue);
  }

  &.is-active {
    border-color: var(--brand-blue);
    background: var(--info-bg);
    color: var(--brand-blue);
  }
}

.lrf-shape {
  display: grid;
  gap: 2px;
  height: 26px;

  i {
    background: currentColor;
    border-radius: 2px;
    opacity: 0.35;
  }

  &.is-landscape {
    width: 44px;
    grid-template-columns: 1fr;

    i:last-child {
      display: none;
    }
  }

  &.is-portrait {
    width: 16px;
    grid-template-columns: 1fr;

    i:last-child {
      display: none;
    }
  }

  &.is-three_screen {
    width: 44px;
    grid-template-columns: 2fr 1fr;
  }
}

/* 录制 / 切片：开关 + 说明 + 存储位置 */
.lrf-feature {
  padding: 12px 14px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);

  & + & {
    margin-top: 10px;
  }
}

.lrf-feature-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lrf-feature-name {
  font-weight: 600;
  color: var(--text-primary);
}

.lrf-feature-body {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-light);
}

.lrf-notice {
  padding: 9px 14px;
  border-radius: var(--radius-md);
  background: var(--warning-bg);
  font-size: 12px;
  color: var(--warning);
}

/* 右侧实时预览 */
.lrf-preview {
  position: sticky;
  top: 0;
}

.lrf-cover {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--bg-page);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.lrf-cover-upload,
.lrf-cover-upload :deep(.arco-upload) {
  display: block;
  width: 100%;
  height: 100%;
}

.lrf-cover-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 100%;
  border: 1px dashed var(--border-light);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--text-tertiary);
  cursor: pointer;

  &:hover {
    border-color: var(--brand-blue);
    color: var(--brand-blue);
  }
}

.lrf-cover-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 1px 8px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.45);
  font-size: 11px;
  color: #fff;
  pointer-events: none;
}

.lrf-cover-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.lrf-preview-name {
  margin-top: 12px;
  overflow: hidden;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lrf-preview-list {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 8px 10px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border-light);
  font-size: 12px;
}

.lrf-preview-key {
  color: var(--text-tertiary);
}

.lrf-preview-val {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.lrf-tag {
  flex-shrink: 0;
  padding: 0 8px;
  border-radius: 10px;
  background: var(--info-bg);
  color: var(--brand-blue);

  &.is-off {
    background: var(--bg-page);
    color: var(--text-tertiary);
  }
}

.lrf-path {
  overflow: hidden;
  color: var(--text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1000px) {
  .lrf-body {
    grid-template-columns: minmax(0, 1fr);
  }

  .lrf-preview {
    position: static;
  }
}
</style>