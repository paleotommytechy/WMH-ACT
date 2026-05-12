
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
      className="bg-violet-50 rounded-2xl p-6 border-2 border-violet-200 mt-8 shadow-inner"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-violet-900 leading-none">Learning in Public</h3>
          <p className="text-violet-600 text-xs mt-1">Generated posts for your networks</p>
        </div>
        <button
          onClick={onClose}
          className="text-violet-400 hover:text-violet-600 font-bold text-sm"
        >
          Dismiss
        </button>
      </div>

      <div className="space-y-6">
        {/* LinkedIn */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 uppercase tracking-widest">
              <Linkedin size={14} className="text-[#0077B5]" />
              LinkedIn Post
            </span>
            <button
              onClick={() => copyToClipboard(posts.linkedin, 'li')}
              className="flex items-center gap-1 text-[10px] font-bold bg-white px-2 py-1 rounded-md border border-violet-100 hover:bg-violet-100 transition-colors"
            >
              {copied === 'li' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              {copied === 'li' ? 'Copied' : 'Copy Text'}
            </button>
          </div>
          <div className="bg-white p-4 rounded-xl border border-violet-100 text-sm italic text-neutral-600 whitespace-pre-wrap leading-relaxed">
            {posts.linkedin}
          </div>
        </div>

        {/* WhatsApp */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 uppercase tracking-widest">
              <Whatsapp size={14} className="text-[#25D366]" />
              WhatsApp Update
            </span>
            <button
              onClick={() => copyToClipboard(posts.whatsapp, 'wa')}
              className="flex items-center gap-1 text-[10px] font-bold bg-white px-2 py-1 rounded-md border border-violet-100 hover:bg-violet-100 transition-colors"
            >
              {copied === 'wa' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              {copied === 'wa' ? 'Copied' : 'Copy Text'}
            </button>
          </div>
          <div className="bg-white p-4 rounded-xl border border-violet-100 text-sm font-mono text-neutral-600 whitespace-pre-wrap leading-relaxed">
            {posts.whatsapp}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
