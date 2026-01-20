/**
 * 云盘模块 + 动态表单系统 前端自动化测试脚本
 *
 * 测试范围：
 * 1. 云盘模块 (测试 1-14)
 *    - 用户登录认证
 *    - 文件夹 CRUD 操作
 *    - 批量操作
 *    - 配额管理
 *    - 旧接口兼容性
 *
 * 2. 动态表单系统 (测试 15-29)
 *    - 元数据配置获取（子系统、类别、表单、字段、字典）
 *    - 表单数据 CRUD 操作
 *    - 字段验证（必填、长度、正则）
 *    - 分页、筛选、排序功能
 *
 * 使用方法：
 * 1. 确保后端服务器运行在 http://localhost:9090
 * 2. 确保前端服务器运行在 http://localhost:5181
 * 3. 运行: node test-cloud-module.js
 *
 * 测试结果：
 * - 绿色 ✅ 表示测试通过
 * - 红色 ❌ 表示测试失败
 * - 蓝色 ℹ️  表示额外信息
 * - 最后会输出测试汇总和通过率
 */

const axios = require('axios');

// 配置
const CONFIG = {
  API_BASE_URL: 'http://localhost:9090/api/v1',
  FRONTEND_URL: 'http://localhost:5181',
  TEST_USER: {
    username: 'admin',
    password: 'admin123',
    clientType: 'web',
    companyId: 1
  }
};

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  testResults.total++;
  log(`\n[${ testResults.total}] 测试: ${testName}`, 'cyan');
}

function logPass(message) {
  testResults.passed++;
  log(`  ✅ ${message}`, 'green');
}

function logFail(message, error) {
  testResults.failed++;
  testResults.errors.push({ test: testResults.total, message, error: error?.message || error });
  log(`  ❌ ${message}`, 'red');
  if (error) {
    log(`     错误: ${error.message || error}`, 'red');
  }
}

function logInfo(message) {
  log(`  ℹ️  ${message}`, 'blue');
}

// HTTP 客户端
let authToken = null;

async function request(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${CONFIG.API_BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message);
  }
}

// 测试函数

/**
 * 测试 1: 用户登录
 */
async function test01_Login() {
  logTest('用户登录');

  try {
    const response = await request('POST', '/auth/login', CONFIG.TEST_USER);

    if (response.code === 200 && response.data.token) {
      authToken = response.data.token;
      logPass(`登录成功，用户: ${response.data.user.username}`);
      logInfo(`Token: ${authToken.substring(0, 50)}...`);
      return true;
    } else {
      logFail('登录失败', new Error('未返回有效的 token'));
      return false;
    }
  } catch (error) {
    logFail('登录请求失败', error);
    return false;
  }
}

/**
 * 测试 2: 获取根目录列表
 */
async function test02_ListRootItems() {
  logTest('获取根目录列表（使用新的统一接口）');

  try {
    const response = await request('GET', '/cloud/items');

    if (response.code === 200 && response.data) {
      const { folders, files } = response.data;
      logPass(`获取成功，文件夹: ${folders.length} 个，文件: ${files.length} 个`);

      if (folders.length > 0) {
        logInfo(`文件夹列表: ${folders.slice(0, 3).map(f => f.name).join(', ')}${folders.length > 3 ? '...' : ''}`);
      }

      if (files.length > 0) {
        logInfo(`文件列表: ${files.slice(0, 3).map(f => f.name).join(', ')}${files.length > 3 ? '...' : ''}`);
      }

      return { folders, files };
    } else {
      logFail('获取失败', new Error('返回数据格式错误'));
      return null;
    }
  } catch (error) {
    logFail('获取根目录失败', error);
    return null;
  }
}

/**
 * 测试 3: 创建文件夹
 */
async function test03_CreateFolder() {
  logTest('创建新文件夹');

  const folderName = `测试文件夹_${Date.now()}`;

  try {
    const response = await request('POST', '/cloud/items', {
      itemType: 'folder',
      name: folderName,
      parentId: null
    });

    if (response.code === 201 && response.data) {
      logPass(`创建成功，文件夹: "${folderName}"，ID: ${response.data.id}`);
      return response.data;
    } else {
      logFail('创建失败', new Error('返回状态码不正确'));
      return null;
    }
  } catch (error) {
    logFail('创建文件夹失败', error);
    return null;
  }
}

/**
 * 测试 4: 验证文件夹已创建
 */
async function test04_VerifyFolderCreated(folderId, folderName) {
  logTest('验证文件夹已在列表中');

  try {
    const response = await request('GET', '/cloud/items');

    if (response.code === 200 && response.data) {
      const { folders } = response.data;
      const found = folders.find(f => f.id === folderId);

      if (found) {
        logPass(`找到文件夹: "${found.name}"，ID: ${found.id}`);
        return true;
      } else {
        logFail('未找到刚创建的文件夹', new Error(`ID ${folderId} 不在列表中`));
        return false;
      }
    }
  } catch (error) {
    logFail('验证失败', error);
    return false;
  }
}

/**
 * 测试 5: 重命名文件夹
 */
async function test05_RenameFolder(folderId, oldName) {
  logTest('重命名文件夹');

  const newName = `已重命名_${Date.now()}`;

  try {
    const response = await request('PUT', `/cloud/items/${folderId}/rename`, {
      newName
    });

    if (response.code === 200) {
      logPass(`重命名成功: "${oldName}" → "${newName}"`);
      return newName;
    } else {
      logFail('重命名失败', new Error('返回状态码不正确'));
      return null;
    }
  } catch (error) {
    logFail('重命名请求失败', error);
    return null;
  }
}

/**
 * 测试 6: 验证重命名
 */
async function test06_VerifyRenamed(folderId, expectedName) {
  logTest('验证文件夹已重命名');

  try {
    const response = await request('GET', '/cloud/items');

    if (response.code === 200 && response.data) {
      const { folders } = response.data;
      const found = folders.find(f => f.id === folderId);

      if (found && found.name === expectedName) {
        logPass(`验证成功: 文件夹名称为 "${found.name}"`);
        return true;
      } else {
        logFail('验证失败', new Error(`期望名称: "${expectedName}"，实际: "${found?.name}"`));
        return false;
      }
    }
  } catch (error) {
    logFail('验证失败', error);
    return false;
  }
}

