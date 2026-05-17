
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, Check, Trash2, AlertCircle, Info, Trophy, 
  MessageSquare, Zap, Clock, Calendar, Shield, X
} from 'lucide-react';
import { AppNotification } from '@/src/lib/types';
import { NotificationService } from '@/src/lib/notifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/src/lib/utils';

interface NotificationCenterProps {
  userId: string;
  theme: 'dark' | 'light';
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  userId, theme, isOpen, onClose 
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await NotificationService.fetchNotifications(userId);
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, userId]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getIcon = (type: string, priority: string) => {
    switch (type) {
      case 'alert': return <AlertCircle className="text-rose-500" size={18} />;
      case 'motivation': return <Zap className="text-amber-500" size={18} />;
      case 'achievement': return <Trophy className="text-violet-500" size={18} />;
      case 'reminder': return <Clock className="text-blue-500" size={18} />;
      case 'admin': return <Shield className="text-indigo-500" size={18} />;
      default: return <Info className="text-slate-400" size={18} />;
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read) 
    : notifications;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
          />

          <motion.div
            initial={{ opacity: 0, y: -10, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, x: 20, scale: 0.95 }}
            className={cn(
              "fixed lg:absolute top-0 right-0 lg:top-14 lg:right-0 w-full lg:w-[400px] h-full lg:h-[600px] z-[100]",
              "flex flex-col overflow-hidden shadow-2xl lg:rounded-2xl border pt-safe lg:pt-0",
              theme === 'dark' ? "bg-[#1e1b4b]/95 border-white/10 backdrop-blur-xl" : "bg-white border-slate-200"
            )}
          >
            {/* Header */}
            <div className={cn(
              "p-6 border-b flex items-center justify-between",
              theme === 'dark' ? "border-white/5" : "border-slate-100"
            )}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                  <Bell className="text-violet-400" size={20} />
                </div>
                <div>
                  <h2 className={cn("font-black text-xl", theme === 'dark' ? "text-white" : "text-slate-900")}>Notifications</h2>
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
                    {notifications.filter(n => !n.is_read).length} Unread Updates
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={onClose}
                  className={cn("p-2 rounded-xl transition-all", theme === 'dark' ? "hover:bg-white/5 text-white/40" : "hover:bg-slate-100 text-slate-400")}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className={cn("px-6 py-3 border-b flex items-center justify-between", theme === 'dark' ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50")}>
              <div className="flex gap-4">
                <button 
                  onClick={() => setFilter('all')}
                  className={cn("text-xs font-black uppercase tracking-tight transition-all", 
                    filter === 'all' ? "text-violet-400 underline decoration-2 underline-offset-4" : theme === 'dark' ? "text-white/40 hover:text-white" : "text-slate-400 hover:text-slate-900"
                  )}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilter('unread')}
                  className={cn("text-xs font-black uppercase tracking-tight transition-all", 
                    filter === 'unread' ? "text-violet-400 underline decoration-2 underline-offset-4" : theme === 'dark' ? "text-white/40 hover:text-white" : "text-slate-400 hover:text-slate-900"
                  )}
                >
                  Unread
                </button>
              </div>
              <button 
                onClick={handleMarkAllAsRead}
                className={cn("text-[10px] font-black uppercase flex items-center gap-1 transition-all", theme === 'dark' ? "text-violet-400/60 hover:text-violet-400" : "text-violet-600/60 hover:text-violet-600")}
              >
                <Check size={12} />
                Mark all as read
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
                  <Clock className="animate-spin text-violet-400" size={32} />
                  <p className="text-xs font-black uppercase">Syncing Intelligence...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-10 text-center gap-4">
                  <div className={cn("w-16 h-16 rounded-full flex items-center justify-center", theme === 'dark' ? "bg-white/5" : "bg-slate-50")}>
                    <Bell className="opacity-20" size={32} />
                  </div>
                  <div>
                    <h3 className={cn("font-bold mb-1", theme === 'dark' ? "text-white" : "text-slate-900")}>All caught up!</h3>
                    <p className={cn("text-sm", theme === 'dark' ? "text-white/40" : "text-slate-500")}>No new notifications to show right now.</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredNotifications.map((n) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        "p-6 flex gap-4 transition-all hover:bg-violet-600/5 group relative",
                        !n.is_read && (theme === 'dark' ? "bg-violet-600/10" : "bg-violet-50/50")
                      )}
                    >
                      {!n.is_read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500" />
                      )}
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        theme === 'dark' ? "bg-white/5" : "bg-slate-50"
                      )}>
                        {getIcon(n.type, n.priority)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className={cn("font-bold leading-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>{n.title}</h4>
                          <span className={cn("text-[10px] whitespace-nowrap", theme === 'dark' ? "text-white/20" : "text-slate-400")}>
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className={cn("text-sm line-clamp-2", theme === 'dark' ? "text-white/60" : "text-slate-500")}>{n.message}</p>
                        {!n.is_read && (
                          <button 
                            onClick={() => handleMarkAsRead(n.id)}
                            className="text-[10px] font-black uppercase text-violet-400 mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                          >
                            Mark Read <Check size={10} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={cn(
              "p-6 border-t",
              theme === 'dark' ? "border-white/5" : "border-slate-100"
            )}>
              <button 
                onClick={onClose}
                className="w-full py-4 rounded-2xl bg-violet-600 text-white font-black uppercase text-xs shadow-xl shadow-violet-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Close Hub
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
