
import React from 'react';
import { Home, Calendar, Plus, User, Settings, Users, FileText, UserPlus, Send, ShieldAlert, LayoutDashboard, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  onAddClick: () => void;
  unreadNotifications?: number;
  unreadChatCount?: number;
  theme: 'dark' | 'light';
  role?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
  activeTab, 
  onTabChange, 
  onAddClick, 
  unreadNotifications = 0,
  unreadChatCount = 0,
  theme,
  role = 'student'
}) => {
  const isDark = theme === 'dark';
  const isAdmin = role === 'admin';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Glassmorphism Background */}
      <div className={`absolute inset-0 backdrop-blur-xl border-t ${isDark ? 'bg-[#130722]/80 border-white/10' : 'bg-white/80 border-slate-200'}`} />
      
      {/* Safe Area Inset for iOS */}
      <div className="relative pb-safe pt-2 px-4 flex items-center justify-between h-18">
        {!isAdmin ? (
          <>
            <NavButton 
              icon={<Home size={20} />} 
              label="Daily" 
              active={activeTab === 'daily'} 
              onClick={() => onTabChange('daily')}
              isDark={isDark}
            />
            
            <NavButton 
              icon={<Calendar size={20} />} 
              label="Weekly" 
              active={activeTab === 'weekly'} 
              onClick={() => onTabChange('weekly')}
              isDark={isDark}
            />

            <NavButton 
              icon={<FileText size={20} />} 
              label="Past" 
              active={activeTab === 'submissions'} 
              onClick={() => onTabChange('submissions')}
              isDark={isDark}
            />

            {/* Prominent Center Action Button */}
            <div className="relative -top-6 px-1">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onAddClick}
                className="w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(124,58,237,0.5)] border-4 cursor-pointer select-none"
                style={{ 
                   borderColor: isDark ? '#130722' : '#f8fafc',
                   touchAction: 'manipulation'
                 }}
              >
                <Plus size={28} strokeWidth={3} />
              </motion.button>
            </div>

            <NavButton 
              icon={<MessageSquare size={20} />} 
              label="Chats" 
              active={activeTab === 'chat'} 
              onClick={() => onTabChange('chat')}
              isDark={isDark}
              badgeCount={unreadChatCount}
            />

            <NavButton 
              icon={<User size={20} />} 
              label="Profile" 
              active={activeTab === 'profile'} 
              onClick={() => onTabChange('profile')}
              isDark={isDark}
            />

            <NavButton 
              icon={<Settings size={20} />} 
              label="Settings" 
              active={activeTab === 'settings'} 
              onClick={() => onTabChange('settings')}
              isDark={isDark}
            />
          </>
        ) : (
          /* Admin Bottom Nav */
          <>
            <NavButton 
              icon={<LayoutDashboard size={20} />} 
              label="Overview" 
              active={activeTab === 'overview'} 
              onClick={() => onTabChange('overview')}
              isDark={isDark}
            />
            <NavButton 
              icon={<Users size={20} />} 
              label="Students" 
              active={activeTab === 'students'} 
              onClick={() => onTabChange('students')}
              isDark={isDark}
            />
            <NavButton 
              icon={<MessageSquare size={20} />} 
              label="Chats" 
              active={activeTab === 'chat'} 
              onClick={() => onTabChange('chat')}
              isDark={isDark}
              badgeCount={unreadChatCount}
            />
            <NavButton 
              icon={<FileText size={20} />} 
              label="Review" 
              active={activeTab === 'submissions'} 
              onClick={() => onTabChange('submissions')}
              isDark={isDark}
            />
            <NavButton 
              icon={<UserPlus size={20} />} 
              label="Invite" 
              active={activeTab === 'invite'} 
              onClick={() => onTabChange('invite')}
              isDark={isDark}
            />
            <NavButton 
              icon={<Send size={20} />} 
              label="Broadcast" 
              active={activeTab === 'broadcast'} 
              onClick={() => onTabChange('broadcast')}
              isDark={isDark}
            />
          </>
        )}
      </div>
    </div>
  );
};

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  isDark: boolean;
  badgeCount?: number;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, active, onClick, isDark, badgeCount = 0 }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-0.5 min-w-[50px] relative cursor-pointer select-none active:scale-95 active:opacity-80 transition-all duration-75"
    style={{ touchAction: 'manipulation' }}
  >
    <div className={`transition-colors duration-200 relative ${active ? 'text-violet-500' : isDark ? 'text-white/40' : 'text-slate-400'}`}>
      {icon}
      {badgeCount > 0 && (
        <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white font-black text-[8px] px-1.5 py-0.5 rounded-full min-w-[16px] h-[16px] flex items-center justify-center border border-slate-900 shadow-md">
          {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      )}
    </div>
    <span className={`text-[9px] font-medium transition-colors duration-200 ${active ? 'text-violet-500' : isDark ? 'text-white/40' : 'text-slate-400'}`}>
      {label}
    </span>
    {active && (
      <motion.div 
        layoutId="activeTabDot"
        className="w-1 h-1 bg-violet-500 rounded-full absolute -bottom-1" 
      />
    )}
  </button>
);