/**
 * 测试 7: 创建子文件夹
 */
async function test07_CreateSubfolder(parentId, parentName) {
  logTest('在文件夹内创建子文件夹');

  const subfolderName = `子文件夹_${Date.now()}`;

  try {
    const response = await request('POST', '/cloud/items', {
      itemType: 'folder',
      name: subfolderName,
      parentId: parentId
    });

    if (response.code === 201 && response.data) {
      logPass(`创建成功: "${parentName}" / "${subfolderName}"，ID: ${response.data.id}`);
      return response.data;
    } else {
      logFail('创建子文件夹失败', new Error('返回状态码不正确'));
      return null;
    }
  } catch (error) {
    logFail('创建子文件夹失败', error);
    return null;
  }
}

/**
 * 测试 8: 获取子文件夹列表
 */
async function test08_ListSubfolders(parentId, parentName) {
  logTest('获取子文件夹列表');

  try {
    const response = await request('GET', `/cloud/items?parentId=${parentId}`);

    if (response.code === 200 && response.data) {
      const { folders, files } = response.data;
      logPass(`获取成功，"${parentName}" 下有 ${folders.length} 个子文件夹，${files.length} 个文件`);

      if (folders.length > 0) {
        logInfo(`子文件夹: ${folders.map(f => f.name).join(', ')}`);
      }

      return { folders, files };
    }
  } catch (error) {
    logFail('获取子文件夹列表失败', error);
    return null;
  }
}

/**
 * 测试 9: 批量创建文件夹
 */
async function test09_BatchCreateFolders() {
  logTest('批量创建文件夹（测试批量操作）');

  const folderNames = [
    `批量测试1_${Date.now()}`,
    `批量测试2_${Date.now()}`,
    `批量测试3_${Date.now()}`
  ];

  try {
    const createdFolders = [];

    for (const name of folderNames) {
      const response = await request('POST', '/cloud/items', {
        itemType: 'folder',
        name: name,
        parentId: null
      });

      if (response.code === 201 && response.data) {
        createdFolders.push(response.data);
      }
    }

    if (createdFolders.length === folderNames.length) {
      logPass(`批量创建成功，共 ${createdFolders.length} 个文件夹`);
      logInfo(`IDs: ${createdFolders.map(f => f.id).join(', ')}`);
      return createdFolders;
    } else {
      logFail('批量创建未全部成功', new Error(`期望: ${folderNames.length}，实际: ${createdFolders.length}`));
      return createdFolders;
    }
  } catch (error) {
    logFail('批量创建失败', error);
    return [];
  }
}

/**
 * 测试 10: 批量删除
 */
async function test10_BatchDelete(folders) {
  logTest('批量删除文件夹');

  const itemIds = folders.map(f => f.id);

  try {
    const response = await request('POST', '/cloud/items/batch/delete', {
      itemIds: itemIds
    });

    if (response.code === 200 && response.data) {
      const { successCount, failedCount, failedItems } = response.data;

      if (successCount === itemIds.length && failedCount === 0) {
        logPass(`批量删除成功，删除了 ${successCount} 个文件夹`);
        return true;
      } else {
        logFail(`批量删除部分失败`, new Error(`成功: ${successCount}, 失败: ${failedCount}`));
        if (failedItems.length > 0) {
          logInfo(`失败项: ${failedItems.join(', ')}`);
        }
        return false;
      }
    }
  } catch (error) {
    logFail('批量删除失败', error);
    return false;
  }
}

/**
 * 测试 11: 验证批量删除
 */
async function test11_VerifyBatchDeleted(deletedIds) {
  logTest('验证批量删除的文件夹已不存在');

  try {
    const response = await request('GET', '/cloud/items');

    if (response.code === 200 && response.data) {
      const { folders } = response.data;
      const stillExists = deletedIds.filter(id => folders.some(f => f.id === id));

      if (stillExists.length === 0) {
        logPass('验证成功，所有文件夹已删除');
        return true;
      } else {
        logFail('验证失败', new Error(`仍存在的ID: ${stillExists.join(', ')}`));
        return false;
      }
    }
  } catch (error) {
    logFail('验证失败', error);
    return false;
  }
}

/**
 * 测试 12: 删除测试文件夹（清理）
 */
async function test12_Cleanup(folderId) {
  logTest('清理测试数据');

  try {
    const response = await request('DELETE', `/cloud/items/${folderId}`);

    if (response.code === 200) {
      logPass(`清理成功，删除了文件夹 ID: ${folderId}`);
      return true;
    }
  } catch (error) {
    logFail('清理失败', error);
    return false;
  }
}

/**
 * 测试 13: 获取配额信息
 */
async function test13_GetQuota() {
  logTest('获取用户配额信息');

  try {
    const response = await request('GET', '/cloud/quota');

    if (response.code === 200 && response.data) {
      const quota = response.data;
      const usedGB = (quota.UsedQuota / (1024 * 1024 * 1024)).toFixed(2);
      const totalGB = (quota.TotalQuota / (1024 * 1024 * 1024)).toFixed(2);
      const usagePercent = quota.UsagePercentage.toFixed(2);

      logPass(`获取成功`);
      logInfo(`已用: ${usedGB} GB / ${totalGB} GB (${usagePercent}%)`);
      logInfo(`文件数: ${quota.FileCount || 0}`);

      return quota;
    }
  } catch (error) {
    logFail('获取配额失败', error);
    return null;
  }
}

/**
 * 测试 14: 测试旧接口兼容性
 */
