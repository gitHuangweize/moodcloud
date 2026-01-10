
import React, { useEffect, useState } from 'react';
import { supabaseStorageService } from '../services/supabaseStorageService';
import { BarChart3, Users, MessageSquare, PenTool, BrainCircuit, Calendar } from 'lucide-react';

interface StatItemProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, icon, color }) => (
  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex items-center gap-4 border border-white/20">
    <div className={`p-3 rounded-lg ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-white/60 text-sm">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const StatsView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await supabaseStorageService.getDailyStats(7);
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const todayStats = stats[0] || { dau: 0, posts_count: 0, comments_count: 0, ai_calls_count: 0 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 w-full max-w-2xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-indigo-400" />
            <h2 className="text-xl font-bold text-white">全站统计数据</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            关闭
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h3 className="text-white/80 font-medium mb-4 flex items-center gap-2">
                  <Calendar size={18} /> 今日概览 ({new Date().toLocaleDateString()})
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <StatItem 
                    label="活跃用户 (DAU)" 
                    value={todayStats.dau} 
                    icon={<Users size={20} className="text-blue-400" />} 
                    color="bg-blue-400/10"
                  />
                  <StatItem 
                    label="今日发帖" 
                    value={todayStats.posts_count} 
                    icon={<PenTool size={20} className="text-emerald-400" />} 
                    color="bg-emerald-400/10"
                  />
                  <StatItem 
                    label="今日评论" 
                    value={todayStats.comments_count} 
                    icon={<MessageSquare size={20} className="text-orange-400" />} 
                    color="bg-orange-400/10"
                  />
                  <StatItem 
                    label="AI 调用次数" 
                    value={todayStats.ai_calls_count} 
                    icon={<BrainCircuit size={20} className="text-purple-400" />} 
                    color="bg-purple-400/10"
                  />
                </div>
              </div>

              {stats.length > 1 && (
                <div>
                  <h3 className="text-white/80 font-medium mb-4">最近 7 天趋势</h3>
                  <div className="bg-white/5 rounded-xl p-4 overflow-x-auto">
                    <table className="w-full text-left text-sm text-white/70">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="pb-2">日期</th>
                          <th className="pb-2">DAU</th>
                          <th className="pb-2">发帖</th>
                          <th className="pb-2">评论</th>
                          <th className="pb-2">AI 调用</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {stats.map((s, i) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                            <td className="py-2 font-mono">{s.date}</td>
                            <td className="py-2">{s.dau}</td>
                            <td className="py-2">{s.posts_count}</td>
                            <td className="py-2">{s.comments_count}</td>
                            <td className="py-2">{s.ai_calls_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsView;
