import React from 'react';
import { motion } from 'motion/react';
import { format, subDays, isSameDay } from 'date-fns';

interface ConsistencyTrackerProps {
  submissions: any[];
}

export const ConsistencyTracker: React.FC<ConsistencyTrackerProps> = ({ submissions }) => {
  const last30Days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i));
  
  const hasSubmissionOnDate = (date: Date) => {
    return submissions.some(s => isSameDay(new Date(s.submitted_date), date));
  };

  const consistencyRate = Math.round(
    (submissions.filter(s => {
      const d = new Date(s.submitted_date);
      return d >= subDays(new Date(), 30);
    }).length / 30) * 100
  );

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-violet-400 uppercase tracking-widest">30-Day Consistency</h3>
          <p className="text-2xl font-black text-white">{consistencyRate}%</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-white/40 uppercase">Activity Map</span>
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
                  : 'bg-white/5 border-white/5'}
              `}
              title={format(date, 'MMM d, yyyy')}
            />
          );
        })}
      </div>
      
      <div className="flex justify-between mt-2 text-[8px] font-bold text-white/20 uppercase tracking-tighter">
        <span>30 Days Ago</span>
        <span>Today</span>
      </div>
    </div>
  );
};
