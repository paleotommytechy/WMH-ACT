import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { 
  Trophy, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  ChevronRight, 
  ChevronLeft,
  ArrowUpRight,
  MessageSquare,
  Zap,
  Target,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  subWeeks,
  isWithinInterval 
} from 'date-fns';
import { toast } from 'react-hot-toast';

interface WeeklyReviewProps {
  userId: string;
  submissions: any[];
  currentStreak: number;
}

export const WeeklyReviewSystem: React.FC<WeeklyReviewProps> = ({ userId, submissions, currentStreak }) => {
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isReflecting, setIsReflecting] = useState(false);
  
  // Form State
  const [learned, setLearned] = useState('');
  const [challenge, setChallenge] = useState('');
  const [win, setWin] = useState('');
  const [focus, setFocus] = useState('');

  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  
  const weekSubmissions = submissions.filter(s => 
    isWithinInterval(new Date(s.submitted_date), { start: selectedWeek, end: weekEnd })
  );

  const stats = {
    totalMinutes: weekSubmissions.reduce((acc, s) => acc + s.time_spent, 0),
    tasksCompleted: weekSubmissions.length,
    activeDays: new Set(weekSubmissions.map(s => s.submitted_date)).size,
    proofs: weekSubmissions.filter(s => s.proof_url).map(s => s.proof_url),
  };

  const getStatus = (activeDays: number) => {
    if (activeDays >= 6) return 'Excellent';
    if (activeDays >= 4) return 'Consistent';
    if (activeDays >= 2) return 'Improving';
    return 'At Risk';
  };

  const status = getStatus(stats.activeDays);

  useEffect(() => {
    fetchReview();
  }, [selectedWeek]);

  const fetchReview = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', format(selectedWeek, 'yyyy-MM-dd'))
        .single();

      if (data) {
        setReview(data);
        setLearned(data.learned_text || '');
        setChallenge(data.challenge_text || '');
        setWin(data.win_text || '');
        setFocus(data.focus_next_week_text || '');
      } else {
        setReview(null);
        setLearned('');
        setChallenge('');
        setWin('');
        setFocus('');
      }
    } catch (err) {
      console.error('Error fetching review:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    try {
      const reviewData = {
        user_id: userId,
        week_start_date: format(selectedWeek, 'yyyy-MM-dd'),
        week_end_date: format(weekEnd, 'yyyy-MM-dd'),
        total_hours: stats.totalMinutes / 60,
        tasks_completed_count: stats.tasksCompleted,
        active_days_count: stats.activeDays,
        streak_maintained: currentStreak,
        learned_text: learned,
        challenge_text: challenge,
        win_text: win,
        focus_next_week_text: focus,
        status: status
      };

      const { error } = await supabase
        .from('weekly_reviews')
        .upsert(reviewData, { onConflict: 'user_id, week_start_date' });

      if (error) throw error;
      
      toast.success('Weekly review saved!');
      fetchReview();
      setIsReflecting(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    setSelectedWeek(prev => direction === 'prev' ? subWeeks(prev, 1) : subWeeks(prev, -1));
  };

  const isCurrentWeek = isSameDay(selectedWeek, startOfWeek(new Date(), { weekStartsOn: 1 }));

  return (
    <div className="space-y-6">
      {/* Week Selector */}
      <div className="flex items-center justify-between bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
        <button 
          onClick={() => changeWeek('prev')}
          className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/60 hover:text-white"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-1">
            Weekly Review Period
          </span>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar size={14} className="text-violet-400" />
            {format(selectedWeek, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h3>
        </div>
        <button 
          onClick={() => changeWeek('next')}
          disabled={isCurrentWeek}
          className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/60 hover:text-white disabled:opacity-20"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <Clock size={16} className="text-emerald-400" />
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${status === 'Excellent' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
              {status}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Total Hours</span>
            <div className="text-2xl font-black text-white">{(stats.totalMinutes / 60).toFixed(1)}h</div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 size={16} className="text-violet-400" />
            <span className="text-[8px] font-bold text-white/20 uppercase">Completed</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Tasks Done</span>
            <div className="text-2xl font-black text-white">{stats.tasksCompleted}</div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={16} className="text-orange-400" />
            <span className="text-[8px] font-bold text-white/20 uppercase">Active</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Active Days</span>
            <div className="text-2xl font-black text-white">{stats.activeDays}/7</div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <Zap size={16} className="text-yellow-400" />
            <span className="text-[8px] font-bold text-white/20 uppercase">Momentum</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Streak</span>
            <div className="text-2xl font-black text-white">{currentStreak}d</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Highlights / Gallery */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-violet-400" />
              Proof Gallery
            </h4>
          </div>
          <div className="p-4">
            {stats.proofs.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl text-white/20 text-xs italic">
                No visual proof uploaded this week
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {stats.proofs.map((url, i) => (
                   <a 
                    key={i} 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="aspect-square bg-white/5 rounded-lg overflow-hidden relative group"
                  >
                    {url.match(/\.(jpeg|jpg|gif|png)$/) ? (
                      <img src={url} alt="proof" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-violet-400">
                        <ArrowUpRight size={24} />
                      </div>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Weekly Reflection */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-violet-600/10">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <MessageSquare size={14} className="text-violet-400" />
              Weekly Reflection
            </h4>
            {!isReflecting && !review && (
               <button 
                onClick={() => setIsReflecting(true)}
                className="text-[10px] font-black bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded-full transition-all flex items-center gap-1 shadow-lg shadow-violet-900/40"
              >
                Start Review
              </button>
            )}
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {isReflecting ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1.5 block">What did you learn?</label>
                    <textarea 
                      value={learned}
                      onChange={(e) => setLearned(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-violet-500 outline-none h-20 resize-none"
                      placeholder="Share your breakthroughs..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1.5 block">Biggest Challenge?</label>
                      <input 
                        value={challenge}
                        onChange={(e) => setChallenge(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-violet-500 outline-none"
                        placeholder="What slowed you down?"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1.5 block">Biggest Win?</label>
                      <input 
                        value={win}
                        onChange={(e) => setWin(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-violet-500 outline-none"
                        placeholder="Celebrate something!"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5 block flex items-center gap-2">
                       <Target size={12} /> Next Week's Focus
                    </label>
                    <input 
                      value={focus}
                      onChange={(e) => setFocus(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                      placeholder="Set your main objective..."
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={handleSubmitReview}
                      className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-all"
                    >
                      Save Reflection
                    </button>
                    <button 
                      onClick={() => setIsReflecting(false)}
                      className="px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ) : review ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="relative pl-4 border-l-2 border-violet-500">
                    <span className="text-[8px] font-bold text-violet-400 uppercase block mb-1">Key Takeaway</span>
                    <p className="text-sm text-white italic leading-relaxed">"{review.learned_text}"</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                      <span className="text-[8px] font-bold text-red-400 uppercase block mb-1">Challenge</span>
                      <p className="text-xs text-white/80">{review.challenge_text || 'None reported'}</p>
                    </div>
                    <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                      <span className="text-[8px] font-bold text-emerald-400 uppercase block mb-1">Win</span>
                      <p className="text-xs text-white/80">{review.win_text || 'None reported'}</p>
                    </div>
                  </div>

                  <div className="bg-violet-500/5 p-4 rounded-xl border border-violet-500/10 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-bold text-violet-400 uppercase block mb-1">Next Week Objective</span>
                      <p className="text-sm font-bold text-white">{review.focus_next_week_text || 'Not set'}</p>
                    </div>
                    <Target className="text-violet-500 opacity-20" size={32} />
                  </div>

                  <button 
                    onClick={() => setIsReflecting(true)}
                    className="w-full text-[10px] text-white/20 hover:text-violet-400 font-bold uppercase transition-all"
                  >
                    Edit Reflection
                  </button>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                   <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                    <MessageSquare size={32} className="text-white/10" />
                   </div>
                   <p className="text-sm text-white/40 font-medium max-w-[200px]">
                    No reflection submitted for this week yet.
                   </p>
                   {isCurrentWeek && (
                     <button 
                      onClick={() => setIsReflecting(true)}
                      className="text-xs font-bold text-violet-400 hover:text-white transition-colors"
                     >
                       Click here to reflect on your progress
                     </button>
                   )}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
