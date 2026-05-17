
import React from 'react';
import { NotificationSettings } from './NotificationSettings';
import { Sun, Moon, Shield, Info, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsViewProps {
  userId: string;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  userId, theme, toggleTheme, onBack 
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <header className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-white/40 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'}`}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className={`text-2xl font-black italic ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>SETTINGS</h1>
      </header>

      <section className="space-y-6">
        {/* Appearance Section */}
        <div className={`p-8 rounded-3xl border backdrop-blur-md transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
              </div>
              <div>
                <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Visual Mode</h3>
                <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Switch between light and dark aesthetics.</p>
              </div>
            </div>
            <button 
              onClick={toggleTheme}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
            >
              Set to {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>

        {/* Reminders / Accountability */}
        <div className="space-y-4">
          <h2 className={`text-[10px] font-black uppercase tracking-widest ml-4 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Accountability Engine</h2>
          <NotificationSettings userId={userId} theme={theme} />
        </div>

        {/* Security & Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`}>
            <div className="flex items-center gap-3 mb-2">
              <Shield size={18} className="text-violet-400" />
              <h3 className="font-bold text-sm uppercase">Privacy Policy</h3>
            </div>
            <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Your progress data is private and encrypted. Only your public profile is visible to the community.</p>
          </div>
          <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`}>
            <div className="flex items-center gap-3 mb-2">
              <Info size={18} className="text-violet-400" />
              <h3 className="font-bold text-sm uppercase">About Mastery Hub</h3>
            </div>
            <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>v2.4.0 • Built for those who prioritize efficiency over effort. Proof is the only truth.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