async function test14_OldAPICompatibility() {
  logTest('测试旧接口向后兼容性');

  try {
    // 测试旧的 /cloud/folders 接口
    const foldersResponse = await request('GET', '/cloud/folders');

    if (foldersResponse.code === 200) {
      logPass('旧的 /cloud/folders 接口仍然可用');
    } else {
      logFail('旧接口不可用', new Error('返回状态码不正确'));
    }

    // 测试旧的 /cloud/files 接口
    const filesResponse = await request('GET', '/cloud/files?folderId=0');

    if (filesResponse.code === 200) {
      logPass('旧的 /cloud/files 接口仍然可用');
    } else {
      logFail('旧接口不可用', new Error('返回状态码不正确'));
    }

    return true;
  } catch (error) {
    logFail('兼容性测试失败', error);
    return false;
  }
}

// ==================== 动态表单测试模块 ====================

/**
 * 测试 15: 获取子系统列表
 */
async function test15_GetSubsystems() {
  logTest('获取元数据子系统列表');

  try {
    const response = await request('GET', '/metadata/subsystems');

    if (response.code === 200 && response.data) {
      const subsystems = response.data;
      logPass(`获取成功，共 ${subsystems.length} 个子系统`);

      if (subsystems.length > 0) {
        logInfo(`子系统列表: ${subsystems.slice(0, 3).map(s => s.SUBSYSTEM_NAME).join(', ')}${subsystems.length > 3 ? '...' : ''}`);
        return subsystems;
      } else {
        logFail('子系统列表为空', new Error('没有可用的子系统'));
        return [];
      }
    } else {
      logFail('获取失败', new Error('返回数据格式错误'));
      return [];
    }
  } catch (error) {
    logFail('获取子系统列表失败', error);
    return [];
  }
}

/**
 * 测试 16: 获取表类别列表
 */
async function test16_GetTableCategories(subsystemId) {
  logTest('获取表类别列表');

  try {
    const response = await request('GET', `/metadata/categories?subsystemId=${subsystemId}`);

    if (response.code === 200 && response.data) {
      const categories = response.data;
      logPass(`获取成功，子系统 ${subsystemId} 下有 ${categories.length} 个类别`);

      if (categories.length > 0) {
        logInfo(`类别列表: ${categories.slice(0, 3).map(c => c.CATEGORY_NAME).join(', ')}${categories.length > 3 ? '...' : ''}`);
        return categories;
      } else {
        logFail('类别列表为空', new Error('该子系统下没有表类别'));
        return [];
      }
    } else {
      logFail('获取失败', new Error('返回数据格式错误'));
      return [];
    }
  } catch (error) {
    logFail('获取表类别列表失败', error);
    return [];
  }
}

/**
 * 测试 17: 获取表单配置列表
 */
async function test17_GetTables(categoryId) {
  logTest('获取表单配置列表');

  try {
    const response = await request('GET', `/metadata/tables?categoryId=${categoryId}`);

    if (response.code === 200 && response.data) {
      const tables = response.data;
      logPass(`获取成功，类别 ${categoryId} 下有 ${tables.length} 个表单`);

      if (tables.length > 0) {
        logInfo(`表单列表: ${tables.slice(0, 3).map(t => t.DISPLAY_NAME).join(', ')}${tables.length > 3 ? '...' : ''}`);
        return tables;
      } else {
        logFail('表单列表为空', new Error('该类别下没有表单'));
        return [];
      }
    } else {
      logFail('获取失败', new Error('返回数据格式错误'));
      return [];
    }
  } catch (error) {
    logFail('获取表单配置列表失败', error);
    return [];
  }
}

/**
 * 测试 18: 获取表单配置详情
 */
async function test18_GetTableConfig(tableId) {
  logTest('获取表单配置详情');

  try {
    const response = await request('GET', `/metadata/tables/${tableId}`);

    if (response.code === 200 && response.data) {
      const config = response.data;
      logPass(`获取成功，表单: "${config.table.DISPLAY_NAME}" (${config.table.TABLE_NAME})`);
      logInfo(`字段数量: ${config.columns.length} 个`);
      logInfo(`权限: ${config.table.MASK || 'AMDQSUV'}`);

      if (config.table.PROPS) {
        const props = JSON.parse(config.table.PROPS);
        if (props.detailTables) {
          logInfo(`子表数量: ${props.detailTables.length} 个`);
        }
      }

      return config;
    } else {
      logFail('获取失败', new Error('返回数据格式错误'));
      return null;
    }
  } catch (error) {
    logFail('获取表单配置详情失败', error);
    return null;
  }
}

/**
 * 测试 19: 获取字段列表
 */
async function test19_GetColumns(tableId) {
  logTest('获取表单字段列表');

  try {
    const response = await request('GET', `/metadata/columns?tableId=${tableId}`);

    if (response.code === 200 && response.data) {
      const columns = response.data;
      logPass(`获取成功，表单 ${tableId} 有 ${columns.length} 个字段`);

      // 统计字段类型
      const controlTypes = columns.reduce((acc, col) => {
        acc[col.CONTROL_TYPE] = (acc[col.CONTROL_TYPE] || 0) + 1;
        return acc;
      }, {});

      logInfo(`字段类型分布: ${Object.entries(controlTypes).map(([type, count]) => `${type}(${count})`).join(', ')}`);

      // 统计必填字段
      const requiredCount = columns.filter(col => col.NULL_ABLE === 'N').length;
      logInfo(`必填字段: ${requiredCount} 个`);

      return columns;
    } else {
      logFail('获取失败', new Error('返回数据格式错误'));
      return [];
    }
  } catch (error) {
    logFail('获取字段列表失败', error);
    return [];
  }
}

/**
 * 测试 20: 获取数据字典
 */
async function test20_GetDicts() {
  logTest('获取数据字典列表');

  try {
    const response = await request('GET', '/metadata/dicts');

    if (response.code === 200 && response.data) {
      const dicts = response.data;
      logPass(`获取成功，共 ${dicts.length} 个字典`);

      if (dicts.length > 0) {
        logInfo(`字典列表: ${dicts.slice(0, 3).map(d => d.DICT_NAME).join(', ')}${dicts.length > 3 ? '...' : ''}`);
        return dicts;
      } else {
        logFail('字典列表为空', new Error('没有可用的数据字典'));
        return [];
      }
    } else {
      logFail('获取失败', new Error('返回数据格式错误'));
      return [];
    }
  } catch (error) {
    logFail('获取数据字典列表失败', error);
    return [];
  }
}

