<template>
  <V2Modal
    :visible="visible"
    title="新建存储桶"
    :width="480"
    :ok-loading="saving"
    ok-text="创建"
    unmount-on-close
    @ok="submit"
    @cancel="$emit('update:visible', false)"
    @update:visible="$emit('update:visible', $event)"
  >
    <a-form ref="formRef" :model="form" layout="vertical">
      <a-form-item field="bucket" label="存储桶名称" :rules="nameRules" validate-trigger="blur">
        <a-input v-model="form.bucket" placeholder="小写字母、数字和 -，如 live-record" :max-length="50" allow-clear>
          <template v-if="appId" #suffix><span class="ccb-suffix">-{{ appId }}</span></template>
        </a-input>
        <template #extra>全局唯一，创建后不能修改</template>
      </a-form-item>
      <a-form-item field="region" label="地域" :rules="[{ required: true, message: '请选择地域' }]">
        <a-select v-model="form.region" :options="regionOptions" allow-search placeholder="选择地域" />
        <template #extra>创建后不能修改</template>
      </a-form-item>
    </a-form>
    <div class="ccb-warn">
      存储桶将设为<b>公开读写</b>，并允许所有来源跨域访问（CORS 全部为 *）。任何人都可以读取、上传、覆盖、删除其中的文件，
      产生的存储和流量费用计入本公司云账号。
    </div>
  </V2Modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { V2Modal } from '@/components/ui'
import { createCosBucket } from '@/api/liveTemplate'

// 新建结果：fullName 为含 -APPID 的完整名称（云盘接口直接返回完整名称 bucket）
type CreatedBucket = { bucket: string; region: string; fullName?: string }

// appId：账号 APPID（取自现有存储桶，没有时用户需输入完整名称）；regions：账号已有存储桶的地域；
// create：创建接口，默认录制模板的接口（公司直播密钥），公司配置传入云盘存储的接口
const props = defineProps<{
  visible: boolean
  defaultRegion?: string
  appId?: string
  regions?: string[]
  create?: (data: { bucket: string; region: string }) => Promise<CreatedBucket>
}>()
const emit = defineEmits<{ 'update:visible': [boolean]; created: [any] }>()

// 腾讯云 COS 常用地域
const COMMON_REGIONS: [string, string][] = [
  ['ap-beijing', '北京'], ['ap-nanjing', '南京'], ['ap-shanghai', '上海'], ['ap-guangzhou', '广州'],
  ['ap-chengdu', '成都'], ['ap-chongqing', '重庆'], ['ap-hongkong', '中国香港'], ['ap-singapore', '新加坡'],
]

const formRef = ref()
const saving = ref(false)
const form = reactive({ bucket: '', region: '' })

const regionOptions = computed(() => {
  const known = new Map(COMMON_REGIONS)
  const values = [...new Set([...(props.regions || []), ...known.keys()])]
  return values.map((r) => ({ value: r, label: known.has(r) ? `${known.get(r)}（${r}）` : r }))
})
const nameRules = [
  { required: true, message: '请输入存储桶名称' },
  {
    validator: (v: string, cb: (e?: string) => void) => {
      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test((v || '').trim())) return cb('只能包含小写字母、数字和 -，且不能以 - 开头或结尾')
      if (!props.appId && !/-\d{10}$/.test(v.trim())) return cb('账号下还没有存储桶，请输入完整名称（名称-APPID）')
      cb()
    },
  },
]

watch(
  () => props.visible,
  (open) => {
    if (!open) return
    form.bucket = ''
    form.region = props.defaultRegion && regionOptions.value.some((o) => o.value === props.defaultRegion) ? props.defaultRegion : 'ap-nanjing'
  },
  { immediate: true },
)

const submit = async () => {
  if (await formRef.value?.validate()) return
  saving.value = true
  try {
    const created: CreatedBucket = await (props.create || createCosBucket)({ bucket: form.bucket.trim(), region: form.region })
    Message.success(`已创建存储桶 ${created.fullName || created.bucket}`)
    emit('created', created)
    emit('update:visible', false)
  } catch (e: any) {
    Message.error(e?.response?.data?.message || e?.message || '创建存储桶失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.ccb-suffix { color: var(--color-text-3); font-family: Consolas, 'Cascadia Mono', monospace; }
.ccb-warn { padding: 10px 14px; border-radius: 6px; background: rgb(var(--warning-1)); color: var(--color-text-2); font-size: 13px; line-height: 1.7; }
</style>
