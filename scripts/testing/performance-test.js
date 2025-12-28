// 真实数据库性能测试脚本
// 在浏览器控制台中运行

console.log('🚀 MoodCloud 真实性能测试开始...');

// 1. 检查数据加载性能
function testDataLoading() {
  console.log('⏱️ 测试数据加载性能...');
  
  const startTime = performance.now();
  
  // 检查当前显示的想法数量
  setTimeout(() => {
    const thoughts = document.querySelectorAll('[class*="absolute cursor-pointer"]');
    const endTime = performance.now();
    
    console.log(`📊 页面加载完成，显示 ${thoughts.length} 个想法`);
    console.log(`⏱️ 渲染耗时: ${(endTime - startTime).toFixed(2)}ms`);
    
    if (thoughts.length <= 100) {
      console.log('✅ 抽样功能正常：显示数量 ≤ 100');
    } else {
      console.log('⚠️ 抽样异常：显示数量 > 100');
    }
  }, 1000);
}

// 2. 测试换一批性能
function testRefreshPerformance() {
  console.log('⚡ 测试换一批性能...');
  
  const iterations = 10;
  const times = [];
  
  let currentIteration = 0;
  
  function runIteration() {
    const startTime = performance.now();
    
    const refreshBtn = document.querySelector('button[title="换一批"]');
    if (refreshBtn) {
      refreshBtn.click();
      
      setTimeout(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        times.push(duration);
        
        currentIteration++;
        console.log(`第 ${currentIteration} 次换一批: ${duration.toFixed(2)}ms`);
        
        if (currentIteration < iterations) {
          setTimeout(runIteration, 300);
        } else {
          // 统计结果
          const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
          const minTime = Math.min(...times);
          const maxTime = Math.max(...times);
          
          console.log('\n📊 换一批性能统计:');
          console.log(`平均耗时: ${avgTime.toFixed(2)}ms`);
          console.log(`最快耗时: ${minTime.toFixed(2)}ms`);
          console.log(`最慢耗时: ${maxTime.toFixed(2)}ms`);
          
          if (avgTime < 50) {
            console.log('✅ 性能优秀：平均 < 50ms');
          } else if (avgTime < 100) {
            console.log('✅ 性能良好：平均 < 100ms');
          } else {
            console.log('⚠️ 性能需要优化：平均 > 100ms');
          }
        }
      }, 200);
    }
  }
  
  runIteration();
}

// 3. 测试内容随机性
function testRandomness() {
  console.log('🎲 测试内容随机性...');
  
  const samples = [];
  const iterations = 5;
  
  function collectSample() {
    const thoughts = document.querySelectorAll('[class*="absolute cursor-pointer"]');
    const content = Array.from(thoughts).slice(0, 10).map(el => el.textContent.trim());
    samples.push(content);
    
    if (samples.length < iterations) {
      const refreshBtn = document.querySelector('button[title="换一批"]');
      if (refreshBtn) {
        refreshBtn.click();
        setTimeout(collectSample, 500);
      }
    } else {
      // 分析随机性
      console.log('\n📊 随机性分析:');
      samples.forEach((sample, index) => {
        console.log(`第${index + 1}次: [${sample.slice(0, 3).join(', ')}...]`);
      });
      
      // 检查重复率
      const allContent = samples.flat();
      const unique = new Set(allContent);
      const duplicateRate = ((allContent.length - unique.size) / allContent.length * 100).toFixed(1);
      
      console.log(`总样本: ${allContent.length}`);
      console.log(`唯一内容: ${unique.size}`);
      console.log(`重复率: ${duplicateRate}%`);
      
      if (duplicateRate < 30) {
        console.log('✅ 随机性良好：重复率 < 30%');
      } else {
        console.log('⚠️ 随机性一般：重复率 ≥ 30%');
      }
    }
  }
  
  collectSample();
}

// 4. 内存使用检查
function checkMemoryUsage() {
  if (performance.memory) {
    const memory = performance.memory;
    console.log('\n💾 内存使用情况:');
    console.log(`已使用: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`总计: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`限制: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.log('\n💾 当前浏览器不支持内存监控');
  }
}

// 5. 完整性能测试
function runFullPerformanceTest() {
  console.log('🎯 开始完整性能测试...');
  console.log('='.repeat(60));
  
  // 步骤1：数据加载性能
  testDataLoading();
  
  // 步骤2：换一批性能测试
  setTimeout(() => {
    console.log('\n' + '='.repeat(60));
    testRefreshPerformance();
  }, 2000);
  
  // 步骤3：随机性测试
  setTimeout(() => {
    console.log('\n' + '='.repeat(60));
    testRandomness();
  }, 8000);
  
  // 步骤4：内存检查
  setTimeout(() => {
    console.log('\n' + '='.repeat(60));
    checkMemoryUsage();
    console.log('\n🎉 性能测试完成！');
  }, 12000);
}

// 6. 快速验证函数
function quickVerify() {
  const count = document.querySelectorAll('[class*="absolute cursor-pointer"]').length;
  console.log(`📊 当前显示: ${count} 个想法`);
  console.log(count <= 100 ? '✅ 抽样正常' : '⚠️ 抽样异常');
  
  const refreshBtn = document.querySelector('button[title="换一批"]');
  console.log(refreshBtn ? '✅ 换一批按钮存在' : '❌ 换一批按钮不存在');
}

console.log('\n📖 可用命令:');
console.log('runFullPerformanceTest() - 完整性能测试');
console.log('testDataLoading() - 数据加载性能');
console.log('testRefreshPerformance() - 换一批性能');
console.log('testRandomness() - 随机性测试');
console.log('checkMemoryUsage() - 内存使用');
console.log('quickVerify() - 快速验证');

console.log('\n🚀 建议先运行: quickVerify()');
