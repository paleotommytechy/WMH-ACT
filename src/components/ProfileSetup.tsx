
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
}

export function ProfileSetup({ userId, email, onComplete }: ProfileSetupProps) {
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...formData,
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
    <div className="min-h-screen bg-[#0f0a1f] flex items-center justify-center p-6 pb-20">
      <div className="max-w-2xl w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          {/* Background Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[100px] rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -ml-32 -mb-32" />

          <header className="mb-10 relative z-10">
            <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-600/20">
              <Rocket className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-black text-white mb-2 italic">INITIALIZE MASTERY</h1>
            <p className="text-violet-200/60 font-medium">To proceed, we must define your identity within the Hub.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-violet-400 uppercase tracking-widest flex items-center gap-2">
                      <User size={14} /> Full Name
                    </label>
                    <input 
                      required
                      value={formData.full_name}
                      onChange={e => updateField('full_name', e.target.value)}
                      placeholder="e.g. John Wilson"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-violet-400 uppercase tracking-widest flex items-center gap-2">
                      <User size={14} /> Username
                    </label>
                    <input 
                      required
                      value={formData.username}
                      onChange={e => updateField('username', e.target.value)}
                      placeholder="e.g. wilson_master"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-violet-400 uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={14} /> Country
                    </label>
                    <input 
                      required
                      value={formData.country}
                      onChange={e => updateField('country', e.target.value)}
                      placeholder="e.g. Nigeria"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-violet-400 uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={14} /> City
                    </label>
                    <input 
                      required
                      value={formData.city}
                      onChange={e => updateField('city', e.target.value)}
                      placeholder="e.g. Lagos"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-violet-400 transition-all flex items-center justify-center gap-2 group"
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
                  <label className="text-xs font-black text-violet-400 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={14} /> Primary Track / Role
                  </label>
                  <input 
                    required
                    value={formData.role_title}
                    onChange={e => updateField('role_title', e.target.value)}
                    placeholder="e.g. UI/UX Designer or Backend Engineer"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-violet-400 uppercase tracking-widest flex items-center gap-2">
                    <GraduationCap size={14} /> Skill Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => updateField('skill_level', level)}
                        className={`py-3 rounded-xl text-xs font-black border transition-all ${formData.skill_level === level ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/20' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'}`}
                      >
                        {level.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-violet-400 uppercase tracking-widest flex items-center gap-2">
                    <Target size={14} /> Current Mastery Goal
                  </label>
                  <textarea 
                    required
                    rows={4}
                    value={formData.goals}
                    onChange={e => updateField('goals', e.target.value)}
                    placeholder="What are you currently pushing to master?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-white/5 border border-white/10 text-white font-black py-4 rounded-xl hover:bg-white/10 transition-all"
                  >
                    BACK
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-[2] bg-violet-600 text-white font-black py-4 rounded-xl hover:bg-violet-500 transition-all flex items-center justify-center gap-2"
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
