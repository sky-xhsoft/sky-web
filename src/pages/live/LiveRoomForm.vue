<template>
  <div class="live-room-form">
    <!-- 左上角按钮 -->
    <div class="form-header">
      <a-space>
        <a-button @click="handleCancel">{{ t('liveRoomForm.return') }}</a-button>
        <a-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEditMode ? t('liveRoomForm.edit') : t('liveRoomForm.submit') }}
        </a-button>
      </a-space>
    </div>

    <a-alert type="info" show-icon style="margin-bottom: 16px">
      {{ t('liveRoomForm.compliance') }}
    </a-alert>

    <a-form :model="formData" :rules="rules" ref="formRef" layout="vertical" size="small">
      <!-- 基本信息 -->
      <div class="form-section-title">{{ t('liveRoomForm.sectionBasic') }}</div>
      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('liveRoomForm.roomName')" field="roomName" required>
            <a-input
              v-model="formData.roomName"
              :placeholder="t('liveRoomForm.roomNamePlaceholder')"
              :max-length="100"
              show-word-limit
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('liveRoomForm.displayMode')" field="displayMode">
            <a-radio-group v-model="formData.displayMode" type="button">
              <a-radio value="landscape">{{ t('liveRoomForm.displayModeLandscape') }}</a-radio>
              <a-radio value="portrait">{{ t('liveRoomForm.displayModePortrait') }}</a-radio>
              <a-radio value="three_screen">三分屏</a-radio>
            </a-radio-group>
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('liveRoomForm.startTime')" field="startTime" required>
            <a-date-picker
              v-model="formData.startTime"
              show-time
              format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('liveRoomForm.endTime')" field="endTime">
            <a-date-picker
              v-model="formData.endTime"
              show-time
              format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <!-- 封面与录制设置 -->
      <div class="form-section-title">{{ t('liveRoomForm.sectionCoverRec') }}</div>
      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('liveRoomForm.coverImage')" field="coverImage">
            <div class="cover-upload-wrapper">
              <a-upload
                v-if="!formData.coverImage"
                :custom-request="handleUpload"
                :show-file-list="false"
                :limit="1"
                accept="image/*"
              >
                <template #upload-button>
                  <div class="upload-area">
                    <icon-plus />
                    <div>{{ t('liveRoomForm.upload') }}</div>
                  </div>
                </template>
              </a-upload>
              <div v-else class="cover-preview">
                <a-image
                  :src="formData.coverImage"
                  width="180"
                  height="101"
                  fit="cover"
                />
                <div class="cover-actions">
                  <a-button size="small" @click="handleRemoveCover">
                    <template #icon>
                      <icon-delete />
                    </template>
                    {{ t('liveRoomForm.delete') }}
                  </a-button>
                  <a-upload
                    :custom-request="handleUpload"
                    :show-file-list="false"
                    accept="image/*"
                  >
                    <template #upload-button>
                      <a-button size="small">
                        <template #icon>
                          <icon-swap />
                        </template>
                        {{ t('liveRoomForm.replace') }}
                      </a-button>
                    </template>
                  </a-upload>
                </div>
              </div>
            </div>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('liveRoomForm.isRecord')" field="isRecord">
            <a-switch v-model="formData.isRecord" :checked-value="'Y'" :unchecked-value="'N'" />
            <div class="form-tip">{{ t('liveRoomForm.isRecordTips') }}</div>
          </a-form-item>
          <!-- 开启录制时选择录制存储位置（云盘文件夹） -->
          <a-form-item v-if="formData.isRecord === 'Y'" :label="t('liveRoomForm.recordFolder')" field="recordFolderId">
            <CloudFolderSelect
              v-model="formData.recordFolderId"
              :root-label="t('liveRoomForm.storageFolderRoot')"
              :placeholder="t('liveRoomForm.recordFolderPlaceholder')"
            />
            <div class="form-tip">{{ t('liveRoomForm.recordFolderTips') }}</div>
          </a-form-item>
          <a-form-item :label="t('liveRoomForm.isClip')" field="isClip">
            <a-switch v-model="formData.isClip" :checked-value="'Y'" :unchecked-value="'N'" />
            <div class="form-tip">{{ t('liveRoomForm.isClipTips') }}</div>
          </a-form-item>
          <!-- 开启切片时选择切片存储位置（云盘文件夹） -->
          <a-form-item v-if="formData.isClip === 'Y'" :label="t('liveRoomForm.clipFolder')" field="clipFolderId">
            <CloudFolderSelect
              v-model="formData.clipFolderId"
              :root-label="t('liveRoomForm.storageFolderRoot')"
              :placeholder="t('liveRoomForm.clipFolderPlaceholder')"
            />
            <div class="form-tip">{{ t('liveRoomForm.clipFolderTips') }}</div>
          </a-form-item>
        </a-col>
      </a-row>

      <!-- 描述 -->
      <div class="form-section-title">{{ t('liveRoomForm.sectionDesc') }}</div>
      <a-row :gutter="24">
        <a-col :span="24">
          <a-form-item :label="t('liveRoomForm.description')" field="description">
            <a-textarea
              v-model="formData.description"
              :max-length="1000"
              show-word-limit
              :placeholder="t('liveRoomForm.descriptionPlaceholder')"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
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
      // 编辑时不动这些通用/状态字段，避免重置直播阶段/观看·回放方式/状态
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
  padding: 16px;
  background: #fff;
  overflow-y: auto;
  height: calc(100vh - 140px);
  min-height: 600px;

  :deep(.arco-form-item) {
    margin-bottom: 16px;
  }

  :deep(.arco-alert) {
    padding: 8px 12px;
    font-size: 13px;
  }

  :deep(.arco-radio-group) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
  }

  :deep(.arco-radio) {
    margin-right: 0;
  }

  :deep(.arco-form-label-item) {
    margin-bottom: 4px;
  }

  .form-section-title {
    font-size: 14px;
    font-weight: 600;
    color: #1d2129;
    margin: 20px 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f0f0;
  }

  .form-tip {
    margin-top: 4px;
    font-size: 12px;
    color: #86909c;
    line-height: 1.4;
  }

  .cover-upload-wrapper {
    .upload-area {
      width: 180px;
      height: 100px;
      border: 1px dashed #c9cdd4;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: #165dff;
        color: #165dff;
      }

      .arco-icon {
        font-size: 28px;
        margin-bottom: 6px;
      }
    }

    .cover-preview {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .cover-actions {
        display: flex;
        gap: 8px;
      }
    }
  }

  .form-header {
    margin-bottom: 16px;
    text-align: left;
  }
}
</style>