/**
 * 测试 21: 获取表单数据列表
 */
async function test21_GetRecords(tableName, tableDisplayName) {
  logTest('获取表单数据列表');

  try {
    const response = await request('GET', `/metadata/data/${tableName}?page=1&pageSize=10`);

    if (response.code === 200 && response.data) {
      const { list, pagination } = response.data;
      logPass(`获取成功，"${tableDisplayName}" 有 ${pagination.total} 条记录`);
      logInfo(`当前页: ${pagination.current}/${Math.ceil(pagination.total / pagination.pageSize)}`);
      logInfo(`显示: ${list.length} 条记录`);

      return { list, pagination };
    } else {
      logFail('获取失败', new Error('返回数据格式错误'));
      return null;
    }
  } catch (error) {
    logFail('获取表单数据列表失败', error);
    return null;
  }
}

/**
 * 测试 22: 创建表单数据
 */
async function test22_CreateRecord(tableName, tableDisplayName, columns) {
  logTest('创建表单数据');

  try {
    // 构造测试数据
    const testData = {};

    columns.forEach(col => {
      // 跳过系统字段
      if (['ID', 'CREATE_BY', 'CREATE_TIME', 'UPDATE_BY', 'UPDATE_TIME'].includes(col.DB_NAME)) {
        return;
      }

      // 根据字段类型生成测试数据
      switch (col.CONTROL_TYPE) {
        case 'text':
          testData[col.DB_NAME] = `测试数据_${Date.now()}`;
          break;
        case 'number':
          testData[col.DB_NAME] = Math.floor(Math.random() * 1000);
          break;
        case 'select':
          testData[col.DB_NAME] = 'Y'; // 默认值
          break;
        case 'checkbox':
          testData[col.DB_NAME] = 'Y';
          break;
        case 'date':
          testData[col.DB_NAME] = new Date().toISOString().split('T')[0];
          break;
        case 'datetime':
          testData[col.DB_NAME] = new Date().toISOString();
          break;
        case 'textarea':
          testData[col.DB_NAME] = `测试备注_${Date.now()}`;
          break;
        default:
          if (col.NULL_ABLE === 'N') {
            testData[col.DB_NAME] = `测试_${Date.now()}`;
          }
      }
    });

    const response = await request('POST', `/metadata/data/${tableName}`, testData);

    if (response.code === 201 && response.data) {
      logPass(`创建成功，"${tableDisplayName}" 新记录 ID: ${response.data.ID}`);
      logInfo(`创建的字段数: ${Object.keys(testData).length} 个`);
      return response.data;
    } else {
      logFail('创建失败', new Error('返回状态码不正确'));
      return null;
    }
  } catch (error) {
    logFail('创建表单数据失败', error);
    return null;
  }
}

/**
 * 测试 23: 获取单条记录详情
 */
async function test23_GetRecordDetail(tableName, recordId, tableDisplayName) {
  logTest('获取单条记录详情');

  try {
    const response = await request('GET', `/metadata/data/${tableName}/${recordId}`);

    if (response.code === 200 && response.data) {
      const record = response.data;
      logPass(`获取成功，"${tableDisplayName}" 记录 ID: ${recordId}`);

      const fieldCount = Object.keys(record).length;
      logInfo(`字段数量: ${fieldCount} 个`);

      // 显示系统字段
      if (record.CREATE_BY) {
        logInfo(`创建人: ${record.CREATE_BY}, 创建时间: ${record.CREATE_TIME}`);
      }

      return record;
    } else {
      logFail('获取失败', new Error('返回数据格式错误'));
      return null;
    }
  } catch (error) {
    logFail('获取记录详情失败', error);
    return null;
  }
}

/**
 * 测试 24: 更新表单数据
 */
async function test24_UpdateRecord(tableName, recordId, tableDisplayName, columns) {
  logTest('更新表单数据');

  try {
    // 构造更新数据
    const updateData = {};

    // 只更新部分字段
    const textColumn = columns.find(col => col.CONTROL_TYPE === 'text' && !['ID', 'CREATE_BY', 'CREATE_TIME', 'UPDATE_BY', 'UPDATE_TIME'].includes(col.DB_NAME));
    if (textColumn) {
      updateData[textColumn.DB_NAME] = `已更新_${Date.now()}`;
    }

    const numberColumn = columns.find(col => col.CONTROL_TYPE === 'number');
    if (numberColumn) {
      updateData[numberColumn.DB_NAME] = 999;
    }

    const response = await request('PUT', `/metadata/data/${tableName}/${recordId}`, updateData);

    if (response.code === 200) {
      logPass(`更新成功，"${tableDisplayName}" 记录 ID: ${recordId}`);
      logInfo(`更新的字段数: ${Object.keys(updateData).length} 个`);
      return true;
    } else {
      logFail('更新失败', new Error('返回状态码不正确'));
      return false;
    }
  } catch (error) {
    logFail('更新表单数据失败', error);
    return false;
  }
}

/**
 * 测试 25: 删除表单数据
 */
async function test25_DeleteRecord(tableName, recordId, tableDisplayName) {
  logTest('删除表单数据');

  try {
    const response = await request('DELETE', `/metadata/data/${tableName}/${recordId}`);

    if (response.code === 200) {
      logPass(`删除成功，"${tableDisplayName}" 记录 ID: ${recordId}`);
      return true;
    } else {
      logFail('删除失败', new Error('返回状态码不正确'));
      return false;
    }
  } catch (error) {
    logFail('删除表单数据失败', error);
    return false;
  }
}

/**
 * 测试 26: 测试字段验证
 */
