
import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
  user?: any;
  profile?: any;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, profile }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <nav className="bg-white border-b border-violet-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="WMH Logo" 
              className="w-10 h-10 object-contain rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.fallback-logo')?.classList.remove('hidden');
              }}
            />
            <div className="fallback-logo hidden w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
              W
            </div>
            <span className="font-bold text-lg tracking-tight text-violet-900 hidden sm:block">
              WMH<span className="text-violet-500">-ACT</span>
            </span>
          </div>

          {user && (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-violet-50 rounded-full border border-violet-100">
                <UserIcon size={14} className="text-violet-500" />
                <span className="text-xs font-medium text-violet-700">
                  {profile?.full_name || user.email}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-violet-200 text-violet-800 rounded-md uppercase font-bold tracking-wider">
                  {profile?.role || 'student'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {children}
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-8 border-top border-neutral-200 mt-auto">
        <p className="text-center text-neutral-400 text-xs mt-8">
          &copy; {new Date().getFullYear()} Wilson Mastery Hub. Efficiency through proof.
        </p>
      </footer>
    </div>
  );
};
