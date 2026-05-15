import React from 'react';
import { motion } from 'motion/react';
import { format, subDays, isSameDay } from 'date-fns';

interface ConsistencyTrackerProps {
  submissions: any[];
  theme?: 'dark' | 'light';
}

export const ConsistencyTracker: React.FC<ConsistencyTrackerProps> = ({ submissions, theme = 'dark' }) => {
  const last30Days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i));
  
  const hasSubmissionOnDate = (date: Date) => {
    return submissions
      .filter(s => !s.review || s.review.status !== 'flagged')
      .some(s => isSameDay(new Date(s.submitted_date), date));
  };

  const consistencyRate = Math.round(
    (submissions
      .filter(s => !s.review || s.review.status !== 'flagged')
      .filter(s => {
        const d = new Date(s.submitted_date);
        return d >= subDays(new Date(), 30);
      }).length / 30) * 100
  );

  return (
    <div className={`backdrop-blur-md rounded-2xl p-6 border shadow-xl transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>30-Day Consistency</h3>
          <p className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{consistencyRate}%</p>
        </div>
        <div className="text-right">
          <span className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Activity Map</span>
        </div>
      </div>

      <div className="flex gap-1.5 justify-between">
        {last30Days.map((date, i) => {
          const active = hasSubmissionOnDate(date);
          return (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.02 }}
              className={`
                flex-1 aspect-square rounded-sm border
                ${active 
                  ? 'bg-violet-500 border-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.3)]' 
                  : theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'}
              `}
              title={format(date, 'MMM d, yyyy')}
            />
          );
        })}
      </div>
      
      <div className={`flex justify-between mt-2 text-[8px] font-bold uppercase tracking-tighter ${theme === 'dark' ? 'text-white/20' : 'text-slate-300'}`}>
        <span>30 Days Ago</span>
        <span>Today</span>
      </div>
    </div>
  );
};
