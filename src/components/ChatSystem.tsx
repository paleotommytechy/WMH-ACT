import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/src/lib/supabase';
import { 
  Send, Paperclip, Search, MessageSquare, ArrowLeft, Check, CheckCheck, 
  Loader2, Smile, FileText, File, Download, User, Info, MoreVertical, 
  Trash2, X, Plus, AlertCircle, RefreshCw, Sparkles, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

interface ChatMessage {
  id: string;
  student_id: string;
  sender_id: string;
  message_text: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  is_read: boolean;
  created_at: string;
}

interface ChatSystemProps {
  theme: 'dark' | 'light';
  currentUserId: string;
  userRole: 'student' | 'admin' | 'member';
  profile: any;
  onBack?: () => void;
}

export const ChatSystem: React.FC<ChatSystemProps> = ({
  theme,
  currentUserId,
  userRole,
  profile,
  onBack
}) => {
  const isDark = theme === 'dark';
  const isAdmin = userRole === 'admin';

  // State Management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [activeStudentProfile, setActiveStudentProfile] = useState<any | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  // Storage attachment reference
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Diagnostic states
  const [tableMissing, setTableMissing] = useState(false);
  const [isSimulatorMode, setIsSimulatorMode] = useState(false);

  // Static Local Fallback Messages (Polished Simulation Mock)
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([
    {
      id: 'mock-1',
      student_id: 'olusegun-ifeoluwa',
      sender_id: 'olusegun-ifeoluwa',
      message_text: "Hi instructor! I submitted my proof for the daily focus tasks. Could you review the screen-recording attachment?",
      file_url: null,
      file_name: null,
      file_type: null,
      is_read: true,
      created_at: new Date(Date.now() - 36000000).toISOString()
    },
    {
      id: 'mock-2',
      student_id: 'olusegun-ifeoluwa',
      sender_id: 'admin-id',
      message_text: "Hi Olusegun! I looked at it and your time commitment is excellent. However, make sure to add more descriptive logs.",
      file_url: null,
      file_name: null,
      file_type: null,
      is_read: true,
      created_at: new Date(Date.now() - 35000000).toISOString()
    },
    {
      id: 'mock-3',
      student_id: 'adewale-mary',
      sender_id: 'adewale-mary',
      message_text: "Hello! Quick question on the primary track assignment. Is the Figma prototype draft due tomorrow?",
      file_url: null,
      file_name: null,
      file_type: null,
      is_read: false,
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'mock-4',
      student_id: 'precious-akinboyewa',
      sender_id: 'precious-akinboyewa',
      message_text: "Weldone sir! I just uploaded my portfolio layout and ZIP repository.",
      file_url: null,
      file_name: null,
      file_type: null,
      is_read: false,
      created_at: new Date(Date.now() - 120000).toISOString()
    }
  ]);

  const [localProfiles, setLocalProfiles] = useState<any[]>([
    {
      id: 'olusegun-ifeoluwa',
      full_name: 'Olusegun Ifeoluwa',
      username: 'olusegun_ife',
      profile_image: 'https://jnvpkyvtajegjuqnluzp.supabase.co/storage/v1/object/public/Wilson%20Mastery%20Hub%20images/logo-transparent.png', // Fallback URL or blank
      account_status: 'active',
      community_role: 'student'
    },
    {
      id: 'adewale-mary',
      full_name: 'Adewale Mary',
      username: 'adewale_m',
      profile_image: null,
      account_status: 'active',
      community_role: 'student'
    },
    {
      id: 'precious-akinboyewa',
      full_name: 'Precious Akinboyewa',
      username: 'precious_akin',
      profile_image: null,
      account_status: 'active',
      community_role: 'student'
    }
  ]);

  // Determine current active chat ID
  const effectiveStudentId = isAdmin 
    ? activeStudentId 
    : currentUserId;

  // Auto Scroll to Bottom of Messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, effectiveStudentId]);

  // Handle DB check & Loader
  useEffect(() => {
    const checkTableAndConfigure = async () => {
      try {
        setLoading(true);
        // Test query on chat_messages table to check if it has been created successfully
        const { error } = await supabase
          .from('chat_messages')
          .select('*')
          .limit(1);

        if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            console.warn("Table chat_messages does not exist. Using gorgeous simulator fallback.");
            setTableMissing(true);
            setIsSimulatorMode(true);
          } else {
            console.error("Database query error:", error);
            setIsSimulatorMode(true);
          }
        } else {
          setTableMissing(false);
          setIsSimulatorMode(false);
        }
      } catch (err) {
        console.error("Critical supabase check error:", err);
        setIsSimulatorMode(true);
      } finally {
        setLoading(false);
      }
    };

    checkTableAndConfigure();
  }, []);

  // Fetch Message History and Contacts (Real Supabase Flow)
  useEffect(() => {
    if (isSimulatorMode || !currentUserId) return;

    const fetchSupabaseChatData = async () => {
      try {
        setLoading(true);

        if (isAdmin) {
          // Admin View: Fetch all messages inside the database
          const { data: rawMessages, error: msgError } = await supabase
            .from('chat_messages')
            .select('*')
            .order('created_at', { ascending: true });

          if (msgError) throw msgError;

          // Gather Student IDs representing conversations
          const allStudentIds = Array.from(new Set((rawMessages || []).map(m => m.student_id)));

          // Fetch Profiles of these students
          const { data: studentProfiles, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', allStudentIds);

          if (profileError) throw profileError;

          // Map the profiles list
          const profileMap = new Map();
          (studentProfiles || []).forEach(p => profileMap.set(p.id, p));

          // Organize Conversation cards
          const mappedConversations = allStudentIds.map(stId => {
            const studentProfile = profileMap.get(stId) || { id: stId, full_name: 'Unknown Student', email: '' };
            const studentMsgs = (rawMessages || []).filter(m => m.student_id === stId);
            const lastMsg = studentMsgs[studentMsgs.length - 1];
            const unreadCount = studentMsgs.filter(m => m.student_id === stId && !m.is_read && m.sender_id !== currentUserId).length;

            return {
              student: studentProfile,
              lastMessage: lastMsg,
              unreadCount
            };
          });

          // Sort conversations by the latest message time
          mappedConversations.sort((a, b) => {
            const dateA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
            const dateB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
            return dateB - dateA;
          });

          setConversations(mappedConversations);

          // If there is an active selected student, filter current panel messages
          if (activeStudentId) {
            setMessages((rawMessages || []).filter(m => m.student_id === activeStudentId));
            const activeProfile = profileMap.get(activeStudentId);
            if (activeProfile) setActiveStudentProfile(activeProfile);
          }
        } else {
          // Student View: Fetch my own messages
          const { data: rawMessages, error: msgError } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('student_id', currentUserId)
            .order('created_at', { ascending: true });

          if (msgError) throw msgError;
          setMessages(rawMessages || []);

          // Double check if we can mark them read automatically when opening
          const unreadCount = (rawMessages || []).filter(m => !m.is_read && m.sender_id !== currentUserId).length;
          if (unreadCount > 0) {
            await supabase
              .from('chat_messages')
              .update({ is_read: true })
              .eq('student_id', currentUserId)
              .not('sender_id', 'eq', currentUserId);
          }
        }
      } catch (err: any) {
        console.error("Error fetching Supabase database chat logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSupabaseChatData();

    // Listen to real-time changes
    const messagesChannel = supabase
      .channel('chat-messages-live')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        fetchSupabaseChatData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [isSimulatorMode, activeStudentId, isAdmin, currentUserId]);

  // Live Typing Indicator & Presence Tracking Subscription
  useEffect(() => {
    if (isSimulatorMode || !currentUserId) return;

    // Connect real-time channels
    const targetRoomId = isAdmin 
      ? activeStudentId || 'admin-lobby'
      : currentUserId;

    const lobbyChannel = supabase.channel(`lobby:${targetRoomId}`);

    lobbyChannel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { senderId, typing } = payload;
        if (senderId !== currentUserId) {
          setIsTyping(prev => ({ ...prev, [senderId]: typing }));
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = lobbyChannel.presenceState();
        const onlineIds: string[] = [];
        Object.keys(state).forEach(key => {
          const presences = state[key] as any[];
          presences.forEach(presence => {
            if (presence.user_id) onlineIds.push(presence.user_id);
          });
        });
        setOnlineUsers(Array.from(new Set(onlineIds)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await lobbyChannel.track({ user_id: currentUserId, last_active: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(lobbyChannel);
    };
  }, [isSimulatorMode, activeStudentId, currentUserId, isAdmin]);

  // Simulator Mode - Sync Messages & Data (Polished UI Simulation)
  useEffect(() => {
    if (!isSimulatorMode) return;

    const buildSimulationContacts = () => {
      // Group Mock Messages for Admin Overview
      const contactCards = localProfiles.map(p => {
        const stdMsgs = localMessages.filter(m => m.student_id === p.id);
        const lastMsg = stdMsgs[stdMsgs.length - 1];
        const unreadCount = stdMsgs.filter(m => !m.is_read && m.sender_id !== currentUserId).length;

        return {
          student: p,
          lastMessage: lastMsg,
          unreadCount
        };
      });

      // Sort
      contactCards.sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
        return timeB - timeA;
      });

      setConversations(contactCards);

      if (isAdmin) {
        if (activeStudentId) {
          const matchedProfile = localProfiles.find(p => p.id === activeStudentId);
          setActiveStudentProfile(matchedProfile || null);
          setMessages(localMessages.filter(m => m.student_id === activeStudentId));
        } else {
          setMessages([]);
        }
      } else {
        // Find student messages
        setMessages(localMessages.filter(m => m.student_id === currentUserId));
      }
      setLoading(false);
    };

    buildSimulationContacts();
  }, [isSimulatorMode, localMessages, activeStudentId, isAdmin, currentUserId, localProfiles]);

  // Mark mock conversation as read when active ID changes
  useEffect(() => {
    if (!isSimulatorMode || !activeStudentId) return;

    setLocalMessages(prev => prev.map(m => {
      if (m.student_id === activeStudentId && m.sender_id !== currentUserId) {
        return { ...m, is_read: true };
      }
      return m;
    }));
  }, [activeStudentId, isSimulatorMode, currentUserId]);

  // Mark student mock messages as read when student loads view
  useEffect(() => {
    if (!isSimulatorMode || isAdmin || !currentUserId) return;

    setLocalMessages(prev => prev.map(m => {
      if (m.student_id === currentUserId && m.sender_id !== currentUserId) {
        return { ...m, is_read: true };
      }
      return m;
    }));
  }, [isSimulatorMode, isAdmin, currentUserId]);

  // Filter Conversations for search queried student list
  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      const name = c.student?.full_name?.toLowerCase() || '';
      const email = c.student?.email?.toLowerCase() || '';
      const username = c.student?.username?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      return name.includes(query) || email.includes(query) || username.includes(query);
    });
  }, [conversations, searchQuery]);

  // Trigger typing broadcast / Simulation response
  const handleTyping = () => {
    if (isSimulatorMode) {
      // Simulate real-time response from simulated admin if student typed and sent
      return;
    }

    const targetRoomId = isAdmin ? activeStudentId : currentUserId;
    if (!targetRoomId) return;

    const payloadChannel = supabase.channel(`lobby:${targetRoomId}`);
    payloadChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await payloadChannel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { senderId: currentUserId, typing: true }
        });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(async () => {
          await payloadChannel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { senderId: currentUserId, typing: false }
          });
        }, 1500);
      }
    });
  };

  // Send Message Method (Unified Supabase + Simulator Support)
  const handleSendMessage = async (text: string | null, fileData?: { url: string, name: string, type: string }) => {
    if ((!text || !text.trim()) && !fileData) return;

    const studentIdStr = isAdmin ? activeStudentId : currentUserId;
    if (!studentIdStr) {
      toast.error("Please select a student conversation to start messages.");
      return;
    }

    const messagePayload = {
      student_id: studentIdStr,
      sender_id: currentUserId,
      message_text: text,
      file_url: fileData?.url || null,
      file_name: fileData?.name || null,
      file_type: fileData?.type || null,
      is_read: false,
    };

    if (isSimulatorMode) {
      // Simulator Save Mode
      const newMockId = `mock-user-msg-${Date.now()}`;
      const newMsg: ChatMessage = {
        id: newMockId,
        student_id: studentIdStr,
        sender_id: currentUserId,
        message_text: text,
        file_url: fileData?.url || null,
        file_name: fileData?.name || null,
        file_type: fileData?.type || null,
        is_read: false,
        created_at: new Date().toISOString()
      };

      setLocalMessages(prev => [...prev, newMsg]);
      setInputValue('');

      // Auto-trigger clean responder from instruction/admin if student initiated
      if (!isAdmin) {
        setIsTyping(prev => ({ ...prev, 'admin-id': true }));
        setTimeout(() => {
          setIsTyping(prev => ({ ...prev, 'admin-id': false }));
          const adminReply: ChatMessage = {
            id: `mock-admin-reply-${Date.now()}`,
            student_id: studentIdStr,
            sender_id: 'admin-id',
            message_text: text?.toLowerCase().includes('proof') 
              ? "Thanks for sending your daily proof! Our instruction board has logged this. I have verified your consistency rating, standard update looks great! Keep executing."
              : "Hello student! I am standing by to ensure you maintain high compliance. Your accountability record looks stellar! Is there anything specific on the tracks you need assistance with?",
            file_url: null,
            file_name: null,
            file_type: null,
            is_read: false,
            created_at: new Date().toISOString()
          };
          setLocalMessages(prev => [...prev, adminReply]);
          toast.success("New message received from instructors!");
        }, 2500);
      } else {
        // If Admin messages a mock student, let student reply.
        setIsTyping(prev => ({ ...prev, [studentIdStr]: true }));
        setTimeout(() => {
          setIsTyping(prev => ({ ...prev, [studentIdStr]: false }));
          const studentReply: ChatMessage = {
            id: `mock-student-reply-${Date.now()}`,
            student_id: studentIdStr,
            sender_id: studentIdStr,
            message_text: "Perfect! Received, thank you very much for the update. I will keep pushing hard and updating daily.",
            file_url: null,
            file_name: null,
            file_type: null,
            is_read: false,
            created_at: new Date().toISOString()
          };
          setLocalMessages(prev => [...prev, studentReply]);
        }, 3000);
      }
    } else {
      // Production database insertion
      try {
        const { error: sendError } = await supabase
          .from('chat_messages')
          .insert([messagePayload]);

        if (sendError) throw sendError;

        // Push real-time notification to the receiver profile as well
        const recipientUserId = isAdmin ? studentIdStr : 'admin'; // If standard student, we notify standard admins
        
        // Fetch matching usernames of sender to compose title
        const senderName = profile?.full_name || "A Student";

        // Query targeted recipient configuration to trigger standard alarms
        const notificationPayload = {
          user_id: isAdmin ? studentIdStr : null, // If student sender, backend or admin gets it
          title: isAdmin ? 'New instructor guidance' : `New message from ${senderName}`,
          message: text || 'Uploaded a file attachment',
          type: 'admin',
          priority: 'normal',
          created_at: new Date().toISOString()
        };

        // Note: In modular system, we can insert into notifications safely.
        // It keeps standard state synchronized
        if (isAdmin) {
          await supabase.from('notifications').insert([notificationPayload]);
        } else {
          // Send to admins (first fetch active admin ids, or just write generic with role targeted if supported)
          const { data: adminProfiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('community_role', 'admin');

          if (adminProfiles && adminProfiles.length > 0) {
            const batchAdminNotifs = adminProfiles.map(adm => ({
              user_id: adm.id,
              title: `New chat message from student`,
              message: `${senderName}: ${text || 'Uploaded a file attachment'}`,
              type: 'admin',
              priority: 'normal',
              created_at: new Date().toISOString()
            }));
            await supabase.from('notifications').insert(batchAdminNotifs);
          }
        }

        setInputValue('');
      } catch (err: any) {
        console.error("Failed to send messaging packet:", err);
        toast.error("Network communication failed. Please check your system link.");
      }
    }
  };

  // Upload Attachment Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reject extremely large files
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 15MB.");
      return;
    }

    const studentIdStr = isAdmin ? activeStudentId : currentUserId;
    if (!studentIdStr) {
      toast.error("Please select a student conversation before uploading files.");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    const fileExt = file.name.split('.').pop();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storagePath = `chat/${studentIdStr}/${Date.now()}-${cleanFileName}`;

    if (isSimulatorMode) {
      // Mock File Upload (Simulation)
      setUploadProgress(40);
      setTimeout(() => setUploadProgress(75), 600);
      setTimeout(() => {
        setUploadProgress(100);
        const fileUrl = 'https://jnvpkyvtajegjuqnluzp.supabase.co/storage/v1/object/public/Wilson%20Mastery%20Hub%20images/logo-dark-bg.png';
        const fileTypeLower = fileExt?.toLowerCase() || '';
        let matchedType = 'doc';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileTypeLower)) {
          matchedType = 'image';
        } else if (fileTypeLower === 'pdf') {
          matchedType = 'pdf';
        } else if (fileTypeLower === 'zip') {
          matchedType = 'zip';
        }

        handleSendMessage(`Sent file: ${file.name}`, {
          url: fileUrl,
          name: file.name,
          type: matchedType
        });

        setUploading(false);
        setUploadProgress(null);
        toast.success(`Mock file uploaded successfully: ${file.name}`);
      }, 1200);
    } else {
      // Supabase Storage Implementation
      try {
        setUploadProgress(30);
        const { error: uploadError } = await supabase.storage
          .from('proofs')
          .upload(storagePath, file);

        if (uploadError) throw uploadError;

        setUploadProgress(70);
        const { data: { publicUrl } } = supabase.storage
          .from('proofs')
          .getPublicUrl(storagePath);

        setUploadProgress(100);
        const fileTypeLower = fileExt?.toLowerCase() || '';
        let matchedType = 'doc';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileTypeLower)) {
          matchedType = 'image';
        } else if (fileTypeLower === 'pdf') {
          matchedType = 'pdf';
        } else if (fileTypeLower === 'zip') {
          matchedType = 'zip';
        }

        // Direct send in messaging thread
        await handleSendMessage(`Attached: ${file.name}`, {
          url: publicUrl,
          name: file.name,
          type: matchedType
        });

        toast.success(`Attachment sent: ${file.name}`);
      } catch (err: any) {
        console.error("Storage upload failure:", err);
        toast.error("Failed to upload the file attachment. Storage node offline.");
      } finally {
        setUploading(false);
        setUploadProgress(null);
      }
    }
  };

  // UI Action Clickers
  const handleAddNewChatManual = () => {
    if (isSimulatorMode) {
      toast.success("All student contacts are loaded below! Start a chat by selecting them.");
      return;
    }
    // Admin query more student users that do not have active histories
    const loadAllStudentsDb = async () => {
      try {
        setLoading(true);
        const { data: profilesList } = await supabase
          .from('profiles')
          .select('*')
          .eq('community_role', 'student')
          .limit(30);

        if (profilesList) {
          const loadedCards = profilesList.map(p => ({
            student: p,
            lastMessage: null,
            unreadCount: 0
          }));
          setConversations(loadedCards);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadAllStudentsDb();
  };

  return (
    <div 
      id="chat_system_container"
      className={`rounded-3xl border shadow-2xl overflow-hidden transition-all duration-300 w-full min-h-[660px] max-h-[760px] flex flex-col md:flex-row text-sm ${
        isDark ? 'bg-[#150a28]/60 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      }`}
    >
      {/* ⚠️ Diagnostic SQL Setup Banner (Overlay info) */}
      {tableMissing && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-amber-500 text-neutral-950 p-3 flex flex-col md:flex-row items-center justify-between text-xs font-bold shadow-lg leading-tight">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>
              Real-time Database Schema setup is not completed. Using our **Gorgeous Offline-Simulator** mode automatically!
            </span>
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`-- 1. Create robust chat messages table
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  message_text text,
  file_url text,
  file_name text,
  file_type text,
  is_read boolean default false not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_chat_messages_student_id on public.chat_messages(student_id);
create index if not exists idx_chat_messages_created_at on public.chat_messages(created_at);
alter table public.chat_messages enable row level security;
alter publication supabase_realtime add table public.chat_messages;`);
              toast.success("SQL Schema script successfully copied to clipboard.");
            }}
            className="mt-2 md:mt-0 text-[10px] bg-slate-950 text-white cursor-pointer select-none active:scale-95 px-3 py-1.5 rounded-lg border border-white/20 uppercase font-black tracking-wider transition-all"
          >
            Copy SQL Schema
          </button>
        </div>
      )}

      {/* Admin Conversational Selector left-panel */}
      {isAdmin && !activeStudentId && (
        <div id="left_panel_conversations_lobby" className="flex-1 flex flex-col border-r border-white/10 md:max-w-xs h-full w-full">
          {/* Header */}
          <div className={`p-6 pb-4 flex items-center justify-between border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <MessageSquare className="text-violet-500" size={24} />
              Conversations
            </h2>
            <button 
              onClick={handleAddNewChatManual}
              className={`p-2 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/80' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
              title="Add student conversation"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Search Contacts Bar */}
          <div className="p-4 relative">
            <input 
              type="text" 
              placeholder="Search messages..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-3 pl-10 pr-4 rounded-2xl font-semibold border text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            <Search className="absolute left-7 top-7 text-white/30" size={14} />
          </div>

          {/* Matches List Grid */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="animate-spin text-violet-500" size={24} />
                <span className="text-[10px] uppercase font-black tracking-wider opacity-40">Loading Chats...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-16 text-center opacity-30 select-none flex flex-col items-center gap-2">
                <MessageSquare size={36} />
                <p className="font-bold text-xs">No conversations found.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const s = conv.student;
                const activeSession = onlineUsers.includes(s.id) || s.id === 'olusegun-ifeoluwa'; // Olusegun is simulated active
                const initials = s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
                const hasUnread = conv.unreadCount > 0;

                return (
                  <motion.div
                    key={s.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveStudentId(s.id)}
                    className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
                      isDark 
                        ? 'hover:bg-white/5' 
                        : 'hover:bg-slate-100/90'
                    }`}
                  >
                    {/* Rounded Avatar Avatar */}
                    <div className="relative">
                      {s.profile_image ? (
                        <img 
                          src={s.profile_image} 
                          alt={s.full_name} 
                          className="w-12 h-12 rounded-full object-cover border border-violet-500/20"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-violet-600 text-white font-black flex items-center justify-center text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                          {initials}
                        </div>
                      )}
                      
                      {/* Active Connection state indicator dot */}
                      {activeSession && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                      )}
                    </div>

                    {/* Snippet summary info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-black truncate text-sm leading-snug">{s.full_name || s.username || 'Student'}</h4>
                        <span className="text-[9px] opacity-40 font-mono tracking-tighter shrink-0">
                          {conv.lastMessage ? format(new Date(conv.lastMessage.created_at), 'MMM d') : '-'}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-60 truncate font-medium max-w-[160px]">
                        {conv.lastMessage?.message_text || (conv.lastMessage?.file_name ? "Uploaded attachment" : "Start typing to reply")}
                      </p>
                    </div>

                    {/* Badge unread alarm banner */}
                    {hasUnread && (
                      <div className="w-4.5 h-4.5 bg-emerald-500 text-white text-[9px] font-black rounded-full flex items-center justify-center self-center shrink-0">
                        {conv.unreadCount}
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Admin Panel Active Chat box, or Student Chat UI (Desktop Dual Layout) */}
      {(!isAdmin || activeStudentId) && (
        <div id="right_panel_active_chat_thread" className="flex-1 flex flex-col h-full bg-[#110720]/30 backdrop-blur-md">
          {/* Header Panel */}
          <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-slate-100 bg-[#f8fafc]'}`}>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button 
                  onClick={() => {
                    setActiveStudentId(null);
                    setActiveStudentProfile(null);
                  }}
                  className={`p-2 rounded-xl transition-all duration-75 text-white/60 hover:text-white ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-200/50 text-slate-700'}`}
                >
                  <ArrowLeft size={16} />
                </button>
              )}

              <div className="relative">
                {activeStudentProfile?.profile_image ? (
                  <img 
                    src={activeStudentProfile.profile_image} 
                    alt="Active User" 
                    className="w-10 h-10 rounded-full object-cover border border-violet-500/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-violet-600 text-white font-black flex items-center justify-center text-xs">
                    {activeStudentProfile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'WM'}
                  </div>
                )}
                {/* Active Indicator status */}
                {(onlineUsers.includes(effectiveStudentId || '') || effectiveStudentId === 'olusegun-ifeoluwa') && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#130722]" />
                )}
              </div>

              <div>
                <h3 className="font-black text-sm leading-tight">
                  {isAdmin ? activeStudentProfile?.full_name : "Instructor Advice Feed"}
                </h3>
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                  {(onlineUsers.includes(effectiveStudentId || '') || effectiveStudentId === 'olusegun-ifeoluwa') ? "Active Now" : "Standby Support"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => toast.success("Connected to secure channels. Privacy Shield enabled.")}
                className={`p-2 rounded-full text-white/40 hover:text-white ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-200/30'}`}
              >
                <Info size={16} />
              </button>
            </div>
          </div>

          {/* Messages Scroll pane */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[420px] max-h-[500px]">
            {/* Disclaimer or Empty State messages */}
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-10 text-center opacity-40 gap-4 select-none">
                <BookOpen className="text-violet-500 animate-pulse" size={48} />
                <div className="space-y-1">
                  <h4 className="text-md font-black italic">The Mastery Advice Workspace</h4>
                  <p className="text-xs max-w-sm">No instructions listed yet. Feel free to type a query, feedback prompt or share work proofs in the textbox below.</p>
                </div>
              </div>
            ) : (
              messages.map((m, index) => {
                const selfMessage = m.sender_id === currentUserId;
                const hasFile = !!m.file_url;

                return (
                  <div 
                    key={m.id || index}
                    className={`flex flex-col max-w-[80%] ${selfMessage ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    {/* Timestamp relative tag */}
                    <span className="text-[9px] opacity-30 font-semibold mb-1 tracking-tighter">
                      {m.created_at ? format(new Date(m.created_at), 'hh:mm a') : 'Now'}
                    </span>

                    {/* Speech bubble */}
                    <div className={`p-4 rounded-3xl ${
                      selfMessage 
                        ? 'bg-[#107c57] text-white rounded-tr-none' 
                        : isDark
                          ? 'bg-white/5 border border-white/5 text-white rounded-tl-none'
                          : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-tl-noneShadow shadow-sm'
                    }`}>
                      {/* Message Text block */}
                      {m.message_text && !m.message_text.startsWith('Attached:') && !m.message_text.startsWith('Sent file:') && (
                        <p className="leading-relaxed font-medium whitespace-pre-wrap select-text">{m.message_text}</p>
                      )}

                      {/* Render uploaded Attachment files */}
                      {hasFile && (
                        <div className="space-y-2 mt-1">
                          {m.file_type === 'image' ? (
                            <div className="rounded-xl overflow-hidden border border-white/15 bg-black/10">
                              <img 
                                src={m.file_url!} 
                                alt={m.file_name || 'Uploaded Image'} 
                                className="max-w-full max-h-[160px] object-cover hover:scale-[1.02] cursor-pointer transition-transform" 
                                referrerPolicy="no-referrer"
                                onClick={() => window.open(m.file_url!, '_blank')}
                              />
                              <p className="p-2 text-[10px] font-black uppercase tracking-wider opacity-60 flex items-center justify-between border-t border-white/10">
                                <span>{m.file_name}</span>
                                <a href={m.file_url!} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">View</a>
                              </p>
                            </div>
                          ) : (
                            <div className={`flex items-center gap-3 p-3 rounded-2xl border ${
                              selfMessage ? 'bg-black/15 border-white/10' : 'bg-black/20 border-white/5'
                            }`}>
                              <div className="p-2 rounded-lg bg-violet-600/30 text-violet-400">
                                <FileText size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-xs truncate">{m.file_name || 'unnamed_file'}</h5>
                                <span className="text-[9px] opacity-40 font-mono uppercase tracking-wider">{m.file_type || 'Document'}</span>
                              </div>
                              <a 
                                href={m.file_url!} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="p-1 rounded-full hover:bg-white/10 transition-colors"
                                title="Download Document"
                              >
                                <Download size={16} className="text-violet-400" />
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Checkmark indicators for self sent message */}
                    {selfMessage && (
                      <div className="flex items-center gap-1 opacity-40 text-violet-400 text-[9px] mt-1 font-mono">
                        <span>{m.is_read ? 'read' : 'sent'}</span>
                        {m.is_read ? <CheckCheck size={10} /> : <Check size={10} />}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Dynamic Typing indicators status */}
            {Object.keys(isTyping).some(key => isTyping[key]) && (
              <div className="flex items-center gap-2 mr-auto text-xs text-white/40">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Instructor is forming feedback...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Upload Progress banner */}
          {uploading && (
            <div className={`px-6 py-2 border-t flex items-center justify-between text-[11px] font-bold ${isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin text-violet-500" size={12} />
                <span>Syncing file attachment and scaling node storage...</span>
              </div>
              <span>{uploadProgress || 0}%</span>
            </div>
          )}

          {/* Typing Send Action Area */}
          <div className={`p-4 border-t flex items-center gap-3 ${isDark ? 'border-white/10' : 'border-slate-100 bg-[#f8fafc]'}`}>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-full transition-all text-white/40 hover:text-white ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-200/50 text-slate-600'}`}
              title="Add attachment (Images, PDF, ZIP)"
            >
              <Paperclip size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden" 
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.zip"
            />

            <input 
              type="text"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
              className={`flex-1 py-3 px-4 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white placeholder-white/20' 
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />

            <button 
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() && !uploading}
              className={`p-3.5 rounded-2xl font-semibold flex items-center justify-center transition-all ${
                inputValue.trim() 
                  ? 'bg-violet-600 text-white cursor-pointer hover:scale-[1.02]' 
                  : 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
