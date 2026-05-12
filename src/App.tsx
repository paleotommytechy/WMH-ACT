
import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Layout } from './components/Layout';
import { AuthForm } from './components/AuthForm';
import { SubmissionForm } from './components/SubmissionForm';
import { StreakDisplay } from './components/StreakDisplay';
import { PublicGenerator } from './components/PublicGenerator';
import { AdminDashboard } from './components/AdminDashboard';
import { Loader2, Plus, Calendar, Clock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfWeek, endOfWeek, isSameWeek } from 'date-fns';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedPosts, setGeneratedPosts] = useState<{ linkedin: string; whatsapp: string } | null>(null);

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
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        // Create profile if not exists (fallback if trigger fails)
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{ id: userId, full_name: session?.user?.user_metadata?.full_name }])
          .select()
          .single();
        if (createError) throw createError;
        setProfile(newProfile);
      } else {
        setProfile(data);
      }
      
      fetchSubmissions(userId);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setLoading(false);
    }
  };

  const fetchSubmissions = async (userId: string) => {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!error) setSubmissions(data);
    setLoading(false);
  };

  const onSubmissionSuccess = (posts: { linkedin: string; whatsapp: string }) => {
    setGeneratedPosts(posts);
    if (session) fetchSubmissions(session.user.id);
    if (session) fetchProfile(session.user.id); // Refresh streak
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-violet-50 flex items-center justify-center">
        <Loader2 className="text-violet-600 animate-spin" size={40} />
      </div>
    );
  }

  if (!session) return <AuthForm />;

  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const weeklyTotalMinutes = submissions
    .filter(s => isSameWeek(new Date(s.created_at), new Date()))
    .reduce((acc, s) => acc + s.time_spent, 0);

  return (
    <Layout user={session.user} profile={profile}>
      <div className="space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-neutral-900">
              Welcome, <span className="text-violet-600">{profile?.full_name?.split(' ')[0] || 'Warrior'}</span>
            </h1>
            <p className="text-neutral-500 font-medium">Efficiency is the only currency of mastery.</p>
          </div>
          {profile?.role === 'student' && (
            <div className="flex bg-white p-2 rounded-2xl border border-violet-100 shadow-sm gap-4 px-6 items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Weekly Goal</span>
                <span className="text-lg font-black text-neutral-900">
                  {Math.floor(weeklyTotalMinutes / 60)}h <span className="text-neutral-300">/ 10h</span>
                </span>
              </div>
              <div className="w-px h-10 bg-neutral-100" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Submissions</span>
                <span className="text-lg font-black text-violet-600">{submissions.length}</span>
              </div>
            </div>
          )}
        </header>

        {profile?.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <SubmissionForm userId={session.user.id} onSuccess={onSubmissionSuccess} />
              
              <AnimatePresence>
                {generatedPosts && (
                  <PublicGenerator 
                    posts={generatedPosts} 
                    onClose={() => setGeneratedPosts(null)} 
                  />
                )}
              </AnimatePresence>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Calendar size={20} className="text-violet-500" />
                    Past Submissions
                  </h2>
                </div>
                
                <div className="space-y-3">
                  {submissions.length === 0 ? (
                    <div className="p-12 border-2 border-dashed border-neutral-200 rounded-2xl text-center">
                      <Plus className="mx-auto text-neutral-300 mb-2" size={32} />
                      <p className="text-neutral-400 font-medium text-sm">No work documented yet. Start now.</p>
                    </div>
                  ) : (
                    submissions.map((s) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm hover:border-violet-200 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                            <Clock size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-neutral-900">{s.task_name}</h4>
                            <div className="flex items-center gap-2 text-xs text-neutral-400">
                              <span>{format(new Date(s.created_at), 'MMM d, h:mm a')}</span>
                              <span>•</span>
                              <span className="font-bold text-violet-500">{s.time_spent}m</span>
                            </div>
                          </div>
                        </div>
                        <a
                          href={s.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-neutral-50 text-neutral-400 rounded-lg hover:bg-violet-50 hover:text-violet-600 transition-all"
                        >
                          <ChevronRight size={20} />
                        </a>
                      </motion.div>
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <StreakDisplay 
                current={profile?.streak_count || 0} 
                longest={profile?.longest_streak || 0} 
              />
              
              <div className="bg-neutral-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="font-black text-xl mb-4 italic">The Mastery Mandate</h3>
                  <ul className="space-y-4 text-sm text-neutral-400 font-medium">
                    <li className="flex gap-2">
                      <span className="text-violet-500 font-bold">01</span>
                      <span>Execution is greater than intent. Always.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-violet-500 font-bold">02</span>
                      <span>If it wasn't documented, it never happened.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-violet-500 font-bold">03</span>
                      <span>The streak is a representation of your integrity.</span>
                    </li>
                  </ul>
                </div>
                <div className="absolute bottom-0 right-0 p-4 opacity-10">
                  <TrendingUp size={120} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
