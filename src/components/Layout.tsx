
import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
  user?: any;
  profile?: any;
  hideNav?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, profile, hideNav }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-[#130722] text-white font-sans flex flex-col">
      {!hideNav && (
        <nav className="bg-[#130722]/80 backdrop-blur-md border-b border-violet-900/50 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src="https://jnvpkyvtajegjuqnluzp.supabase.co/storage/v1/object/public/Wilson%20Mastery%20Hub%20images/logo-transparent.png" 
                alt="WMH Logo" 
                className="h-12 w-auto object-contain hover:scale-105 transition-transform"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.querySelector('.fallback-logo')?.classList.remove('hidden');
                }}
              />
              <div className="fallback-logo hidden w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
                W
              </div>
            </div>

            {user && (
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-violet-900/30 rounded-full border border-violet-700/50">
                  <UserIcon size={14} className="text-violet-400" />
                  <span className="text-xs font-medium text-violet-200">
                    {profile?.name || user.email}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-violet-600 text-white rounded-md uppercase font-bold tracking-wider">
                    {profile?.role || 'student'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-900/40 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </nav>
      )}

      <main className={`max-w-5xl mx-auto px-4 w-full ${hideNav ? 'flex-1 flex flex-col justify-center py-12' : 'py-8 md:py-12'}`}>
        {children}
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-8 border-t border-violet-900/30 mt-auto">
        <p className="text-center text-violet-400/60 text-xs mt-8">
          &copy; {new Date().getFullYear()} Wilson Mastery Hub. Efficiency through proof.
        </p>
      </footer>
    </div>
  );
};
