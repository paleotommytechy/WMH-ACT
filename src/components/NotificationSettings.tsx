
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Bell, Smartphone, MessageCircle, Clock, Moon, 
  Zap, Trophy, Shield, Settings, Info, Save, Loader2 
} from 'lucide-react';
import { NotificationPreference } from '@/src/lib/types';
import { NotificationService } from '@/src/lib/notifications';
import { cn } from '@/src/lib/utils';
import { toast } from 'react-hot-toast';

interface NotificationSettingsProps {
  userId: string;
  theme: 'dark' | 'light';
}

const Section = ({ title, icon: Icon, children, theme }: { title: string, icon: any, children: React.ReactNode, theme: 'dark' | 'light' }) => (
  <div className={cn(
    "p-6 rounded-2xl border backdrop-blur-sm space-y-4",
    theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
  )}>
    <div className="flex items-center gap-3 mb-2">
      <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center">
        <Icon className="text-violet-400" size={20} />
      </div>
      <h3 className={cn("font-bold text-lg", theme === 'dark' ? "text-white" : "text-slate-900")}>{title}</h3>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const Toggle = ({ label, description, enabled, onToggle, icon: Icon, theme }: { label: string, description: string, enabled: boolean, onToggle: () => void, icon?: any, theme: 'dark' | 'light' }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex gap-4 items-start">
      {Icon && <div className={cn("mt-1 p-2 rounded-lg", theme === 'dark' ? "bg-white/5 text-white/40" : "bg-slate-50 text-slate-400")}><Icon size={16} /></div>}
      <div>
        <h4 className={cn("font-bold text-sm", theme === 'dark' ? "text-white" : "text-slate-900")}>{label}</h4>
        <p className={cn("text-xs", theme === 'dark' ? "text-white/40" : "text-slate-500")}>{description}</p>
      </div>
    </div>
    <button 
      type="button"
      onClick={onToggle}
      className={cn(
        "w-12 h-6 rounded-full p-1 transition-all duration-300 relative shrink-0",
        enabled ? "bg-violet-600" : (theme === 'dark' ? "bg-white/10" : "bg-slate-200")
      )}
    >
      <div className={cn(
        "w-4 h-4 rounded-full bg-white transition-all duration-300",
        enabled ? "translate-x-6" : "translate-x-0"
      )} />
    </button>
  </div>
);

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ 
  userId, theme 
}) => {
  const [prefs, setPrefs] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const data = await NotificationService.fetchPreferences(userId);
        if (data) {
          setPrefs(data);
        } else {
          setPrefs({
            user_id: userId,
            push_enabled: false,
            whatsapp_enabled: false,
            whatsapp_number: '',
            reminder_frequency: 'daily',
            quiet_hours_start: '22:00',
            quiet_hours_end: '08:00',
            motivation_enabled: true,
            weekly_summary_enabled: true,
            streak_protection_alerts: true
          });
        }
      } catch (err) {
        console.error('Error loading preferences:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPrefs();
  }, [userId]);

  const handleToggle = (key: keyof NotificationPreference) => {
    if (!prefs) return;
    setPrefs({ ...prefs, [key]: !prefs[key] });
  };

  const handlePushEnable = async () => {
    if (!prefs) return;
    
    if (!prefs.push_enabled) {
      const granted = await NotificationService.requestPushPermission();
      if (granted) {
        try {
          await NotificationService.subscribeUserToPush(userId);
          setPrefs({ ...prefs, push_enabled: true });
          toast.success('Push notifications active!');
        } catch (err) {
          console.error('Push subscription failed:', err);
          toast.error('Could not activate push notifications.');
        }
      } else {
        toast.error('Permission denied.');
      }
    } else {
      setPrefs({ ...prefs, push_enabled: false });
    }
  };

  const handleSave = async () => {
    if (!prefs) return;
    try {
      setSaving(true);
      await NotificationService.updatePreferences(userId, prefs);
      toast.success('Accountability settings synced.');
    } catch (err) {
      console.error('Error saving:', err);
      toast.error('Sync failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Delivery Channels" icon={Smartphone} theme={theme}>
          <Toggle 
            label="Push Notifications" 
            description="Real-time alerts on your browser or mobile device."
            enabled={prefs?.push_enabled || false}
            onToggle={handlePushEnable}
            icon={Bell}
            theme={theme}
          />
          <div className={cn("h-px", theme === 'dark' ? "bg-white/5" : "bg-slate-100")} />
          <Toggle 
            label="WhatsApp Reminders" 
            description="Accountability messages directly to your WhatsApp."
            enabled={prefs?.whatsapp_enabled || false}
            onToggle={() => handleToggle('whatsapp_enabled')}
            icon={MessageCircle}
            theme={theme}
          />
          {prefs?.whatsapp_enabled && (
             <div className="mt-4">
               <input 
                 type="tel"
                 placeholder="+234..."
                 value={prefs.whatsapp_number || ''}
                 onChange={(e) => {
                   const val = e.target.value;
                   setPrefs(prev => prev ? { ...prev, whatsapp_number: val } : null);
                 }}
                 className={cn(
                   "w-full p-4 rounded-xl border font-bold text-sm transition-all focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none",
                   theme === 'dark' ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-slate-50 border-slate-200 text-slate-900"
                 )}
               />
               <p className={cn("text-[10px] font-bold uppercase text-violet-400 mt-2 tracking-widest pl-1")}>Verified WhatsApp ID Needed</p>
             </div>
          )}
        </Section>

        <Section title="Optimization" icon={Clock} theme={theme}>
          <div className="space-y-4">
            <div>
              <label className={cn("text-xs font-black uppercase tracking-widest mb-2 block", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Reminder Frequency</label>
              <select 
                value={prefs?.reminder_frequency}
                onChange={(e) => setPrefs({ ...prefs!, reminder_frequency: e.target.value as any })}
                className={cn(
                  "w-full p-4 rounded-xl border font-bold text-sm transition-all outline-none",
                  theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                )}
              >
                <option value="daily">Once Daily (Aggressive)</option>
                <option value="twice_daily">Twice Daily (Ruthless)</option>
                <option value="weekly">Weekly (Standard)</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className={cn("text-xs font-black uppercase tracking-widest mb-2 block", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Quiet Hours Start</label>
                <input 
                  type="time"
                  value={prefs?.quiet_hours_start}
                  onChange={(e) => setPrefs({ ...prefs!, quiet_hours_start: e.target.value })}
                  className={cn(
                    "w-full p-4 rounded-xl border font-bold text-sm transition-all outline-none",
                    theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  )}
                />
              </div>
              <div>
                <label className={cn("text-xs font-black uppercase tracking-widest mb-2 block", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Quiet Hours End</label>
                <input 
                  type="time"
                  value={prefs?.quiet_hours_end}
                  onChange={(e) => setPrefs({ ...prefs!, quiet_hours_end: e.target.value })}
                  className={cn(
                    "w-full p-4 rounded-xl border font-bold text-sm transition-all outline-none",
                    theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  )}
                />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Intelligence Filters" icon={Zap} theme={theme}>
          <Toggle 
            label="Motivation Nudges" 
            description="AI-generated productivity boosts and quotes."
            enabled={prefs?.motivation_enabled || false}
            onToggle={() => handleToggle('motivation_enabled')}
            icon={Zap}
            theme={theme}
          />
          <Toggle 
            label="Streak Danger Alerts" 
            description="Alerts when your consistency is at high risk."
            enabled={prefs?.streak_protection_alerts || false}
            onToggle={() => handleToggle('streak_protection_alerts')}
            icon={Shield}
            theme={theme}
          />
          <Toggle 
            label="Weekly Summaries" 
            description="Comprehensive review of your mastery progress."
            enabled={prefs?.weekly_summary_enabled || false}
            onToggle={() => handleToggle('weekly_summary_enabled')}
            icon={Trophy}
            theme={theme}
          />
        </Section>
      </div>

      <button 
        onClick={handleSave}
        disabled={saving}
        className={cn(
          "fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all z-50",
          theme === 'dark' 
            ? "bg-violet-600 text-white shadow-violet-900/40 hover:bg-violet-500" 
            : "bg-violet-600 text-white shadow-violet-200/50 hover:bg-violet-700",
          saving && "animate-pulse"
        )}
        title="Sync Accountability Config"
      >
        {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
      </button>
    </div>
  );
};
