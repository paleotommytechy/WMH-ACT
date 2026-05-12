
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
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select(`
          *,
          submissions (
            id,
            created_at,
            time_spent
          )
        `)
        .order('full_name');

      if (pError) throw pError;

      const processed = profiles.map((p: any) => {
        const lastSubDate = p.last_submission_date ? new Date(p.last_submission_date) : null;
        const now = new Date();
        const diffDays = lastSubDate ? Math.floor((now.getTime() - lastSubDate.getTime()) / (1000 * 3600 * 24)) : 999;
        
        let status: 'active' | 'at-risk' | 'inactive' = 'inactive';
        if (diffDays <= 1) status = 'active';
        else if (diffDays <= 3) status = 'at-risk';

        return {
          ...p,
          status,
          totalHours: p.submissions?.reduce((acc: number, s: any) => acc + (s.time_spent / 60), 0) || 0
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

  if (loading) return <div className="animate-pulse space-y-4">
    <div className="h-20 bg-neutral-100 rounded-2xl" />
    <div className="h-64 bg-neutral-100 rounded-2xl" />
  </div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Active Today</span>
            <div className="text-3xl font-black text-green-600">{stats.active}</div>
          </div>
          <TrendingUp className="text-green-100" size={48} />
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">At Risk</span>
            <div className="text-3xl font-black text-orange-500">{stats.atRisk}</div>
          </div>
          <BadgeAlert className="text-orange-100" size={48} />
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Total Students</span>
            <div className="text-3xl font-black text-violet-600">{stats.total}</div>
          </div>
          <Users className="text-violet-100" size={48} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-50 flex items-center justify-between">
          <h2 className="text-xl font-bold">User Directory</h2>
          <button 
            onClick={fetchData}
            className="text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors uppercase tracking-widest"
          >
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50/50 text-neutral-400 text-[10px] font-bold uppercase tracking-widest border-b border-neutral-50">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Streak</th>
                <th className="px-6 py-4 text-center">Hours</th>
                <th className="px-6 py-4 text-center">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-neutral-900">{u.full_name}</div>
                    <div className="text-[10px] text-neutral-400">{u.id.substring(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`
                      text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider
                      ${u.status === 'active' ? 'bg-green-50 text-green-600 border border-green-100' : 
                        u.status === 'at-risk' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                        'bg-red-50 text-red-600 border border-red-100'}
                    `}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 font-black text-violet-600">
                      <span>{u.streak_count}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-neutral-500">
                    {u.totalHours.toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-neutral-400 font-medium">
                    {u.last_submission_date ? format(new Date(u.last_submission_date), 'MMM d, h:mm a') : 'Never'}
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
