<template>
  <div class="live-room-form">
    <!-- 左上角按钮 -->
    <div class="form-header">
      <a-space>
        <a-button @click="handleCancel">返回</a-button>
        <a-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEditMode ? '修改' : '立即创建' }}
        </a-button>
      </a-space>
    </div>

    <a-alert type="info" show-icon style="margin-bottom: 16px">
      请您遵守国家相关规定，禁止发布含有违法、违规、低俗、暴力、色情、虚假宣传等内容的直播。Zigebo将会对直播内容进行监管，如发现违规行为将会对直播内容进行下架、封禁等操作
    </a-alert>

    <a-form :model="formData" :rules="rules" ref="formRef" layout="vertical" size="small">
      <a-row :gutter="24">
        <!-- 左列 -->
        <a-col :span="12">
          <!-- 直播形式 -->
          <a-form-item label="直播形式" field="broadcastFormat" required>
            <a-radio-group v-model="formData.broadcastFormat">
              <a-radio value="live">直播</a-radio>
              <a-radio value="vod">点播/录播</a-radio>
              <a-radio value="pseudo">伪直播</a-radio>
            </a-radio-group>
            <div class="form-tip" v-if="formData.broadcastFormat === 'live'">
              实时直播形式，根据实际画面进行传播，无法快进或回放
            </div>
          </a-form-item>

          <!-- 直播名称 -->
          <a-form-item label="直播名称" field="roomName" required>
            <a-input
              v-model="formData.roomName"
              placeholder="请输入直播名称，100字内"
              :max-length="100"
              show-word-limit
            />
          </a-form-item>

          <!-- 开始时间 -->
          <a-form-item label="开始时间" field="startTime" required>
            <a-date-picker
              v-model="formData.startTime"
              show-time
              format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </a-form-item>

          <!-- 直播封面 -->
          <a-form-item label="直播封面" field="coverImage">
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
                    <div>选择图片</div>
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
                    删除
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
                        更换
                      </a-button>
                    </template>
                  </a-upload>
                </div>
              </div>
            </div>
            <div class="form-tip">推荐图片尺寸为：1000*562 支持JPG、PNG格式</div>
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useNavigationStore } from '../stores/navigation'
import api from '../api/http'
import dayjs from 'dayjs'

// 接收 props（从 BasicLayout 传递）
const props = defineProps<{
  roomId?: string
}>()

const navigationStore = useNavigationStore()
const formRef = ref()
const submitting = ref(false)

const isEditMode = computed(() => !!props.roomId)
const pageTitle = computed(() => isEditMode.value ? '编辑直播间' : '创建直播间')

const formData = reactive({
  broadcastFormat: 'live',
  roomName: '',
  startTime: '',
  coverImage: ''
})

const rules = {
  broadcastFormat: [{ required: true, message: '请选择直播形式' }],
  roomName: [
    { required: true, message: '请输入直播名称' },
    { max: 100, message: '直播名称不能超过100字' }
  ],
  startTime: [{ required: true, message: '请选择开始时间' }]
}

// 加载直播间数据（编辑模式）
const loadRoomData = async () => {
  if (!isEditMode.value) return

  try {
    const response = await api.get(`/data/LIVE_ROOM/${props.roomId}`)

    if (response.data?.data) {
      const data = response.data.data
      // 将大写下划线格式转换为驼峰命名
      formData.roomName = data.ROOM_NAME || ''
      formData.broadcastFormat = data.BROADCAST_FORMAT || 'live'
      formData.startTime = data.START_TIME || ''
      formData.coverImage = data.COVER_IMAGE || ''
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
  Message.success('已删除封面')
}

const handleUpload = async (option: any) => {
  const { fileItem, onSuccess, onError } = option

  try {
    const uploadFormData = new FormData()
    uploadFormData.append('file', fileItem.file)
    uploadFormData.append('category', 'live_cover') // 文件分类

    // 调用后端上传接口
    const response = await api.post('/files/upload', uploadFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    console.log('上传响应:', response.data)

    if (response.data && response.data.code === 0) {
      const fileData = response.data.data
      // 后端返回的是小驼峰格式，直接使用 accessUrl 字段
      const imageUrl = fileData.accessUrl
      console.log('设置图片URL:', imageUrl)

      formData.coverImage = imageUrl

      onSuccess()
      Message.success('上传成功')
    } else {
      throw new Error(response.data?.message || '上传失败')
    }
  } catch (error: any) {
    console.error('上传失败:', error)
    onError(error)
    Message.error(error.message || '上传失败')
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    submitting.value = true

    // 转换日期时间格式为 MySQL 格式 (YYYY-MM-DD HH:MM:SS)
    const formatDateTime = (dateTime: string) => {
      if (!dateTime) return null
      console.log('原始时间:', dateTime)
      const formatted = dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss')
      console.log('格式化后:', formatted)
      return formatted
    }

    // 将驼峰命名转换为大写下划线格式
    const requestData = {
      ROOM_NAME: formData.roomName,
      BROADCAST_FORMAT: formData.broadcastFormat,
      START_TIME: formatDateTime(formData.startTime),
      COVER_IMAGE: formData.coverImage
    }

    console.log('提交的数据:', requestData)

    if (isEditMode.value) {
      // 使用标准的更新接口
      await api.put(`/data/LIVE_ROOM/${props.roomId}`, requestData)
      Message.success('更新成功')
    } else {
      // 使用标准的创建接口
      await api.post('/data/LIVE_ROOM', requestData)
      Message.success('创建成功')
    }

    navigationStore.goBack()
  } catch (error: any) {
    console.error('操作失败:', error)
    Message.error(error.message || (isEditMode.value ? '更新失败' : '创建失败'))
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  navigationStore.goBack()
}

onMounted(() => {
  loadRoomData()
})
</script>

<style scoped lang="scss">
.live-room-form {
  padding: 16px;
  background: #fff;
  overflow-y: auto;
  height: calc(100vh - 140px);
  min-height: 600px;

  // 紧凑布局
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