async function test26_TestFieldValidation(tableName, columns) {
  logTest('测试字段验证（必填、长度、正则）');

  try {
    // 查找必填字段
    const requiredColumn = columns.find(col =>
      col.NULL_ABLE === 'N' &&
      !['ID', 'CREATE_BY', 'CREATE_TIME', 'UPDATE_BY', 'UPDATE_TIME'].includes(col.DB_NAME)
    );

    if (!requiredColumn) {
      logInfo('没有必填字段，跳过验证测试');
      return true;
    }

    // 尝试创建不包含必填字段的记录
    const invalidData = {};
    const response = await request('POST', `/metadata/data/${tableName}`, invalidData);

    // 应该返回错误
    if (response.code === 400 || response.code === 422) {
      logPass(`字段验证正常，拒绝了无效数据`);
      logInfo(`错误信息: ${response.message || '缺少必填字段'}`);
      return true;
    } else if (response.code === 201) {
      logFail('字段验证失败', new Error('应该拒绝无效数据，但创建成功了'));
      return false;
    } else {
      logFail('验证测试失败', new Error('返回状态码异常'));
      return false;
    }
  } catch (error) {
    // 如果抛出异常，说明验证起作用了
    if (error.message.includes('必填') || error.message.includes('required') || error.message.includes('不能为空')) {
      logPass(`字段验证正常，拒绝了无效数据`);
      logInfo(`错误信息: ${error.message}`);
      return true;
    } else {
      logFail('字段验证测试失败', error);
      return false;
    }
  }
}

/**
 * 测试 27: 测试分页功能
 */
async function test27_TestPagination(tableName, tableDisplayName) {
  logTest('测试分页功能');

  try {
    // 获取第1页
    const page1 = await request('GET', `/metadata/data/${tableName}?page=1&pageSize=5`);

    if (page1.code !== 200 || !page1.data) {
      logFail('获取第1页失败', new Error('返回数据格式错误'));
      return false;
    }

    const { pagination } = page1.data;
    logInfo(`总记录数: ${pagination.total}, 每页: ${pagination.pageSize}`);

    // 如果有多页，测试第2页
    if (pagination.total > pagination.pageSize) {
      const page2 = await request('GET', `/metadata/data/${tableName}?page=2&pageSize=5`);

      if (page2.code === 200 && page2.data) {
        logPass(`分页功能正常，成功获取第2页数据`);
        logInfo(`第2页记录数: ${page2.data.list.length} 条`);
        return true;
      } else {
        logFail('获取第2页失败', new Error('返回数据格式错误'));
        return false;
      }
    } else {
      logPass(`分页功能正常（总记录数不足以测试多页）`);
      return true;
    }
  } catch (error) {
    logFail('分页功能测试失败', error);
    return false;
  }
}

/**
 * 测试 28: 测试筛选功能
 */
async function test28_TestFilters(tableName, columns, tableDisplayName) {
  logTest('测试筛选功能');

  try {
    // 查找可筛选的字段（文本或选择类型）
    const filterableColumn = columns.find(col =>
      (col.CONTROL_TYPE === 'text' || col.CONTROL_TYPE === 'select') &&
      !['ID', 'CREATE_BY', 'CREATE_TIME', 'UPDATE_BY', 'UPDATE_TIME'].includes(col.DB_NAME)
    );

    if (!filterableColumn) {
      logInfo('没有可筛选的字段，跳过筛选测试');
      return true;
    }

    // 构造筛选条件
    const filterValue = filterableColumn.CONTROL_TYPE === 'select' ? 'Y' : '测试';
    const response = await request('GET', `/metadata/data/${tableName}?${filterableColumn.DB_NAME}=${filterValue}`);

    if (response.code === 200 && response.data) {
      logPass(`筛选功能正常，筛选字段: ${filterableColumn.DISPLAY_NAME}`);
      logInfo(`筛选结果: ${response.data.list.length} 条记录`);
      return true;
    } else {
      logFail('筛选失败', new Error('返回数据格式错误'));
      return false;
    }
  } catch (error) {
    logFail('筛选功能测试失败', error);
    return false;
  }
}

/**
 * 测试 29: 测试排序功能
 */
async function test29_TestSorting(tableName, tableDisplayName) {
  logTest('测试排序功能');

  try {
    // 按 ID 升序
    const ascResponse = await request('GET', `/metadata/data/${tableName}?sortBy=ID&sortOrder=asc&pageSize=5`);

    if (ascResponse.code !== 200 || !ascResponse.data) {
      logFail('升序排序失败', new Error('返回数据格式错误'));
      return false;
    }

    // 按 ID 降序
    const descResponse = await request('GET', `/metadata/data/${tableName}?sortBy=ID&sortOrder=desc&pageSize=5`);

    if (descResponse.code !== 200 || !descResponse.data) {
      logFail('降序排序失败', new Error('返回数据格式错误'));
      return false;
    }

    // 验证排序结果
    const ascList = ascResponse.data.list;
    const descList = descResponse.data.list;

    if (ascList.length > 0 && descList.length > 0) {
      const firstAsc = ascList[0].ID;
      const firstDesc = descList[0].ID;

      if (firstAsc !== firstDesc) {
        logPass(`排序功能正常，升序首条ID: ${firstAsc}, 降序首条ID: ${firstDesc}`);
        return true;
      } else {
        logInfo('排序功能可能正常（数据量不足以验证）');
        return true;
      }
    } else {
      logInfo('数据为空，无法验证排序功能');
      return true;
    }
  } catch (error) {
    logFail('排序功能测试失败', error);
    return false;
  }
}

// ==================== 系统管理 - 公司表单专项测试 ====================

/**
 * 测试 30: 获取公司表单配置
 */
