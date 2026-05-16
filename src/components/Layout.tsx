
import React, { useState, useEffect } from 'react';
import { LogOut, User as UserIcon, Sun, Moon, Bell } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { NotificationCenter } from './NotificationCenter';
import { NotificationService } from '@/src/lib/notifications';

interface LayoutProps {
  children: React.ReactNode;
  user?: any;
  profile?: any;
  hideNav?: boolean;
  theme?: 'dark' | 'light';
  toggleTheme?: () => void;
  onTabChange?: (tab: 'daily' | 'weekly' | 'profile') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, profile, hideNav, onTabChange, theme, toggleTheme }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    if (user) {
      const fetchUnread = async () => {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        
        if (!error && count !== null) {
          setUnreadCount(count);
        }
      };

      fetchUnread();

      // Real-time subscription for new notifications
      const channel = supabase
        .channel('notifications-changes')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          setUnreadCount(prev => prev + 1);
          // Show local notification if permission granted
          NotificationService.showLocalNotification(payload.new.title, payload.new.message);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-[#130722] text-white' : 'bg-slate-50 text-slate-900'}`}>
      {!hideNav && (
        <nav className={`${theme === 'dark' ? 'bg-[#130722]/80 border-violet-900/50' : 'bg-[#130722]/95 border-violet-900/30'} backdrop-blur-md border-b sticky top-0 z-50`}>
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center cursor-pointer" onClick={() => onTabChange?.('daily')}>
              <img 
                src={theme === 'light' 
                  ? "https://jnvpkyvtajegjuqnluzp.supabase.co/storage/v1/object/public/Wilson%20Mastery%20Hub%20images/logo-dark-bg.png" 
                  : "https://jnvpkyvtajegjuqnluzp.supabase.co/storage/v1/object/public/Wilson%20Mastery%20Hub%20images/logo-transparent.png"
                } 
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
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsNotificationsOpen(!isNotificationsOpen);
                      if (isNotificationsOpen) setUnreadCount(0); // Optimistic clear
                    }}
                    className={`p-2 rounded-full transition-colors relative ${theme === 'dark' ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                    title="Notifications"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#130722]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationCenter 
                    userId={user.id} 
                    theme={theme!} 
                    isOpen={isNotificationsOpen} 
                    onClose={() => setIsNotificationsOpen(false)} 
                  />
                </div>

                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-violet-300 hover:text-white hover:bg-white/10'}`}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button 
                  onClick={() => onTabChange?.('profile')}
                  className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full border transition-colors ${theme === 'dark' ? 'bg-violet-900/30 border-violet-700/50 hover:bg-violet-800/40 text-violet-200' : 'bg-violet-900/20 border-violet-700/30 hover:bg-violet-900/40 text-violet-200'}`}
                >
                  <UserIcon size={14} className={theme === 'dark' ? 'text-violet-400' : 'text-violet-400'} />
                  <span className="text-xs font-medium">
                    {profile?.full_name || user.email}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-violet-600 text-white rounded-md uppercase font-bold tracking-wider">
                    {profile?.community_role || 'student'}
                  </span>
                </button>
                <button
                  onClick={() => onTabChange?.('profile')}
                  className="md:hidden p-2 text-neutral-400 hover:text-white"
                >
                  <UserIcon size={20} />
                </button>
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

      <footer className={`max-w-5xl mx-auto px-4 py-8 border-t mt-auto ${theme === 'dark' ? 'border-violet-900/30' : 'border-slate-200'}`}>
        <p className={`text-center text-xs mt-8 ${theme === 'dark' ? 'text-violet-400/60' : 'text-slate-400'}`}>
          &copy; {new Date().getFullYear()} Wilson Mastery Hub. Efficiency through proof.
        </p>
      </footer>
    </div>
  );
};
