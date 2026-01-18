/**
 * 云盘模块前端自动化测试脚本
 *
 * 使用方法：
 * 1. 确保后端服务器运行在 http://localhost:9090
 * 2. 确保前端服务器运行在 http://localhost:5181
 * 3. 运行: node test-cloud-module.js
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

// 主测试流程
async function runTests() {
  log('\n========================================', 'cyan');
  log('  云盘模块前端功能自动化测试', 'cyan');
  log('========================================\n', 'cyan');

  log(`API 地址: ${CONFIG.API_BASE_URL}`, 'blue');
  log(`前端地址: ${CONFIG.FRONTEND_URL}`, 'blue');
  log(`测试用户: ${CONFIG.TEST_USER.username}\n`, 'blue');

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
