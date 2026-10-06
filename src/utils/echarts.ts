/**
 * ECharts 按需引入：只注册项目用到的图表与组件（整包约 1.1MB）
 * 新增图表类型时在此注册，用法与整包相同：import * as echarts from '@/utils/echarts'
 */
import { use } from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TitleComponent, TooltipComponent, AxisPointerComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([BarChart, LineChart, GridComponent, LegendComponent, TitleComponent, TooltipComponent, AxisPointerComponent, CanvasRenderer])

export * from 'echarts/core'
