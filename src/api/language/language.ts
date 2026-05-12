import api from '@/api/http'

// 语言配置类型
export interface Language {
  id?: number
  code: string
  name: string
  isDefault?: string
  isActive?: string
  sysCompanyId?: number
  createBy?: string
  createTime?: string
  updateBy?: string
  updateTime?: string
}

// 翻译配置类型
export interface Translation {
  id?: number
  key: string
  language: string
  value: string
  module?: string
  isActive?: string
  sysCompanyId?: number
  createBy?: string
  createTime?: string
  updateBy?: string
  updateTime?: string
}

// 翻译列表请求
export interface ListTranslationsRequest {
  language?: string
  module?: string
  page?: number
  pageSize?: number
}

// 翻译列表响应
export interface ListTranslationsResponse {
  items: Translation[]
  total: number
  page: number
  pageSize: number
}

// 添加翻译请求
export interface AddTranslationRequest {
  key: string
  language: string
  value: string
  module?: string
}

// 更新翻译请求
export interface UpdateTranslationRequest {
  id: number
  key: string
  language: string
  value: string
  module?: string
}

// 获取语言列表
export async function listLanguages(): Promise<Language[]> {
  const res = await api.get('/api/v1/languages')
  return res.data
}

// 获取翻译列表
export async function listTranslations(
  params?: ListTranslationsRequest
): Promise<ListTranslationsResponse> {
  const res = await api.get('/api/v1/languages/translations', { params })
  return res.data
}

// 获取单个翻译
export async function getTranslation(key: string, language?: string): Promise<Translation | null> {
  const res = await api.get(`/api/v1/languages/translations/${key}`, {
    params: { language },
  })
  return res.data
}

// 添加翻译
export async function addTranslation(request: AddTranslationRequest): Promise<Translation> {
  try {
    const res = await api.post('/api/v1/languages/translations', request)
    return res.data
  } catch (e) {
    console.error('添加翻译失败:', e)
    throw e
  }
}

// 更新翻译
export async function updateTranslation(request: UpdateTranslationRequest): Promise<Translation> {
  try {
    const res = await api.put(`/api/v1/languages/translations/${request.id}`, request)
    return res.data
  } catch (e) {
    console.error('更新翻译失败:', e)
    throw e
  }
}

// 删除翻译
export async function deleteTranslation(id: number): Promise<void> {
  try {
    await api.delete(`/api/v1/languages/translations/${id}`)
  } catch (e) {
    console.error('删除翻译失败:', e)
    throw e
  }
}

// 导出翻译
export async function exportTranslations(language: string): Promise<Blob> {
  try {
    const res = await api.get('/api/v1/languages/translations/export', {
      params: { language },
      responseType: 'blob',
    })
    return res.data
  } catch (e) {
    console.error('导出翻译失败:', e)
    throw e
  }
}

// 导入翻译
export async function importTranslations(file: File, language: string): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('language', language)

  try {
    await api.post('/api/v1/languages/translations/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  } catch (e) {
    console.error('导入翻译失败:', e)
    throw e
  }
}