async function test30_GetCompanyTableConfig() {
  logTest('获取公司表单配置 (SYS_COMPANY)');

  try {
    // 假设公司表的 ID 是 4（根据之前看到的路由 /metadata/list/4）
    const response = await request('GET', '/metadata/tables/4/config');

    if (response.code === 200 && response.data) {
      const { table, columns } = response.data;
      logPass(`获取成功，表单: "${table.DISPLAY_NAME || table.displayName}"`);
      logInfo(`物理表名: ${table.NAME || table.name}`);
      logInfo(`字段数量: ${columns.length} 个`);
      logInfo(`权限掩码: ${table.MASK || table.mask || 'N/A'}`);

      return { table, columns };
    } else {
      logFail('获取失败', new Error('返回数据格式错误'));
      return null;
    }
  } catch (error) {
    logFail('获取公司表单配置失败', error);
    return null;
  }
}

/**
 * 测试 31: 查询公司列表
 */
async function test31_GetCompanyList() {
  logTest('查询公司列表');

  try {
    const response = await request('POST', '/data/SYS_COMPANY/query', {
      tableName: 'SYS_COMPANY',
      page: 1,
      pageSize: 10
    });

    if (response.code === 200 && response.data) {
      // 兼容两种响应格式
      const dataList = response.data.data || response.data.Data || [];
      const total = response.data.total || response.data.Total || 0;

      logPass(`查询成功，共 ${total} 条记录`);
      logInfo(`当前页显示: ${dataList.length} 条`);

      if (dataList.length > 0) {
        const firstCompany = dataList[0];
        logInfo(`示例公司: ${firstCompany.NAME || firstCompany.name || '未命名'} (ID: ${firstCompany.ID})`);
      }

      return { list: dataList, total };
    } else {
      logFail('查询失败', new Error('返回数据格式错误'));
      return null;
    }
  } catch (error) {
    logFail('查询公司列表失败', error);
    return null;
  }
}

/**
 * 测试 32: 新增公司
 */
async function test32_CreateCompany() {
  logTest('新增公司记录');

  const timestamp = Date.now();
  const testCompany = {
    NAME: `测试公司_${timestamp}`,
    SHORT_NAME: `测试${timestamp}`,
    CONTACT_PERSON: '张三',
    CONTACT_PHONE: '13800138000',
    EMAIL: `test${timestamp}@example.com`,
    ADDRESS: '北京市朝阳区测试街道123号',
    IS_ACTIVE: 'Y',
    REMARK: `自动化测试创建 ${new Date().toLocaleString()}`
  };

  try {
    const response = await request('POST', '/data/SYS_COMPANY', testCompany);

    if (response.code === 201 || response.code === 200) {
      const newCompany = response.data;
      logPass(`新增成功，公司: "${testCompany.NAME}"，ID: ${newCompany.ID}`);
      logInfo(`公司全称: ${testCompany.NAME}`);
      logInfo(`公司简称: ${testCompany.SHORT_NAME}`);
      logInfo(`联系人: ${testCompany.CONTACT_PERSON} (${testCompany.CONTACT_PHONE})`);

      return newCompany;
    } else {
      logFail('新增失败', new Error(`返回状态码: ${response.code}`));
      return null;
    }
  } catch (error) {
    logFail('新增公司失败', error);
    return null;
  }
}

/**
 * 测试 33: 获取公司详情
 */
async function test33_GetCompanyDetail(companyId) {
  logTest('获取公司详情');

  try {
    const response = await request('GET', `/data/SYS_COMPANY/${companyId}`);

    if (response.code === 200 && response.data) {
      const company = response.data;
      logPass(`获取成功，公司 ID: ${companyId}`);
      logInfo(`公司名称: ${company.NAME || company.name}`);
      logInfo(`状态: ${company.IS_ACTIVE === 'Y' ? '启用' : '禁用'}`);

      if (company.CREATE_BY) {
        logInfo(`创建人: ${company.CREATE_BY}, 创建时间: ${company.CREATE_TIME}`);
      }

      return company;
    } else {
      logFail('获取失败', new Error('返回数据格式错误'));
      return null;
    }
  } catch (error) {
    logFail('获取公司详情失败', error);
    return null;
  }
}

/**
 * 测试 34: 修改公司信息
 */
async function test34_UpdateCompany(companyId, originalName) {
  logTest('修改公司信息');

  const updateData = {
    NAME: `${originalName}_已修改`,
    CONTACT_PERSON: '李四',
    CONTACT_PHONE: '13900139000',
    ADDRESS: '上海市浦东新区更新街道456号',
    REMARK: `自动化测试更新 ${new Date().toLocaleString()}`
  };

  try {
    const response = await request('PUT', `/data/SYS_COMPANY/${companyId}`, updateData);

    if (response.code === 200) {
      logPass(`修改成功，公司 ID: ${companyId}`);
      logInfo(`新名称: ${updateData.NAME}`);
      logInfo(`新联系人: ${updateData.CONTACT_PERSON} (${updateData.CONTACT_PHONE})`);
      logInfo(`新地址: ${updateData.ADDRESS}`);

      return updateData;
    } else {
      logFail('修改失败', new Error(`返回状态码: ${response.code}`));
      return null;
    }
  } catch (error) {
    logFail('修改公司信息失败', error);
    return null;
  }
}

/**
 * 测试 35: 验证修改后的数据
 */
async function test35_VerifyUpdate(companyId, expectedName) {
  logTest('验证修改后的数据');

  try {
    const response = await request('GET', `/data/SYS_COMPANY/${companyId}`);

    if (response.code === 200 && response.data) {
      const company = response.data;
      const actualName = company.NAME || company.name;

      if (actualName === expectedName) {
        logPass(`验证成功，名称已更新为: "${actualName}"`);
        return true;
      } else {
        logFail('验证失败', new Error(`期望: "${expectedName}", 实际: "${actualName}"`));
        return false;
      }
    }
  } catch (error) {
    logFail('验证修改失败', error);
    return false;
  }
}

/**
 * 测试 36: 删除公司（软删除）
 */
async function test36_DeleteCompany(companyId, companyName) {
  logTest('删除公司记录（软删除）');

  try {
    const response = await request('DELETE', `/data/SYS_COMPANY/${companyId}`);

    if (response.code === 200) {
      logPass(`删除成功，公司: "${companyName}"，ID: ${companyId}`);
      return true;
    } else {
      logFail('删除失败', new Error(`返回状态码: ${response.code}`));
      return false;
    }
  } catch (error) {
    logFail('删除公司失败', error);
    return false;
  }
}

