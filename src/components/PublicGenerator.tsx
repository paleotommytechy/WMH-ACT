
import React from 'react';
import { Copy, Linkedin, PhoneCall as Whatsapp, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PublicGeneratorProps {
  posts: { linkedin: string; whatsapp: string } | null;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export const PublicGenerator: React.FC<PublicGeneratorProps> = ({ posts, onClose, theme = 'dark' }) => {
  const [copied, setCopied] = React.useState<'li' | 'wa' | null>(null);

  const copyToClipboard = (text: string, type: 'li' | 'wa') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!posts) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`backdrop-blur-md rounded-2xl p-6 border mt-8 shadow-inner transition-all ${theme === 'dark' ? 'bg-violet-900/20 border-violet-500/30' : 'bg-violet-50 border-violet-200'}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-lg font-black leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Learning in Public</h3>
          <p className={`${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'} text-xs mt-1`}>Generated posts for your networks</p>
        </div>
        <button
          onClick={onClose}
          className={`${theme === 'dark' ? 'text-violet-400 hover:text-white' : 'text-violet-600 hover:text-slate-900'} font-bold text-sm`}
        >
          Dismiss
        </button>
      </div>

      <div className="space-y-6">
        {/* LinkedIn */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-violet-300/40' : 'text-slate-400'}`}>
              <Linkedin size={14} className="text-[#0A66C2]" />
              LinkedIn Post
            </span>
            <button
              onClick={() => copyToClipboard(posts.linkedin, 'li')}
              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}
            >
              {copied === 'li' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied === 'li' ? 'Copied' : 'Copy Text'}
            </button>
          </div>
          <div className={`p-4 rounded-xl border text-sm italic whitespace-pre-wrap leading-relaxed ${theme === 'dark' ? 'bg-white/5 border-white/5 text-violet-200/80' : 'bg-white border-slate-100 text-slate-700'}`}>
            {posts.linkedin}
          </div>
        </div>

        {/* WhatsApp */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-violet-300/40' : 'text-slate-400'}`}>
              <Whatsapp size={14} className="text-[#25D366]" />
              WhatsApp Update
            </span>
            <button
              onClick={() => copyToClipboard(posts.whatsapp, 'wa')}
              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}
            >
              {copied === 'wa' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied === 'wa' ? 'Copied' : 'Copy Text'}
            </button>
          </div>
          <div className={`p-4 rounded-xl border text-sm font-mono whitespace-pre-wrap leading-relaxed ${theme === 'dark' ? 'bg-white/5 border-white/5 text-violet-200/80' : 'bg-white border-slate-100 text-slate-700'}`}>
            {posts.whatsapp}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
