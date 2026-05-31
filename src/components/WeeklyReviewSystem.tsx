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
  theme?: 'dark' | 'light';
}

export const WeeklyReviewSystem: React.FC<WeeklyReviewProps> = ({ userId, submissions, currentStreak, theme = 'dark' }) => {
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
    isWithinInterval(new Date(s.submitted_date), { start: selectedWeek, end: weekEnd }) &&
    (!s.review || s.review.status !== 'flagged')
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
      <div className={`flex items-center justify-between backdrop-blur-md p-4 rounded-2xl border shadow-lg ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
        <button 
          onClick={() => changeWeek('prev')}
          className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-white/60 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'}`}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>
            Weekly Review Period
          </span>
          <h3 className={`text-sm font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <Calendar size={14} className="text-violet-400" />
            {format(selectedWeek, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h3>
        </div>
        <button 
          onClick={() => changeWeek('next')}
          disabled={isCurrentWeek}
          className={`p-2 rounded-xl transition-colors disabled:opacity-20 ${theme === 'dark' ? 'hover:bg-white/5 text-white/60 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'}`}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`backdrop-blur-md p-4 rounded-2xl border flex flex-col justify-between ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <Clock size={16} className="text-emerald-500" />
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${status === 'Excellent' ? 'bg-emerald-500/20 text-emerald-500' : theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-400'}`}>
              {status}
            </span>
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Total Hours</span>
            <div className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{(stats.totalMinutes / 60).toFixed(1)}h</div>
          </div>
        </div>

        <div className={`backdrop-blur-md p-4 rounded-2xl border flex flex-col justify-between ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 size={16} className="text-violet-500" />
            <span className={`text-[8px] font-bold uppercase ${theme === 'dark' ? 'text-white/20' : 'text-slate-300'}`}>Completed</span>
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Tasks Done</span>
            <div className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.tasksCompleted}</div>
          </div>
        </div>

        <div className={`backdrop-blur-md p-4 rounded-2xl border flex flex-col justify-between ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={16} className="text-orange-500" />
            <span className={`text-[8px] font-bold uppercase ${theme === 'dark' ? 'text-white/20' : 'text-slate-300'}`}>Active</span>
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Active Days</span>
            <div className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.activeDays}/7</div>
          </div>
        </div>

        <div className={`backdrop-blur-md p-4 rounded-2xl border flex flex-col justify-between ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <Zap size={16} className="text-yellow-500" />
            <span className={`text-[8px] font-bold uppercase ${theme === 'dark' ? 'text-white/20' : 'text-slate-300'}`}>Momentum</span>
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Streak</span>
            <div className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{currentStreak}d</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Highlights / Gallery */}
        <div className={`backdrop-blur-md rounded-2xl border overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
          <div className={`p-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
            <h4 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <ImageIcon size={14} className="text-violet-500" />
              Proof Gallery
            </h4>
          </div>
          <div className="p-4">
            {stats.proofs.length === 0 ? (
              <div className={`h-48 flex flex-col items-center justify-center border-2 border-dashed rounded-xl text-xs italic ${theme === 'dark' ? 'border-white/5 text-white/20' : 'border-slate-100 text-slate-300'}`}>
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
        <div className={`backdrop-blur-md rounded-2xl border overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
          <div className={`p-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5 bg-violet-600/10' : 'border-slate-100 bg-violet-50'}`}>
            <h4 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <MessageSquare size={14} className="text-violet-500" />
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
                    <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>What did you learn?</label>
                    <textarea 
                      value={learned}
                      onChange={(e) => setLearned(e.target.value)}
                      className={`w-full border rounded-xl p-3 text-xs focus:ring-1 focus:ring-violet-500 outline-none h-20 resize-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      placeholder="Share your breakthroughs..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>Biggest Challenge?</label>
                      <input 
                        value={challenge}
                        onChange={(e) => setChallenge(e.target.value)}
                        className={`w-full border rounded-xl p-3 text-xs focus:ring-1 focus:ring-violet-500 outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                        placeholder="What slowed you down?"
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>Biggest Win?</label>
                      <input 
                        value={win}
                        onChange={(e) => setWin(e.target.value)}
                        className={`w-full border rounded-xl p-3 text-xs focus:ring-1 focus:ring-violet-500 outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                        placeholder="Celebrate something!"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block flex items-center gap-2 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                       <Target size={12} /> Next Week's Focus
                    </label>
                    <input 
                      value={focus}
                      onChange={(e) => setFocus(e.target.value)}
                      className={`w-full border rounded-xl p-3 text-xs focus:ring-1 focus:ring-emerald-500 outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
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
                      className={`px-4 rounded-xl font-bold transition-all ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
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
                    <span className={`text-[8px] font-bold uppercase block mb-1 ${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>Key Takeaway</span>
                    <p className={`text-sm italic leading-relaxed ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>"{review.learned_text}"</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                      <span className="text-[8px] font-bold text-red-500 uppercase block mb-1">Challenge</span>
                      <p className={`text-xs ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}>{review.challenge_text || 'None reported'}</p>
                    </div>
                    <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                      <span className="text-[8px] font-bold text-emerald-500 uppercase block mb-1">Win</span>
                      <p className={`text-xs ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}>{review.win_text || 'None reported'}</p>
                    </div>
                  </div>

                  <div className="bg-violet-500/5 p-4 rounded-xl border border-violet-500/10 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-bold text-violet-500 uppercase block mb-1">Next Week Objective</span>
                      <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{review.focus_next_week_text || 'Not set'}</p>
                    </div>
                    <Target className="text-violet-500 opacity-20" size={32} />
                  </div>

                  <button 
                    onClick={() => setIsReflecting(true)}
                    className={`w-full text-[10px] font-bold uppercase transition-all ${theme === 'dark' ? 'text-white/20 hover:text-violet-400' : 'text-slate-300 hover:text-violet-600'}`}
                  >
                    Edit Reflection
                  </button>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                   <div className={`w-16 h-16 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <MessageSquare size={32} className={theme === 'dark' ? 'text-white/10' : 'text-slate-200'} />
                   </div>
                   <p className={`text-sm font-medium max-w-[200px] ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>
                    No reflection submitted for this week yet.
                   </p>
                   {isCurrentWeek && (
                     <button 
                      onClick={() => setIsReflecting(true)}
                      className={`text-xs font-bold transition-colors ${theme === 'dark' ? 'text-violet-400 hover:text-white' : 'text-violet-600 hover:text-slate-900'}`}
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
