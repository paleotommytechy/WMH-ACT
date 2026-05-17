
import React from 'react';
import { Home, Calendar, Plus, User, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: 'daily' | 'weekly' | 'profile' | 'settings';
  onTabChange: (tab: 'daily' | 'weekly' | 'profile' | 'settings') => void;
  onAddClick: () => void;
  unreadNotifications?: number;
  theme: 'dark' | 'light';
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
  activeTab, 
  onTabChange, 
  onAddClick, 
  unreadNotifications = 0,
  theme 
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Glassmorphism Background */}
      <div className={`absolute inset-0 backdrop-blur-xl border-t ${isDark ? 'bg-[#130722]/80 border-white/10' : 'bg-white/80 border-slate-200'}`} />
      
      {/* Safe Area Inset for iOS */}
      <div className="relative pb-safe pt-2 px-6 flex items-center justify-between h-18">
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
            className="w-14 h-14 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(124,58,237,0.5)] border-4 border-[#130722]"
            style={{ 
               borderColor: isDark ? '#130722' : '#f8fafc'
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
    className="flex flex-col items-center justify-center gap-1 min-w-[60px]"
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
