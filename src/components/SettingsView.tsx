
import React, { useState } from 'react';
import { NotificationSettings } from './NotificationSettings';
import { Sun, Moon, LogOut, Info, ArrowLeft, HelpCircle, MessageSquare, ChevronDown, ChevronUp, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { toast } from 'react-hot-toast';

interface SettingsViewProps {
  userId: string;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onBack: () => void;
}

const FAQ_ITEMS = [
  {
    question: "How does the accountability system work?",
    answer: "Every day, you're expected to submit your progress. If you miss a day, the AI accountability engine sends nudges via WhatsApp or Push. Consistency builds your 'Mastery Score'."
  },
  {
    question: "What counts as a 'Submission'?",
    answer: "Any work completed towards your primary track. You provide a description, time spent, reflection, and a proof link (GitHub, Loom, or Image)."
  },
  {
    question: "Can I edit a submission later?",
    answer: "Yes, you can save submissions as drafts and edit them multiple times before committing. Once committed, they go to the admin for review."
  },
  {
    question: "How are streaks calculated?",
    answer: "Streaks are calculated based on consecutive days of committed submissions. 'Protection Alerts' warn you when a streak is at risk."
  }
];

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  userId, theme, toggleTheme, onBack 
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendFeedback = async () => {
    if (!feedback.trim()) return;
    setSending(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    toast.success('Efficiency feedback received. Thank you!');
    setFeedback('');
    setSending(false);
  };

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

        {/* Schedule */}
        <div className="space-y-4">
          <h2 className={`text-[10px] font-black uppercase tracking-widest ml-4 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Accountability Engine</h2>
          <NotificationSettings userId={userId} theme={theme} />
        </div>

        {/* FAQ Section */}
        <div className="space-y-4 pt-4">
          <h2 className={`text-[10px] font-black uppercase tracking-widest ml-4 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Support & FAQ</h2>
          <div className={`rounded-3xl border overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className={cn("border-b last:border-0", theme === 'dark' ? "border-white/5" : "border-slate-100")}>
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-5 flex items-center justify-between text-left transition-colors hover:bg-white/5"
                >
                  <span className={cn("font-bold text-sm", theme === 'dark' ? "text-white" : "text-slate-900")}>{item.question}</span>
                  {openFaq === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={cn("px-5 pb-5 text-xs leading-relaxed", theme === 'dark' ? "text-white/60" : "text-slate-500")}>
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Form */}
        <div className="space-y-4 pt-4">
          <h2 className={`text-[10px] font-black uppercase tracking-widest ml-4 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>System Improvement Feedback</h2>
          <div className={`p-6 rounded-3xl border space-y-4 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <textarea 
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Suggest a feature or report a bug to help optimize the hub..."
              rows={3}
              className={cn(
                "w-full p-4 rounded-2xl border text-sm transition-all focus:ring-2 focus:ring-violet-500/50 outline-none resize-none",
                theme === 'dark' ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-slate-50 border-slate-200 text-slate-900"
              )}
            />
            <button 
              onClick={handleSendFeedback}
              disabled={sending || !feedback.trim()}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-lg shadow-violet-600/20"
            >
              {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              Submit Feedback
            </button>
          </div>
        </div>

        {/* Global Actions (Logout) */}
        <div className="pt-8">
          <button
            onClick={() => {
              import('@/src/lib/supabase').then(({ supabase }) => supabase.auth.signOut());
            }}
            className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all border ${
              theme === 'dark' 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white' 
                : 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white'
            }`}
          >
            <LogOut size={20} />
            LOGOUT
          </button>
        </div>
      </section>
    </div>
  );
};
