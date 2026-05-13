
import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Profile, SkillLevel, UserRole } from '@/src/lib/types';
import { Loader2, User, MapPin, Briefcase, GraduationCap, Target, Save, ArrowLeft, Globe, Github, Linkedin, Twitter, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';

interface ProfileEditorProps {
  profile: Profile;
  onUpdate: (profile: Profile) => void;
  onBack: () => void;
}

export function ProfileEditor({ profile, onUpdate, onBack }: ProfileEditorProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Profile>>({ ...profile });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white italic">EDIT PROFILE</h1>
            <p className="text-violet-200/60 font-medium">Refine your identity in the mastery hub.</p>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-violet-600/20 transition-all"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          SYNC CHANGES
        </button>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Core Identity Section */}
        <div className="space-y-6 bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <User size={100} />
          </div>
          <h2 className="text-sm font-black text-violet-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-4">
            <User size={16} /> Core Identity
          </h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Full Name</label>
              <input 
                value={formData.full_name || ''}
                onChange={e => updateField('full_name', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Username</label>
              <input 
                value={formData.username || ''}
                onChange={e => updateField('username', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Profile Image URL</label>
              <div className="flex gap-2">
                <input 
                  value={formData.profile_image || ''}
                  onChange={e => updateField('profile_image', e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                />
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white/20 overflow-hidden">
                  {formData.profile_image ? (
                    <img src={formData.profile_image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={20} />
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Bio</label>
              <textarea 
                rows={3}
                value={formData.bio || ''}
                onChange={e => updateField('bio', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Location & Contact Section */}
        <div className="space-y-6 bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <MapPin size={100} />
          </div>
          <h2 className="text-sm font-black text-violet-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-4">
            <MapPin size={16} /> Location & Contact
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Country</label>
                <input 
                  value={formData.country || ''}
                  onChange={e => updateField('country', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">City</label>
                <input 
                  value={formData.city || ''}
                  onChange={e => updateField('city', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Timezone</label>
              <input 
                value={formData.timezone || 'UTC'}
                onChange={e => updateField('timezone', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Phone Number</label>
              <input 
                value={formData.phone_number || ''}
                onChange={e => updateField('phone_number', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Professional Section */}
        <div className="space-y-6 bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl relative overflow-hidden md:col-span-2">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Briefcase size={100} />
          </div>
          <h2 className="text-sm font-black text-violet-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-4">
            <Briefcase size={16} /> Professional Context
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Role / Title</label>
                <input 
                  value={formData.role_title || ''}
                  onChange={e => updateField('role_title', e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Skill Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => updateField('skill_level', level)}
                      className={`py-3 rounded-xl text-xs font-black border transition-all ${formData.skill_level === level ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                    >
                      {level.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Primary Track</label>
                <input 
                  value={formData.primary_track || ''}
                  onChange={e => updateField('primary_track', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Mastery Goals</label>
                <textarea 
                  rows={4}
                  value={formData.goals || ''}
                  onChange={e => updateField('goals', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 outline-none transition-all resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Learning Focus</label>
                <input 
                  value={formData.learning_focus || ''}
                  onChange={e => updateField('learning_focus', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Links Section */}
        <div className="space-y-6 bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl relative overflow-hidden md:col-span-2">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Globe size={100} />
          </div>
          <h2 className="text-sm font-black text-violet-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-4">
            <Globe size={16} /> Presence & Portfolio
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/40">
                <Globe size={20} />
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Portfolio</label>
                <input 
                  value={formData.portfolio_link || ''}
                  onChange={e => updateField('portfolio_link', e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-transparent border-none p-0 text-white text-sm focus:ring-0 outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/40">
                <Github size={20} />
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">GitHub</label>
                <input 
                  value={formData.github_link || ''}
                  onChange={e => updateField('github_link', e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full bg-transparent border-none p-0 text-white text-sm focus:ring-0 outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/40">
                <Linkedin size={20} />
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">LinkedIn</label>
                <input 
                  value={formData.linkedin_link || ''}
                  onChange={e => updateField('linkedin_link', e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full bg-transparent border-none p-0 text-white text-sm focus:ring-0 outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/40">
                <Twitter size={20} />
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Twitter (X)</label>
                <input 
                  value={formData.twitter_link || ''}
                  onChange={e => updateField('twitter_link', e.target.value)}
                  placeholder="https://x.com/..."
                  className="w-full bg-transparent border-none p-0 text-white text-sm focus:ring-0 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Public Settings */}
        <div className="space-y-6 bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl md:col-span-2">
          <h2 className="text-sm font-black text-violet-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-4">
            <ExternalLink size={16} /> Privacy & Visibility
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
              <div>
                <h4 className="text-white font-bold text-sm">Public Profile</h4>
                <p className="text-xs text-white/40">Allow others to see your mastery profile</p>
              </div>
              <button 
                type="button"
                onClick={() => updateField('public_profile_enabled', !formData.public_profile_enabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${formData.public_profile_enabled ? 'bg-violet-600' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.public_profile_enabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
              <div>
                <h4 className="text-white font-bold text-sm">Leaderboard Visibility</h4>
                <p className="text-xs text-white/40">Show your ranking in community boards</p>
              </div>
              <button 
                type="button"
                onClick={() => updateField('allow_leaderboard_visibility', !formData.allow_leaderboard_visibility)}
                className={`w-12 h-6 rounded-full transition-colors relative ${formData.allow_leaderboard_visibility ? 'bg-violet-600' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.allow_leaderboard_visibility ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
