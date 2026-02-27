<template>
  <div class="live-room-form">
    <a-alert type="info" show-icon style="margin-bottom: 16px">
      请您遵守国家相关规定，禁止发布含有违法、违规、低俗、暴力、色情、虚假宣传等内容的直播。微赞将会对直播内容进行监管，如发现违规行为将会对直播内容进行下架、封禁等操作
    </a-alert>

    <a-form :model="formData" :rules="rules" ref="formRef" layout="vertical" size="small">
      <a-row :gutter="24">
        <!-- 左列 -->
        <a-col :span="12">
          <!-- 直播类型 -->
          <a-form-item label="直播类型" field="roomType" required>
            <a-radio-group v-model="formData.roomType">
              <a-radio value="video">
                <icon-video-camera />
                视频直播
              </a-radio>
            </a-radio-group>
          </a-form-item>

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

          <!-- 直播阶段 -->
          <a-form-item label="直播阶段" field="roomStage" required>
            <a-radio-group v-model="formData.roomStage">
              <a-radio value="formal">正式直播</a-radio>
              <a-radio value="test">测试直播</a-radio>
            </a-radio-group>
            <div class="form-tip" v-if="formData.roomStage === 'test'">
              测试直播提前播前进行开播测试，观众无法观看直播画面，测试直播不支持点播/录播以及直播
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
            <div class="form-tip">
              本场直播将于{{ formatStartTime }}开播
              <a-link @click="showScheduleModal = true">设置开播提醒</a-link>
            </div>
          </a-form-item>

          <!-- 显示模式 -->
          <a-form-item label="显示模式" field="displayMode">
            <a-radio-group v-model="formData.displayMode">
              <a-radio value="landscape">横屏</a-radio>
              <a-radio value="portrait">竖屏</a-radio>
              <a-radio value="three_screen">三分屏</a-radio>
            </a-radio-group>
            <div class="form-tip">
              比例为16:9，视野相对开阔，适用于空间层次感更丰富，纵深感强的场景
            </div>
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

        <!-- 右列 -->
        <a-col :span="12">
          <!-- 观看方式 -->
          <a-form-item label="观看方式">
            <a-radio-group v-model="formData.viewingMethod">
              <a-radio value="public">
                <icon-eye />
                公开
              </a-radio>
              <a-radio value="encrypted">
                <icon-lock />
                加密
              </a-radio>
              <a-radio value="paid">
                <icon-yuan />
                付费
              </a-radio>
              <a-radio value="ticket">
                <icon-ticket />
                购票进入
              </a-radio>
              <a-radio value="enterprise">
                <icon-user-group />
                企业成员观看
              </a-radio>
              <a-radio value="custom">
                <icon-user />
                自建成员观看
              </a-radio>
            </a-radio-group>
            <div class="form-tip" v-if="formData.viewingMethod === 'public'">
              公开直播，所有人可以进来观看
            </div>
          </a-form-item>

          <!-- 观看密码（加密时显示） -->
          <a-form-item
            v-if="formData.viewingMethod === 'encrypted'"
            label="观看密码"
            field="viewingPassword"
          >
            <a-input-password v-model="formData.viewingPassword" placeholder="请输入观看密码" />
          </a-form-item>

          <!-- 观看价格（付费时显示） -->
          <a-form-item
            v-if="formData.viewingMethod === 'paid'"
            label="观看价格"
            field="viewingPrice"
          >
            <a-input-number v-model="formData.viewingPrice" placeholder="请输入价格">
              <template #prefix>¥</template>
            </a-input-number>
          </a-form-item>

          <!-- 回放方式 -->
          <a-form-item label="回放方式">
            <a-radio-group v-model="formData.playbackMethod">
              <a-radio value="post_end">结束后回放</a-radio>
              <a-radio value="real_time">实时回放</a-radio>
              <a-radio value="no_playback">结束后不回放</a-radio>
            </a-radio-group>
            <div class="form-tip" v-if="formData.playbackMethod === 'post_end'">
              结束后直播后才生成并播放回放视频
            </div>
          </a-form-item>

          <!-- 回放有效期 -->
          <a-form-item label="回放有效期" v-if="formData.playbackMethod !== 'no_playback'">
            <a-radio-group v-model="formData.playbackValidity">
              <a-radio value="unlimited">无限制</a-radio>
              <a-radio value="all_day">全天</a-radio>
              <a-radio value="partial">部分时段</a-radio>
            </a-radio-group>
          </a-form-item>

          <!-- 回放时段（部分时段时显示） -->
          <a-form-item
            v-if="formData.playbackValidity === 'partial'"
            label="回放时段"
          >
            <a-space>
              <a-time-picker v-model="formData.playbackStartTime" placeholder="开始时间" />
              <span>至</span>
              <a-time-picker v-model="formData.playbackEndTime" placeholder="结束时间" />
            </a-space>
          </a-form-item>

          <!-- 直播间描述 -->
          <a-form-item label="直播间描述" field="description">
            <a-textarea
              v-model="formData.description"
              placeholder="请输入直播间描述"
              :max-length="500"
              show-word-limit
              :auto-size="{ minRows: 3, maxRows: 5 }"
            />
          </a-form-item>

          <!-- 签到活动 -->
          <a-form-item label="签到活动">
            <a-link @click="showSignInModal = true">
              <icon-plus />
              创建活动
            </a-link>
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>

    <!-- 底部按钮 -->
    <div class="form-footer">
      <a-space>
        <a-button @click="handleCancel">返回</a-button>
        <a-button type="primary" @click="handleSubmit" :loading="submitting">
          立即创建
        </a-button>
      </a-space>
    </div>
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
const showScheduleModal = ref(false)
const showSignInModal = ref(false)

