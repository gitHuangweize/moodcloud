// 修复版测试数据生成脚本 - 直接复制到控制台
async function generateTestData(count = 500) {
  console.log(`🔄 开始生成 ${count} 条测试数据...`);
  
  const contents = [
    '今天天气真好，心情很棒', '工作有点累，需要休息', '想要去旅行看看世界', '美食真的太香了', '学习新技能很有成就感',
    '运动让人快乐健康', '朋友是人生最宝贵的财富', '家人的温暖无可替代', '梦想正在一步步实现', '生活需要仪式感',
    '读书使人充实智慧', '音乐能治愈心灵', '艺术点亮生活色彩', '大自然的美让人敬畏', '感恩每一个美好瞬间',
    '努力就会有收获', '坚持就是胜利', '相信自己，你可以的', '每一天都是新的开始', '简单就是幸福',
    '时间过得真快', '回忆总是美好的', '未来充满希望', '活在当下最重要', '做自己喜欢的事'
  ];

  if (typeof window.supabaseStorageService === 'undefined') {
    console.error('❌ 请在应用的浏览器控制台中运行此脚本');
    return;
  }

  const colors = ['text-blue-600', 'text-purple-600', 'text-pink-600', 'text-indigo-600', 'text-cyan-600'];
  
  // 生成有效的 UUID
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  for (let i = 0; i < count; i++) {
    const thought = {
      content: contents[Math.floor(Math.random() * contents.length)],
      type: 'WHISPER',
      author: `测试用户${Math.floor(Math.random() * 50) + 1}`,
      authorId: generateUUID(), // 使用正确的 UUID 格式
      timestamp: Math.floor(Date.now() - Math.random() * 86400000 * 30), // 使用 Math.floor 确保是整数
      likes: Math.floor(Math.random() * 100),
      echoes: Math.floor(Math.random() * 20),
      x: Math.random() * 80 + 5,
      y: Math.random() * 70 + 10,
      fontSize: Math.floor(Math.random() * 12) + 14,
      color: colors[Math.floor(Math.random() * colors.length)]
    };

    try {
      await window.supabaseStorageService.saveThought(thought);
      if ((i + 1) % 50 === 0) {
        console.log(`✅ 已生成 ${i + 1} 条数据`);
      }
    } catch (error) {
      console.error(`❌ 生成第 ${i + 1} 条数据时出错:`, error);
    }
  }

  console.log(`🎉 成功生成 ${count} 条测试数据！`);
  console.log('🔄 刷新页面查看效果...');
}

// 清理测试数据
async function clearTestData() {
  console.log('🧹 开始清理测试数据...');
  try {
    const thoughts = await window.supabaseStorageService.getThoughts();
    const testThoughts = thoughts.filter(t => t.author.includes('测试用户'));
    
    for (const thought of testThoughts) {
      await window.supabaseStorageService.deleteThought(thought.id);
    }
    
    console.log(`✅ 清理了 ${testThoughts.length} 条测试数据`);
  } catch (error) {
    console.error('❌ 清理数据时出错:', error);
  }
}

console.log('🎯 修复版测试数据脚本已加载！');
console.log('使用方法:');
console.log('  generateTestData(100) - 生成100条测试数据');
console.log('  generateTestData(500) - 生成500条测试数据');
console.log('  clearTestData() - 清理所有测试数据');
