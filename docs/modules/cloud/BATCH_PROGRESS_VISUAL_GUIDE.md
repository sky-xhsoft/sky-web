# Batch Progress Dialog - Visual Guide

## Component Preview

```
┌─────────────────────────────────────────────────────────┐
│  批量操作进度                                      ✕   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ████████████████████░░░░░░░░░░░░  60%                 │
│  正在处理: 3 / 5                                        │
│                                                         │
│  ┌────────────┬────────────┬────────────┐              │
│  │   成功     │   失败     │   总计     │              │
│  │            │            │            │              │
│  │     3      │     2      │     5      │              │
│  └────────────┴────────────┴────────────┘              │
│                                                         │
│  ⚠ 以下 2 项操作失败                                    │
│  ┌───────────────────────────────────────────────┐     │
│  │ ✕ file_123                                    │     │
│  │ ✕ folder_456                                  │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│              [ 确定 ]  [ 重试失败项 ]                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## State Transitions

### 1. In Progress
```
Progress: ████████░░░░░░░░░░  40%
Status: 正在处理: 2 / 5
Success: 2  |  Failed: 0  |  Total: 5
[Dialog cannot be closed]
```

### 2. Completed Successfully
```
Progress: ████████████████████  100% ✓
Status: 全部完成！成功处理 5 项
Success: 5  |  Failed: 0  |  Total: 5
[Confirm button enabled]
```

### 3. Completed with Failures
```
Progress: ████████████████████  100% ⚠
Status: 处理完成：成功 3 项，失败 2 项
Success: 3  |  Failed: 2  |  Total: 5
Failed Items List:
  ✕ file_123
  ✕ folder_456
[Confirm and Retry buttons enabled]
```

## Color Scheme

### Progress Bar
- **In Progress**: Blue (#165DFF)
- **Success**: Green (#00B42A)
- **Warning**: Orange (#FF7D00)

### Statistics Cards
- **Success Count**: Green text
- **Failed Count**: Red text
- **Total Count**: Blue text

### Failed Items
- **Background**: Light gray (#F7F8FA)
- **Icon**: Red (#F53F3F)
- **Text**: Dark gray (#4E5969)

## Interaction Flow

```
User Action: Click "Delete" on selected items
     ↓
System: Show confirmation dialog
     ↓
User Action: Confirm deletion
     ↓
System: Show progress dialog (inProgress: true)
     ↓
System: Call batch delete API
     ↓
System: Update progress state with results
     ↓
System: Set inProgress to false
     ↓
System: Show success/warning message
     ↓
System: Refresh data
     ↓
User Action: Click "Confirm" to close
     ↓
System: Close dialog
```

## Props Overview

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| visible | Boolean | - | Controls dialog visibility |
| title | String | '批量操作进度' | Dialog title |
| total | Number | - | Total items to process |
| completed | Number | - | Items completed |
| successCount | Number | - | Successful operations |
| failed | Number | - | Failed operations |
| failedItems | Array | [] | List of failed item names |
| inProgress | Boolean | - | Operation in progress |
| autoClose | Boolean | false | Auto-close on success |
| autoCloseDelay | Number | 2000 | Delay before auto-close (ms) |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| update:visible | Boolean | Visibility change |
| close | - | Dialog closed |
| retry | - | Retry button clicked |

## Usage Example

```vue
<template>
  <CloudBatchProgressDialog
    v-model:visible="progressVisible"
    title="批量删除进度"
    :total="10"
    :completed="7"
    :success-count="5"
    :failed="2"
    :failed-items="['file_1', 'folder_2']"
    :in-progress="false"
    @close="handleClose"
    @retry="handleRetry"
  />
</template>

<script setup>
const progressVisible = ref(false)

function handleClose() {
  console.log('Dialog closed')
}

function handleRetry() {
  console.log('Retry failed items')
}
</script>
```

## Responsive Behavior

### Desktop (> 600px)
- Dialog width: 600px
- Failed items list: max-height 200px with scroll

### Mobile (< 600px)
- Dialog adapts to screen width
- Statistics cards remain horizontal
- Failed items list still scrollable

## Accessibility Features

✅ Keyboard navigation support
✅ Screen reader announcements
✅ Focus management
✅ Semantic HTML
✅ ARIA labels
✅ Color + Icon + Text indicators

## Browser Support

✅ Chrome (latest)
✅ Firefox (latest)
✅ Safari (latest)
✅ Edge (latest)
✅ Mobile browsers