const isEditMode = computed(() => !!props.roomId)
const pageTitle = computed(() => isEditMode.value ? '编辑直播间' : '创建直播间')

const formData = reactive({
  roomType: 'video',
  broadcastFormat: 'live',
  roomStage: 'formal',
  roomName: '',
  startTime: '',
  displayMode: 'landscape',
  coverImage: '',
  viewingMethod: 'public',
  viewingPassword: '',
  viewingPrice: undefined,
  playbackMethod: 'post_end',
  playbackValidity: 'unlimited',
  playbackStartTime: '',
  playbackEndTime: '',
  description: ''
})

const rules = {
  roomType: [{ required: true, message: '请选择直播类型' }],
  broadcastFormat: [{ required: true, message: '请选择直播形式' }],
  roomStage: [{ required: true, message: '请选择直播阶段' }],
  roomName: [
    { required: true, message: '请输入直播名称' },
    { max: 100, message: '直播名称不能超过100字' }
  ],
  startTime: [{ required: true, message: '请选择开始时间' }]
}

const formatStartTime = computed(() => {
  if (!formData.startTime) return ''
  return dayjs(formData.startTime).format('YYYY年MM月DD日 HH:mm:ss')
})

// 加载直播间数据（编辑模式）
const loadRoomData = async () => {
  if (!isEditMode.value) return

  try {
    const response = await api.get(`/data/LIVE_ROOM/${props.roomId}`)

    if (response.data?.data) {
      const data = response.data.data
      // 将大写下划线格式转换为驼峰命名
      formData.roomName = data.ROOM_NAME || ''
      formData.roomType = data.ROOM_TYPE || 'video'
      formData.broadcastFormat = data.BROADCAST_FORMAT || 'live'
      formData.roomStage = data.ROOM_STAGE || 'formal'
      formData.displayMode = data.DISPLAY_MODE || 'landscape'
      formData.startTime = data.START_TIME || ''
      formData.endTime = data.END_TIME || ''
      formData.coverImage = data.COVER_IMAGE || ''
      formData.viewingMethod = data.VIEWING_METHOD || 'public'
      formData.viewingPassword = data.VIEWING_PASSWORD || ''
      formData.viewingPrice = data.VIEWING_PRICE
      formData.playbackMethod = data.PLAYBACK_METHOD || 'post_end'
      formData.playbackValidity = data.PLAYBACK_VALIDITY || 'unlimited'
      formData.playbackStartTime = data.PLAYBACK_START_TIME || ''
      formData.playbackEndTime = data.PLAYBACK_END_TIME || ''
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
      ROOM_TYPE: formData.roomType,
      BROADCAST_FORMAT: formData.broadcastFormat,
      ROOM_STAGE: formData.roomStage,
      DISPLAY_MODE: formData.displayMode,
      START_TIME: formatDateTime(formData.startTime),
      END_TIME: formatDateTime(formData.endTime),
      COVER_IMAGE: formData.coverImage,
      VIEWING_METHOD: formData.viewingMethod,
      VIEWING_PASSWORD: formData.viewingPassword,
      VIEWING_PRICE: formData.viewingPrice,
      PLAYBACK_METHOD: formData.playbackMethod,
      PLAYBACK_VALIDITY: formData.playbackValidity,
      PLAYBACK_START_TIME: formData.playbackStartTime,
      PLAYBACK_END_TIME: formData.playbackEndTime,
      DESCRIPTION: formData.description
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

  .form-footer {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #e5e6eb;
    text-align: right;
  }
}
</style>
