
import React, { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Layout } from './Layout';
import { Loader2, Mail, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';

interface AuthFormProps {
  theme?: 'dark' | 'light';
  toggleTheme?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ theme = 'dark', toggleTheme }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Convert username to internal email if it's not already an email
        const loginEmail = email.includes('@') ? email : `${email}@wmh.local`;
        
        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });
        if (error) throw error;
        toast.success('Welcome back!');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split('@')[0],
            }
          }
        });
        if (error) throw error;

        toast.success('Account created successfully!');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout 
      hideNav 
      theme={theme} 
      toggleTheme={toggleTheme}
    >
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`backdrop-blur-xl p-8 rounded-3xl shadow-2xl border transition-all ${theme === 'dark' ? 'bg-neutral-900/40 border-white/10' : 'bg-white border-slate-200'}`}
        >
          <div className="text-center mb-8">
            <img 
              src={theme === 'light' 
                ? "https://jnvpkyvtajegjuqnluzp.supabase.co/storage/v1/object/public/Wilson%20Mastery%20Hub%20images/logo-dark-bg.png" 
                : "https://jnvpkyvtajegjuqnluzp.supabase.co/storage/v1/object/public/Wilson%20Mastery%20Hub%20images/logo-transparent.png"
              } 
              alt="Wilson Mastery Hub" 
              className="w-full max-w-[280px] h-auto mx-auto mb-6 object-contain"
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
            <h1 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {isLogin ? 'Welcome Back' : 'Join the Hub'}
            </h1>
            <p className={`${theme === 'dark' ? 'text-violet-200/60' : 'text-slate-500'} text-sm`}>
              {isLogin ? 'Sign in to track your mastery progress' : 'Start your accountability journey today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ml-1 ${theme === 'dark' ? 'text-violet-300' : 'text-violet-600'}`}>
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" size={18} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all placeholder:text-neutral-600 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ml-1 ${theme === 'dark' ? 'text-violet-300' : 'text-violet-600'}`}>
                Username or Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" size={18} />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all placeholder:text-neutral-600 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  placeholder="WMH_XXXX or email@example.com"
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ml-1 ${theme === 'dark' ? 'text-violet-300' : 'text-violet-600'}`}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all placeholder:text-neutral-600 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Signup disabled as per requirement */}
          <div className="mt-6 text-center">
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-violet-200/40' : 'text-slate-400'}`}>
              Invite-only system. Contact an admin for access.
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};
