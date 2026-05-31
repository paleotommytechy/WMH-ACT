
import React, { useState, useEffect } from 'react';
import { LogOut, User as UserIcon, Sun, Moon, Bell, AlertTriangle, X, MessageSquare } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { NotificationCenter } from './NotificationCenter';
import { NotificationService } from '@/src/lib/notifications';
import { BottomNav } from './BottomNav';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  user?: any;
  profile?: any;
  hideNav?: boolean;
  hideBottomNav?: boolean;
  theme?: 'dark' | 'light';
  toggleTheme?: () => void;
  onTabChange?: (tab: string) => void;
  onAddClick?: () => void;
  activeTab?: string;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  profile, 
  hideNav, 
  hideBottomNav,
  onTabChange, 
  onAddClick,
  activeTab = 'daily',
  theme, 
  toggleTheme 
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [hasUnreadAlertDismissed, setHasUnreadAlertDismissed] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleMarkAllReadAndDismiss = async () => {
    if (user) {
      try {
        await NotificationService.markAllAsRead(user.id);
        setUnreadCount(0);
        setHasUnreadAlertDismissed(true);
      } catch (err) {
        console.error('Error clearing:', err);
      }
    }
  };

  // Synchronize isNotificationsOpen with activeTab if it's 'settings' (WE NO LONGER DO THIS AUTO-OPEN)
  useEffect(() => {
    // If we want notifications to be a standard tab, we could handle it here.
    // But currently settings is its own page.
  }, [activeTab]);

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

      const fetchUnreadChat = async () => {
        try {
          const query = supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false)
            .neq('sender_id', user.id);
          
          if (profile?.community_role !== 'admin') {
            query.eq('student_id', user.id);
          }
          
          const { count, error } = await query;
          if (!error && count !== null) {
            setUnreadChatCount(count);
          } else if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
            // Simulator fallback
            setUnreadChatCount(0);
          }
        } catch (e) {
          setUnreadChatCount(0);
        }
      };

      fetchUnread();
      fetchUnreadChat();

      // Real-time subscription for new and updated notifications
      const channel = supabase
        .channel('notifications-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          fetchUnread();
          if (payload.eventType === 'INSERT') {
            // Show local notification if permission granted
            NotificationService.showLocalNotification(payload.new.title, payload.new.message);
          }
        })
        .subscribe();

      // Real-time subscription for chat messages unread sync
      const chatChannel = supabase
        .channel('chat-messages-layout-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        }, () => {
          fetchUnreadChat();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(chatChannel);
      };
    }
  }, [user, profile?.community_role]);

  const handleCloseNotifications = () => {
    setIsNotificationsOpen(false);
  };

  const isDark = theme === 'dark';
  const role = profile?.community_role || 'student';
  const isAdmin = role === 'admin';

  const navItems = isAdmin 
    ? [
        { id: 'overview', label: 'Overview' },
        { id: 'students', label: 'Students' },
        { id: 'chat', label: 'Chats' },
        { id: 'submissions', label: 'Review Hub' },
        { id: 'invite', label: 'Invite' },
        { id: 'broadcast', label: 'Broadcast' },
        { id: 'moderation', label: 'Moderation' },
      ]
    : [
        { id: 'daily', label: 'Home' },
        { id: 'weekly', label: 'Weekly' },
        { id: 'submissions', label: 'Past Submissions' },
        { id: 'chat', label: 'Chats' },
        { id: 'profile', label: 'Profile' },
        { id: 'settings', label: 'Settings' },
      ];

  return (
    <div className={`min-h-screen-ios font-sans flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-[#130722]' : 'bg-slate-50 text-slate-900'}`}>
      {!hideNav && (
        <nav className={`${theme === 'dark' ? 'bg-[#130722]/80 border-violet-900/50' : 'bg-[#130722]/95 border-violet-900/30'} backdrop-blur-md border-b sticky top-0 z-50`}>
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center cursor-pointer shrink-0" onClick={() => onTabChange?.(profile?.community_role === 'admin' ? 'overview' : 'daily')}>
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

            {/* Desktop Navigation Links (Center Alignment) */}
            {user && (
              <div className="hidden md:flex items-center gap-1 bg-black/10 dark:bg-white/[0.03] p-1 rounded-2xl border border-slate-200/50 dark:border-white/5 mx-auto">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange?.(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight transition-all cursor-pointer relative flex items-center gap-1.5 select-none ${
                        isActive
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/10'
                          : theme === 'dark'
                            ? 'text-white/40 hover:text-white hover:bg-white/5'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/80'
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.id === 'chat' && unreadChatCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center shrink-0">
                          {unreadChatCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {user && (
              <div className="flex items-center gap-4 shrink-0">
                {/* Dynamic Notification Button */}
                <button
                  onClick={() => {
                    setIsNotificationsOpen(!isNotificationsOpen);
                    if (isNotificationsOpen) setUnreadCount(0); // Optimistic clear
                  }}
                  className={`p-2 rounded-full transition-colors relative ${theme === 'dark' ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                  title="Notifications"
                >
                  {unreadCount > 0 ? (
                    <motion.div
                      animate={{
                        scale: [1, 1.15, 1],
                        rotate: [0, -8, 8, -8, 0]
                      }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Bell size={20} className="text-violet-400" />
                    </motion.div>
                  ) : (
                    <Bell size={20} />
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#130722]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                
                {/* Desktop-only Profile & Logout */}
                <div className="hidden md:flex items-center gap-4">
                  <button 
                    onClick={() => onTabChange?.('profile')}
                    className={`flex items-center gap-2 pr-3 pl-1.5 py-1 rounded-full border transition-colors ${theme === 'dark' ? 'bg-violet-900/30 border-violet-700/50 hover:bg-violet-800/40 text-violet-200' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'}`}
                  >
                    {profile?.profile_image ? (
                      <img src={profile.profile_image} alt={profile.full_name || 'Profile'} className="w-6 h-6 rounded-full object-cover border border-violet-500/50" />
                    ) : (
                      <UserIcon size={14} className={theme === 'dark' ? 'text-violet-400' : 'text-slate-500'} />
                    )}
                    <span className="text-xs font-medium">
                      {profile?.full_name || user.email}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-violet-600 text-white rounded-md uppercase font-bold tracking-wider">
                      {profile?.community_role || 'student'}
                    </span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-900/40 rounded-full transition-colors"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      )}

      <main className={
        activeTab === 'chat'
          ? `w-full flex-1 flex flex-col md:max-w-5xl md:mx-auto md:px-4 md:py-8 ${hideBottomNav ? 'pb-0' : 'pb-24'} md:pb-12`
          : `max-w-5xl mx-auto px-4 w-full ${hideNav ? 'flex-1 flex flex-col justify-center py-12' : 'py-8 md:py-12 pb-24 md:pb-12'}`
      }>
        {children}
      </main>

      {!hideNav && !hideBottomNav && user && (
        <BottomNav 
          activeTab={activeTab}
          onTabChange={onTabChange as any}
          onAddClick={onAddClick || (() => {})}
          unreadNotifications={unreadCount}
          unreadChatCount={unreadChatCount}
          theme={theme!}
          role={profile?.community_role || 'student'}
        />
      )}

      <footer className={`max-w-5xl mx-auto px-4 py-8 border-t mt-auto hidden md:block ${theme === 'dark' ? 'border-violet-900/30' : 'border-slate-200'}`}>
        <p className={`text-center text-xs mt-8 ${theme === 'dark' ? 'text-violet-400/60' : 'text-slate-400'}`}>
          &copy; {new Date().getFullYear()} Wilson Mastery Hub. Efficiency through proof.
        </p>
      </footer>

      {user && (
        <NotificationCenter 
          userId={user.id} 
          theme={theme!} 
          isOpen={isNotificationsOpen} 
          onClose={handleCloseNotifications} 
          onRedirect={onTabChange}
        />
      )}

      {/* Unread system directives alert popup on load */}
      <AnimatePresence>
        {user && unreadCount > 0 && !hasUnreadAlertDismissed && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setHasUnreadAlertDismissed(true)}
            />

            {/* Alert Dialog Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-md rounded-3xl border shadow-2xl p-8 space-y-6 z-10 ${
                theme === 'dark' ? 'bg-[#1a1625] border-rose-500/20 text-white' : 'bg-white border-rose-100 text-slate-900'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/30 animate-pulse">
                  <AlertTriangle className="text-rose-500" size={24} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 block">
                    Attention Required
                  </span>
                  <h3 className="text-2xl font-black leading-tight tracking-tight">
                    Unread Directives
                  </h3>
                </div>
              </div>

              <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                You have <span className="text-rose-400 font-black">{unreadCount} unread update(s)</span> in your feed. 
                Please check your Notification Hub for critical accountability directives, updates, or reviewed feedback.
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsNotificationsOpen(true);
                    setHasUnreadAlertDismissed(true);
                  }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black uppercase text-xs shadow-xl shadow-violet-600/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                >
                  Open Notification Hub ({unreadCount})
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleMarkAllReadAndDismiss}
                    className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] transition-all border cursor-pointer ${
                      theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Mark All Read
                  </button>
                  <button
                    onClick={() => setHasUnreadAlertDismissed(true)}
                    className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] transition-all border cursor-pointer ${
                      theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Dismiss Alert
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
