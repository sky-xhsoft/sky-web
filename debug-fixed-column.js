// 在浏览器控制台运行这段代码来检查固定列配置
console.log('=== 检查操作列配置 ===');

// 1. 检查 Vue 组件数据
const app = document.querySelector('#app').__vueParentComponent;
console.log('App instance:', app);

// 2. 检查表格列配置
const tableCells = document.querySelectorAll('.arco-table-th');
tableCells.forEach((cell, index) => {
    const text = cell.textContent.trim();
    const isFixed = cell.classList.contains('arco-table-col-fixed-right') || 
                    cell.classList.contains('arco-table-cell-fixed-right');
    console.log(`列 ${index}: ${text}, 是否固定右侧: ${isFixed}, 类名: ${cell.className}`);
});

// 3. 检查操作列
const actionHeader = Array.from(tableCells).find(cell => cell.textContent.trim() === '操作');
if (actionHeader) {
    console.log('操作列表头:', {
        className: actionHeader.className,
        style: actionHeader.getAttribute('style'),
        computedStyle: {
            position: getComputedStyle(actionHeader).position,
            right: getComputedStyle(actionHeader).right,
            zIndex: getComputedStyle(actionHeader).zIndex
        }
    });
}
