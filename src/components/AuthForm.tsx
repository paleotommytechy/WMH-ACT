
import React, { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Layout } from './Layout';
import { Loader2, Mail, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

export const AuthForm: React.FC = () => {
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
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase.from('users').insert([{
            id: data.user.id,
            email: email,
            name: fullName || 'Warrior',
            role: 'student'
          }]);
          if (profileError) console.error('Profile creation error:', profileError);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout hideNav>
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900/40 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10"
        >
          <div className="text-center mb-8">
            <img 
              src="https://jnvpkyvtajegjuqnluzp.supabase.co/storage/v1/object/public/Wilson%20Mastery%20Hub%20images/logo-transparent.png" 
              alt="Wilson Mastery Hub" 
              className="w-full max-w-[280px] h-auto mx-auto mb-6 object-contain"
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
            <h1 className="text-2xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Join the Hub'}
            </h1>
            <p className="text-violet-200/60 text-sm">
              {isLogin ? 'Sign in to track your mastery progress' : 'Start your accountability journey today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-violet-300 uppercase tracking-wider mb-1.5 ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" size={18} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all placeholder:text-neutral-600 text-white"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-violet-300 uppercase tracking-wider mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all placeholder:text-neutral-600 text-white"
                  placeholder="wilsonmasteryhub@gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-violet-300 uppercase tracking-wider mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all placeholder:text-neutral-600 text-white"
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

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-violet-300 hover:text-white font-medium transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};
