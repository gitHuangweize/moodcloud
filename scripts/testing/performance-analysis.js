// 性能分析和优化建议
console.log('🔍 性能瓶颈分析...');

// 1. 检查数据量大小
async function analyzeDataSize() {
  const thoughts = await window.supabaseStorageService.getThoughts();
  console.log(`📊 总数据量: ${thoughts.length} 条`);
  
  // 模拟抽样耗时
  const startTime = performance.now();
  const sampled = thoughts.length > 100 ? [...thoughts].sort(() => 0.5 - Math.random()).slice(0, 100) : thoughts;
  const endTime = performance.now();
  
  console.log(`⏱️ 抽样算法耗时: ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`📊 抽样后: ${sampled.length} 条`);
}

// 2. 测试 React 重渲染耗时
function testReactRenderTime() {
  console.log('⚡ 测试 React 重渲染性能...');
  
  const startTime = performance.now();
  
  // 触发换一批
  const refreshBtn = document.querySelector('button[title="换一批"]');
  if (refreshBtn) {
    refreshBtn.click();
  }
  
  // 监听 DOM 变化
  const observer = new MutationObserver(() => {
    const endTime = performance.now();
    console.log(`⏱️ DOM 更新完成，总耗时: ${(endTime - startTime).toFixed(2)}ms`);
    observer.disconnect();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true
  });
}

// 3. 优化建议：使用 useCallback 和减少重新渲染
console.log('💡 优化建议:');
console.log('1. 主要瓶颈可能在 React 重渲染，而非算法本身');
console.log('2. 建议使用 useCallback 优化事件处理');
console.log('3. 考虑使用 React.memo 防止不必要的重渲染');
console.log('4. 可以考虑预计算多个抽样结果，切换时直接使用');

// 4. 快速测试当前算法性能
function testAlgorithmPerformance() {
  console.log('🧪 测试抽样算法性能...');
  
  const sizes = [100, 300, 500, 1000];
  
  sizes.forEach(size => {
    // 生成测试数据
    const testData = Array.from({length: size}, (_, i) => ({id: i, content: `test-${i}`}));
    
    // 测试旧算法
    const oldStart = performance.now();
    const oldResult = [...testData].sort(() => 0.5 - Math.random()).slice(0, 100);
    const oldTime = performance.now() - oldStart;
    
    // 测试新算法
    const newStart = performance.now();
    const shuffled = [...testData];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const newResult = shuffled.slice(0, 100);
    const newTime = performance.now() - newStart;
    
    console.log(`📊 ${size}条数据: 旧算法 ${oldTime.toFixed(3)}ms, 新算法 ${newTime.toFixed(3)}ms`);
  });
}

console.log('\n📖 可用命令:');
console.log('analyzeDataSize() - 分析数据量');
console.log('testReactRenderTime() - 测试 React 渲染时间');
console.log('testAlgorithmPerformance() - 测试算法性能');

console.log('\n🚀 建议先运行: testAlgorithmPerformance()');
