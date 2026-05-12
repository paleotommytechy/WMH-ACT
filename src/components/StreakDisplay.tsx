
import React from 'react';
import { Flame, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

interface StreakDisplayProps {
  current: number;
  longest: number;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({ current, longest }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-violet-600 text-white rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-2 opacity-20 transform translate-x-2 -translate-y-2">
          <Flame size={80} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Current Streak</span>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black">{current}</span>
          <span className="font-bold">DAYS</span>
        </div>
        <Flame className={`mt-2 ${current > 0 ? 'text-orange-400 fill-orange-400' : 'text-violet-400'}`} size={24} />
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-white border border-violet-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center group"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-1">Longest Streak</span>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-violet-900">{longest}</span>
          <span className="font-bold text-violet-600/50 uppercase text-xs">Best</span>
        </div>
        <Trophy className="mt-2 text-violet-200 group-hover:text-yellow-500 transition-colors" size={24} />
      </motion.div>
    </div>
  );
};
