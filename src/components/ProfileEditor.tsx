
import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Profile, SkillLevel, UserRole } from '@/src/lib/types';
import { Loader2, User, MapPin, Briefcase, GraduationCap, Target, Save, ArrowLeft, Globe, Github, Linkedin, Twitter, ExternalLink, Image as ImageIcon, Camera, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

interface ProfileEditorProps {
  profile: Profile;
  onUpdate: (profile: Profile) => void;
  onBack: () => void;
  theme?: 'dark' | 'light';
}

export function ProfileEditor({ profile, onUpdate, onBack, theme = 'dark' }: ProfileEditorProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<Profile>>({ ...profile });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL with cache buster
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const publicUrlWithBuster = `${publicUrl}?t=${Date.now()}`;

      // Update local state and form
      updateField('profile_image', publicUrlWithBuster);

      // Update database immediately to ensure UI consistency
      const { error: patchError } = await supabase
        .from('profiles')
        .update({ profile_image: publicUrlWithBuster, updated_at: new Date().toISOString() })
        .eq('id', profile.id);
      
      if (patchError) throw patchError;

      // Update parent state immediately with latest form data
      onUpdate({ ...profile, ...formData, profile_image: publicUrlWithBuster } as Profile);

      toast.success('Identity visual updated!');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

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
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-white/40 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'}`}
          >
            <ArrowLeft size={24} />
          </button>
          <span className={`text-2xl font-black italic ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>PROFILE</span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.form 
          key="profile"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleSubmit} 
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
            {/* Core Identity Section */}
        <div className={`space-y-6 backdrop-blur-md border p-8 rounded-3xl relative overflow-hidden transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className={`absolute top-0 right-0 p-4 opacity-5 pointer-events-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <User size={100} />
          </div>
          
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
            <div className="space-y-4">
              <label className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Identity Visual (Avatar)</label>
              <div className="flex flex-col items-center gap-4">
                <div className={`relative group w-32 h-32 rounded-3xl overflow-hidden border-2 transition-all ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                  {formData.profile_image ? (
                    <img src={formData.profile_image} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center opacity-40">
                      <Camera size={32} />
                    </div>
                  )}
                  
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <Loader2 className="animate-spin text-white" size={24} />
                    ) : (
                      <>
                        <Upload className="text-white mb-2" size={20} />
                        <span className="text-[10px] text-white font-black uppercase">Change Photo</span>
                      </>
                    )}
                  </label>
                </div>
                <p className={`text-[10px] text-center font-medium ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>PNG, JPG up to 2MB. Square recommended.</p>
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
                placeholder="e.g. Frontend Engineering, Product Design, Fullstack"
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
                placeholder="e.g. React, TypeScript, System Design"
                className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
            </div>
            <div className="space-y-2">
              <label className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Weekly Focus Hour Goal (hours)</label>
              <input 
                type="number"
                min={1}
                max={168}
                value={formData.weekly_hour_goal !== undefined ? formData.weekly_hour_goal : 10}
                onChange={e => updateField('weekly_hour_goal', parseInt(e.target.value) || 10)}
                className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
               <p className={`text-[10px] ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>Adjust your personalized weekly discipline threshold of hours (Default: 10).</p>
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

        {/* Global Actions (Save) */}
        <div className="md:col-span-2 pt-8">
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-violet-600/20 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            SAVE
          </button>
        </div>
      </motion.form>
    </AnimatePresence>
  </div>
);
}
