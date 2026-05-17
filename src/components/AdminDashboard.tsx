
import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { 
  BadgeAlert, Users, TrendingUp, Clock, ExternalLink, Calendar, 
  Search, Filter, CheckCircle2, AlertCircle, MessageSquare, 
  BarChart3, LayoutDashboard, UserCheck, ShieldAlert, 
  Bell, FileText, ChevronRight, MoreVertical, Star,
  Trash2, X, Send, Copy, RefreshCw, Lock, User, Mail,
  BrainCircuit, Zap, Target, Menu, Maximize2, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isToday, isYesterday } from 'date-fns';
import { Profile, Submission, Announcement } from '@/src/lib/types';
import { toast } from 'react-hot-toast';

const StudentMobileCard: React.FC<{ u: Profile, theme: 'dark' | 'light', getStatusColor: (s: string) => string }> = ({ u, theme, getStatusColor }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 rounded-[2rem] border backdrop-blur-xl transition-all relative overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Users size={80} />
      </div>
      
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${theme === 'dark' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-violet-100 text-violet-600 border border-violet-200 shadow-inner'}`}>
              {u.profile_image ? (
                <img src={u.profile_image} alt={u.full_name || ''} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                u.full_name?.[0] || '?'
              )}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 ${theme === 'dark' ? 'border-[#130722]' : 'border-white'} ${u.account_status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          </div>
          <div>
            <h4 className={`font-black tracking-tight text-lg leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{u.full_name}</h4>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-violet-400/50' : 'text-violet-600/50'}`}>@{u.username || 'unknown'}</p>
          </div>
        </div>
        <button className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-slate-50 text-slate-400'}`}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-2 mb-1 opacity-40">
            <TrendingUp size={12} />
            <span className="text-[10px] font-black uppercase tracking-tighter">Streak</span>
          </div>
          <div className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{u.current_streak}d</div>
        </div>
        <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-2 mb-1 opacity-40">
            <Target size={12} />
            <span className="text-[10px] font-black uppercase tracking-tighter">Consistency</span>
          </div>
          <div className={`text-xl font-black ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{u.weekly_consistency_score}%</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail size={12} className="text-violet-400" />
            <span className={`text-[10px] font-medium max-w-[140px] truncate ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>{u.email}</span>
          </div>
          <div className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border ${getStatusColor(u.account_status)}`}>
            {u.account_status}
          </div>
        </div>
        
        <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500" 
            style={{ width: `${u.weekly_consistency_score}%` }} 
          />
        </div>
      </div>
    </motion.div>
  );
};

interface AdminDashboardProps {
  theme?: 'dark' | 'light';
  activeView?: AdminView;
  onViewChange?: (view: AdminView) => void;
}

type AdminView = 'overview' | 'students' | 'submissions' | 'moderation' | 'invite' | 'broadcast';

const BroadcastForm: React.FC<{ theme: 'dark' | 'light', users: Profile[] }> = ({ theme, users }) => {
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'admin' as any,
    target: 'all' as 'all' | 'students' | 'at-risk'
  });
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!form.title || !form.message) return;
    setSending(true);
    try {
      let targets = [];
      if (form.target === 'all') {
        targets = users.map(u => u.id);
      } else if (form.target === 'students') {
        targets = users.filter(u => u.community_role === 'student').map(u => u.id);
      } else if (form.target === 'at-risk') {
        targets = users.filter(u => (u.weekly_consistency_score || 0) < 40).map(u => u.id);
      }

      if (targets.length === 0) {
        toast.error('No target users found.');
        return;
      }

      const notifications = targets.map(userId => ({
        user_id: userId,
        title: form.title,
        message: form.message,
        type: form.type,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;

      toast.success(`Broadcast sent to ${targets.length} users!`);
      setForm({ ...form, title: '', message: '' });
    } catch (err) {
      console.error('Broadcast error:', err);
      toast.error('Failed to send broadcast.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`p-8 rounded-3xl border backdrop-blur-xl ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="flex items-center gap-3 mb-6">
        <Send className="text-violet-400" size={24} />
        <div>
          <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Platform Broadcast</h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Dispatch mission-critical updates to the student body.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Title</label>
          <input 
            type="text" 
            placeholder="Critical Mastery Update"
            value={form.title}
            onChange={(e) => setForm({...form, title: e.target.value})}
            className={`w-full px-6 py-3 rounded-2xl border outline-none font-bold ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-violet-500' : 'bg-slate-50 border-slate-200'}`}
          />
        </div>
        <div>
          <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Message Body</label>
          <textarea 
            rows={4}
            placeholder="Enter the broadcast message content here..."
            value={form.message}
            onChange={(e) => setForm({...form, message: e.target.value})}
            className={`w-full px-6 py-4 rounded-2xl border outline-none font-medium resize-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-violet-500' : 'bg-slate-50 border-slate-200'}`}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Type</label>
            <select 
              value={form.type}
              onChange={(e) => setForm({...form, type: e.target.value as any})}
              className={`w-full px-6 py-3 rounded-2xl border outline-none font-bold ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`}
            >
              <option value="admin">Admin Broadcast</option>
              <option value="motivation">Motivation Boost</option>
              <option value="system">System Alert</option>
            </select>
          </div>
          <div>
            <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Target Audience</label>
            <select 
              value={form.target}
              onChange={(e) => setForm({...form, target: e.target.value as any})}
              className={`w-full px-6 py-3 rounded-2xl border outline-none font-bold ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`}
            >
              <option value="all">All Registered Users</option>
              <option value="students">All Active Students</option>
              <option value="at-risk">At-Risk Students ONLY</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleSend}
          disabled={sending || !form.title || !form.message}
          className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-xl ${
            sending ? 'bg-slate-500/30' : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/20'
          }`}
        >
          {sending ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
          {sending ? 'DISPATCHING...' : 'DISPATCH BROADCAST'}
        </button>
      </div>
    </div>
  );
};

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
    } catch (error: any) {
      console.error('Create student error:', error);
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ theme = 'dark', activeView: propActiveView, onViewChange }) => {
  const [activeView, setActiveView] = useState<AdminView>(propActiveView || 'overview');

  useEffect(() => {
    if (propActiveView && propActiveView !== activeView) {
      setActiveView(propActiveView);
    }
  }, [propActiveView]);

  const handleViewChange = (view: AdminView) => {
    setActiveView(view);
    onViewChange?.(view);
  };
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLightbox, setShowLightbox] = useState<string | null>(null);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'at-risk' | 'inactive'>('all');
  
  // Detail views
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [reviewForm, setReviewForm] = useState({ notes: '', status: 'reviewed' as any });
  const [reviewHubTab, setReviewHubTab] = useState<'pending' | 'history'>('pending');
  const [initLoading, setInitLoading] = useState(false);

  const initInfrastructure = async () => {
    try {
      setInitLoading(true);
      const response = await fetch('/api/admin/init-infrastructure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Identity Storage (Avatars) Initialized!');
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error('Initialization failed: ' + err.message);
    } finally {
      setInitLoading(false);
    }
  };

  useEffect(() => {
    console.log(`AdminDashboard: State updated. Submissions count: ${submissions.length}`);
  }, [submissions]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');

      const { data: adminProfile, error: adminErr } = await supabase
        .from('profiles')
        .select('community_role')
        .eq('id', authUser.id)
        .single();
      
      if (adminErr) {
        console.error('AdminDashboard: Error checking admin role:', adminErr);
        // If we can't even read our own profile, we have a RLS problem
      }
      
      console.log('AdminDashboard: Current Admin Profile:', adminProfile);
      
      if (adminProfile?.community_role !== 'admin') {
        console.warn('AdminDashboard: User is not an admin according to profiles table.');
        toast.error('Admin access restricted');
      }

      // Fetch Students
      const { data: profiles, error: pError } = await supabase
        .from('admin_student_management')
        .select('*')
        .order('created_at', { ascending: false });

      if (pError) {
        console.warn('View admin_student_management fetch failed, falling back to profiles');
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        setUsers(p || []);
      } else {
        setUsers(profiles || []);
      }
      
      // Fetch Submissions with Reviews and Relationships
      const { data: subs, error: sError } = await supabase
        .from('submissions')
        .select(`
          *,
          student:profiles(full_name, username, email),
          review:submission_reviews(
            *,
            admin:profiles(full_name)
          )
        `)
        .eq('is_draft', false)
        .order('submitted_date', { ascending: false });

      if (sError) {
        console.error('Submissions fetch error:', sError);
        // Recovery simple fetch
        const { data: recoveredSubs } = await supabase
          .from('submissions')
          .select('*, review:submission_reviews(*)')
          .eq('is_draft', false)
          .order('submitted_date', { ascending: false });
        
        setSubmissions(recoveredSubs || []);
      } else {
        // PostgREST might return review/student as arrays due to relationships, normalize them
        const normalized = (subs || []).map(s => ({
          ...s,
          student: Array.isArray(s.student) ? s.student[0] : s.student,
          review: Array.isArray(s.review) ? (s.review[0] || null) : (s.review || null)
        }));
        setSubmissions(normalized);
      }
      
      const { data: analytics } = await supabase.rpc('get_platform_analytics');
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
      
      // Auto-assign the admin_id to the current reviewer
      const { error } = await supabase
        .from('submission_reviews')
        .upsert({
          submission_id: selectedSubmission.id,
          admin_id: user?.id,
          status: reviewForm.status,
          admin_notes: reviewForm.notes,
          updated_at: new Date().toISOString()
        }, { onConflict: 'submission_id' });

      if (error) throw error;
      
      // Send notification to the student
      await supabase.from('notifications').insert({
        user_id: selectedSubmission.user_id,
        title: reviewForm.status === 'excellent' ? '🌟 Superior Achievement!' : '✅ Submission Verified',
        message: `Your submission "${selectedSubmission.task_completed}" has been reviewed. Status: ${reviewForm.status.toUpperCase()}.`,
        type: reviewForm.status === 'excellent' ? 'achievement' : 'reminder',
        priority: reviewForm.status === 'flagged' ? 'high' : 'normal',
        created_at: new Date().toISOString()
      });
      
      toast.success('Review finalized & Notification sent');
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

  const getIntelligenceInsights = () => {
    const students = users.filter(u => u.community_role === 'student');
    const atRisk = students.filter(u => (u.weekly_consistency_score || 0) < 40);
    const topPerformers = [...students].sort((a, b) => (b.current_streak || 0) - (a.current_streak || 0)).slice(0, 3);
    
    // validSubs are already filtered for is_draft=false in fetchAllData
    const todayCount = submissions.filter(s => isToday(new Date(s.submitted_date))).length;
    const yesterdayCount = submissions.filter(s => isYesterday(new Date(s.submitted_date))).length;
    
    const velocity = yesterdayCount === 0 ? todayCount * 100 : ((todayCount - yesterdayCount) / yesterdayCount) * 100;
    
    return {
      atRisk,
      topPerformers,
      todayCount,
      velocity,
      needsAttention: submissions.filter(s => !s.review || s.review.status === 'pending').length
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
    const isStudent = u.community_role !== 'admin';
    const matchesSearch = (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (u.username || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.account_status === statusFilter;
    return isStudent && matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-screen pb-20 relative">
      {/* Mobile Header (Hidden Sidebar Burger) */}
      <div className="lg:hidden flex items-center justify-between mb-4 sticky top-0 z-40 bg-inherit pt-4">
        <h2 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Admin Panel</h2>
        <button
          onClick={() => supabase.auth.signOut()}
          className={`p-2 rounded-xl border transition-all ${
            theme === 'dark' 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
              : 'bg-rose-50 border-rose-100 text-rose-600 shadow-sm'
          }`}
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay (Disabled) */}
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

      {/* Sidebar Navigation (Desktop Only on Mobile it's hidden) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:w-64 space-y-2 p-6 lg:p-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        hidden lg:block
        ${theme === 'dark' ? 'bg-[#0f0c14] lg:bg-transparent' : 'bg-white lg:bg-transparent'}
      `}>
        <div className="flex items-center justify-between lg:hidden mb-10">
          <h2 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Menu</h2>
          <button onClick={() => setIsSidebarOpen(false)} className={theme === 'dark' ? 'text-white/40' : 'text-slate-400'}>
            <X size={24} />
          </button>
        </div>

        <button
          onClick={() => fetchAllData()}
          className={`w-full flex items-center gap-3 px-4 py-4 mb-4 rounded-2xl font-black transition-all border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-violet-400 hover:bg-white/10' : 'bg-violet-50 border-violet-200 text-violet-600 hover:bg-violet-100'}`}
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          <span>Sync Data</span>
        </button>

        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'submissions', label: 'Review Hub', icon: FileText },
          { id: 'invite', label: 'Invite Student', icon: UserCheck },
          { id: 'broadcast', label: 'Broadcast', icon: Send },
          { id: 'moderation', label: 'Moderation', icon: ShieldAlert },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              handleViewChange(item.id as AdminView);
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
            {item.id === 'submissions' && submissions.filter(s => !s.review || s.review.status === 'pending').length > 0 && (
              <span className="ml-auto w-6 h-6 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-black">
                {submissions.filter(s => !s.review || s.review.status === 'pending').length}
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
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className={`text-4xl font-black tracking-tighter italic ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>COCKPIT CORE</h1>
                  <p className={theme === 'dark' ? 'text-violet-200/60' : 'text-slate-500'}>Operational authority of the Mastery Hub.</p>
                </div>
                <button 
                  onClick={initInfrastructure}
                  disabled={initLoading}
                  title="Fix configuration & setup storage buckets"
                  className={`p-4 rounded-2xl border transition-all flex items-center gap-2 group ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-violet-600/20 hover:border-violet-600/40 text-violet-400' : 'bg-white border-slate-200 hover:border-violet-600/40 text-violet-600 shadow-sm'}`}
                >
                  <RefreshCw size={20} className={initLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                  <span className="text-xs font-black uppercase tracking-widest hidden md:inline">Sync Infra</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Students', value: stats?.total_users || 0, icon: Users, color: 'text-violet-400' },
                  { label: 'Active Today', value: stats?.active_students || 0, icon: UserCheck, color: 'text-emerald-400' },
                  { label: 'Avg Persistence', value: (stats?.avg_persistence || 0).toFixed(1) + 'd', icon: TrendingUp, color: 'text-blue-400' },
                  { label: 'Submission Velocity', value: (stats?.submission_velocity >= 0 ? '+' : '') + (stats?.submission_velocity || 0) + '%', icon: Zap, color: 'text-amber-400' },
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
                          {stats?.submission_velocity >= 0 ? '+' : ''}{stats?.submission_velocity || 0}%
                        </span>
                        <span className={`text-xs font-bold mb-2 ${stats?.submission_velocity >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          vs yesterday
                        </span>
                      </div>
                    </div>

                    <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <Target className="text-emerald-400" size={20} />
                        <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Goal Tracking</h4>
                      </div>
                      <div className="flex items-end gap-3">
                        <span className={`text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {stats?.daily_submissions || 0}
                        </span>
                        <span className={`text-xs font-bold mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                          tasks locked today
                        </span>
                      </div>
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
                      onClick={() => handleViewChange('submissions')}
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

              <div className="grid grid-cols-1 md:hidden gap-4">
                {filteredUsers.map((u) => (
                  <StudentMobileCard key={u.id} u={u} theme={theme} getStatusColor={getStatusColor} />
                ))}
              </div>

              <div className={`hidden md:block backdrop-blur-md rounded-3xl border shadow-xl overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
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
                                <div className={`text-[10px] ${theme === 'dark' ? 'text-white/30' : 'text-slate-500'}`}>Email: {u.email}</div>
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
              <div className="flex gap-2 p-1 rounded-2xl bg-white/5 border border-white/10 w-fit">
                <button 
                  onClick={() => setReviewHubTab('pending')}
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${reviewHubTab === 'pending' ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white'}`}
                >
                  Needs Review ({submissions.filter(s => !s.review || s.review.status === 'pending').length})
                </button>
                <button 
                  onClick={() => setReviewHubTab('history')}
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${reviewHubTab === 'history' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                >
                  Audit History
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {(reviewHubTab === 'pending' 
                  ? submissions.filter(s => !s.review || s.review.status === 'pending')
                  : submissions.filter(s => s.review && s.review.status !== 'pending')
                ).map((sub: any) => {
                  const student = sub.student || users.find(u => u.id === sub.user_id);
                  return (
                    <motion.div
                      layout
                      key={sub.id}
                      className={`p-6 rounded-3xl border backdrop-blur-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                        theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          sub.review?.status === 'flagged' ? 'bg-rose-500/10 text-rose-400' :
                          sub.review?.status === 'excellent' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-violet-500/10 text-violet-400'
                        }`}>
                          {sub.review?.status === 'excellent' ? <Star size={24} /> : 
                           sub.review?.status === 'flagged' ? <AlertCircle size={24} /> : <Clock size={24} />}
                        </div>
                        <div className="min-w-0 flex-1 flex items-start gap-4">
                          {(sub.proof_url?.match(/\.(jpeg|jpg|gif|png|webp)$/) || sub.proof_url?.includes('supabase.co/storage/v1/object/public/proofs/')) && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowLightbox(sub.proof_url);
                              }}
                              className="hidden sm:block w-16 h-16 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 cursor-zoom-in hover:border-violet-500/50 transition-all"
                            >
                              <img src={sub.proof_url} alt="Proof thumb" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-black truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{sub.task_completed}</h4>
                            <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                              By <span className="text-violet-400 font-bold">{student?.full_name || student?.username || 'Anonymous Student'}</span> • {format(new Date(sub.submitted_date), 'MMM d, HH:mm')}
                            </p>
                            {sub.review?.admin_notes && (
                              <p className={`text-xs mt-2 p-2 rounded-lg italic border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white/50' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                <MessageSquare size={12} className="inline mr-1" />
                                "{sub.review.admin_notes}"
                              </p>
                            )}
                            {sub.review?.admin?.full_name && (
                              <p className="text-[10px] mt-1 text-violet-400 font-bold uppercase tracking-widest">
                                Reviewed by {sub.review.admin.full_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        {sub.review && (
                          <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${
                            sub.review.status === 'excellent' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                            sub.review.status === 'reviewed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                            'bg-rose-500/10 border-rose-500/20 text-rose-500'
                          }`}>
                            {sub.review.status}
                          </div>
                        )}
                        <div className={`px-4 py-2 rounded-xl text-xs font-bold ${theme === 'dark' ? 'bg-white/5 text-white/60' : 'bg-slate-50 text-slate-500'}`}>
                          {sub.time_spent} mins
                        </div>
                        <button 
                          onClick={() => {
                            setReviewForm({ notes: sub.review?.admin_notes || '', status: sub.review?.status || 'reviewed' });
                            setSelectedSubmission(sub);
                          }}
                          className={`px-6 py-2 rounded-xl text-xs font-black transition-all shadow-lg ${
                            sub.review ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/20'
                          }`}
                        >
                          {sub.review ? 'Update Review' : 'Review Submission'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
                
                {(reviewHubTab === 'pending' 
                  ? submissions.filter(s => !s.review || s.review.status === 'pending')
                  : submissions.filter(s => s.review && s.review.status !== 'pending')
                ).length === 0 && (
                   <div className="py-20 text-center">
                     <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
                     <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Gallery Empty</h3>
                     <p className={`text-sm ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                       {reviewHubTab === 'pending' ? 'No pending submissions.' : 'No audit history yet.'}
                     </p>
                   </div>
                )}
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

          {activeView === 'broadcast' && (
            <motion.div 
              key="broadcast"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <BroadcastForm theme={theme} users={users} />
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
                     <div className="mt-4 space-y-3">
                       <span className="text-[10px] font-black uppercase text-violet-400 tracking-widest block">Artifact Proof</span>
                       {selectedSubmission.proof_url.match(/\.(jpeg|jpg|gif|png|webp)$/) || selectedSubmission.proof_url.includes('supabase.co/storage/v1/object/public/proofs/') ? (
                         <div className="relative group overflow-hidden rounded-2xl border border-white/10 aspect-video bg-black/20">
                           <img 
                             src={selectedSubmission.proof_url} 
                             alt="Proof" 
                             className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                           />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <button 
                               onClick={() => setShowLightbox(selectedSubmission!.proof_url)}
                               className="bg-white text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-xl scale-95 group-hover:scale-100 transition-transform"
                               type="button"
                             >
                               <Maximize2 size={16} />
                               Full View
                             </button>
                           </div>
                         </div>
                       ) : (
                         <a 
                           href={selectedSubmission.proof_url} 
                           target="_blank" 
                           rel="noreferrer"
                           className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                             theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-violet-500/50 text-white' : 'bg-slate-50 border-slate-200 hover:border-violet-300'
                           }`}
                         >
                           <div className="flex items-center gap-2 text-violet-400 font-bold hover:text-violet-300 transition-colors">
                             <ExternalLink size={16} />
                             View Proof Artifact (Link)
                           </div>
                           <Maximize2 size={16} className="opacity-40" />
                         </a>
                       )}
                     </div>
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
                              : theme === 'dark' ? 'bg-white/5 border-white/10 text-white/40 ' + type.color : 'bg-slate-50'
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

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95"
            onClick={() => setShowLightbox(null)}
          >
            <button 
              onClick={() => setShowLightbox(null)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
            >
              <X size={32} />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={showLightbox}
              alt="Full Proof"
              className="max-h-full max-w-full rounded-lg shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