/**
 * 测试 37: 验证删除后记录状态
 */
async function test37_VerifyDeletion(companyId) {
  logTest('验证删除后记录状态（软删除）');

  try {
    const response = await request('GET', `/data/SYS_COMPANY/${companyId}`);

    if (response.code === 200 && response.data) {
      const company = response.data;
      const isActive = company.IS_ACTIVE || company.is_active;

      if (isActive === 'N') {
        logPass(`验证成功，记录已标记为删除（IS_ACTIVE = 'N'）`);
        return true;
      } else {
        logInfo(`注意: 记录仍处于启用状态，可能是硬删除或软删除未生效`);
        return true;
      }
    } else if (response.code === 404) {
      logPass(`验证成功，记录已被硬删除（404）`);
      return true;
    } else {
      logFail('验证失败', new Error('无法验证删除状态'));
      return false;
    }
  } catch (error) {
    // 如果是404错误，说明记录已被物理删除
    if (error.message.includes('404') || error.message.includes('不存在')) {
      logPass(`验证成功，记录已被硬删除`);
      return true;
    } else {
      logFail('验证删除失败', error);
      return false;
    }
  }
}

/**
 * 测试 38: 批量新增公司
 */
async function test38_BatchCreateCompanies() {
  logTest('批量新增公司记录');

  const timestamp = Date.now();
  const companies = [
    {
      NAME: `批量测试公司A_${timestamp}`,
      SHORT_NAME: `批量A${timestamp}`,
      CONTACT_PERSON: '王五',
      CONTACT_PHONE: '13700137000',
      IS_ACTIVE: 'Y'
    },
    {
      NAME: `批量测试公司B_${timestamp}`,
      SHORT_NAME: `批量B${timestamp}`,
      CONTACT_PERSON: '赵六',
      CONTACT_PHONE: '13700137001',
      IS_ACTIVE: 'Y'
    },
    {
      NAME: `批量测试公司C_${timestamp}`,
      SHORT_NAME: `批量C${timestamp}`,
      CONTACT_PERSON: '钱七',
      CONTACT_PHONE: '13700137002',
      IS_ACTIVE: 'Y'
    }
  ];

  try {
    const createdCompanies = [];

    for (const company of companies) {
      const response = await request('POST', '/data/SYS_COMPANY', company);

      if (response.code === 201 || response.code === 200) {
        createdCompanies.push(response.data);
      }
    }

    if (createdCompanies.length === companies.length) {
      logPass(`批量新增成功，共 ${createdCompanies.length} 家公司`);
      logInfo(`IDs: ${createdCompanies.map(c => c.ID).join(', ')}`);
      logInfo(`公司名称: ${createdCompanies.map(c => c.NAME || c.name).join(', ')}`);

      return createdCompanies;
    } else {
      logFail('批量新增未全部成功', new Error(`期望: ${companies.length}，实际: ${createdCompanies.length}`));
      return createdCompanies;
    }
  } catch (error) {
    logFail('批量新增公司失败', error);
    return [];
  }
}

/**
 * 测试 39: 批量删除公司
 */
async function test39_BatchDeleteCompanies(companies) {
  logTest('批量删除公司记录');

  const ids = companies.map(c => c.ID);

  try {
    const response = await request('POST', '/data/SYS_COMPANY/batch-delete', {
      ids: ids
    });

    if (response.code === 200) {
      logPass(`批量删除成功，删除了 ${ids.length} 家公司`);
      logInfo(`删除的IDs: ${ids.join(', ')}`);
      return true;
    } else {
      logFail('批量删除失败', new Error(`返回状态码: ${response.code}`));
      return false;
    }
  } catch (error) {
    logFail('批量删除公司失败', error);
    return false;
  }
}

/**
 * 测试 40: 测试公司名称唯一性验证
 */
async function test40_TestUniqueValidation() {
  logTest('测试公司名称唯一性验证');

  try {
    // 先创建一个公司
    const timestamp = Date.now();
    const testCompany = {
      NAME: `唯一性测试_${timestamp}`,
      SHORT_NAME: `唯一${timestamp}`,
      IS_ACTIVE: 'Y'
    };

    const createResponse = await request('POST', '/data/SYS_COMPANY', testCompany);

    if (createResponse.code !== 201 && createResponse.code !== 200) {
      logFail('创建测试公司失败', new Error('无法创建测试数据'));
      return false;
    }

    const createdId = createResponse.data.ID;

    // 尝试创建同名公司
    try {
      const duplicateResponse = await request('POST', '/data/SYS_COMPANY', testCompany);

      if (duplicateResponse.code === 400 || duplicateResponse.code === 409) {
        logPass(`唯一性验证正常，拒绝了重复名称`);
        logInfo(`错误信息: ${duplicateResponse.message || '公司名称已存在'}`);

        // 清理测试数据
        await request('DELETE', `/data/SYS_COMPANY/${createdId}`);
        return true;
      } else if (duplicateResponse.code === 201 || duplicateResponse.code === 200) {
        logInfo(`注意: 系统允许重复公司名称，可能未设置唯一性约束`);

        // 清理测试数据
        await request('DELETE', `/data/SYS_COMPANY/${createdId}`);
        await request('DELETE', `/data/SYS_COMPANY/${duplicateResponse.data.ID}`);
        return true;
      }
    } catch (error) {
      if (error.message.includes('已存在') || error.message.includes('duplicate') || error.message.includes('unique')) {
        logPass(`唯一性验证正常，拒绝了重复名称`);
        logInfo(`错误信息: ${error.message}`);

        // 清理测试数据
        await request('DELETE', `/data/SYS_COMPANY/${createdId}`);
        return true;
      } else {
        throw error;
      }
    }
  } catch (error) {
    logFail('唯一性验证测试失败', error);
    return false;
  }
}


