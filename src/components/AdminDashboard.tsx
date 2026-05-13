
import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { 
  BadgeAlert, Users, TrendingUp, Clock, ExternalLink, Calendar, 
  Search, Filter, CheckCircle2, AlertCircle, MessageSquare, 
  BarChart3, LayoutDashboard, UserCheck, ShieldAlert, 
  Bell, FileText, ChevronRight, MoreVertical, Star,
  Trash2, X, Send, Copy, RefreshCw, Lock, User, Mail,
  BrainCircuit, Zap, Target, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isYesterday } from 'date-fns';
import { Profile, Submission, SubmissionReview, Announcement } from '@/src/lib/types';
import { toast } from 'react-hot-toast';

interface AdminDashboardProps {
  theme?: 'dark' | 'light';
}

type AdminView = 'overview' | 'students' | 'submissions' | 'announcements' | 'moderation' | 'invite';

const InviteForm: React.FC<{ theme: 'dark' | 'light' }> = ({ theme }) => {
  const [form, setForm] = useState({
    fullName: '',
    realEmail: '',
    track: 'UI/UX Design',
    role: 'Student'
  });
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  const generateCredentials = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    const username = `WMH_${year}_${random}`;
    
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setCredentials({ username, password });
    setCreated(false);
  };

  const handleCreate = async () => {
    if (!credentials) return;
    setLoading(true);

    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      
      const response = await fetch('/api/admin/create-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          username: credentials.username,
          password: credentials.password,
          adminId: adminUser?.id
        })
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Failed to create account');

      toast.success('Account Created Successfully!');
      setCreated(true);
      // We don't reset credentials here because the user needs to see them one last time
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400" size={18} />
            <input 
              type="text" 
              placeholder="Student's Legal Name"
              value={form.fullName}
              onChange={(e) => setForm({...form, fullName: e.target.value})}
              className={`w-full pl-12 pr-4 py-3 rounded-2xl border outline-none font-bold ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-violet-500' : 'bg-slate-50 border-slate-200'}`}
            />
          </div>
        </div>
        <div>
          <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Real Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400" size={18} />
            <input 
              type="email" 
              placeholder="personal@email.com"
              value={form.realEmail}
              onChange={(e) => setForm({...form, realEmail: e.target.value})}
              className={`w-full pl-12 pr-4 py-3 rounded-2xl border outline-none font-bold ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-violet-500' : 'bg-slate-50 border-slate-200'}`}
            />
          </div>
        </div>
        <div>
          <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Track / Program</label>
          <input 
            type="text" 
            placeholder="e.g. UI/UX Design, Python, etc."
            value={form.track}
            onChange={(e) => setForm({...form, track: e.target.value})}
            className={`w-full px-6 py-3 rounded-2xl border outline-none font-bold ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-violet-500' : 'bg-slate-50 border-slate-200'}`}
          />
        </div>
        <div>
          <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Role</label>
          <input 
            type="text" 
            placeholder="e.g. Mastery Student"
            value={form.role}
            onChange={(e) => setForm({...form, role: e.target.value})}
            className={`w-full px-6 py-3 rounded-2xl border outline-none font-bold ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-violet-500' : 'bg-slate-50 border-slate-200'}`}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center pt-4">
        <button 
          onClick={generateCredentials}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all ${theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          <RefreshCw size={18} />
          Generate Credentials
        </button>

        {credentials && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex-1 grid grid-cols-2 gap-4 p-4 rounded-2xl border-2 border-dashed ${theme === 'dark' ? 'border-violet-500/30 bg-violet-500/5' : 'border-violet-200 bg-violet-50'}`}
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-violet-400">Username</span>
              <div className="flex items-center justify-between">
                <span className={`font-mono font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{credentials.username}</span>
                <button onClick={() => copyToClipboard(credentials.username, 'Username')} className="text-violet-400 hover:text-white p-1">
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-violet-400">Password</span>
              <div className="flex items-center justify-between">
                <span className={`font-mono font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{credentials.password}</span>
                <button onClick={() => copyToClipboard(credentials.password, 'Password')} className="text-violet-400 hover:text-white p-1">
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="pt-8">
        <button 
          onClick={handleCreate}
          disabled={!credentials || loading || created}
          className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-xl ${
            !credentials || created ? 'bg-slate-500/30 text-white/30 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/20'
          }`}
        >
          {loading ? (
            <RefreshCw className="animate-spin" size={20} />
          ) : created ? (
            <CheckCircle2 className="text-emerald-400" size={20} />
          ) : (
            <UserCheck size={20} />
          )}
          {created ? 'ACCOUNT CREATED' : loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT NOW'}
        </button>
        {created && (
          <p className="text-center mt-4 text-emerald-400 text-sm font-bold flex items-center justify-center gap-2">
            <ShieldAlert size={16} />
            Success: Make sure to copy credentials before navigating away!
          </p>
        )}
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ theme = 'dark' }) => {
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'at-risk' | 'inactive'>('all');
  
  // Detail views
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [reviewForm, setReviewForm] = useState({ notes: '', status: 'reviewed' as any });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch Profiles
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (pError) throw pError;

      // Fetch Submissions with Reviews
      const { data: subs, error: sError } = await supabase
        .from('submissions')
        .select('*, review:submission_reviews(*)')
        .order('submitted_date', { ascending: false });

      if (sError) throw sError;

      // Fetch Announcements
      const { data: ann, error: aError } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch Platform Analytics via the helper function we created
      const { data: analytics, error: rError } = await supabase.rpc('get_platform_analytics');

      setUsers(profiles || []);
      setSubmissions(subs || []);
      setAnnouncements(ann || []);
      setStats(analytics);
    } catch (error) {
      console.error('Admin Dashboard fetch error:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmission = async () => {
    if (!selectedSubmission) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('submission_reviews')
        .upsert({
          submission_id: selectedSubmission.id,
          admin_id: user?.id,
          status: reviewForm.status,
          admin_notes: reviewForm.notes,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success('Review submitted');
      setSelectedSubmission(null);
      fetchAllData();
    } catch (error) {
      console.error('Review error:', error);
      toast.error('Failed to save review');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
      case 'at-risk': return 'text-orange-400 bg-orange-400/10 border-orange-500/20';
      case 'inactive': return 'text-rose-400 bg-rose-400/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-500/20';
    }
  };

  // Mastery Intelligence Logic
  const getIntelligenceInsights = () => {
    const atRisk = users.filter(u => (u.weekly_consistency_score || 0) < 40 && u.community_role === 'student');
    const topPerformers = [...users].filter(u => u.community_role === 'student').sort((a, b) => (b.current_streak || 0) - (a.current_streak || 0)).slice(0, 3);
    
    const todayCount = submissions.filter(s => isToday(new Date(s.submitted_date))).length;
    const yesterdayCount = submissions.filter(s => isYesterday(new Date(s.submitted_date))).length;
    
    const velocity = yesterdayCount === 0 ? todayCount * 100 : ((todayCount - yesterdayCount) / yesterdayCount) * 100;
    
    return {
      atRisk,
      topPerformers,
      todayCount,
      velocity,
      needsAttention: submissions.filter(s => !s.review).length
    };
  };

  const insights = getIntelligenceInsights();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Clock className="text-violet-500 animate-spin" size={40} />
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    // Show anyone who isn't an admin as a student for safety
    const isStudent = u.community_role !== 'admin';
    const matchesSearch = u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.account_status === statusFilter;
    return isStudent && matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-screen pb-20 relative">
      {/* Mobile Header with Burger */}
      <div className="lg:hidden flex items-center justify-between mb-4 sticky top-0 z-40 bg-inherit pt-4">
        <h2 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Admin Panel</h2>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:w-64 space-y-2 p-6 lg:p-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${theme === 'dark' ? 'bg-[#0f0c14] lg:bg-transparent' : 'bg-white lg:bg-transparent'}
      `}>
        <div className="flex items-center justify-between lg:hidden mb-10">
          <h2 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Menu</h2>
          <button onClick={() => setIsSidebarOpen(false)} className={theme === 'dark' ? 'text-white/40' : 'text-slate-400'}>
            <X size={24} />
          </button>
        </div>

        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'submissions', label: 'Review Hub', icon: FileText },
          { id: 'announcements', label: 'Announcements', icon: Bell },
          { id: 'invite', label: 'Invite Student', icon: UserCheck },
          { id: 'moderation', label: 'Moderation', icon: ShieldAlert },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveView(item.id as AdminView);
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-black transition-all ${
              activeView === item.id 
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' 
                : theme === 'dark' ? 'text-white/40 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <item.icon size={20} />
            <span className="tracking-tight">{item.label}</span>
            {item.id === 'submissions' && submissions.filter(s => !s.review).length > 0 && (
              <span className="ml-auto w-6 h-6 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-black">
                {submissions.filter(s => !s.review).length}
              </span>
            )}
          </button>
        ))}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 space-y-8 min-w-0">
        <AnimatePresence mode="wait">
          {activeView === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Students', value: stats?.total_users || 0, icon: Users, color: 'text-violet-400' },
                  { label: 'Active Today', value: stats?.active_students || 0, icon: UserCheck, color: 'text-emerald-400' },
                  { label: 'Pending Reviews', value: stats?.pending_reviews || 0, icon: AlertCircle, color: 'text-orange-400' },
                  { label: 'Avg Persistence', value: (stats?.avg_focus_hours || 0).toFixed(1) + 'h', icon: TrendingUp, color: 'text-blue-400' },
                ].map((stat, i) => (
                  <div key={i} className={`backdrop-blur-md p-6 rounded-2xl border shadow-sm transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <stat.icon className={stat.color} size={24} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>{stat.label}</span>
                    </div>
                    <div className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Mastery Intelligence Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className={`lg:col-span-2 backdrop-blur-md p-8 rounded-3xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className={`text-2xl font-black flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        <BrainCircuit className="text-violet-400" size={28} />
                        Mastery Intelligence
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Real-time platform audit and actionable pattern recognition.</p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${theme === 'dark' ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'bg-violet-50 border-violet-100 text-violet-600'}`}>
                      <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Active Scan</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <Zap className="text-amber-400" size={20} />
                        <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Submission Velocity</h4>
                      </div>
                      <div className="flex items-end gap-3">
                        <span className={`text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {insights.velocity > 0 ? '+' : ''}{insights.velocity.toFixed(0)}%
                        </span>
                        <span className={`text-xs font-bold mb-2 ${insights.velocity >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          vs yesterday
                        </span>
                      </div>
                      <p className={`text-xs mt-4 ${theme === 'dark' ? 'text-white/30' : 'text-slate-500'}`}>
                        Students are submitting {insights.velocity >= 0 ? 'more' : 'less'} frequently today. 
                        {insights.velocity > 20 ? ' Momentum is high.' : insights.velocity < -20 ? ' Intervention suggested.' : ''}
                      </p>
                    </div>

                    <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <Target className="text-emerald-400" size={20} />
                        <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Goal Tracking</h4>
                      </div>
                      <div className="flex items-end gap-3">
                        <span className={`text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {insights.todayCount}
                        </span>
                        <span className={`text-xs font-bold mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                          tasks locked today
                        </span>
                      </div>
                      <p className={`text-xs mt-4 ${theme === 'dark' ? 'text-white/30' : 'text-slate-500'}`}>
                        Current platform utilization is at {Math.min(100, (insights.todayCount / (users.length || 1) * 100)).toFixed(0)}% for the last 24 hours.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/10">
                    <h4 className={`text-xs font-black uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>Critical Alerts</h4>
                    <div className="space-y-3">
                      {insights.atRisk.slice(0, 3).map(u => (
                        <div key={u.id} className={`flex items-center justify-between p-4 rounded-xl border ${theme === 'dark' ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}>
                          <div className="flex items-center gap-3">
                            <AlertCircle className="text-rose-400" size={18} />
                            <div>
                              <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{u.full_name} is losing momentum</p>
                              <p className={`text-[10px] ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Consistency dropped to {u.weekly_consistency_score}%</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setActiveView('announcements');
                              toast(`Drafting follow-up for ${u.full_name}`, { icon: '📝' });
                            }}
                            className="text-[10px] font-black uppercase text-rose-400 hover:underline"
                          >
                             Reach Out
                          </button>
                        </div>
                      ))}
                      {insights.atRisk.length === 0 && (
                        <div className={`p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3`}>
                          <CheckCircle2 className="text-emerald-400" size={18} />
                          <p className="text-sm font-bold text-emerald-400">All students are maintaining healthy consistency levels.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className={`backdrop-blur-md p-6 rounded-3xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      <Star className="text-amber-400" size={20} />
                      Top Performers
                    </h3>
                    <div className="space-y-4">
                      {insights.topPerformers.map((u, i) => (
                        <div key={u.id} className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-500' : 'bg-slate-500'} text-white`}>
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{u.full_name}</p>
                            <p className={`text-[10px] ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>{u.current_streak} Day Streak</p>
                          </div>
                          <div className={`text-xs font-black ${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>
                            {u.weekly_consistency_score}%
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setActiveView('announcements')}
                      className={`w-full mt-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                    >
                      Acknowledge Leaders
                    </button>
                  </div>

                  <div className={`backdrop-blur-md p-6 rounded-3xl border ${theme === 'dark' ? 'bg-white/5 border-white/10 shadow-xl' : 'bg-violet-600 border-none shadow-violet-600/20 text-white'}`}>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-violet-400' : 'text-white'}`}>
                      <ShieldAlert size={20} />
                      System Audit
                    </h3>
                    <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-white/60' : 'text-white/80'}`}>
                      Platform integrity is currently high. {insights.needsAttention} submissions are awaiting your validation.
                    </p>
                    <button 
                      onClick={() => setActiveView('submissions')}
                      className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-white text-violet-600 hover:shadow-lg'}`}
                    >
                      Go to Review Hub
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'students' && (
            <motion.div 
              key="students"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Filter Bar */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                  <input 
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 rounded-2xl border transition-all focus:ring-4 outline-none ${
                      theme === 'dark' 
                        ? 'bg-white/5 border-white/10 text-white focus:ring-violet-500/20' 
                        : 'bg-white border-slate-200 text-slate-900 focus:ring-violet-100'
                    }`}
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  {['all', 'active', 'at-risk', 'inactive'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                        statusFilter === status 
                          ? 'bg-violet-600 text-white' 
                          : theme === 'dark' ? 'bg-white/5 text-white/40 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`backdrop-blur-md rounded-3xl border shadow-xl overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className={`text-[10px] font-bold uppercase tracking-widest border-b ${theme === 'dark' ? 'bg-white/5 text-violet-300/40 border-white/10' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4 text-center">Persistence</th>
                        <th className="px-6 py-4 text-center">Weekly Consistency</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-violet-500/5 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${theme === 'dark' ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                                {u.full_name?.[0] || '?'}
                              </div>
                              <div>
                                <div className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{u.full_name}</div>
                                <div className={`text-[10px] ${theme === 'dark' ? 'text-white/30' : 'text-slate-500'}`}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className={`text-lg font-black ${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>{u.current_streak}d</span>
                              <span className="text-[10px] opacity-40">STREAK</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className={`text-lg font-black ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{u.weekly_consistency_score}%</span>
                              <div className="w-20 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${u.weekly_consistency_score}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase border ${getStatusColor(u.account_status)}`}>
                              {u.account_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${theme === 'dark' ? 'bg-white/5 text-white/40 hover:text-white' : 'bg-slate-100 text-slate-400'}`}>
                               <ChevronRight size={18} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'submissions' && (
            <motion.div 
              key="submissions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-4">
                {submissions.filter(s => !s.review || s.review.status === 'pending').map((sub) => {
                  const student = users.find(u => u.id === sub.user_id);
                  return (
                    <motion.div
                      layout
                      key={sub.id}
                      className={`p-6 rounded-3xl border backdrop-blur-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                        theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                          <Clock size={24} />
                        </div>
                        <div>
                          <h4 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{sub.task_completed}</h4>
                          <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                            By <span className="text-violet-400 font-bold">{student?.full_name || 'Anonymous Student'}</span> • {format(new Date(sub.submitted_date), 'MMM d, HH:mm')}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <div className={`px-4 py-2 rounded-xl text-xs font-bold ${theme === 'dark' ? 'bg-white/5 text-white/60' : 'bg-slate-50 text-slate-500'}`}>
                          {sub.time_spent} mins
                        </div>
                        <button 
                          onClick={() => setSelectedSubmission(sub)}
                          className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-violet-600/20"
                        >
                          Review Submission
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
                
                {submissions.filter(s => !s.review || s.review.status === 'pending').length === 0 && (
                   <div className="py-20 text-center">
                     <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
                     <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>All Clear!</h3>
                     <p className={`text-sm ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>No pending submissions for review right now.</p>
                   </div>
                )}
              </div>
            </motion.div>
          )}

          {activeView === 'announcements' && (
            <motion.div 
              key="announcements"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className={`p-8 rounded-3xl border backdrop-blur-xl ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Send Global Announcement</h3>
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                    const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;
                    const target = (form.elements.namedItem('target') as HTMLSelectElement).value;

                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      const { error } = await supabase.from('announcements').insert({
                        title, content, target_role: target, created_by: user?.id
                      });
                      if (error) throw error;
                      toast.success('Announcement broadcasted!');
                      form.reset();
                      fetchAllData();
                    } catch (err) {
                      toast.error('Failed to send announcement');
                    }
                  }}
                  className="space-y-4"
                >
                  <input 
                    name="title"
                    required
                    type="text" 
                    placeholder="Announcement Title"
                    className={`w-full px-6 py-3 rounded-2xl border outline-none font-bold ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-violet-500' : 'bg-slate-50 border-slate-200'}`}
                  />
                  <textarea 
                    name="content"
                    required
                    rows={4}
                    placeholder="Type your message to the Mastery Hub community..."
                    className={`w-full px-6 py-4 rounded-3xl border outline-none font-medium resize-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-violet-500' : 'bg-slate-50 border-slate-200'}`}
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-white/30">Target:</span>
                      <select name="target" className={`px-3 py-1 rounded-lg text-xs font-bold ${theme === 'dark' ? 'bg-white/10 text-white border-none' : 'bg-slate-100'}`}>
                        <option value="all">All Students</option>
                        <option value="at-risk">At-Risk Students</option>
                        <option value="top">Top Performers</option>
                      </select>
                    </div>
                    <button type="submit" className="flex items-center gap-2 px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black transition-all">
                      <Send size={18} />
                      Blast Announcement
                    </button>
                  </div>
                </form>
              </div>

              <div className="space-y-4">
                <h3 className={`text-lg font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <Clock size={20} className="text-violet-400" />
                  Recent Communications
                </h3>
                {announcements.length === 0 ? (
                  <p className="text-center py-10 opacity-30">No recent announcements.</p>
                ) : announcements.map(a => (
                  <div key={a.id} className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white/60' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <h4 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{a.title}</h4>
                       <div className="flex items-center gap-2">
                         <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-600/20 text-violet-400 rounded uppercase">{a.target_role}</span>
                         <span className="text-[10px] font-bold opacity-30">{format(new Date(a.created_at), 'MMM d, HH:mm')}</span>
                       </div>
                    </div>
                    <p className="text-sm font-medium">{a.content}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeView === 'invite' && (
            <motion.div 
              key="invite"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className={`p-8 rounded-3xl border backdrop-blur-xl ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className={`text-2xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Create Student Account</h3>
                <p className={`text-sm mb-8 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                  Register new students to the Mastery Hub. Credentials will be generated automatically.
                </p>

                <InviteForm theme={theme} />
              </div>
            </motion.div>
          )}

          {activeView === 'moderation' && (
            <motion.div 
              key="moderation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className={`p-8 rounded-3xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-xl font-black mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <ShieldAlert className="text-rose-500" />
                  Platform Moderation Tools
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'Flagged Submissions', desc: 'Review submissions reported as low quality or spam.', count: submissions.filter(s => s.review?.status === 'flagged').length, icon: BadgeAlert, color: 'text-rose-500' },
                    { title: 'Deactivated Accounts', desc: 'Accounts suspended for policy violations.', count: users.filter(u => u.account_status === 'suspended').length, icon: Users, color: 'text-slate-500' },
                  ].map((tool, i) => (
                    <div key={i} className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex justify-between mb-4">
                        <tool.icon className={tool.color} size={24} />
                        <span className="text-2xl font-black">{tool.count}</span>
                      </div>
                      <h4 className={`font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{tool.title}</h4>
                      <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>{tool.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                 <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Flagged Activity Feed</h3>
                 {submissions.filter(s => s.review?.status === 'flagged').length === 0 ? (
                   <div className="py-20 text-center opacity-30">No flagged activity found.</div>
                 ) : (
                   submissions.filter(s => s.review?.status === 'flagged').map(sub => (
                     <div key={sub.id} className={`p-5 rounded-2xl border flex items-center justify-between ${theme === 'dark' ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}>
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center">
                              <AlertCircle size={20} />
                           </div>
                           <div>
                             <p className="font-bold text-sm">Flagged: {sub.task_completed}</p>
                             <p className="text-[10px] opacity-60">Submitted by {users.find(u => u.id === sub.user_id)?.full_name}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => setSelectedSubmission(sub)}
                          className="text-xs font-black text-rose-500 hover:underline"
                        >
                           RE-REVIEW
                        </button>
                     </div>
                   ))
                 )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Submission Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="absolute inset-0 bg-black/60 backdrop-blur-md"
             onClick={() => setSelectedSubmission(null)}
           />
           <motion.div 
             initial={{ scale: 0.9, opacity: 0, y: 20 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
             className={`relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#1a1625] border border-white/10' : 'bg-white'}`}
           >
             <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                   <div>
                     <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Review Submission</h3>
                     <p className={`text-sm ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Validating documentation for accountability.</p>
                   </div>
                   <button onClick={() => setSelectedSubmission(null)} className="p-2 hover:bg-white/10 rounded-xl">
                      <X size={24} className="text-white/30" />
                   </button>
                </div>

                <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-slate-50'}`}>
                   <div className="flex justify-between mb-4">
                      <span className="text-[10px] font-black uppercase text-violet-400 tracking-widest">Task Detail</span>
                      <span className="text-[10px] font-bold text-white/30 uppercase">{format(new Date(selectedSubmission.submitted_date), 'MMMM d, yyyy')}</span>
                   </div>
                   <h4 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{selectedSubmission.task_completed}</h4>
                   <p className={`text-sm font-medium italic ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>"{selectedSubmission.reflection}"</p>
                   
                   {selectedSubmission.proof_url && (
                     <a 
                       href={selectedSubmission.proof_url} 
                       target="_blank" 
                       rel="noreferrer"
                       className="mt-4 flex items-center gap-2 text-violet-400 font-bold hover:text-violet-300 transition-colors"
                     >
                       <ExternalLink size={16} />
                       View Proof Artifact
                     </a>
                   )}
                </div>

                <div className="space-y-4">
                   <div>
                      <label className="text-[10px] font-black uppercase text-white/30 mb-2 block">Admin Feedback</label>
                      <textarea 
                        value={reviewForm.notes}
                        onChange={(e) => setReviewForm({...reviewForm, notes: e.target.value})}
                        placeholder="Add constructive feedback or recognition..."
                        className={`w-full px-6 py-4 rounded-2xl border outline-none font-medium resize-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-violet-500' : 'bg-slate-50 border-slate-200'}`}
                      />
                   </div>

                   <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'reviewed', label: 'Verified', icon: CheckCircle2, color: 'hover:bg-emerald-500 hover:border-emerald-500' },
                        { id: 'excellent', label: 'Superior', icon: Star, color: 'hover:bg-amber-500 hover:border-amber-500' },
                        { id: 'flagged', label: 'Questionable', icon: AlertCircle, color: 'hover:bg-rose-500 hover:border-rose-500' },
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setReviewForm({...reviewForm, status: type.id as any})}
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                            reviewForm.status === type.id 
                              ? type.id === 'reviewed' ? 'bg-emerald-500 text-white border-emerald-500' : 
                                type.id === 'excellent' ? 'bg-amber-500 text-white border-amber-500' : 'bg-rose-500 text-white border-rose-500'
                              : theme === 'dark' ? 'bg-white/5 border-white/10 text-white/40' + ' ' + type.color : 'bg-slate-50'
                          }`}
                        >
                          <type.icon size={20} />
                          <span className="text-[10px] font-black uppercase">{type.label}</span>
                        </button>
                      ))}
                   </div>
                </div>

                <button 
                  onClick={handleReviewSubmission}
                  className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-violet-600/20"
                >
                  Confirm Review
                </button>
             </div>
           </motion.div>
        </div>
      )}
    </div>
  );
};
