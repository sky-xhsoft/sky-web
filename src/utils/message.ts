/**
 * Message 提示工具 - 统一配置显示位置
 */
import { Message as ArcoMessage } from '@arco-design/web-vue'

// 创建一个自定义的 Message 对象，所有方法都添加位置配置
export const Message = {
  info(content: string) {
    return ArcoMessage.info({
      content,
      position: 'top',
      duration: 3000
    })
  },

  success(content: string) {
    return ArcoMessage.success({
      content,
      position: 'top',
      duration: 3000
    })
  },

  warning(content: string) {
    return ArcoMessage.warning({
      content,
      position: 'top',
      duration: 3000
    })
  },

  error(content: string) {
    return ArcoMessage.error({
      content,
      position: 'top',
      duration: 3000
    })
  }
}
