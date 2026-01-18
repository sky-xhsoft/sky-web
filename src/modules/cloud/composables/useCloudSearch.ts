/**
 * 云盘搜索 Composable
 *
 * 封装文件搜索逻辑，支持模糊搜索（Fuse.js）
 */

import { ref, computed, watch } from 'vue'
import Fuse from 'fuse.js'
import { useCloudStore } from '@/modules/cloud/stores/cloudStore'
import { searchFiles } from '@/modules/cloud/api'
import type { FileItem, FileSearchParams } from '@/modules/cloud/types'
import { debounce, memoize } from '@/modules/cloud/utils/performance'

/**
 * Fuse.js 配置
 */
const FUSE_OPTIONS: Fuse.IFuseOptions<FileItem> = {
  keys: [
    { name: 'FileName', weight: 0.7 },
    { name: 'FileType', weight: 0.2 },
    { name: 'Tags', weight: 0.1 },
  ],
  threshold: 0.4,
  distance: 100,
  minMatchCharLength: 2,
  includeScore: true,
  includeMatches: true,
  ignoreLocation: true,
  useExtendedSearch: false,
}

/**
 * 云盘搜索功能
 */
export function useCloudSearch() {
  const store = useCloudStore()

  const searchQuery = computed({
    get: () => store.searchQuery,
    set: (value) => store.setSearchQuery(value),
  })
  const searching = ref(false)
  const searchResults = ref<FileItem[]>([])
  const fuzzySearchEnabled = ref(true)

  const searchFolderId = ref<number>()
  const searchFileType = ref<string>()

  let fuseInstance: Fuse<FileItem> | null = null

  function getFuseInstance(): Fuse<FileItem> {
    if (!fuseInstance || fuseInstance.getIndex().size !== store.files.length) {
      fuseInstance = new Fuse(store.files, FUSE_OPTIONS)
    }
    return fuseInstance
  }

  function searchFuzzy(query: string): FileItem[] {
    if (!query.trim()) return store.files

    const fuse = getFuseInstance()
    const results = fuse.search(query)

    return results.map((result) => ({
      ...result.item,
      _searchScore: result.score,
      _searchMatches: result.matches,
    }))
  }

  function searchExact(query: string): FileItem[] {
    if (!query.trim()) return store.files

    const lowerQuery = query.toLowerCase()
    return store.files.filter((file) => {
      return file.FileName.toLowerCase().includes(lowerQuery)
    })
  }

  function searchLocal(query: string): FileItem[] {
    store.setSearchQuery(query)

    if (!query.trim()) {
      return store.filteredAndSortedFiles
    }

    const results = fuzzySearchEnabled.value
      ? searchFuzzy(query)
      : searchExact(query)

    let filtered = results

    if (searchFileType.value) {
      filtered = filtered.filter((file) =>
        file.FileType?.toLowerCase().includes(searchFileType.value!.toLowerCase())
      )
    }

    if (searchFolderId.value !== undefined) {
      filtered = filtered.filter((file) => file.FolderId === searchFolderId.value)
    }

    return filtered
  }

  async function searchRemote(params: FileSearchParams) {
    searching.value = true
    try {
      const results = await searchFiles(params)
      searchResults.value = results
      return results
    } catch (e: any) {
      console.error('搜索失败:', e)
      searchResults.value = []
      return []
    } finally {
      searching.value = false
    }
  }

  async function search(query: string, useBackend = false) {
    if (!query.trim()) {
      clearSearch()
      return []
    }

    if (useBackend) {
      return await searchRemote({
        keyword: query,
        folderId: searchFolderId.value,
        fileType: searchFileType.value,
      })
    } else {
      return searchLocal(query)
    }
  }

  function clearSearch() {
    store.setSearchQuery('')
    searchResults.value = []
    searchFolderId.value = undefined
    searchFileType.value = undefined
  }

  function highlightKeyword(
    text: string,
    keyword: string,
    matches?: readonly Fuse.FuseResultMatch[]
  ): string {
    if (!keyword.trim()) return text

    if (matches && matches.length > 0) {
      const textMatches = matches.filter((m) => m.key === 'FileName')
      if (textMatches.length > 0 && textMatches[0].indices) {
        let result = ''
        let lastIndex = 0

        textMatches[0].indices.forEach(([start, end]) => {
          result += text.slice(lastIndex, start)
          result += `<mark>${text.slice(start, end + 1)}</mark>`
          lastIndex = end + 1
        })
        result += text.slice(lastIndex)

        return result
      }
    }

    const regex = new RegExp(`(${keyword})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  function filterByType(fileType: string) {
    searchFileType.value = fileType
  }

  function filterByFolder(folderId: number) {
    searchFolderId.value = folderId
  }

  function toggleFuzzySearch(enabled: boolean) {
    fuzzySearchEnabled.value = enabled
    if (searchQuery.value) {
      searchLocal(searchQuery.value)
    }
  }

  const getSearchSuggestions = memoize(
    (query: string, limit = 5): string[] => {
      if (!query.trim()) return []

      if (fuzzySearchEnabled.value) {
        const fuse = getFuseInstance()
        const results = fuse.search(query, { limit })
        return results.map((result) => {
          return result.item.FileName.replace(/.[^.]+$/, '')
        })
      } else {
        const lowerQuery = query.toLowerCase()
        const suggestions = new Set<string>()

        store.files.forEach((file) => {
          const fileName = file.FileName.toLowerCase()
          if (fileName.includes(lowerQuery)) {
            const nameWithoutExt = file.FileName.replace(/.[^.]+$/, '')
            suggestions.add(nameWithoutExt)
          }
        })

        return Array.from(suggestions).slice(0, limit)
      }
    },
    (query, limit) => `${query}-${limit}-${fuzzySearchEnabled.value}`
  )

  function getPopularSearches(limit = 10): FileItem[] {
    return [...store.files]
      .sort((a, b) => {
        const aTime = new Date(a.CreateTime || 0).getTime()
        const bTime = new Date(b.CreateTime || 0).getTime()
        return bTime - aTime
      })
      .slice(0, limit)
  }

  const resultCount = computed(() => {
    if (!searchQuery.value) return 0
    return searchLocal(searchQuery.value).length
  })

  const hasResults = computed(() => resultCount.value > 0)

  const isSearching = computed(() => searching.value || !!searchQuery.value)

  const searchSummary = computed(() => {
    if (!searchQuery.value) return ''
    const mode = fuzzySearchEnabled.value ? '模糊' : '精确'
    return `${mode}搜索找到 ${resultCount.value} 个结果`
  })

  const debouncedSearchLocal = debounce((query: string) => {
    if (query.trim()) {
      searchLocal(query)
    }
  }, 300)

  watch(searchQuery, (newQuery) => {
    debouncedSearchLocal(newQuery)
  })

  watch(
    () => store.files.length,
    () => {
      fuseInstance = null
    }
  )

  return {
    search,
    searchLocal,
    searchRemote,
    searchFuzzy,
    searchExact,
    clearSearch,

    filterByType,
    filterByFolder,
    toggleFuzzySearch,

    highlightKeyword,
    getSearchSuggestions,
    getPopularSearches,

    searchQuery,
    searching,
    searchResults,
    searchFolderId,
    searchFileType,
    fuzzySearchEnabled,

    resultCount,
    hasResults,
    isSearching,
    searchSummary,

    filteredAndSortedFiles: () => store.filteredAndSortedFiles,
  }
}

export default useCloudSearch
