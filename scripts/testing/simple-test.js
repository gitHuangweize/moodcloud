// 简化版测试脚本 - 直接复制到浏览器控制台运行

console.log('🧪 MoodCloud 抽样功能测试脚本已加载！');

// 1. 检查当前显示的想法数量
function countThoughts() {
  const thoughts = document.querySelectorAll('[class*="absolute cursor-pointer"]');
  console.log(`📊 当前显示的想法数量: ${thoughts.length}`);
  return thoughts.length;
}

// 2. 获取当前显示的内容
function getCurrentContent() {
  const thoughts = document.querySelectorAll('[class*="absolute cursor-pointer"]');
  return Array.from(thoughts).map(el => el.textContent.trim());
}

// 3. 测试换一批功能
function testRefresh() {
  console.log('🔄 测试换一批功能...');
  
  const before = getCurrentContent();
  console.log('换一批前的前5个内容:', before.slice(0, 5));
  
  // 点击换一批按钮
  const refreshBtn = document.querySelector('button[title="换一批"]');
  if (refreshBtn) {
    refreshBtn.click();
    console.log('✅ 成功点击换一批按钮');
    
    setTimeout(() => {
      const after = getCurrentContent();
      console.log('换一批后的前5个内容:', after.slice(0, 5));
      
      // 检查是否有变化
      const changed = before.some((content, index) => content !== after[index]);
      console.log(changed ? '✅ 内容已更新' : '⚠️ 内容可能没有变化');
      countThoughts();
    }, 500);
  } else {
    console.error('❌ 找不到换一批按钮');
  }
}

// 4. 快速测试换一批多次
function testMultipleRefresh(times = 5) {
  console.log(`🔄 快速测试换一批 ${times} 次...`);
  
  let count = 0;
  const interval = setInterval(() => {
    const refreshBtn = document.querySelector('button[title="换一批"]');
    if (refreshBtn) {
      refreshBtn.click();
      count++;
      console.log(`✅ 第 ${count} 次换一批完成`);
      
      if (count >= times) {
        clearInterval(interval);
        console.log('🎉 多次测试完成！');
        countThoughts();
      }
    }
  }, 800);
}

// 5. 生成测试数据（简化版）
function createTestData(count = 100) {
  console.log(`🔄 开始创建 ${count} 条测试数据...`);
  
  const contents = [
    '今天心情不错', '工作有点累', '想要去旅行', '美食真香', '学习新技能',
    '运动很快乐', '朋友很重要', '家人最温暖', '梦想实现中', '生活需要仪式感'
  ];
  
  // 直接操作 DOM 添加一些测试元素来验证抽样
  const container = document.querySelector('.relative.w-full.h-\\[calc\\(100vh-120px\\)\\]');
  if (!container) {
    console.error('❌ 找不到云图容器');
    return;
  }
  
  // 先清空现有的
  const existing = container.querySelectorAll('[class*="absolute cursor-pointer"]');
  existing.forEach(el => el.remove());
  
  // 添加大量测试数据
  for (let i = 0; i < count; i++) {
    const div = document.createElement('div');
    div.className = `absolute cursor-pointer select-none transition-all duration-700 hover:scale-110 active:scale-95 animate-float text-blue-600 whitespace-nowrap`;
    div.style.cssText = `
      left: ${Math.random() * 80 + 5}%;
      top: ${Math.random() * 70 + 10}%;
      font-size: ${Math.floor(Math.random() * 12) + 14}px;
      opacity: 0.8;
      animation-delay: ${Math.random() * 5}s;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.05));
    `;
    div.textContent = contents[Math.floor(Math.random() * contents.length)];
    container.appendChild(div);
  }
  
  console.log(`✅ 已创建 ${count} 条测试数据`);
  countThoughts();
}

// 6. 验证抽样效果
function verifySampling() {
  console.log('🔍 验证抽样效果...');
  
  const total = document.querySelectorAll('[class*="absolute cursor-pointer"]').length;
  console.log(`📊 当前显示: ${total} 个想法`);
  
  if (total <= 200) {
    console.log('✅ 抽样正常：显示数量 ≤ 200');
  } else {
    console.log('⚠️ 抽样可能有问题：显示数量 > 200');
  }
  
  // 检查分布
  const contents = getCurrentContent();
  const unique = new Set(contents);
  console.log(`📊 内容去重后: ${unique.size} 个唯一内容`);
  console.log(`📊 重复率: ${((contents.length - unique.size) / contents.length * 100).toFixed(1)}%`);
}

// 运行完整测试
function runFullTest() {
  console.log('🎯 开始完整测试流程...');
  console.log('='.repeat(50));
  
  // 1. 检查初始状态
  console.log('📋 步骤 1: 检查初始状态');
  countThoughts();
  verifySampling();
  
  // 2. 测试换一批
  setTimeout(() => {
    console.log('\n📋 步骤 2: 测试换一批功能');
    testRefresh();
  }, 1000);
  
  // 3. 多次测试
  setTimeout(() => {
    console.log('\n📋 步骤 3: 多次换一批测试');
    testMultipleRefresh(3);
  }, 3000);
  
  // 4. 创建大量数据测试
  setTimeout(() => {
    console.log('\n📋 步骤 4: 大数据量测试');
    createTestData(500);
  }, 6000);
  
  // 5. 最终验证
  setTimeout(() => {
    console.log('\n📋 步骤 5: 最终验证');
    verifySampling();
    console.log('\n🎉 所有测试完成！');
  }, 8000);
}

// 使用说明
console.log('\n📖 使用说明:');
console.log('countThoughts() - 统计当前显示的想法数量');
console.log('testRefresh() - 测试换一批功能');
console.log('testMultipleRefresh(5) - 快速测试5次换一批');
console.log('createTestData(300) - 创建300条测试数据');
console.log('verifySampling() - 验证抽样效果');
console.log('runFullTest() - 运行完整测试流程');
console.log('\n🚀 建议运行: runFullTest()');
