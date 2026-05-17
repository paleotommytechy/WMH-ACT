
import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Loader2, Send, CheckCircle2, Link as LinkIcon, Image as ImageIcon, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateSocialPosts } from '@/src/lib/gemini';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

import { Submission } from '@/src/lib/types';

interface SubmissionFormProps {
  userId: string;
  theme: 'dark' | 'light';
  onSuccess: (posts: { linkedin: string; whatsapp: string }) => void;
  editSubmission?: Submission | null;
  onCancelEdit?: () => void;
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({ userId, onSuccess, theme, editSubmission, onCancelEdit }) => {
  const [loading, setLoading] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState('');
  const [timeSpent, setTimeSpent] = useState('');
  const [reflection, setReflection] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofType, setProofType] = useState<'link' | 'screenshot'>('link');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existingDraftId, setExistingDraftId] = useState<string | null>(null);

  // Handle edit submission prop
  useEffect(() => {
    if (editSubmission) {
      setExistingDraftId(editSubmission.id);
      setTaskCompleted(editSubmission.task_completed || '');
      setTimeSpent(editSubmission.time_spent?.toString() || '');
      setReflection(editSubmission.reflection || '');
      setProofUrl(editSubmission.proof_url || '');
      if (editSubmission.proof_url) {
        setProofType('link');
      }
    } else {
      // Clear form for new submission
      setExistingDraftId(null);
      setTaskCompleted('');
      setTimeSpent('');
      setReflection('');
      setProofUrl('');
      setFile(null);
    }
  }, [editSubmission]);

  const handleSubmit = async (e: React.FormEvent, asDraft: boolean = false) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation for final submission
    if (!asDraft) {
      if (!taskCompleted) {
        setError('Task name is required');
        setLoading(false);
        return;
      }
      if (!timeSpent) {
        setError('Time spent is required');
        setLoading(false);
        return;
      }
      if (!reflection) {
        setError('Reflection is required');
        setLoading(false);
        return;
      }
    }

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      let finalProofUrl = proofUrl;

      // Handle file upload if screenshot is selected and a new file is provided
      if (proofType === 'screenshot' && file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage
          .from('proofs')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('proofs')
          .getPublicUrl(fileName);
        
        finalProofUrl = publicUrl;
      }
      
      const submissionData = {
        user_id: userId,
        task_completed: taskCompleted,
        time_spent: timeSpent ? parseInt(timeSpent) : 0,
        reflection,
        proof_url: finalProofUrl,
        submitted_date: today,
        is_draft: asDraft
      };

      if (existingDraftId) {
        // Update existing record
        const { error: submitError } = await supabase
          .from('submissions')
          .update(submissionData)
          .eq('id', existingDraftId);

        if (submitError) throw submitError;
      } else {
        // Insert new record
        const { error: submitError } = await supabase.from('submissions').insert([submissionData]);
        if (submitError) throw submitError;
      }

      if (!asDraft) {
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

        if (onCancelEdit) onCancelEdit();
        toast.success('Nicely done! Work submitted.');
        
        // Reset
        setTaskCompleted('');
        setTimeSpent('');
        setReflection('');
        setProofUrl('');
        setFile(null);
        setExistingDraftId(null);
      } else {
        toast.success('Draft saved successfully!');
        if (onCancelEdit) onCancelEdit(); // Close/Reset after saving draft too to allow new ones
        
        // Reset
        setTaskCompleted('');
        setTimeSpent('');
        setReflection('');
        setProofUrl('');
        setFile(null);
        setExistingDraftId(null);
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`backdrop-blur-md rounded-2xl p-6 shadow-xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="text-emerald-500" size={24} />
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {existingDraftId ? 'Edit Draft' : 'Daily Accountability'}
          </h2>
        </div>
        {existingDraftId && (
          <button 
            type="button" 
            onClick={() => onCancelEdit?.()}
            className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-lg border ${theme === 'dark' ? 'border-white/10 text-white/40 hover:text-white' : 'border-slate-200 text-slate-400 hover:text-slate-900'}`}
          >
            Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${theme === 'dark' ? 'text-violet-400/60' : 'text-slate-500'}`}>
              Task Completed
            </label>
            <input
              type="text"
              value={taskCompleted}
              onChange={(e) => setTaskCompleted(e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
              placeholder="e.g. React Module 1"
            />
          </div>
          <div>
            <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${theme === 'dark' ? 'text-violet-400/60' : 'text-slate-500'}`}>
              Time Spent (Minutes)
            </label>
            <input
              type="number"
              value={timeSpent}
              onChange={(e) => setTimeSpent(e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
              placeholder="e.g. 45"
            />
          </div>
        </div>

        <div>
          <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${theme === 'dark' ? 'text-violet-400/60' : 'text-slate-500'}`}>
            Reflection (What did you learn?)
          </label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={3}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
            placeholder="Key takeaways or breakthroughs..."
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={`block text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-violet-400/60' : 'text-slate-500'}`}>
              Proof of Work
            </label>
            <div className={`flex p-1 rounded-lg border shadow-inner ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setProofType('link')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${proofType === 'link' ? 'bg-violet-600 text-white' : theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                URL Link
              </button>
              <button
                type="button"
                onClick={() => setProofType('screenshot')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${proofType === 'screenshot' ? 'bg-violet-600 text-white' : theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Screenshot
              </button>
            </div>
          </div>

          <div className="relative">
            {proofType === 'link' ? (
              <>
                <LinkIcon className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-white/20' : 'text-slate-300'}`} size={18} />
                <input
                  type="url"
                  required
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                  placeholder="Github repo, LinkedIn, or Screenshot URL"
                />
              </>
            ) : (
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="screenshot-upload"
                  required={proofType === 'screenshot'}
                />
                <label
                  htmlFor="screenshot-upload"
                  className={`w-full h-12 flex items-center justify-center gap-2 border border-dashed rounded-xl cursor-pointer transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-violet-500/50 text-white/60' : 'bg-slate-50 border-slate-300 hover:bg-slate-100 hover:border-violet-400 text-slate-600'}`}
                >
                  <ImageIcon size={20} className="text-violet-400" />
                  {file ? file.name : 'Upload screenshot proof'}
                </label>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-xs">{error}</p>
        )}

        <div className="flex flex-col md:flex-row gap-3 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-violet-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            Submit Daily Work
          </button>
          
          <button
            type="button"
            disabled={loading}
            onClick={(e) => handleSubmit(e as any, true)}
            className={`flex-1 font-bold px-8 py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save as Draft
          </button>
        </div>
      </form>
    </div>
  );
};
