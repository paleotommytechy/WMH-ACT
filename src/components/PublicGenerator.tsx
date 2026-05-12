
import React from 'react';
import { Copy, Linkedin, PhoneCall as Whatsapp, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PublicGeneratorProps {
  posts: { linkedin: string; whatsapp: string } | null;
  onClose: () => void;
}

export const PublicGenerator: React.FC<PublicGeneratorProps> = ({ posts, onClose }) => {
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
      className="bg-violet-900/20 backdrop-blur-md rounded-2xl p-6 border border-violet-500/30 mt-8 shadow-inner"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-white leading-none">Learning in Public</h3>
          <p className="text-violet-400 text-xs mt-1">Generated posts for your networks</p>
        </div>
        <button
          onClick={onClose}
          className="text-violet-400 hover:text-white font-bold text-sm"
        >
          Dismiss
        </button>
      </div>

      <div className="space-y-6">
        {/* LinkedIn */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-violet-300/40 uppercase tracking-widest">
              <Linkedin size={14} className="text-[#0A66C2]" />
              LinkedIn Post
            </span>
            <button
              onClick={() => copyToClipboard(posts.linkedin, 'li')}
              className="flex items-center gap-1 text-[10px] font-bold bg-white/5 px-2 py-1 rounded-md border border-white/10 hover:bg-white/10 transition-colors text-white"
            >
              {copied === 'li' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied === 'li' ? 'Copied' : 'Copy Text'}
            </button>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm italic text-violet-200/80 whitespace-pre-wrap leading-relaxed">
            {posts.linkedin}
          </div>
        </div>

        {/* WhatsApp */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-violet-300/40 uppercase tracking-widest">
              <Whatsapp size={14} className="text-[#25D366]" />
              WhatsApp Update
            </span>
            <button
              onClick={() => copyToClipboard(posts.whatsapp, 'wa')}
              className="flex items-center gap-1 text-[10px] font-bold bg-white/5 px-2 py-1 rounded-md border border-white/10 hover:bg-white/10 transition-colors text-white"
            >
              {copied === 'wa' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied === 'wa' ? 'Copied' : 'Copy Text'}
            </button>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm font-mono text-violet-200/80 whitespace-pre-wrap leading-relaxed">
            {posts.whatsapp}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
