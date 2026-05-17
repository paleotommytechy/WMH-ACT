
import React, { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Profile, SkillLevel } from '@/src/lib/types';
import { Loader2, Rocket, User, MapPin, Briefcase, GraduationCap, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';

interface ProfileSetupProps {
  userId: string;
  email: string;
  onComplete: (profile: Profile) => void;
  theme?: 'dark' | 'light';
}

export function ProfileSetup({ userId, email, onComplete, theme = 'dark' }: ProfileSetupProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    role_title: '',
    skill_level: 'Beginner' as SkillLevel,
    primary_track: '',
    country: '',
    city: '',
    goals: '',
    learning_focus: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          primary_track: formData.role_title, // Map role_title to primary_track for consistency if needed
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      toast.success('Mastery profile activated!');
      onComplete(data as Profile);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 pb-20 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0f0a1f]' : 'bg-slate-50'}`}>
      <div className="max-w-2xl w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`backdrop-blur-xl border rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}
        >
          {/* Background Decorative elements */}
          {theme === 'dark' && (
            <>
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[100px] rounded-full -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -ml-32 -mb-32" />
            </>
          )}

          <header className="mb-10 relative z-10">
            <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-600/20">
              <Rocket className="text-white" size={32} />
            </div>
            <h1 className={`text-4xl font-black mb-2 italic ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>INITIALIZE MASTERY</h1>
            <p className={`${theme === 'dark' ? 'text-violet-200/60' : 'text-slate-500'} font-medium`}>To proceed, we must define your identity within the Hub.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>
                      <User size={14} /> Full Name
                    </label>
                    <input 
                      required
                      value={formData.full_name}
                      onChange={e => updateField('full_name', e.target.value)}
                      placeholder="e.g. John Wilson"
                      className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>
                      <User size={14} /> Username
                    </label>
                    <input 
                      required
                      value={formData.username}
                      onChange={e => updateField('username', e.target.value)}
                      placeholder="e.g. wilson_master"
                      className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>
                      <MapPin size={14} /> Country
                    </label>
                    <input 
                      required
                      value={formData.country}
                      onChange={e => updateField('country', e.target.value)}
                      placeholder="e.g. Nigeria"
                      className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>
                      <MapPin size={14} /> City
                    </label>
                    <input 
                      required
                      value={formData.city}
                      onChange={e => updateField('city', e.target.value)}
                      placeholder="e.g. Lagos"
                      className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
                    />
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => setStep(2)}
                  className={`w-full font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-xl ${theme === 'dark' ? 'bg-white text-black hover:bg-violet-400' : 'bg-violet-600 text-white hover:bg-violet-700'}`}
                >
                  NEXT PHASE
                  <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    →
                  </motion.span>
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="space-y-2">
                  <label className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>
                    <Briefcase size={14} /> Primary Track / Role
                  </label>
                  <input 
                    required
                    value={formData.role_title}
                    onChange={e => updateField('role_title', e.target.value)}
                    placeholder="e.g. Frontend Engineering, Backend, UI/UX"
                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>
                    <Target size={14} /> Learning Focus
                  </label>
                  <input 
                    required
                    value={(formData as any).learning_focus || ''}
                    onChange={e => updateField('learning_focus', e.target.value)}
                    placeholder="e.g. React, TypeScript, System Design"
                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>
                    <GraduationCap size={14} /> Skill Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => updateField('skill_level', level)}
                        className={`py-3 rounded-xl text-xs font-black border transition-all ${formData.skill_level === level ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/20' : theme === 'dark' ? 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300'}`}
                      >
                        {level.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>
                    <Target size={14} /> Current Mastery Goal
                  </label>
                  <textarea 
                    required
                    rows={4}
                    value={formData.goals}
                    onChange={e => updateField('goals', e.target.value)}
                    placeholder="What are you currently pushing to master?"
                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all resize-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className={`flex-1 font-black py-4 rounded-xl transition-all border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    BACK
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-[2] bg-violet-600 text-white font-black py-4 rounded-xl hover:bg-violet-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : 'INITIALIZE PROFILE'}
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}
