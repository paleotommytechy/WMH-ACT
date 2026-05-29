
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, ExternalLink, Calendar, MessageSquare, Star, CheckCircle2, AlertCircle, Maximize2, Sparkles, Copy, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Submission } from '@/src/lib/types';
import Markdown from 'react-markdown';

interface SubmissionDetailModalProps {
  submission: Submission | any;
  isOpen: boolean;
  onClose: () => void;
  onEditDraft?: (submission: Submission) => void;
  theme?: 'dark' | 'light';
}

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({ 
  submission, 
  isOpen, 
  onClose, 
  onEditDraft,
  theme = 'dark' 
}) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const [whatsappPost, setWhatsappPost] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  React.useEffect(() => {
    // Reset AI state when submission changes
    setWhatsappPost(null);
    setAiError(null);
    setCopied(false);
  }, [submission]);

  const generateWhatsApp = async () => {
    setGenerating(true);
    setAiError(null);
    try {
      const response = await fetch("/api/ai/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskCompleted: submission.task_completed,
          timeSpent: submission.time_spent,
          reflection: submission.reflection,
          submittedDate: submission.submitted_date
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Failed to generate humanized update.");
      }

      const data = await response.json();
      setWhatsappPost(data.post);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!whatsappPost) return;
    navigator.clipboard.writeText(whatsappPost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!submission) return null;

  const isImage = (url?: string) => {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png|webp)$/) != null || url.includes('supabase.co/storage/v1/object/public/proofs/');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 cursor-pointer"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-none"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border cursor-default flex flex-col max-h-[90vh] md:max-h-[85vh] ${
              theme === 'dark' ? 'bg-[#1a1625] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header (Fixed at the top) */}
            <div className={`p-6 md:p-8 pb-4 flex justify-between items-start shrink-0 border-b select-none ${
              theme === 'dark' ? 'border-white/5 bg-[#1a1625]' : 'border-slate-100 bg-white'
            }`}>
              <div>
                <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Submission Details
                </h3>
                <div className={`flex items-center gap-2 text-sm mt-1 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                  <Calendar size={14} className="text-violet-400" />
                  {format(new Date(submission.submitted_date), 'MMMM d, yyyy')}
                </div>
              </div>
              <button 
                onClick={onClose} 
                className={`p-2 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${theme === 'dark' ? 'hover:bg-white/10 text-white/30 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'}`}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body (Scrollable container) */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              {/* Status Badge */}
              {submission.is_draft ? (
                <div className={`flex items-center gap-4 p-4 rounded-2xl border bg-slate-500/10 border-slate-500/20 text-slate-400`}>
                  <AlertCircle size={20} />
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Current Status</p>
                    <p className="text-sm font-black uppercase">Draft (Unsubmitted)</p>
                  </div>
                  {onEditDraft && (
                    <button
                      onClick={() => onEditDraft(submission)}
                      className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-lg shadow-violet-600/20 cursor-pointer"
                    >
                      Continue Editing
                    </button>
                  )}
                </div>
              ) : submission.review && (
                <div className={`flex items-center gap-2 p-3 rounded-2xl border ${
                  submission.review.status === 'excellent' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                  submission.review.status === 'reviewed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                  submission.review.status === 'flagged' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                  'bg-slate-500/10 border-slate-500/20 text-slate-400'
                }`}>
                  {submission.review.status === 'excellent' ? <Star size={18} /> : 
                   submission.review.status === 'reviewed' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Current Status</p>
                    <p className="text-sm font-black uppercase">{submission.review.status}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                   <span className="text-[10px] font-black uppercase text-violet-400 tracking-widest block mb-1">Focus Task</span>
                   <div className={`text-md font-bold markdown-body ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                     <Markdown>{submission.task_completed}</Markdown>
                   </div>
                </div>
                <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                   <span className="text-[10px] font-black uppercase text-violet-400 tracking-widest block mb-1">Time Invested</span>
                   <div className="flex items-center gap-2">
                     <Clock size={16} className="text-violet-400" />
                     <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{submission.time_spent} Minutes</h4>
                   </div>
                </div>
              </div>

              <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                 <span className="text-[10px] font-black uppercase text-violet-400 tracking-widest block mb-2">Personal Reflection</span>
                 <div className={`text-sm font-medium leading-relaxed markdown-body ${theme === 'dark' ? 'text-white/70' : 'text-slate-700'}`}>
                   <Markdown>{submission.reflection}</Markdown>
                 </div>
              </div>

              {/* Proof Preview */}
              {submission.proof_url && (
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase text-violet-400 tracking-widest block">Evidence Attachment</span>
                  {isImage(submission.proof_url) ? (
                    <div className="relative group overflow-hidden rounded-2xl border border-white/10 aspect-video">
                      <img 
                        src={submission.proof_url} 
                        alt="Proof" 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => setShowLightbox(true)}
                          className="bg-white text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-xl scale-95 group-hover:scale-100 transition-transform cursor-pointer"
                        >
                          <Maximize2 size={16} />
                          Expand View
                        </button>
                      </div>
                    </div>
                  ) : (
                    <a 
                      href={submission.proof_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-violet-500/50 text-white' : 'bg-slate-50 border-slate-200 hover:border-violet-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ExternalLink size={20} className="text-violet-400" />
                        <span className="text-sm font-bold truncate max-w-[200px] md:max-w-md">{submission.proof_url}</span>
                      </div>
                      <Maximize2 size={16} className="opacity-40" />
                    </a>
                  )}
                </div>
              )}

              {/* Admin Notes */}
              {submission.review?.admin_notes && (
                <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-violet-500/5 border-violet-500/20' : 'bg-violet-50 border-violet-100'}`}>
                   <div className="flex items-center gap-2 mb-2">
                     <MessageSquare size={16} className="text-violet-400" />
                     <span className="text-[10px] font-black uppercase text-violet-400 tracking-widest">Instructor Feedback</span>
                   </div>
                   <div className={`text-sm font-medium leading-relaxed break-words whitespace-pre-wrap markdown-body ${theme === 'dark' ? 'text-white/80' : 'text-slate-800'}`}>
                     <Markdown>{submission.review.admin_notes}</Markdown>
                   </div>
                </div>
              )}

              {/* AI WhatsApp Humanizer Agent */}
              {!submission.is_draft && (
                <div className={`p-6 rounded-2xl border transition-all ${
                  theme === 'dark' 
                    ? 'bg-emerald-500/[0.03] border-emerald-500/20 text-white' 
                    : 'bg-emerald-50/50 border-emerald-200 text-slate-900'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">
                      AI WhatsApp Humanizer Agent
                    </span>
                  </div>
                  <p className={`text-xs mb-4 leading-relaxed ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                    Rewrite this accountability submission into a conversational, human-sounding WhatsApp post including the official mastery tags.
                  </p>
                  
                  {whatsappPost ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                          Generated Social Copy:
                        </span>
                        <button
                          onClick={copyToClipboard}
                          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${
                            copied 
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' 
                              : theme === 'dark' 
                                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' 
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          {copied ? 'Copied to Clipboard' : 'Copy Post'}
                        </button>
                      </div>
                      <div className={`p-4 rounded-xl border text-sm font-sans whitespace-pre-wrap leading-relaxed select-text ${
                        theme === 'dark' ? 'bg-[#0f0b18] border-white/5 text-emerald-200/90' : 'bg-white border-emerald-100 text-slate-700'
                      }`}>
                        {whatsappPost}
                      </div>
                      <button
                        onClick={generateWhatsApp}
                        disabled={generating}
                        className={`text-xs font-bold underline transition-all ${
                          theme === 'dark' ? 'text-white/40 hover:text-emerald-400' : 'text-slate-500 hover:text-emerald-600'
                        }`}
                      >
                        Regenerate Response
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={generateWhatsApp}
                      disabled={generating}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          Converting submission...
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          Generate Conversational WhatsApp Post
                        </>
                      )}
                    </button>
                  )}
                  {aiError && (
                    <p className="mt-2 text-xs text-red-500 font-semibold">{aiError}</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Lightbox Overlay */}
          <AnimatePresence>
            {showLightbox && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 transition-all"
              >
                <button 
                  onClick={() => setShowLightbox(false)}
                  className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                >
                  <X size={32} />
                </button>
                <motion.img
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  src={submission.proof_url}
                  alt="Full Proof"
                  className="max-h-full max-w-full rounded-lg shadow-2xl object-contain"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};
