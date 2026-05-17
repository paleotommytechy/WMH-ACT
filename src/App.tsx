
import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Layout } from './components/Layout';
import { AuthForm } from './components/AuthForm';
import { SubmissionForm } from './components/SubmissionForm';
import { StreakDisplay } from './components/StreakDisplay';
import { ConsistencyTracker } from './components/ConsistencyTracker';
import { WeeklyReviewSystem } from './components/WeeklyReviewSystem';
import { PublicGenerator } from './components/PublicGenerator';
import { AdminDashboard } from './components/AdminDashboard';
import { ProfileSetup } from './components/ProfileSetup';
import { ProfileEditor } from './components/ProfileEditor';
import { SettingsView } from './components/SettingsView';
import { SubmissionDetailModal } from './components/SubmissionDetailModal';
import { 
  Loader2, Plus, Calendar, Clock, ChevronRight, ChevronDown, TrendingUp, 
  Shield, User as UserIcon, Star, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfWeek, endOfWeek, isSameWeek } from 'date-fns';
import { Toaster, toast } from 'react-hot-toast';
import { Profile } from '@/src/lib/types';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedPosts, setGeneratedPosts] = useState<{ linkedin: string; whatsapp: string } | null>(null);
  const [selectedSubForModal, setSelectedSubForModal] = useState<any | null>(null);
  const [editingDraft, setEditingDraft] = useState<any | null>(null);
  const [isSubmitCollapsed, setIsSubmitCollapsed] = useState(window.innerWidth < 768);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(window.innerWidth < 768);

  const [activeTab, setActiveTab] = useState<string>('daily');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Initial theme check
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.className = newTheme;
    localStorage.setItem('theme', newTheme);

    if (profile) {
      const { error } = await supabase
        .from('profiles')
        .update({ preferred_theme: newTheme })
        .eq('id', profile.id);
      if (error) console.error('Error saving theme preference:', error);
    }
  };

  useEffect(() => {
    if (profile?.preferred_theme && profile.preferred_theme !== theme) {
      const pTheme = profile.preferred_theme as 'dark' | 'light';
      setTheme(pTheme);
      document.documentElement.className = pTheme;
      localStorage.setItem('theme', pTheme);
    }
  }, [profile?.preferred_theme]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); 
      
      if (error) {
        console.error('Profile fetch error details:', error);
        if (error.code === '42501') {
          toast.error('Database Permission Error: Please run the supabase_permission_fix.sql script in your Supabase dashboard.', { duration: 6000 });
        } else if (error.message.includes('recursion')) {
          toast.error('Security Error: Policy Loop detected in Supabase.');
        } else {
          toast.error('Failed to fetch profile settings.');
        }
        return;
      }
      
      if (!data) {
        // This case should be handled by the database trigger, but fallback for safety
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{ 
            id: userId, 
            full_name: session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User',
            email: session?.user?.email || '',
            username: session?.user?.email?.split('@')[0] + Math.floor(Math.random() * 1000)
          }])
          .select()
          .single();
        if (createError) console.error('Profile creation error:', createError);
        else setProfile(newProfile as Profile);
      } else {
        setProfile(data as Profile);
      }
      
      fetchSubmissions(userId);
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*, review:submission_reviews(*)')
        .eq('user_id', userId)
        .order('submitted_date', { ascending: false });
      
      if (error) {
        console.error('Submissions fetch error:', error);
        return;
      }

      // Normalize reviews (Supabase join often returns an array or object depending on schema)
      const normalizedSubs = (data || []).map(s => {
        let review = null;
        if (Array.isArray(s.review)) {
          review = s.review[0] || null;
        } else if (s.review) {
          review = s.review;
        }
        
        return {
          ...s,
          review
        };
      });

      setSubmissions(normalizedSubs);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const onSubmissionSuccess = (posts: { linkedin: string; whatsapp: string }) => {
    setGeneratedPosts(posts);
    setEditingDraft(null);
    if (session) {
      fetchSubmissions(session.user.id);
      fetchProfile(session.user.id);
    }
  };

  const calculateStreak = (subs: any[]) => {
    if (!subs || subs.length === 0) return { current: 0, longest: 0 };
    
    // Filter out flagged submissions and drafts for streak calculation
    const validSubs = subs.filter(s => (!s.review || s.review.status !== 'flagged') && !s.is_draft);
    if (validSubs.length === 0) return { current: 0, longest: 0 };

    // Get unique dates sorted descending
    const dates = Array.from(new Set(validSubs.map(s => s.submitted_date))).sort((a, b) => b.localeCompare(a));
    
    let current = 0;
    let longest = 0;
    let tempStreak = 0;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    
    // Check if streak is still active (today or yesterday)
    if (dates[0] !== today && dates[0] !== yesterday) {
      current = 0;
    } else {
      // Calculate current streak
      let lastDate = new Date(dates[0]);
      current = 1;
      for (let i = 1; i < dates.length; i++) {
        const currentDate = new Date(dates[i]);
        const diff = (lastDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24);
        if (diff === 1) {
          current++;
          lastDate = currentDate;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    tempStreak = 1;
    longest = 1;
    for (let i = 1; i < dates.length; i++) {
      const d1 = new Date(dates[i-1]);
      const d2 = new Date(dates[i]);
      const diff = (d1.getTime() - d2.getTime()) / (1000 * 3600 * 24);
      if (diff === 1) {
        tempStreak++;
      } else {
        longest = Math.max(longest, tempStreak);
        tempStreak = 1;
      }
    }
    longest = Math.max(longest, tempStreak);

    return { current, longest };
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-[#130722]' : 'bg-slate-50'}`}>
        <Loader2 className="text-violet-500 animate-spin" size={40} />
      </div>
    );
  }

  if (!session) return <AuthForm theme="dark" toggleTheme={toggleTheme} />;

  if (profile && !profile.onboarding_completed) {
    return <ProfileSetup userId={session.user.id} email={session.user.email} onComplete={setProfile} theme={theme} />;
  }

  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const weeklyTotalMinutes = submissions
    .filter(s => isSameWeek(new Date(s.submitted_date), new Date()))
    .filter(s => !s.review || s.review.status !== 'flagged')
    .filter(s => !s.is_draft)
    .reduce((acc, s) => acc + s.time_spent, 0);

  return (
    <Layout 
      user={session.user} 
      profile={profile} 
      onTabChange={setActiveTab}
      activeTab={activeTab}
      onAddClick={() => {
        setActiveTab('daily');
        setIsSubmitCollapsed(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      theme={theme}
      toggleTheme={toggleTheme}
    >
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1e1b4b',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      }} />
      
      {activeTab === 'profile' ? (
        <ProfileEditor 
          profile={profile!} 
          onUpdate={setProfile} 
          onBack={() => setActiveTab('daily')} 
          theme={theme}
        />
      ) : activeTab === 'settings' ? (
        <SettingsView 
          userId={session.user.id}
          theme={theme}
          toggleTheme={toggleTheme}
          onBack={() => setActiveTab('daily')}
        />
      ) : (
        <div className="space-y-10">
          {profile?.community_role !== 'admin' && (
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 md:pt-0">
            <div className="flex items-center gap-6">
              {profile?.profile_image && (
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="relative group shrink-0"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
                  <img 
                    src={profile.profile_image} 
                    alt="Profile" 
                    className={`relative w-20 h-20 rounded-2xl object-cover border-2 ${theme === 'dark' ? 'border-white/10' : 'border-white'} shadow-2xl`}
                  />
                </motion.div>
              )}
              <div>
                <h1 className={`text-4xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Welcome, <span className="text-violet-400">{profile?.full_name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'User'}</span>
                </h1>
                <p className={`${theme === 'dark' ? 'text-violet-200/60' : 'text-slate-500'} font-medium`}>
                  Efficiency is the only currency of mastery.
                </p>
              </div>
            </div>
            {profile?.community_role === 'student' && (
              <>
                <div className={`flex backdrop-blur-md p-1 rounded-2xl border shadow-xl items-center ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
                  <button 
                    onClick={() => setActiveTab('daily')}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'daily' ? 'bg-violet-600 text-white shadow-lg' : theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Daily Focus
                  </button>
                  <button 
                    onClick={() => setActiveTab('weekly')}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'weekly' ? 'bg-violet-600 text-white shadow-lg' : theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Weekly Review
                  </button>
                </div>

                <div className={`flex backdrop-blur-md p-2 rounded-2xl border shadow-xl gap-4 px-6 items-center ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-violet-400/60' : 'text-violet-600/60'}`}>Weekly Goal</span>
                    <span className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {Math.floor(weeklyTotalMinutes / 60)}h <span className={`${theme === 'dark' ? 'text-white/20' : 'text-slate-300'}`}>/ 10h</span>
                    </span>
                  </div>
                  <div className={`w-px h-10 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-violet-400/60' : 'text-violet-600/60'}`}>Submissions</span>
                    <span className="text-lg font-black text-violet-400">{submissions.length}</span>
                  </div>
                </div>
              </>
            )}
          </header>
        )}

        {profile?.community_role === 'admin' ? (
          <AdminDashboard 
            theme={theme} 
            activeView={activeTab as any} 
            onViewChange={(view) => setActiveTab(view)} 
          />
        ) : activeTab === 'weekly' ? (
          <WeeklyReviewSystem 
            userId={session.user.id} 
            submissions={submissions}
            currentStreak={calculateStreak(submissions).current}
            theme={theme}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="lg:hidden mb-4">
                <button 
                  onClick={() => setIsSubmitCollapsed(!isSubmitCollapsed)}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between font-bold border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                >
                  <span className="flex items-center gap-2">
                    <Plus size={20} className="text-violet-400" />
                    Daily Accountability
                  </span>
                  <motion.div animate={{ rotate: isSubmitCollapsed ? 0 : 180 }}>
                    <ChevronDown size={20} />
                  </motion.div>
                </button>
              </div>

              <motion.div 
                initial={false}
                animate={{ height: isSubmitCollapsed && window.innerWidth < 768 ? 0 : 'auto', opacity: isSubmitCollapsed && window.innerWidth < 768 ? 0 : 1 }}
                className="overflow-hidden"
              >
                <SubmissionForm 
                  userId={session.user.id} 
                  theme={theme} 
                  onSuccess={onSubmissionSuccess} 
                  editSubmission={editingDraft}
                  onCancelEdit={() => setEditingDraft(null)}
                />
              </motion.div>
              
              <AnimatePresence>
                {generatedPosts && (
                  <PublicGenerator 
                    posts={generatedPosts} 
                    onClose={() => setGeneratedPosts(null)} 
                    theme={theme}
                  />
                )}
              </AnimatePresence>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <header className={`flex-1 flex items-center justify-between p-2 lg:p-0 rounded-2xl lg:rounded-none transition-colors ${window.innerWidth < 768 && 'cursor-pointer'} `} onClick={() => window.innerWidth < 768 && setIsHistoryCollapsed(!isHistoryCollapsed)}>
                    <h2 className={`text-xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      <Calendar size={20} className="text-violet-400" />
                      Past Submissions
                    </h2>
                    <div className="lg:hidden">
                       <motion.div animate={{ rotate: isHistoryCollapsed ? 0 : 180 }}>
                        <ChevronDown size={20} className={theme === 'dark' ? 'text-white' : 'text-slate-900'} />
                      </motion.div>
                    </div>
                  </header>
                </div>
                
                <motion.div 
                  initial={false}
                  animate={{ height: isHistoryCollapsed && window.innerWidth < 768 ? 0 : 'auto', opacity: isHistoryCollapsed && window.innerWidth < 768 ? 0 : 1 }}
                  className="space-y-3 overflow-hidden"
                >
                  {submissions.length === 0 ? (
                    <div className={`p-12 border-2 border-dashed rounded-2xl text-center ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                      <Plus className={`mx-auto mb-2 ${theme === 'dark' ? 'text-white/10' : 'text-slate-200'}`} size={32} />
                      <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>No work documented yet. Start now.</p>
                    </div>
                  ) : (
                    submissions.map((s) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setSelectedSubForModal(s)}
                        className={`backdrop-blur-sm p-5 rounded-2xl border shadow-sm transition-all flex items-center justify-between group cursor-pointer ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-violet-500/50' : 'bg-white border-slate-200 hover:border-violet-300'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-violet-500/10 text-violet-400 group-hover:bg-violet-600 group-hover:text-white' : 'bg-violet-50 text-violet-600 group-hover:bg-violet-100'}`}>
                            <Clock size={24} />
                          </div>
                          <div>
                            <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{s.task_completed}</h4>
                            <div className={`flex items-center gap-2 text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                              <span>{format(new Date(s.submitted_date), 'MMM d, yyyy')}</span>
                              <span>•</span>
                              <span className="font-bold text-violet-400">{s.time_spent}m</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {s.is_draft && (
                            <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white/40' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                              Draft
                            </div>
                          )}
                          {s.review && (
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase border ${
                              s.review.status === 'excellent' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                              s.review.status === 'reviewed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                              s.review.status === 'flagged' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                              'bg-slate-500/10 border-slate-500/20 text-slate-500'
                            }`}>
                              {s.review.status === 'excellent' && <Star size={10} />}
                              {s.review.status === 'reviewed' && <CheckCircle2 size={10} />}
                              {s.review.status === 'flagged' && <AlertCircle size={10} />}
                              {s.review.status}
                            </div>
                          )}
                          {s.proof_url && (
                            <div
                              className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-white/5 text-white/40 hover:bg-violet-500/20 hover:text-violet-400' : 'bg-slate-100 text-slate-400 hover:bg-violet-50 hover:text-violet-600'}`}
                            >
                              <ChevronRight size={20} />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </section>
            </div>

            <div className="space-y-6">
              <StreakDisplay 
                current={calculateStreak(submissions).current} 
                longest={calculateStreak(submissions).longest} 
                theme={theme}
              />
              
              <ConsistencyTracker submissions={submissions} theme={theme} />
              
              <div className={`backdrop-blur-md rounded-2xl p-6 shadow-xl border relative overflow-hidden ${theme === 'dark' ? 'bg-white/5 text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'}`}>
                <div className="relative z-10">
                  <h3 className="font-black text-xl mb-4 italic">The Mastery Mandate</h3>
                  <ul className={`space-y-4 text-sm font-medium ${theme === 'dark' ? 'text-violet-200/60' : 'text-slate-600'}`}>
                    <li className="flex gap-2">
                      <span className="text-violet-400 font-bold">01</span>
                      <span>Execution is greater than intent. Always.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-violet-400 font-bold">02</span>
                      <span>If it wasn't documented, it never happened.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-violet-400 font-bold">03</span>
                      <span>The streak is a representation of your integrity.</span>
                    </li>
                  </ul>
                </div>
                <div className="absolute bottom-0 right-0 p-4 opacity-5">
                  <TrendingUp size={120} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )}
      <SubmissionDetailModal 
        isOpen={!!selectedSubForModal} 
        submission={selectedSubForModal} 
        onClose={() => setSelectedSubForModal(null)} 
        onEditDraft={(sub) => {
          setEditingDraft(sub);
          setSelectedSubForModal(null);
          setIsSubmitCollapsed(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        theme={theme}
      />
    </Layout>
  );
}