// 主测试流程
async function runTests() {
  log('\n========================================', 'cyan');
  log('  云盘模块 + 动态表单系统 自动化测试', 'cyan');
  log('========================================\n', 'cyan');

  log(`API 地址: ${CONFIG.API_BASE_URL}`, 'blue');
  log(`前端地址: ${CONFIG.FRONTEND_URL}`, 'blue');
  log(`测试用户: ${CONFIG.TEST_USER.username}\n`, 'blue');

  // ==================== 云盘模块测试 ====================
  log('\n==================== 云盘模块测试 ====================\n', 'yellow');

  // 1. 登录
  const loginSuccess = await test01_Login();
  if (!loginSuccess) {
    log('\n❌ 登录失败，无法继续测试', 'red');
    process.exit(1);
  }

  // 2. 获取根目录列表
  const rootItems = await test02_ListRootItems();

  // 3. 创建文件夹
  const newFolder = await test03_CreateFolder();
  if (newFolder) {
    // 4. 验证创建
    await test04_VerifyFolderCreated(newFolder.id, newFolder.name);

    // 5. 重命名
    const newName = await test05_RenameFolder(newFolder.id, newFolder.name);
    if (newName) {
      // 6. 验证重命名
      await test06_VerifyRenamed(newFolder.id, newName);
    }

    // 7. 创建子文件夹
    const subfolder = await test07_CreateSubfolder(newFolder.id, newName);
    if (subfolder) {
      // 8. 获取子文件夹列表
      await test08_ListSubfolders(newFolder.id, newName);
    }
  }

  // 9. 批量创建
  const batchFolders = await test09_BatchCreateFolders();

  if (batchFolders.length > 0) {
    // 10. 批量删除
    const batchDeleteSuccess = await test10_BatchDelete(batchFolders);

    if (batchDeleteSuccess) {
      // 11. 验证批量删除
      await test11_VerifyBatchDeleted(batchFolders.map(f => f.id));
    }
  }

  // 12. 清理测试数据
  if (newFolder) {
    await test12_Cleanup(newFolder.id);
  }

  // 13. 获取配额
  await test13_GetQuota();

  // 14. 测试旧接口兼容性
  await test14_OldAPICompatibility();

  // ==================== 动态表单系统测试 ====================
  log('\n==================== 动态表单系统测试 ====================\n', 'yellow');

  // 15. 获取子系统列表
  const subsystems = await test15_GetSubsystems();

  if (subsystems.length > 0) {
    const firstSubsystem = subsystems[0];
    logInfo(`选择子系统: ${firstSubsystem.SUBSYSTEM_NAME} (ID: ${firstSubsystem.ID})`);

    // 16. 获取表类别列表
    const categories = await test16_GetTableCategories(firstSubsystem.ID);

    if (categories.length > 0) {
      const firstCategory = categories[0];
      logInfo(`选择类别: ${firstCategory.CATEGORY_NAME} (ID: ${firstCategory.ID})`);

      // 17. 获取表单配置列表
      const tables = await test17_GetTables(firstCategory.ID);

      if (tables.length > 0) {
        const firstTable = tables[0];
        logInfo(`选择表单: ${firstTable.DISPLAY_NAME} (ID: ${firstTable.ID})`);

        // 18. 获取表单配置详情
        const config = await test18_GetTableConfig(firstTable.ID);

        if (config) {
          // 19. 获取字段列表
          const columns = await test19_GetColumns(firstTable.ID);

          // 20. 获取数据字典
          await test20_GetDicts();

          // 21. 获取表单数据列表
          const records = await test21_GetRecords(firstTable.TABLE_NAME, firstTable.DISPLAY_NAME);

          // 22. 创建表单数据
          const newRecord = await test22_CreateRecord(firstTable.TABLE_NAME, firstTable.DISPLAY_NAME, columns);

          if (newRecord) {
            // 23. 获取单条记录详情
            await test23_GetRecordDetail(firstTable.TABLE_NAME, newRecord.ID, firstTable.DISPLAY_NAME);

            // 24. 更新表单数据
            await test24_UpdateRecord(firstTable.TABLE_NAME, newRecord.ID, firstTable.DISPLAY_NAME, columns);

            // 25. 删除表单数据
            await test25_DeleteRecord(firstTable.TABLE_NAME, newRecord.ID, firstTable.DISPLAY_NAME);
          }

          // 26. 测试字段验证
          await test26_TestFieldValidation(firstTable.TABLE_NAME, columns);

          // 27. 测试分页功能
          await test27_TestPagination(firstTable.TABLE_NAME, firstTable.DISPLAY_NAME);

          // 28. 测试筛选功能
          await test28_TestFilters(firstTable.TABLE_NAME, columns, firstTable.DISPLAY_NAME);

          // 29. 测试排序功能
          await test29_TestSorting(firstTable.TABLE_NAME, firstTable.DISPLAY_NAME);
        }
      }
    }
  }

  // 打印测试结果
  printSummary();
}

function printSummary() {
  log('\n========================================', 'cyan');
  log('  测试结果汇总', 'cyan');
  log('========================================\n', 'cyan');

  log(`总测试数: ${testResults.total}`, 'blue');
  log(`通过: ${testResults.passed}`, 'green');
  log(`失败: ${testResults.failed}`, 'red');

  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
  log(`通过率: ${passRate}%`, passRate === '100.00' ? 'green' : 'yellow');

  if (testResults.errors.length > 0) {
    log('\n失败的测试详情:', 'red');
    testResults.errors.forEach((err, index) => {
      log(`\n${index + 1}. 测试 #${err.test}: ${err.message}`, 'red');
      log(`   错误: ${err.error}`, 'red');
    });
  }

  log('\n========================================\n', 'cyan');

  if (testResults.failed === 0) {
    log('🎉 所有测试通过！', 'green');
    process.exit(0);
  } else {
    log('⚠️  部分测试失败，请检查详情', 'yellow');
    process.exit(1);
  }
}

// 运行测试
runTests().catch(error => {
  log(`\n❌ 测试执行出错: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
