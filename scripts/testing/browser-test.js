// 在浏览器控制台中运行这个脚本来测试抽样功能

console.log('🧪 开始测试云图抽样功能...');

// 1. 检查当前显示的想法数量
function checkCurrentThoughts() {
  const thoughtElements = document.querySelectorAll('[class*="absolute cursor-pointer"]');
  console.log(`📊 当前显示的想法数量: ${thoughtElements.length}`);
  return thoughtElements.length;
}

// 2. 测试换一批功能
function testRefreshBatch() {
  console.log('🔄 测试换一批功能...');
  
  // 记录当前的想法内容
  const beforeContent = Array.from(document.querySelectorAll('[class*="absolute cursor-pointer"]'))
    .map(el => el.textContent.trim());
  
  console.log('换一批前的内容:', beforeContent.slice(0, 5)); // 只显示前5个
  
  // 点击换一批按钮
  const refreshButton = document.querySelector('button[title="换一批"]');
  if (refreshButton) {
    refreshButton.click();
    console.log('✅ 成功点击换一批按钮');
    
    // 等待一下让内容更新
    setTimeout(() => {
      const afterContent = Array.from(document.querySelectorAll('[class*="absolute cursor-pointer"]'))
        .map(el => el.textContent.trim());
      
      console.log('换一批后的内容:', afterContent.slice(0, 5)); // 只显示前5个
      
      // 检查内容是否真的变化了
      const changed = beforeContent.some((content, index) => content !== afterContent[index]);
      console.log(changed ? '✅ 内容已更新' : '⚠️ 内容可能没有变化');
      
      checkCurrentThoughts();
    }, 1000);
  } else {
    console.error('❌ 找不到换一批按钮');
  }
}

// 3. 性能测试
function performanceTest() {
  console.log('⚡ 开始性能测试...');
  
  const iterations = 10;
  const startTime = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    setTimeout(() => {
      const refreshButton = document.querySelector('button[title="换一批"]');
      if (refreshButton) {
        refreshButton.click();
      }
      
      if (i === iterations - 1) {
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        console.log(`⚡ ${iterations} 次换一批总耗时: ${totalTime.toFixed(2)}ms`);
        console.log(`⚡ 平均每次耗时: ${(totalTime / iterations).toFixed(2)}ms`);
      }
    }, i * 200);
  }
}

// 4. 视觉检查
function visualCheck() {
  console.log('👀 视觉检查清单:');
  console.log('□ 换一批按钮是否可见？');
  console.log('□ 想法是否随机分布？');
  console.log('□ 颜色是否多样化？');
  console.log('□ 字体大小是否有变化？');
  console.log('□ 动画效果是否流畅？');
  
  // 检查按钮
  const refreshButton = document.querySelector('button[title="换一批"]');
  console.log(refreshButton ? '✅ 换一批按钮可见' : '❌ 换一批按钮不可见');
}

// 运行所有测试
function runAllTests() {
  console.log('🎯 开始完整测试流程...');
  
  checkCurrentThoughts();
  visualCheck();
  
  setTimeout(() => {
    testRefreshBatch();
  }, 1000);
  
  setTimeout(() => {
    performanceTest();
  }, 3000);
}

// 自动运行测试
runAllTests();

// 也可以单独运行各个测试
// checkCurrentThoughts();
// testRefreshBatch();
// performanceTest();
// visualCheck();

console.log('🎉 测试脚本已加载！你可以手动调用上面的函数进行测试。');
