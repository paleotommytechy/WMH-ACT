
import React, { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Loader2, Send, CheckCircle2, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateSocialPosts } from '@/src/lib/gemini';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';

interface SubmissionFormProps {
  userId: string;
  onSuccess: (posts: { linkedin: string; whatsapp: string }) => void;
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({ userId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState('');
  const [timeSpent, setTimeSpent] = useState('');
  const [reflection, setReflection] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // 1. Submit to Supabase
      const { error: submitError } = await supabase.from('submissions').insert([
        {
          user_id: userId,
          task_completed: taskCompleted,
          time_spent: parseInt(timeSpent),
          reflection,
          proof_url: proofUrl,
          submitted_date: today,
        },
      ]);

      if (submitError) throw submitError;

      // 2. Confetti for encouragement
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7C3AED', '#C084FC', '#FFFFFF']
      });

      // 3. Generate Posts via Gemini
      const posts = await generateSocialPosts({
        task_name: taskCompleted,
        time_spent: parseInt(timeSpent),
        reflection,
      });

      onSuccess(posts);
      
      // Reset
      setTaskCompleted('');
      setTimeSpent('');
      setReflection('');
      setProofUrl('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/10">
      <div className="flex items-center gap-2 mb-6">
        <CheckCircle2 className="text-emerald-400" size={24} />
        <h2 className="text-xl font-bold text-white">Daily Accountability</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-violet-400/60 uppercase tracking-widest mb-1.5">
              Task Completed
            </label>
            <input
              type="text"
              required
              value={taskCompleted}
              onChange={(e) => setTaskCompleted(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all text-white placeholder:text-white/20"
              placeholder="e.g. React Module 1"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-violet-400/60 uppercase tracking-widest mb-1.5">
              Time Spent (Minutes)
            </label>
            <input
              type="number"
              required
              value={timeSpent}
              onChange={(e) => setTimeSpent(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all text-white placeholder:text-white/20"
              placeholder="e.g. 45"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-violet-400/60 uppercase tracking-widest mb-1.5">
            Reflection (What did you learn?)
          </label>
          <textarea
            required
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none text-white placeholder:text-white/20"
            placeholder="Key takeaways or breakthroughs..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-violet-400/60 uppercase tracking-widest mb-1.5">
            Proof of Work (Link/URL)
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input
              type="url"
              required
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all text-white placeholder:text-white/20"
              placeholder="Github repo, Loom link, or Screenshot URL"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-xs">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto bg-violet-600 hover:bg-violet-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-violet-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          Submit Daily Work
        </button>
      </form>
    </div>
  );
};
