
import React from 'react';
import { Home, Calendar, Plus, User, Settings, Users, FileText, UserPlus, Send, ShieldAlert, LayoutDashboard } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  onAddClick: () => void;
  unreadNotifications?: number;
  theme: 'dark' | 'light';
  role?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
  activeTab, 
  onTabChange, 
  onAddClick, 
  unreadNotifications = 0,
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
              icon={<Home size={24} />} 
              label="Daily" 
              active={activeTab === 'daily'} 
              onClick={() => onTabChange('daily')}
              isDark={isDark}
            />
            
            <NavButton 
              icon={<Calendar size={24} />} 
              label="Weekly" 
              active={activeTab === 'weekly'} 
              onClick={() => onTabChange('weekly')}
              isDark={isDark}
            />

            {/* Prominent Center Action Button */}
            <div className="relative -top-6 px-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onAddClick}
                className="w-14 h-14 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(124,58,237,0.5)] border-4 cursor-pointer select-none"
                style={{ 
                   borderColor: isDark ? '#130722' : '#f8fafc',
                   touchAction: 'manipulation'
                }}
              >
                <Plus size={32} strokeWidth={3} />
              </motion.button>
            </div>

            <NavButton 
              icon={<User size={24} />} 
              label="Profile" 
              active={activeTab === 'profile'} 
              onClick={() => onTabChange('profile')}
              isDark={isDark}
            />

            <NavButton 
              icon={<Settings size={24} />} 
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
              icon={<LayoutDashboard size={24} />} 
              label="Overview" 
              active={activeTab === 'overview'} 
              onClick={() => onTabChange('overview')}
              isDark={isDark}
            />
            <NavButton 
              icon={<Users size={24} />} 
              label="Students" 
              active={activeTab === 'students'} 
              onClick={() => onTabChange('students')}
              isDark={isDark}
            />
            <NavButton 
              icon={<FileText size={24} />} 
              label="Review" 
              active={activeTab === 'submissions'} 
              onClick={() => onTabChange('submissions')}
              isDark={isDark}
            />
            <NavButton 
              icon={<UserPlus size={24} />} 
              label="Invite" 
              active={activeTab === 'invite'} 
              onClick={() => onTabChange('invite')}
              isDark={isDark}
            />
            <NavButton 
              icon={<Send size={24} />} 
              label="Broadcast" 
              active={activeTab === 'broadcast'} 
              onClick={() => onTabChange('broadcast')}
              isDark={isDark}
            />
            <NavButton 
              icon={<ShieldAlert size={24} />} 
              label="Moderate" 
              active={activeTab === 'moderation'} 
              onClick={() => onTabChange('moderation')}
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
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, active, onClick, isDark }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-1 min-w-[60px] cursor-pointer select-none active:scale-95 active:opacity-80 transition-all duration-75"
    style={{ touchAction: 'manipulation' }}
  >
    <div className={`transition-colors duration-200 ${active ? 'text-violet-500' : isDark ? 'text-white/40' : 'text-slate-400'}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-medium transition-colors duration-200 ${active ? 'text-violet-500' : isDark ? 'text-white/40' : 'text-slate-400'}`}>
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
