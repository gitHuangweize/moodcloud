// 生成更多样化的测试数据，降低重复率
async function generateDiverseTestData(count = 500) {
  console.log(`🔄 开始生成 ${count} 条多样化测试数据...`);
  
  // 扩展内容库，增加多样性
  const contents = [
    // 情感类
    '今天心情特别好', '感觉有点沮丧', '内心平静如水', '激动得睡不着', '焦虑又期待',
    '温暖如春', '心情像过山车', '淡淡的忧伤', '满满的幸福感', '有点小失落',
    
    // 工作学习类
    '代码终于跑通了', 'bug改了一整天', '学到新技能了', '项目上线成功', '加班到深夜',
    '面试通过了', '论文写完了', '考试前的紧张', '完成了一个小目标', '今天效率很高',
    
    // 生活日常类
    '早餐吃得很满足', '傍晚的夕阳很美', '雨天听音乐', '周末睡到自然醒', '夜深人静时',
    '一杯咖啡的时光', '整理房间的心情', '做饭的乐趣', '散步的惬意', '阅读的沉浸',
    
    // 人际关系类
    '朋友的鼓励很温暖', '家人的支持很重要', '和同事的愉快合作', '陌生人的善意', '老师的教导',
    '陪伴是最长情的告白', '理解与被理解', '分享的快乐', '倾听的力量', '友谊万岁',
    
    // 梦想未来类
    '梦想正在发芽', '为未来努力', '相信自己能行', '一步一步向前走', '明天会更好',
    '目标就在前方', '坚持就是胜利', '不放弃的梦想', '勇敢做自己', '未来可期',
    
    // 人生感悟类
    '生活需要仪式感', '简单就是幸福', '活在当下最重要', '感恩每一个瞬间', '时间过得真快',
    '回忆总是美好的', '成长路上的风景', '经历就是财富', '心态决定一切', '人生如旅途',
    
    // 兴趣爱好类
    '音乐治愈心灵', '运动释放压力', '画画时的专注', '摄影记录美好', '手工制作的乐趣',
    '园艺的治愈力', '写作的快感', '舞蹈的自由', '旅行的意义', '美食的幸福感',
    
    // 自然风景类
    '春天的花开', '夏日的海风', '秋天的落叶', '冬日的暖阳', '山间的清风',
    '城市的霓虹', '乡村的宁静', '星空的浩瀚', '大海的辽阔', '森林的神秘'
  ];

  if (typeof window.supabaseStorageService === 'undefined') {
    console.error('❌ 请在应用的浏览器控制台中运行此脚本');
    return;
  }

  const colors = ['text-blue-600', 'text-purple-600', 'text-pink-600', 'text-indigo-600', 'text-cyan-600', 'text-green-600', 'text-yellow-600', 'text-red-600'];
  
  // 生成有效的 UUID
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // 检查登录状态
  const { data: { session } } = await window.supabase.auth.getSession();
  if (!session) {
    console.log('❌ 请先登录: 运行 loginTestUser()');
    return;
  }

  let successCount = 0;
  for (let i = 0; i < count; i++) {
    // 随机选择内容，偶尔添加个人化变化
    let content = contents[Math.floor(Math.random() * contents.length)];
    if (Math.random() < 0.3) { // 30% 概率添加变化
      const suffixes = ['～', '！', '...', '✨', '💭', '🌟', '🎯', '🌈'];
      content += suffixes[Math.floor(Math.random() * suffixes.length)];
    }
    
    const thought = {
      content: content,
      type: 'WHISPER',
      author: session.user.user_metadata?.username || '测试用户',
      authorId: session.user.id,
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
    }
  }

  console.log(`🎉 成功生成 ${successCount} 条多样化测试数据！`);
  console.log(`📊 内容库大小: ${contents.length} 种不同内容`);
  console.log('🔄 刷新页面查看效果...');
}

console.log('🎯 多样化测试数据脚本已加载！');
console.log('使用方法:');
console.log('  generateDiverseTestData(300) - 生成300条多样化数据');
console.log('  generateDiverseTestData(500) - 生成500条多样化数据');
