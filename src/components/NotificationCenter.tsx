
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, Check, Trash2, AlertCircle, Info, Trophy, 
  MessageSquare, Zap, Clock, Calendar, Shield, X, ExternalLink
} from 'lucide-react';
import { AppNotification } from '@/src/lib/types';
import { NotificationService } from '@/src/lib/notifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/src/lib/utils';
import Markdown from 'react-markdown';

interface NotificationCenterProps {
  userId: string;
  theme: 'dark' | 'light';
  isOpen: boolean;
  onClose: () => void;
  onRedirect?: (tab: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  userId, theme, isOpen, onClose, onRedirect 
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

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

  const getRedirectTab = (title: string, message: string): string | null => {
    const content = (title + ' ' + message).toLowerCase();
    
    // Check for weekly focus goals, reviews, or consistency
    if (content.includes('weekly') || content.includes('streak') || content.includes('consistency') || content.includes('hour goal') || content.includes('goal reached') || content.includes('focus goal') || content.includes('milestone')) {
      return 'weekly';
    }
    
    // Check for chat / messages / advisory
    if (content.includes('chat') || content.includes('message') || content.includes('sender') || content.includes('advisor') || content.includes('dm') || content.includes('instructor text') || content.includes('texted') || content.includes('replied') || content.includes('circle') || content.includes('group')) {
      return 'chat';
    }
    
    // Check for submissions / reviews
    if (content.includes('submission') || content.includes('review') || content.includes('reviewed') || content.includes('approved') || content.includes('rejected') || content.includes('focus log') || content.includes('verified') || content.includes('achievement')) {
      return 'submissions';
    }
    
    return null;
  };

  const handleNotificationClick = async (n: AppNotification) => {
    setSelectedNotification(n);
    if (!n.is_read) {
      await handleMarkAsRead(n.id);
    }
    const targetTab = getRedirectTab(n.title, n.message);
    if (targetTab && onRedirect) {
      onRedirect(targetTab);
      onClose(); // Auto close notifications drawer/sheet
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

  // Escape key closure for selected notification modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNotification(null);
      }
    };
    if (selectedNotification) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNotification]);

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
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "p-6 flex gap-4 transition-all hover:bg-violet-600/5 group relative cursor-pointer",
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(n.id);
                            }}
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

          {/* Full Context Notification Modal */}
          <AnimatePresence>
            {selectedNotification && (
              <div 
                className="fixed inset-0 z-[120] flex items-center justify-center p-4 cursor-pointer"
                onClick={() => setSelectedNotification(null)}
              >
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-none"
                />

                {/* Modal Card */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border cursor-default flex flex-col max-h-[90vh] md:max-h-[85vh]",
                    theme === 'dark' ? "bg-[#1a1625] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
                  )}
                >
                  {/* Fixed Header */}
                  <div className={cn(
                    "p-6 md:p-8 pb-4 flex justify-between items-start gap-4 border-b shrink-0 select-none",
                    theme === 'dark' ? "border-white/5" : "border-slate-100"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        theme === 'dark' ? "bg-white/5" : "bg-slate-100"
                      )}>
                        {getIcon(selectedNotification.type, selectedNotification.priority)}
                      </div>
                      <div>
                        <span className={cn("text-[10px] font-black uppercase tracking-widest block opacity-60")}>
                          {selectedNotification.type} • {selectedNotification.priority} priority
                        </span>
                        <h3 className={cn("text-xl font-black leading-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>
                          {selectedNotification.title}
                        </h3>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedNotification(null)} 
                      className={cn("p-2 rounded-xl transition-colors shrink-0 cursor-pointer", theme === 'dark' ? "hover:bg-white/10 text-white/30 hover:text-white" : "hover:bg-slate-150 text-slate-400 hover:text-slate-900")}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Scrollable Contents */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                    {(() => {
                      const message = selectedNotification.message;
                      const feedbackMarker = "Feedback:";
                      const index = message.indexOf(feedbackMarker);
                      
                      if (index !== -1) {
                        const introText = message.substring(0, index).trim();
                        const feedbackText = message.substring(index + feedbackMarker.length).trim();
                        return (
                          <div className="space-y-4">
                            {introText && (
                              <div className={cn(
                                "p-4 rounded-xl text-xs opacity-80 leading-relaxed font-semibold",
                                theme === 'dark' ? "text-violet-200/80" : "text-slate-600"
                              )}>
                                {introText}
                              </div>
                            )}
                            <div className={cn(
                              "p-6 rounded-2xl border relative overflow-hidden space-y-2",
                              theme === 'dark' ? "bg-violet-500/10 border-violet-500/30 text-white" : "bg-violet-50/50 border-violet-200 text-slate-900"
                            )}>
                              <div className="flex items-center gap-2 text-violet-400">
                                <MessageSquare size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Instructor Feedback</span>
                              </div>
                              <div className={cn(
                                "text-sm font-semibold leading-relaxed break-words whitespace-pre-wrap markdown-body",
                                theme === 'dark' ? "text-violet-100/95" : "text-violet-950"
                              )}>
                                <Markdown>{feedbackText}</Markdown>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      const isReviewRelated = selectedNotification.title.toLowerCase().includes('submission') || 
                                             selectedNotification.message.toLowerCase().includes('reviewed') ||
                                             selectedNotification.title.toLowerCase().includes('achievement');
                      
                      if (isReviewRelated) {
                        return (
                          <div className={cn(
                            "p-6 rounded-2xl border relative overflow-hidden space-y-2",
                            theme === 'dark' ? "bg-violet-500/10 border-violet-500/30 text-white" : "bg-violet-50/50 border-violet-200 text-slate-900"
                          )}>
                            <div className="flex items-center gap-2 text-violet-400">
                              <MessageSquare size={16} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Instructor Feedback</span>
                            </div>
                            <div className={cn(
                              "text-sm font-semibold leading-relaxed break-words whitespace-pre-wrap markdown-body",
                              theme === 'dark' ? "text-violet-100/95" : "text-violet-950"
                            )}>
                              <Markdown>{message}</Markdown>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div className={cn(
                          "p-6 rounded-2xl border text-sm leading-relaxed overflow-y-auto max-h-[300px] whitespace-pre-wrap break-words",
                          theme === 'dark' ? "bg-white/5 border-white/5 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-700"
                        )}>
                          <Markdown>{message}</Markdown>
                        </div>
                      );
                    })()}

                    <div className={`flex items-center gap-2 text-xs opacity-60`}>
                      <Calendar size={14} className="text-violet-400" />
                      <span>Received on {formatDistanceToNow(new Date(selectedNotification.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Fixed Footer */}
                  <div className={cn(
                    "p-6 border-t shrink-0 flex items-center gap-3",
                    theme === 'dark' ? "border-white/5 bg-[#171320]" : "border-slate-100 bg-slate-50"
                  )}>
                    {selectedNotification.action_url ? (
                      <a 
                        href={selectedNotification.action_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black uppercase text-xs text-center flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-600/20 cursor-pointer"
                      >
                        <ExternalLink size={14} />
                        Visit Destination
                      </a>
                    ) : (() => {
                      const tab = getRedirectTab(selectedNotification.title, selectedNotification.message);
                      if (tab) {
                        let btnText = 'Submissions';
                        if (tab === 'chat') btnText = 'Chat Area';
                        else if (tab === 'weekly') btnText = 'Weekly Hub';
                        return (
                          <button
                            onClick={() => {
                              if (onRedirect) onRedirect(tab);
                              setSelectedNotification(null);
                              onClose();
                            }}
                            className="flex-1 py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black uppercase text-xs text-center flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-600/20 cursor-pointer"
                          >
                            Go to {btnText}
                          </button>
                        );
                      }
                      return null;
                    })()}
                    <button 
                      onClick={() => setSelectedNotification(null)}
                      className={cn(
                        "py-3 px-5 rounded-xl font-black uppercase text-xs transition-all cursor-pointer",
                        (selectedNotification.action_url || getRedirectTab(selectedNotification.title, selectedNotification.message)) ? "border" : "w-full py-4 text-center rounded-2xl bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-600/20",
                        theme === 'dark' ? "border-white/10 text-white hover:bg-white/5" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      Close Context
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};
