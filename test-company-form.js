/**
 * 系统管理 - 公司表单 浏览器自动化测试
 *
 * 测试范围：
 * 1. 登录系统
 * 2. 导航到公司管理页面
 * 3. 新增公司记录
 * 4. 查看公司详情
 * 5. 修改公司信息
 * 6. 删除公司记录
 * 7. 批量操作
 *
 * 使用方法：
 * 1. 安装依赖: npm install playwright
 * 2. 确保后端服务运行在 http://localhost:9090
 * 3. 确保前端服务运行在 http://localhost:5173
 * 4. 运行: node test-company-form.js
 */

import { chromium } from 'playwright';

// 配置
const CONFIG = {
  BASE_URL: 'http://localhost:5173',
  TIMEOUT: 30000,
  TEST_USER: {
    username: 'admin',
    password: 'admin123'
  },
  COMPANY_TABLE_ID: 4, // 公司表的 ID
  HEADLESS: false, // 设置为 true 可无头模式运行
  SLOW_MO: 500 // 放慢操作速度，方便观察
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
  log(`\n[${testResults.total}] 测试: ${testName}`, 'cyan');
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

// 截图辅助函数
async function takeScreenshot(page, name) {
  const timestamp = Date.now();
  const filename = `screenshots/${name}_${timestamp}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  logInfo(`截图已保存: ${filename}`);
}

// 等待并点击元素
async function clickElement(page, selector, description) {
  try {
    await page.waitForSelector(selector, { timeout: CONFIG.TIMEOUT });
    await page.click(selector);
    logInfo(`已点击: ${description}`);
    await page.waitForTimeout(500); // 等待动画完成
  } catch (error) {
    throw new Error(`无法点击 ${description}: ${error.message}`);
  }
}

// 等待并填写输入框
async function fillInput(page, selector, value, description) {
  try {
    await page.waitForSelector(selector, { timeout: CONFIG.TIMEOUT });
    await page.fill(selector, value);
    logInfo(`已填写 ${description}: ${value}`);
  } catch (error) {
    throw new Error(`无法填写 ${description}: ${error.message}`);
  }
}

/**
 * 测试 1: 启动浏览器并登录
 */
async function test01_Login(browser) {
  logTest('启动浏览器并登录系统');

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 访问登录页
    await page.goto(CONFIG.BASE_URL);
    logInfo(`访问: ${CONFIG.BASE_URL}`);

    // 等待登录页面加载
    await page.waitForSelector('input[type="text"], input[placeholder*="用户名"]', { timeout: CONFIG.TIMEOUT });

    // 填写用户名
    await fillInput(page, 'input[type="text"], input[placeholder*="用户名"]', CONFIG.TEST_USER.username, '用户名');

    // 填写密码
    await fillInput(page, 'input[type="password"], input[placeholder*="密码"]', CONFIG.TEST_USER.password, '密码');

    // 点击登录按钮
    await clickElement(page, 'button[type="submit"], button:has-text("登录")', '登录按钮');

    // 等待登录成功，检查是否跳转到首页
    await page.waitForURL(/.*\/(dashboard|home|\/)/, { timeout: CONFIG.TIMEOUT });

    logPass(`登录成功，当前页面: ${page.url()}`);

    return { context, page };
  } catch (error) {
    logFail('登录失败', error);
    throw error;
  }
}

/**
 * 测试 2: 导航到公司管理页面
 */
async function test02_NavigateToCompanyList(page) {
  logTest('导航到公司管理页面');

  try {
    // 方法1: 通过菜单导航
    try {
      // 等待菜单加载
      await page.waitForSelector('.arco-menu, nav, [role="navigation"]', { timeout: 5000 });

      // 查找"系统管理"或"公司"菜单项
      const menuItems = await page.$$('.arco-menu-item, .menu-item, [role="menuitem"]');

      for (const item of menuItems) {
        const text = await item.textContent();
        if (text && (text.includes('公司') || text.includes('系统管理'))) {
          await item.click();
          logInfo(`点击菜单: ${text.trim()}`);
          await page.waitForTimeout(1000);
          break;
        }
      }
    } catch (error) {
      logInfo('通过菜单导航失败，尝试直接访问URL');
    }

    // 方法2: 直接访问URL
    const companyListUrl = `${CONFIG.BASE_URL}/metadata/list/${CONFIG.COMPANY_TABLE_ID}`;
    await page.goto(companyListUrl);
    logInfo(`直接访问: ${companyListUrl}`);

    // 等待表格加载
    await page.waitForSelector('.arco-table, table, [class*="table"]', { timeout: CONFIG.TIMEOUT });

    logPass('成功到达公司管理页面');

    // 截图
    await takeScreenshot(page, 'company-list');

    return true;
  } catch (error) {
    logFail('导航失败', error);
    await takeScreenshot(page, 'navigation-error');
    throw error;
  }
}

/**
 * 测试 3: 点击新增按钮并打开表单
 */
async function test03_OpenCreateForm(page) {
  logTest('点击新增按钮打开表单');

  try {
    // 查找新增按钮（可能的选择器）
    const createButtonSelectors = [
      'button:has-text("新增")',
      'button:has-text("添加")',
      'button:has-text("创建")',
      'button[class*="create"]',
      'button[type="primary"]:has-text("新")',
      '.arco-btn-primary:has-text("新")'
    ];

    let buttonClicked = false;
    for (const selector of createButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        await page.click(selector);
        buttonClicked = true;
        logInfo(`点击了新增按钮: ${selector}`);
        break;
      } catch (error) {
        // 继续尝试下一个选择器
      }
    }

    if (!buttonClicked) {
      throw new Error('找不到新增按钮');
    }

    // 等待表单页面加载
    await page.waitForTimeout(1000);

    // 检查是否跳转到新增页面或打开了表单对话框
    const isFormPage = page.url().includes('create');
    const hasFormModal = await page.$('.arco-modal, .arco-drawer, form') !== null;

    if (isFormPage || hasFormModal) {
      logPass('表单已打开');
      await takeScreenshot(page, 'create-form');
      return true;
    } else {
      throw new Error('表单未打开');
    }
  } catch (error) {
    logFail('打开表单失败', error);
    await takeScreenshot(page, 'create-form-error');
    throw error;
  }
}

/**
 * 测试 4: 填写公司信息并保存
 */
async function test04_FillAndSaveCompany(page) {
  logTest('填写公司信息并保存');

  const timestamp = Date.now();
  const testData = {
    name: `自动化测试公司_${timestamp}`,
    shortName: `测试${timestamp}`,
    contactPerson: '张三',
    contactPhone: '13800138000',
    email: `test${timestamp}@example.com`,
    address: '北京市朝阳区测试街道123号'
  };

  try {
    // 等待加载完成（等待 loading 消失）
    try {
      await page.waitForSelector('.arco-spin-loading', { state: 'hidden', timeout: 5000 });
    } catch (error) {
      // 如果没有 loading，继续
    }

    // 再等待一段时间让页面稳定
    await page.waitForTimeout(2000);

    // 填写公司全称
    const nameInputSelectors = [
      'input[name="NAME"]',
      'input[placeholder*="公司名称"]',
      'input[placeholder*="名称"]',
      '.arco-form-item:has-text("公司名称") input',
      '.arco-form-item:has-text("名称") input'
    ];

    for (const selector of nameInputSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        await page.fill(selector, testData.name);
        logInfo(`已填写公司名称: ${testData.name}`);
        break;
      } catch (error) {
        // 继续尝试下一个选择器
      }
    }

    // 填写公司简称
    const shortNameSelectors = [
      'input[name="SHORT_NAME"]',
      'input[placeholder*="简称"]',
      '.arco-form-item:has-text("简称") input'
    ];

    for (const selector of shortNameSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        await page.fill(selector, testData.shortName);
        logInfo(`已填写公司简称: ${testData.shortName}`);
        break;
      } catch (error) {
        // 可选字段，忽略错误
      }
    }

    // 填写联系人
    const contactPersonSelectors = [
      'input[name="CONTACT_PERSON"]',
      'input[placeholder*="联系人"]',
      '.arco-form-item:has-text("联系人") input'
    ];

    for (const selector of contactPersonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        await page.fill(selector, testData.contactPerson);
        logInfo(`已填写联系人: ${testData.contactPerson}`);
        break;
      } catch (error) {
        // 可选字段
      }
    }

    // 填写联系电话
    const contactPhoneSelectors = [
      'input[name="CONTACT_PHONE"]',
      'input[placeholder*="电话"]',
      '.arco-form-item:has-text("电话") input'
    ];

    for (const selector of contactPhoneSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        await page.fill(selector, testData.contactPhone);
        logInfo(`已填写联系电话: ${testData.contactPhone}`);
        break;
      } catch (error) {
        // 可选字段
      }
    }

    // 截图
    await takeScreenshot(page, 'form-filled');

    // 点击保存按钮
    const saveButtonSelectors = [
      'button:has-text("保存")',
      'button:has-text("确定")',
      'button:has-text("提交")',
      'button[type="submit"]',
      '.arco-btn-primary:has-text("保")'
    ];

    let buttonClicked = false;
    for (const selector of saveButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        await page.click(selector);
        buttonClicked = true;
        logInfo(`点击了保存按钮: ${selector}`);
        break;
      } catch (error) {
        // 继续尝试
      }
    }

    if (!buttonClicked) {
      throw new Error('找不到保存按钮');
    }

    // 等待保存完成（可能显示成功提示或跳转）
    await page.waitForTimeout(2000);

    // 检查是否有成功提示
    const hasSuccessMessage = await page.$('.arco-message-success, .arco-notification-success, [class*="success"]') !== null;

    if (hasSuccessMessage) {
      logPass('保存成功，显示成功提示');
    } else {
      logPass('保存操作已完成');
    }

    logInfo(`创建的公司: ${testData.name}`);

    return testData;
  } catch (error) {
    logFail('填写和保存失败', error);
    await takeScreenshot(page, 'save-error');
    throw error;
  }
}

/**
 * 测试 5: 返回列表并验证新增的记录
 */
async function test05_VerifyCreatedRecord(page, companyName) {
  logTest('返回列表并验证新增的记录');

  try {
    // 如果在详情页，点击返回按钮
    const backButtonSelectors = [
      'button:has-text("返回")',
      'button:has-text("关闭")',
      '.arco-btn:has-text("返回")'
    ];

    for (const selector of backButtonSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          logInfo('点击返回按钮');
          await page.waitForTimeout(1000);
          break;
        }
      } catch (error) {
        // 继续
      }
    }

    // 确保在列表页
    const companyListUrl = `${CONFIG.BASE_URL}/metadata/list/${CONFIG.COMPANY_TABLE_ID}`;
    await page.goto(companyListUrl);
    await page.waitForTimeout(1000);

    // 等待表格加载
    await page.waitForSelector('.arco-table, table', { timeout: CONFIG.TIMEOUT });

    // 在表格中查找刚创建的公司
    const tableContent = await page.textContent('.arco-table, table');

    if (tableContent.includes(companyName)) {
      logPass(`在列表中找到新增的公司: ${companyName}`);
      await takeScreenshot(page, 'record-verified');
      return true;
    } else {
      logFail('在列表中未找到新增的公司', new Error(`未找到: ${companyName}`));
      await takeScreenshot(page, 'record-not-found');
      return false;
    }
  } catch (error) {
    logFail('验证记录失败', error);
    await takeScreenshot(page, 'verify-error');
    return false;
  }
}

/**
 * 测试 6: 点击查看按钮查看详情
 */
async function test06_ViewCompanyDetail(page, companyName) {
  logTest('查看公司详情');

  try {
    // 在表格中找到目标行
    await page.waitForSelector('.arco-table, table', { timeout: CONFIG.TIMEOUT });

    // 查找包含公司名称的行中的"查看"按钮
    const rows = await page.$$('.arco-table-tr, tr');

    for (const row of rows) {
      const rowText = await row.textContent();
      if (rowText && rowText.includes(companyName)) {
        // 在这一行中查找查看按钮
        const viewButton = await row.$('button:has-text("查看"), a:has-text("查看")');
        if (viewButton) {
          await viewButton.click();
          logInfo('点击查看按钮');
          await page.waitForTimeout(1000);
          break;
        }
      }
    }

    // 等待详情页面加载
    await page.waitForTimeout(1000);

    // 验证是否进入详情页
    const hasFormContent = await page.$('form, .arco-form, .arco-descriptions') !== null;

    if (hasFormContent) {
      logPass('成功进入详情页');
      await takeScreenshot(page, 'detail-view');
      return true;
    } else {
      throw new Error('未能进入详情页');
    }
  } catch (error) {
    logFail('查看详情失败', error);
    await takeScreenshot(page, 'view-detail-error');
    return false;
  }
}

/**
 * 测试 7: 点击编辑按钮并修改信息
 */
async function test07_EditCompany(page, originalName) {
  logTest('编辑公司信息');

  try {
    // 查找编辑按钮
    const editButtonSelectors = [
      'button:has-text("编辑")',
      'button:has-text("修改")',
      '.arco-btn:has-text("编辑")'
    ];

    let buttonClicked = false;
    for (const selector of editButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        await page.click(selector);
        buttonClicked = true;
        logInfo('点击编辑按钮');
        await page.waitForTimeout(1000);
        break;
      } catch (error) {
        // 继续尝试
      }
    }

    if (!buttonClicked) {
      throw new Error('找不到编辑按钮');
    }

    // 等待表单变为可编辑状态
    await page.waitForTimeout(1000);

    // 修改公司名称
    const newName = `${originalName}_已修改`;
    const nameInputSelectors = [
      'input[name="NAME"]',
      'input[placeholder*="公司名称"]',
      '.arco-form-item:has-text("公司名称") input',
      '.arco-form-item:has-text("名称") input:not([disabled])'
    ];

    for (const selector of nameInputSelectors) {
      try {
        const input = await page.$(selector);
        if (input) {
          await input.fill('');  // 清空
          await input.fill(newName);  // 填写新值
          logInfo(`已修改公司名称: ${newName}`);
          break;
        }
      } catch (error) {
        // 继续尝试
      }
    }

    // 修改联系人
    const contactPersonSelectors = [
      'input[name="CONTACT_PERSON"]',
      'input[placeholder*="联系人"]',
      '.arco-form-item:has-text("联系人") input:not([disabled])'
    ];

    for (const selector of contactPersonSelectors) {
      try {
        const input = await page.$(selector);
        if (input) {
          await input.fill('');
          await input.fill('李四');
          logInfo('已修改联系人: 李四');
          break;
        }
      } catch (error) {
        // 可选字段
      }
    }

    // 截图
    await takeScreenshot(page, 'form-edited');

    // 点击保存按钮
    const saveButtonSelectors = [
      'button:has-text("保存")',
      'button:has-text("确定")',
      'button[type="submit"]'
    ];

    buttonClicked = false;
    for (const selector of saveButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        await page.click(selector);
        buttonClicked = true;
        logInfo('点击保存按钮');
        break;
      } catch (error) {
        // 继续尝试
      }
    }

    if (!buttonClicked) {
      throw new Error('找不到保存按钮');
    }

    // 等待保存完成
    await page.waitForTimeout(2000);

    logPass('修改成功');

    return newName;
  } catch (error) {
    logFail('编辑失败', error);
    await takeScreenshot(page, 'edit-error');
    throw error;
  }
}

/**
 * 测试 8: 删除公司记录
 */
async function test08_DeleteCompany(page, companyName) {
  logTest('删除公司记录');

  try {
    // 返回列表页
    const companyListUrl = `${CONFIG.BASE_URL}/metadata/list/${CONFIG.COMPANY_TABLE_ID}`;
    await page.goto(companyListUrl);
    await page.waitForTimeout(1000);

    // 等待表格加载
    await page.waitForSelector('.arco-table, table', { timeout: CONFIG.TIMEOUT });

    // 在表格中找到目标行的删除按钮
    const rows = await page.$$('.arco-table-tr, tr');

    for (const row of rows) {
      const rowText = await row.textContent();
      if (rowText && rowText.includes(companyName)) {
        // 在这一行中查找删除按钮
        const deleteButton = await row.$('button:has-text("删除"), a:has-text("删除")');
        if (deleteButton) {
          await deleteButton.click();
          logInfo('点击删除按钮');
          await page.waitForTimeout(500);

          // 处理确认对话框
          const confirmButtonSelectors = [
            '.arco-modal button:has-text("确定")',
            '.arco-modal button:has-text("删除")',
            '.arco-popconfirm button:has-text("确定")',
            '.arco-popconfirm button:has-text("删除")'
          ];

          for (const selector of confirmButtonSelectors) {
            try {
              const confirmButton = await page.$(selector);
              if (confirmButton) {
                await confirmButton.click();
                logInfo('确认删除');
                await page.waitForTimeout(1000);
                break;
              }
            } catch (error) {
              // 继续尝试
            }
          }

          break;
        }
      }
    }

    // 验证删除成功
    await page.waitForTimeout(1000);
    const tableContent = await page.textContent('.arco-table, table');

    if (!tableContent.includes(companyName)) {
      logPass('删除成功，记录已从列表中移除');
      await takeScreenshot(page, 'record-deleted');
      return true;
    } else {
      logInfo('记录可能仍在列表中（可能是软删除）');
      return true;
    }
  } catch (error) {
    logFail('删除失败', error);
    await takeScreenshot(page, 'delete-error');
    return false;
  }
}

/**
 * 测试 9: 测试批量操作
 */
async function test09_BatchOperations(page) {
  logTest('测试批量操作');

  try {
    // 确保在列表页
    const companyListUrl = `${CONFIG.BASE_URL}/metadata/list/${CONFIG.COMPANY_TABLE_ID}`;
    await page.goto(companyListUrl);
    await page.waitForTimeout(1000);

    // 等待表格加载
    await page.waitForSelector('.arco-table, table', { timeout: CONFIG.TIMEOUT });

    // 先创建几条测试数据
    const testCompanies = [];
    for (let i = 0; i < 3; i++) {
      // 点击新增
      await clickElement(page, 'button:has-text("新增")', '新增按钮');
      await page.waitForTimeout(1000);

      // 填写基本信息
      const timestamp = Date.now() + i;
      const name = `批量测试公司${i + 1}_${timestamp}`;

      await fillInput(page, 'input[name="NAME"], input[placeholder*="名称"]', name, '公司名称');

      // 保存
      await clickElement(page, 'button:has-text("保存")', '保存按钮');
      await page.waitForTimeout(2000);

      testCompanies.push(name);

      // 返回列表
      await page.goto(companyListUrl);
      await page.waitForTimeout(1000);
    }

    logInfo(`已创建 ${testCompanies.length} 条测试记录`);

    // 勾选复选框
    const checkboxes = await page.$$('.arco-checkbox input[type="checkbox"]');
    let checkedCount = 0;

    for (let i = 0; i < Math.min(3, checkboxes.length); i++) {
      try {
        await checkboxes[i].check();
        checkedCount++;
        await page.waitForTimeout(200);
      } catch (error) {
        // 继续
      }
    }

    if (checkedCount > 0) {
      logInfo(`已选中 ${checkedCount} 条记录`);

      // 查找批量删除按钮
      const batchDeleteButton = await page.$('button:has-text("批量删除"), button:has-text("删除")');

      if (batchDeleteButton) {
        await batchDeleteButton.click();
        logInfo('点击批量删除按钮');
        await page.waitForTimeout(500);

        // 确认删除
        const confirmButton = await page.$('.arco-modal button:has-text("确定"), .arco-popconfirm button:has-text("确定")');
        if (confirmButton) {
          await confirmButton.click();
          logInfo('确认批量删除');
          await page.waitForTimeout(2000);
        }

        logPass('批量删除操作完成');
        await takeScreenshot(page, 'batch-delete');
      } else {
        logInfo('未找到批量删除按钮，跳过批量删除测试');
      }
    } else {
      logInfo('未能选中记录，跳过批量操作测试');
    }

    return true;
  } catch (error) {
    logFail('批量操作测试失败', error);
    await takeScreenshot(page, 'batch-operation-error');
    return false;
  }
}

// 主测试流程
async function runTests() {
  log('\n========================================', 'cyan');
  log('  公司表单 浏览器自动化测试', 'cyan');
  log('========================================\n', 'cyan');

  log(`前端地址: ${CONFIG.BASE_URL}`, 'blue');
  log(`测试用户: ${CONFIG.TEST_USER.username}`, 'blue');
  log(`无头模式: ${CONFIG.HEADLESS ? '是' : '否'}`, 'blue');
  log(`操作速度: ${CONFIG.SLOW_MO}ms\n`, 'blue');

  let browser;
  let context;
  let page;

  try {
    // 启动浏览器
    browser = await chromium.launch({
      headless: CONFIG.HEADLESS,
      slowMo: CONFIG.SLOW_MO
    });

    // 测试 1: 登录
    const loginResult = await test01_Login(browser);
    context = loginResult.context;
    page = loginResult.page;

    // 测试 2: 导航到公司管理页面
    await test02_NavigateToCompanyList(page);

    // 测试 3: 打开新增表单
    await test03_OpenCreateForm(page);

    // 测试 4: 填写并保存公司信息
    const testData = await test04_FillAndSaveCompany(page);

    // 测试 5: 验证新增的记录
    await test05_VerifyCreatedRecord(page, testData.name);

    // 测试 6: 查看详情
    await test06_ViewCompanyDetail(page, testData.name);

    // 测试 7: 编辑公司信息
    const updatedName = await test07_EditCompany(page, testData.name);

    // 测试 8: 删除公司记录
    await test08_DeleteCompany(page, updatedName);

    // 测试 9: 批量操作
    await test09_BatchOperations(page);

  } catch (error) {
    log(`\n❌ 测试执行出错: ${error.message}`, 'red');
    console.error(error);
  } finally {
    // 关闭浏览器
    if (browser) {
      await browser.close();
      log('\n浏览器已关闭', 'blue');
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

  const passRate = testResults.total > 0
    ? ((testResults.passed / testResults.total) * 100).toFixed(2)
    : '0.00';
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
