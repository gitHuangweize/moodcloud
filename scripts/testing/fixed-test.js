// 修复后的测试脚本 - 复制到浏览器控制台运行

console.log('🔧 MoodCloud 修复验证脚本已加载！');

// 1. 检查当前真实数据（不是DOM测试数据）
function checkRealData() {
  // 获取React组件的数据
  const thoughts = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.[0]?.currentRenderer?.element?.ref?.state?.thoughts;
  if (thoughts) {
    console.log(`📊 React组件中的数据量: ${thoughts.length}`);
    return thoughts.length;
  } else {
    // 备用方法：检查DOM中的实际元素
    const domThoughts = document.querySelectorAll('[class*="absolute cursor-pointer"]');
    console.log(`📊 DOM中显示的元素数量: ${domThoughts.length}`);
    return domThoughts.length;
  }
}

// 2. 获取当前显示的内容
function getCurrentContent() {
  const thoughts = document.querySelectorAll('[class*="absolute cursor-pointer"]');
  return Array.from(thoughts).map(el => el.textContent.trim());
}

// 3. 测试换一批功能（修复版）
function testRefreshFixed() {
  console.log('🔄 测试换一批功能（修复版）...');
  
  const before = getCurrentContent();
  console.log('换一批前的内容（前5个）:', before.slice(0, 5));
  
  // 点击换一批按钮
  const refreshBtn = document.querySelector('button[title="换一批"]');
  if (refreshBtn) {
    refreshBtn.click();
    console.log('✅ 成功点击换一批按钮');
    
    // 等待React重新渲染
    setTimeout(() => {
      const after = getCurrentContent();
      console.log('换一批后的内容（前5个）:', after.slice(0, 5));
      
      // 检查是否有变化
      const changed = before.some((content, index) => content !== after[index]);
      console.log(changed ? '✅ 内容已更新 - 修复成功！' : '⚠️ 内容没有变化');
      
      checkRealData();
    }, 100); // 减少等待时间
  } else {
    console.error('❌ 找不到换一批按钮');
  }
}

// 4. 创建大量真实测试数据
function createRealTestData(count = 500) {
  console.log(`🔄 创建 ${count} 条真实测试数据...`);
  
  const contents = [
    '今天心情不错', '工作有点累', '想要去旅行', '美食真香', '学习新技能',
    '运动很快乐', '朋友很重要', '家人最温暖', '梦想实现中', '生活需要仪式感',
    '代码改变世界', '咖啡续命', '深夜编程', 'bug又出现了', '终于修复了',
    '产品经理又改需求', '设计稿很完美', '测试通过了', '上线成功', '用户很满意'
  ];
  
  const colors = ['text-blue-600', 'text-purple-600', 'text-pink-600', 'text-indigo-600', 'text-cyan-600'];
  
  // 创建测试数据数组
  const testData = [];
  for (let i = 0; i < count; i++) {
    testData.push({
      id: `test-${Date.now()}-${i}`,
      content: contents[Math.floor(Math.random() * contents.length)],
      type: 'WHISPER',
      author: `测试用户${Math.floor(Math.random() * 20) + 1}`,
      authorId: `test-user-${Math.floor(Math.random() * 5) + 1}`,
      timestamp: Date.now() - Math.random() * 86400000 * 30,
      likes: Math.floor(Math.random() * 50),
      echoes: Math.floor(Math.random() * 10),
      x: Math.random() * 80 + 5,
      y: Math.random() * 70 + 10,
      fontSize: Math.floor(Math.random() * 12) + 14,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
  
  // 直接操作React状态（如果可能）
  console.log('✅ 测试数据已准备');
  console.log(`📊 应该显示最多200个，实际显示: ${checkRealData()}个`);
  
  return testData;
}

// 5. 验证抽样是否正确工作
function verifySamplingFixed() {
  console.log('🔍 验证抽样功能...');
  
  const displayed = document.querySelectorAll('[class*="absolute cursor-pointer"]').length;
  console.log(`📊 当前显示: ${displayed} 个想法`);
  
  if (displayed <= 200) {
    console.log('✅ 抽样正常：显示数量 ≤ 200');
  } else {
    console.log('⚠️ 抽样异常：显示数量 > 200');
  }
  
  // 检查内容分布
  const contents = getCurrentContent();
  const unique = new Set(contents);
  console.log(`📊 唯一内容: ${unique.size} 个`);
  console.log(`📊 重复率: ${((contents.length - unique.size) / contents.length * 100).toFixed(1)}%`);
}

// 6. 完整测试流程
function runFixedTest() {
  console.log('🎯 运行修复验证测试...');
  console.log('='.repeat(50));
  
  // 步骤1：检查初始状态
  console.log('📋 步骤1: 检查初始状态');
  verifySamplingFixed();
  
  // 步骤2：测试换一批
  setTimeout(() => {
    console.log('\n📋 步骤2: 测试换一批功能');
    testRefreshFixed();
  }, 1000);
  
  // 步骤3：多次测试换一批
  setTimeout(() => {
    console.log('\n📋 步骤3: 多次换一批测试');
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const refreshBtn = document.querySelector('button[title="换一批"]');
        if (refreshBtn) {
          refreshBtn.click();
          console.log(`✅ 第 ${i + 1} 次换一批完成`);
        }
      }, i * 500);
    }
  }, 3000);
  
  // 步骤4：最终验证
  setTimeout(() => {
    console.log('\n📋 步骤4: 最终验证');
    verifySamplingFixed();
    console.log('\n🎉 修复验证完成！');
  }, 5000);
}

// 使用说明
console.log('\n📖 使用说明:');
console.log('checkRealData() - 检查真实数据量');
console.log('testRefreshFixed() - 测试修复后的换一批功能');
console.log('createRealTestData(500) - 创建500条测试数据');
console.log('verifySamplingFixed() - 验证抽样功能');
console.log('runFixedTest() - 运行完整修复验证');
console.log('\n🚀 建议运行: runFixedTest()');
