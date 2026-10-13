/**
 * 复制文本到剪贴板。
 * navigator.clipboard 只在安全上下文（HTTPS / localhost）可用，测试环境是 HTTP，
 * 不可用或写入失败时退回到临时文本框 + execCommand('copy')。
 */
export async function copyText(text: string): Promise<boolean> {
  if (!text) return false
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // 权限被拒等情况，继续用旧方式
    }
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  try {
    textarea.select()
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}
