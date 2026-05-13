
import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { BadgeAlert, Users, TrendingUp, Clock, ExternalLink, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ active: 0, atRisk: 0, total: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: usersData, error: uError } = await supabase
        .from('profiles')
        .select(`
          *,
          submissions (
            id,
            submitted_date,
            time_spent
          )
        `)
        .order('full_name');

      if (uError) throw uError;

      const processed = usersData.map((u: any) => {
        const sortedSubs = (u.submissions || []).sort((a: any, b: any) => 
          b.submitted_date.localeCompare(a.submitted_date)
        );
        
        const lastSubDateStr = sortedSubs[0]?.submitted_date;
        const lastSubDate = lastSubDateStr ? new Date(lastSubDateStr) : null;
        const now = new Date();
        const today = format(now, 'yyyy-MM-dd');
        
        const diffDays = lastSubDateStr ? Math.floor((new Date(today).getTime() - new Date(lastSubDateStr).getTime()) / (1000 * 3600 * 24)) : 999;
        
        let status: 'active' | 'at-risk' | 'inactive' = 'inactive';
        if (diffDays <= 1) status = 'active';
        else if (diffDays <= 3) status = 'at-risk';

        // Calculate Streak
        let currentStreak = 0;
        if (lastSubDateStr) {
          const yesterday = format(new Date(now.getTime() - 86400000), 'yyyy-MM-dd');
          if (lastSubDateStr === today || lastSubDateStr === yesterday) {
            const uniqueDates = Array.from(new Set(sortedSubs.map((s: any) => s.submitted_date))) as string[];
            currentStreak = 1;
            let lastD = new Date(uniqueDates[0]);
            for (let i = 1; i < uniqueDates.length; i++) {
              const currD = new Date(uniqueDates[i]);
              if ((lastD.getTime() - currD.getTime()) / (1000 * 3600 * 24) === 1) {
                currentStreak++;
                lastD = currD;
              } else break;
            }
          }
        }

        return {
          ...u,
          status,
          currentStreak,
          totalHours: u.submissions?.reduce((acc: number, s: any) => acc + (s.time_spent / 60), 0) || 0,
          lastActive: lastSubDateStr
        };
      });

      setUsers(processed);
      setStats({
        total: processed.length,
        active: processed.filter(u => u.status === 'active').length,
        atRisk: processed.filter(u => u.status === 'at-risk').length,
      });
    } catch (error) {
      console.error('Admin fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="space-y-4">
    <div className="h-20 bg-white/5 rounded-2xl animate-pulse" />
    <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
  </div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-violet-400/60 uppercase tracking-widest">Active Today</span>
            <div className="text-3xl font-black text-emerald-400">{stats.active}</div>
          </div>
          <TrendingUp className="text-emerald-400/10" size={48} />
        </div>
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-violet-400/60 uppercase tracking-widest">At Risk</span>
            <div className="text-3xl font-black text-orange-400">{stats.atRisk}</div>
          </div>
          <BadgeAlert className="text-orange-400/10" size={48} />
        </div>
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-violet-400/60 uppercase tracking-widest">Total Students</span>
            <div className="text-3xl font-black text-violet-400">{stats.total}</div>
          </div>
          <Users className="text-violet-400/10" size={48} />
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">User Directory</h2>
          <button 
            onClick={fetchData}
            className="text-xs font-bold text-violet-400 hover:text-white transition-colors uppercase tracking-widest"
          >
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-violet-300/40 text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Streak</th>
                <th className="px-6 py-4 text-center">Hours</th>
                <th className="px-6 py-4 text-center">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{u.full_name}</div>
                    <div className="text-[10px] text-white/40">{u.email}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`
                      text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider
                      ${u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                        u.status === 'at-risk' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'}
                    `}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 font-black text-violet-400">
                      <span>{u.currentStreak}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-white/60">
                    {u.totalHours.toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-white/30 font-medium">
                    {u.lastActive ? format(new Date(u.lastActive), 'MMM d, yyyy') : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
