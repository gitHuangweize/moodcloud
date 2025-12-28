// 带登录功能的测试数据生成脚本
async function loginTestUser() {
  console.log('🔐 登录测试用户...');
  
  try {
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email: 'huangyongjin3@126.com',
      password: '123456'
    });
    
    if (error) {
      console.log('📝 测试用户不存在，尝试注册...');
      // 如果用户不存在，先注册
      const { data: signUpData, error: signUpError } = await window.supabase.auth.signUp({
        email: 'huangyongjin3@126.com',
        password: '123456',
        options: {
          data: {
            username: '测试用户'
          }
        }
      });
      
      if (signUpError) {
        console.error('❌ 注册失败:', signUpError);
        return false;
      }
      
      console.log('✅ 注册成功，请检查邮箱确认后重新登录');
      return false;
    }
    
    console.log('✅ 登录成功！');
    console.log('用户信息:', data.user);
    return true;
  } catch (error) {
    console.error('❌ 登录出错:', error);
    return false;
  }
}

// 生成测试数据的函数（需要先登录）
async function generateTestData(count = 500) {
  console.log(`🔄 开始生成 ${count} 条测试数据...`);
  
  // 检查是否已登录
  const { data: { session } } = await window.supabase.auth.getSession();
  if (!session) {
    console.log('❌ 请先登录: 运行 loginTestUser()');
    return;
  }
  
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

  let successCount = 0;
  for (let i = 0; i < count; i++) {
    const thought = {
      content: contents[Math.floor(Math.random() * contents.length)],
      type: 'WHISPER',
      author: session.user.user_metadata?.username || '测试用户',
      authorId: session.user.id, // 使用真实用户的 ID
      timestamp: Math.floor(Date.now() - Math.random() * 86400000 * 30),
      likes: Math.floor(Math.random() * 100),
      echoes: Math.floor(Math.random() * 20),
      x: Math.random() * 80 + 5,
      y: Math.random() * 70 + 10,
      fontSize: Math.floor(Math.random() * 12) + 14,
      color: colors[Math.floor(Math.random() * colors.length)]
    };

    try {
      await window.supabaseStorageService.saveThought(thought);
      successCount++;
      if (successCount % 50 === 0) {
        console.log(`✅ 已生成 ${successCount} 条数据`);
      }
    } catch (error) {
      console.error(`❌ 生成第 ${i + 1} 条数据时出错:`, error);
      // 不要 break，继续尝试其他的
    }
  }

  console.log(`🎉 成功生成 ${successCount} 条测试数据！`);
  console.log('🔄 刷新页面查看效果...');
}

// 清理测试数据
async function clearTestData() {
  console.log('🧹 开始清理测试数据...');
  try {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      console.log('❌ 请先登录');
      return;
    }
    
    const thoughts = await window.supabaseStorageService.getThoughts();
    const testThoughts = thoughts.filter(t => t.authorId === session.user.id);
    
    for (const thought of testThoughts) {
      await window.supabaseStorageService.deleteThought(thought.id);
    }
    
    console.log(`✅ 清理了 ${testThoughts.length} 条测试数据`);
  } catch (error) {
    console.error('❌ 清理数据时出错:', error);
  }
}

// 检查登录状态
function checkLoginStatus() {
  window.supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      console.log('✅ 已登录用户:', session.user.user_metadata?.username || session.user.email);
    } else {
      console.log('❌ 未登录');
    }
  });
}

console.log('🎯 带登录功能的测试脚本已加载！');
console.log('使用方法:');
console.log('  loginTestUser() - 登录测试用户');
console.log('  checkLoginStatus() - 检查登录状态');
console.log('  generateTestData(100) - 生成100条测试数据');
console.log('  clearTestData() - 清理测试数据');
console.log('\n🚀 建议顺序: loginTestUser() -> generateTestData(100)');
