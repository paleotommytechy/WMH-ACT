
import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Profile, SkillLevel, UserRole } from '@/src/lib/types';
import { Loader2, User, MapPin, Briefcase, GraduationCap, Target, Save, ArrowLeft, Globe, Github, Linkedin, Twitter, ExternalLink, Image as ImageIcon, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { NotificationSettings } from './NotificationSettings';

interface ProfileEditorProps {
  profile: Profile;
  onUpdate: (profile: Profile) => void;
  onBack: () => void;
  theme?: 'dark' | 'light';
}

export function ProfileEditor({ profile, onUpdate, onBack, theme = 'dark' }: ProfileEditorProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Profile>>({ ...profile });
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications'>('profile');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Profile synchronized successfully');
      onUpdate(data as Profile);
      onBack();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof Profile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-white/40 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'}`}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className={`text-3xl font-black italic ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>IDENTITY {activeTab === 'profile' ? 'CORE' : 'REMINDERS'}</h1>
            <p className={`${theme === 'dark' ? 'text-violet-200/60' : 'text-slate-500'} font-medium`}>Refine your mastery settings.</p>
          </div>
        </div>

        <div className={`p-1 rounded-2xl flex border shadow-xl backdrop-blur-md ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'bg-violet-600 text-white shadow-lg' : theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <User size={14} /> Profile
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'notifications' ? 'bg-violet-600 text-white shadow-lg' : theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <Bell size={14} /> Reminders
          </button>
        </div>

        {activeTab === 'profile' && (
          <button 
            onClick={() => handleSubmit()}
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-violet-600/20 transition-all ml-auto md:ml-0"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            SYNC CHANGES
          </button>
        )}
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'profile' ? (
          <motion.form 
            key="profile"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleSubmit} 
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Core Identity Section */}
        <div className={`space-y-6 backdrop-blur-md border p-8 rounded-3xl relative overflow-hidden transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className={`absolute top-0 right-0 p-4 opacity-5 pointer-events-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <User size={100} />
          </div>
          <h2 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 border-b pb-4 ${theme === 'dark' ? 'text-violet-400 border-white/5' : 'text-violet-600 border-slate-100'}`}>
            <User size={16} /> Core Identity
          </h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Full Name</label>
              <input 
                value={formData.full_name || ''}
                onChange={e => updateField('full_name', e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
            </div>
            <div className="space-y-2">
              <label className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Username</label>
              <input 
                value={formData.username || ''}
                onChange={e => updateField('username', e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
            </div>
            <div className="space-y-2">
              <label className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Profile Image URL</label>
              <div className="flex gap-2">
                <input 
                  value={formData.profile_image || ''}
                  onChange={e => updateField('profile_image', e.target.value)}
                  placeholder="https://..."
                  className={`flex-1 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${theme === 'dark' ? 'bg-white/10 text-white/20' : 'bg-slate-100 text-slate-300'}`}>
                  {formData.profile_image ? (
                    <img src={formData.profile_image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={20} />
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Bio</label>
              <textarea 
                rows={3}
                value={formData.bio || ''}
                onChange={e => updateField('bio', e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all resize-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
            </div>
          </div>
        </div>

        {/* Location & Contact Section */}
        <div className={`space-y-6 backdrop-blur-md border p-8 rounded-3xl relative overflow-hidden transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className={`absolute top-0 right-0 p-4 opacity-5 pointer-events-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <MapPin size={100} />
          </div>
          <h2 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 border-b pb-4 ${theme === 'dark' ? 'text-violet-400 border-white/5' : 'text-violet-600 border-slate-100'}`}>
            <MapPin size={16} /> Location & Contact
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Country</label>
                <input 
                  value={formData.country || ''}
                  onChange={e => updateField('country', e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>City</label>
                <input 
                  value={formData.city || ''}
                  onChange={e => updateField('city', e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Timezone</label>
              <input 
                value={formData.timezone || 'UTC'}
                onChange={e => updateField('timezone', e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
            </div>
            <div className="space-y-2">
              <label className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Phone Number</label>
              <input 
                value={formData.phone_number || ''}
                onChange={e => updateField('phone_number', e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
            </div>
          </div>
        </div>

        {/* Professional Section */}
        <div className={`space-y-6 backdrop-blur-md border p-8 rounded-3xl relative overflow-hidden md:col-span-2 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className={`absolute top-0 right-0 p-4 opacity-5 pointer-events-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <Briefcase size={100} />
          </div>
          <h2 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 border-b pb-4 ${theme === 'dark' ? 'text-violet-400 border-white/5' : 'text-violet-600 border-slate-100'}`}>
            <Briefcase size={16} /> Professional Context
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Role / Title</label>
                <input 
                  value={formData.role_title || ''}
                  onChange={e => updateField('role_title', e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Skill Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => updateField('skill_level', level)}
                      className={`py-3 rounded-xl text-xs font-black border transition-all ${formData.skill_level === level ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/20' : theme === 'dark' ? 'bg-white/5 border-white/10 text-white/40 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-900'}`}
                    >
                      {level.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Primary Track</label>
                <input 
                  value={formData.primary_track || ''}
                  onChange={e => updateField('primary_track', e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Mastery Goals</label>
                <textarea 
                  rows={4}
                  value={formData.goals || ''}
                  onChange={e => updateField('goals', e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all resize-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Learning Focus</label>
                <input 
                  value={formData.learning_focus || ''}
                  onChange={e => updateField('learning_focus', e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Links Section */}
        <div className={`space-y-6 backdrop-blur-md border p-8 rounded-3xl relative overflow-hidden md:col-span-2 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className={`absolute top-0 right-0 p-4 opacity-5 pointer-events-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <Globe size={100} />
          </div>
          <h2 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 border-b pb-4 ${theme === 'dark' ? 'text-violet-400 border-white/5' : 'text-violet-600 border-slate-100'}`}>
            <Globe size={16} /> Presence & Portfolio
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className={`flex items-center gap-4 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-white/10 text-white/40' : 'bg-white text-slate-400'}`}>
                <Globe size={20} />
              </div>
              <div className="flex-1">
                <label className={`text-[10px] uppercase font-bold block mb-1 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Portfolio</label>
                <input 
                  value={formData.portfolio_link || ''}
                  onChange={e => updateField('portfolio_link', e.target.value)}
                  placeholder="https://..."
                  className={`w-full bg-transparent border-none p-0 text-sm focus:ring-0 outline-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                />
              </div>
            </div>
            <div className={`flex items-center gap-4 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-white/10 text-white/40' : 'bg-white text-slate-400'}`}>
                <Github size={20} />
              </div>
              <div className="flex-1">
                <label className={`text-[10px] uppercase font-bold block mb-1 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>GitHub</label>
                <input 
                  value={formData.github_link || ''}
                  onChange={e => updateField('github_link', e.target.value)}
                  placeholder="https://github.com/..."
                  className={`w-full bg-transparent border-none p-0 text-sm focus:ring-0 outline-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                />
              </div>
            </div>
            <div className={`flex items-center gap-4 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-white/10 text-white/40' : 'bg-white text-slate-400'}`}>
                <Linkedin size={20} />
              </div>
              <div className="flex-1">
                <label className={`text-[10px] uppercase font-bold block mb-1 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>LinkedIn</label>
                <input 
                  value={formData.linkedin_link || ''}
                  onChange={e => updateField('linkedin_link', e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className={`w-full bg-transparent border-none p-0 text-sm focus:ring-0 outline-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                />
              </div>
            </div>
            <div className={`flex items-center gap-4 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-white/10 text-white/40' : 'bg-white text-slate-400'}`}>
                <Twitter size={20} />
              </div>
              <div className="flex-1">
                <label className={`text-[10px] uppercase font-bold block mb-1 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Twitter (X)</label>
                <input 
                  value={formData.twitter_link || ''}
                  onChange={e => updateField('twitter_link', e.target.value)}
                  placeholder="https://x.com/..."
                  className={`w-full bg-transparent border-none p-0 text-sm focus:ring-0 outline-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Public Settings & Preferences */}
        <div className={`space-y-6 backdrop-blur-md border p-8 rounded-3xl md:col-span-2 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h2 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 border-b pb-4 ${theme === 'dark' ? 'text-violet-400 border-white/5' : 'text-violet-600 border-slate-100'}`}>
            <ExternalLink size={16} /> Privacy & Preferences
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={`flex items-center justify-between p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <div>
                <h4 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Public Profile</h4>
                <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Allow others to see your mastery profile</p>
              </div>
              <button 
                type="button"
                onClick={() => updateField('public_profile_enabled', !formData.public_profile_enabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${formData.public_profile_enabled ? 'bg-violet-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${formData.public_profile_enabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            
            <div className={`flex items-center justify-between p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <div>
                <h4 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Preferred Theme</h4>
                <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Choose your visual interface style</p>
              </div>
              <div className={`flex p-1 rounded-lg ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => updateField('preferred_theme', 'light')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${formData.preferred_theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => updateField('preferred_theme', 'dark')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${formData.preferred_theme === 'dark' ? 'bg-violet-600 text-white shadow-sm' : theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
        </div>
          </motion.form>
        ) : (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <NotificationSettings userId={profile.id} theme={theme} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
