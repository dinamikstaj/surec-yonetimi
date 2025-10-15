'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Sidebar from '@/components/sidebar';
import { toast } from 'sonner';
import io from 'socket.io-client';
import { getApiBaseUrl, getApiUrl } from '@/lib/utils';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Paperclip,
  X,
  Check,
  CheckCheck,
  Loader2,
  Clock,
  Circle,
  Shield,
  Wrench,
  User as UserIcon
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  lastSeen?: string;
  isOnline?: boolean;
  statusMessage?: string;
  notificationSound?: string;
}

interface Message {
  _id?: string;
  sender: string | User;
  content: string;
  type: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  read: boolean;
  createdAt: string;
  isDeleted?: boolean;
}

interface Chat {
  _id: string;
  participants: User[];
  messages: Message[];
  lastMessage?: string;
  lastMessageTime: string;
  unreadCount?: { [key: string]: number };
}

export default function AdminChatPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [userChats, setUserChats] = useState<Chat[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const [currentUserSound, setCurrentUserSound] = useState<string>('hamzaaa');

  // Bildirim sesleri - Gerçek ses dosyaları
  const playNotificationSound = (soundType: string = 'hamzaaa') => {
    try {
      const soundFile = `/sounds/${soundType}.mp3`;
      console.log('🔊 Playing notification sound:', soundFile);
      
      const audio = new Audio(soundFile);
      audio.volume = 0.7; // Ses seviyesi artırıldı
      audio.preload = 'auto'; // Ses dosyasını önceden yükle
      
      // Ses yükleme durumunu kontrol et
      audio.addEventListener('loadstart', () => console.log('📥 Audio loading started'));
      audio.addEventListener('canplay', () => console.log('✅ Audio can play'));
      audio.addEventListener('error', (e) => console.error('❌ Audio error:', e));
      audio.addEventListener('ended', () => console.log('🏁 Audio ended'));
      
      // Audio permission için user interaction simulation
      const playWithPermission = () => {
        audio.play().then(() => {
          console.log('🎵 Audio playing successfully');
        }).catch(error => {
          console.error('❌ Audio play failed:', error);
        });
      };
      
      // İlk kez permission al
      if (!(window as any).audioPermissionGranted) {
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
        silentAudio.volume = 0;
        silentAudio.play().then(() => {
          (window as any).audioPermissionGranted = true;
          playWithPermission();
        }).catch(() => {
          const clickEvent = new MouseEvent('click', { bubbles: true });
          document.dispatchEvent(clickEvent);
          (window as any).audioPermissionGranted = true;
          playWithPermission();
        });
      } else {
        playWithPermission();
      }
    } catch (error) {
      console.error('❌ Notification sound error:', error);
    }
  };

  // Test fonksiyonu - manuel ses çalma
  const testNotificationSound = () => {
    console.log('🧪 Testing notification sound...');
    playNotificationSound('hamzaaa');
  };

  // ========================
  // AUDIO PERMISSION
  // ========================
  useEffect(() => {
    // Sayfa yüklendiğinde ses izni al
    const requestAudioPermission = async () => {
      try {
        const audio = new Audio('/sounds/hamzaaa.mp3');
        audio.volume = 0;
        await audio.play();
        audio.pause();
        console.log('✅ Audio permission granted');
      } catch (error) {
        console.log('⚠️ Audio permission needed - user interaction required');
      }
    };
    
    requestAudioPermission();
  }, []);

  // Kullanıcının kendi bildirim sesi
  useEffect(() => {
    const fetchMe = async () => {
      try {
    if (!currentUserId) return;
        const res = await fetch(`${getApiBaseUrl()}/users/${currentUserId}`);
        if (res.ok) {
          const me = await res.json();
          if (me?.notificationSound) setCurrentUserSound(me.notificationSound);
        }
      } catch {}
    };
    fetchMe();
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    const backendUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.hostname}:5000`
      : 'http://localhost:5000';
    
    if (socketRef.current) socketRef.current.disconnect();
    
    socketRef.current = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected');
      socketRef.current.emit('join_user', currentUserId);
    });

    // Dürt bildirimi - hedef kullanıcı ise ses çal ve toast göster
    socketRef.current.on('nudge_notification', (data: any) => {
      try {
        if (!data || !data.userId) return;
        if (data.userId !== currentUserId) return; // Yalnızca hedef kullanıcıda

        console.log('⚡ Nudge received (admin chat):', data);

        // Backend'den gelen hedef kullanıcının sesini çal
        const soundToPlay = data.targetUserSound || currentUserSound || 'hamzaaa';
        playNotificationSound(soundToPlay);

        toast.warning(
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>!</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Dürtüldün!</p>
              <p className="text-sm text-muted-foreground truncate">{data.message || 'Yönetici sizi dürtüyor!'}</p>
            </div>
          </div>,
          {
            duration: 4000,
            position: 'bottom-right',
          }
        );
      } catch (error) {
        console.error('Nudge handle error (admin):', error);
      }
    });

    socketRef.current.on('new_message', (data: any) => {
      if (!data?.message?._id || !data?.chatId) return;
      
      setCurrentChat(prev => {
        if (!prev || prev._id !== data.chatId) return prev;
        const exists = prev.messages.some(msg => msg._id === data.message._id);
        if (exists) return prev;
        
        const senderName = typeof data.message.sender === 'string' 
          ? 'Bilinmeyen' 
          : data.message.sender.name || 'Bilinmeyen';
        
        // Chat mesajlarında ses çalma - sadece dürt bildiriminde çalacak
        
        const messagePreview = data.message.content.length > 50 
          ? data.message.content.substring(0, 50) + '...' 
          : data.message.content;
        
        toast.success(
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              {data.message.sender?.avatar && <AvatarImage src={`${getApiUrl()}${data.message.sender.avatar}`} />}
              <AvatarFallback>{senderName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{senderName}</p>
              <p className="text-sm text-muted-foreground truncate">{messagePreview}</p>
            </div>
          </div>,
          { duration: 4000, position: 'bottom-right' }
        );
        
        fetchChats();
        
        return {
          ...prev,
          messages: [...prev.messages, data.message]
        };
      });
    });

     socketRef.current.on('message_deleted', (data: any) => {
         setCurrentChat(prev => {
        if (!prev || prev._id !== data.chatId) return prev;
           return {
             ...prev,
             messages: prev.messages.filter(msg => msg._id !== data.messageId)
           };
         });
     });

     socketRef.current.on('typing_start', (data: any) => {
       if (data.chatId === currentChat?._id && data.userId !== currentUserId) {
         setIsTyping(true);
       }
     });

     socketRef.current.on('typing_stop', (data: any) => {
      if (data.chatId === currentChat?._id) {
         setIsTyping(false);
       }
     });

     socketRef.current.on('user_status_changed', (data: any) => {
       setUsers(prev => prev.map(user => 
         user._id === data.userId 
           ? { ...user, isOnline: data.isOnline, lastSeen: data.lastSeen }
           : user
       ));
      
      if (selectedUser?._id === data.userId) {
        setSelectedUser(prev => prev ? { ...prev, isOnline: data.isOnline, lastSeen: data.lastSeen } : null);
      }
     });

     socketRef.current.on('messages_read', (data: any) => {
       if (data.chatId === currentChat?._id) {
         setCurrentChat(prev => {
           if (!prev) return prev;
           return {
             ...prev,
             messages: prev.messages.map(msg => {
              const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender._id;
              if (senderId === currentUserId) {
                return { ...msg, status: 'read' };
               }
               return msg;
             })
           };
         });
       }
     });
    
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [currentUserId, currentChat?._id]);

  useEffect(() => {
    if (currentUserId) {
      fetchUsers();
      fetchChats();
      
      const refreshInterval = setInterval(() => {
        fetchUsers();
        fetchChats();
      }, 10000);
      
      return () => clearInterval(refreshInterval);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId || !socketRef.current) return;

    const heartbeatInterval = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('heartbeat', currentUserId);
      }
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  }, [currentUserId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentUserId) {
        fetchUsers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUserId]);

  useEffect(() => {
      scrollToBottom();
  }, [currentChat?.messages]);

  useEffect(() => {
    if (currentChat?._id && currentUserId) {
      const hasUnreadMessages = currentChat.messages.some(msg => {
        const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender._id;
        return senderId !== currentUserId && msg.status !== 'read';
      });
      
      if (hasUnreadMessages) {
        const timer = setTimeout(() => {
          markMessagesAsRead(currentChat._id);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [currentChat?.messages, currentChat?._id, currentUserId]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/chat/all-users?excludeUserId=${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Users fetch error:', error);
    }
  };

  const fetchChats = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/chat/user/${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        setUserChats(data);
      }
    } catch (error) {
      console.error('Chats fetch error:', error);
    }
  };

  const getUnreadCount = (userId: string): number => {
    const chat = userChats.find(c => 
      c.participants.some(p => p._id === userId)
    );
    if (!chat || !chat.unreadCount || !currentUserId) return 0;
    return chat.unreadCount[currentUserId] || 0;
  };

  const handleSelectUser = async (user: User) => {
    setSelectedUser(user);
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/chat/get-or-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId1: currentUserId, userId2: user._id }),
      });
      
      if (response.ok) {
        const chat = await response.json();
        setCurrentChat(chat);
        await markMessagesAsRead(chat._id);
        fetchChats();
      }
    } catch (error) {
      console.error('Chat fetch error:', error);
      toast.error('Sohbet yüklenemedi');
    }
  };

  const markMessagesAsRead = async (chatId: string) => {
    try {
      await fetch(`${getApiBaseUrl()}/chat/${chatId}/read/${currentUserId}`, {
        method: 'PUT'
      });
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  const handleTyping = () => {
    if (!currentChat || !socketRef.current) return;
    
    socketRef.current.emit('typing_start', {
      chatId: currentChat._id,
      userId: currentUserId,
      userName: 'Admin'
    });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('typing_stop', {
          chatId: currentChat._id,
          userId: currentUserId
        });
      }
    }, 2000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dosya boyutu 10MB\'dan küçük olmalıdır');
      return;
    }
    
    setSelectedFile(file);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
    
    toast.loading('Dosya yükleniyor...');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${getApiBaseUrl()}/chat/upload`, {
        method: 'POST',
        body: formData,
      });
      
      toast.dismiss();
      
      if (response.ok) {
        const result = await response.json();
        toast.success('Dosya yüklendi! Göndermek için Enter tuşuna basın.');
        (setSelectedFile as any).uploadedData = result;
      } else {
        toast.error('Dosya yüklenemedi');
        setSelectedFile(null);
        setFilePreview(null);
      }
    } catch (error) {
      toast.dismiss();
      console.error('File upload error:', error);
      toast.error('Dosya yükleme hatası');
    setSelectedFile(null);
    setFilePreview(null);
    }
  };

  const handleSendMessage = async (fileData?: any) => {
    const uploadedData = fileData || (setSelectedFile as any).uploadedData;
    
    if ((!message.trim() && !uploadedData && !selectedFile) || !currentChat || !currentUserId || sending) return;

    const content = message.trim();
    const tempId = `temp_${Date.now()}`;
    setSending(true);
    
    try {
      const optimisticMessage: Message = {
        _id: tempId,
        sender: currentUserId,
        content: uploadedData ? (content || `📎 ${uploadedData.fileName}`) : content,
        type: uploadedData ? 'file' : 'text',
        fileName: uploadedData?.fileName,
        fileSize: uploadedData?.fileSize,
        fileType: uploadedData?.fileType,
        fileUrl: uploadedData?.fileUrl,
        status: 'sending',
        read: false,
        createdAt: new Date().toISOString()
      };
      
      setCurrentChat(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, optimisticMessage]
        };
      });
      
      setMessage('');
      setSelectedFile(null);
      setFilePreview(null);
      
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
      const response = await fetch(`${getApiBaseUrl()}/chat/${currentChat._id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUserId,
          content: uploadedData ? (content || `📎 ${uploadedData.fileName}`) : content,
          type: uploadedData ? 'file' : 'text',
          fileName: uploadedData?.fileName,
          fileSize: uploadedData?.fileSize,
          fileType: uploadedData?.fileType,
          fileUrl: uploadedData?.fileUrl
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        setCurrentChat(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: prev.messages.map(msg => 
              msg._id === tempId ? { ...msg, _id: data.messageId, status: 'sent' } : msg
            )
          };
        });
        
        setTimeout(() => {
          setCurrentChat(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: prev.messages.map(msg => 
                msg._id === data.messageId ? { ...msg, status: 'delivered' } : msg
              )
            };
          });
        }, 1000);
        
      } else {
        setCurrentChat(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: prev.messages.filter(msg => msg._id !== tempId)
          };
        });
        toast.error('Mesaj gönderilemedi');
      }
    } catch (error) {
      console.error('Send error:', error);
      setCurrentChat(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter(msg => msg._id !== tempId)
        };
      });
      toast.error('Mesaj gönderme hatası');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentChat || !currentUserId) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/chat/${currentChat._id}/message/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (response.ok) {
        toast.success('Mesaj silindi');
      } else {
        toast.error('Mesaj silinemedi');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Silme hatası');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getMessageStatusIcon = (msg: Message) => {
    if (!msg.status) return null;
    
    switch (msg.status) {
      case 'sending':
        return (
          <svg className="h-4 w-4 text-gray-400 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case 'sent':
        return (
          <svg className="h-4 w-4 text-gray-400" viewBox="0 0 16 15" fill="none">
            <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512z" fill="currentColor"/>
          </svg>
        );
      case 'delivered':
        return (
          <svg className="h-4 w-4 text-gray-400" viewBox="0 0 16 15" fill="none">
            <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512z" fill="currentColor"/>
            <path d="M11.775 3.316l-.478-.372a.365.365 0 0 0-.51.063L5.431 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512z" fill="currentColor"/>
          </svg>
        );
      case 'read':
        return (
          <svg className="h-4 w-4 text-blue-500" viewBox="0 0 16 15" fill="none">
            <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512z" fill="currentColor"/>
            <path d="M11.775 3.316l-.478-.372a.365.365 0 0 0-.51.063L5.431 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512z" fill="currentColor"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (lastSeen: string) => {
    if (!lastSeen) return 'Bilinmiyor';
    const now = new Date();
    const seen = new Date(lastSeen);
    const diffInMinutes = Math.floor((now.getTime() - seen.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Az önce aktifti';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce aktifti`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce aktifti`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} gün önce aktifti`;
    
    return seen.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatDateSeparator = (date: string) => {
    const msgDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (msgDate.toDateString() === today.toDateString()) {
      return 'Bugün';
    } else if (msgDate.toDateString() === yesterday.toDateString()) {
      return 'Dün';
    } else {
      return msgDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-3 w-3" />;
      case 'technician': return <Wrench className="h-3 w-3" />;
      default: return <UserIcon className="h-3 w-3" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'technician': return 'Teknisyen';
      case 'personnel': return 'Personel';
      default: return role;
    }
  };

  const getRoleVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'technician': return 'default';
      default: return 'secondary';
    }
  };

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return 0;
    });

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex ml-16 lg:ml-0">
        {/* USERS LIST */}
        <div className="w-full md:w-96 border-r">
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Chat
              </h2>
              <div className="flex items-center gap-2">
                  <Button
                  variant="outline" 
                  size="sm"
                  onClick={testNotificationSound}
                  className="text-xs"
                >
                  🔊 Test
                  </Button>
                <Badge variant="outline">{filteredUsers.length} Kullanıcı</Badge>
                    </div>
                  </div>
                  
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger>
                <SelectValue placeholder="Rol Filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Roller</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="technician">Teknisyen</SelectItem>
                <SelectItem value="personnel">Personel</SelectItem>
              </SelectContent>
            </Select>
                  </div>

          <div className="overflow-y-auto h-[calc(100vh-12rem)]">
                    {filteredUsers.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => handleSelectUser(user)}
                className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
                  selectedUser?._id === user._id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              {user.avatar && <AvatarImage src={`${getApiUrl()}${user.avatar}`} />}
                      <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${
                      user.isOnline ? 'bg-green-500' : 'bg-muted'
                            }`} />
                          </div>
                            <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{user.name}</p>
                        <Badge variant={getRoleVariant(user.role)} className="text-xs px-1.5 py-0">
                          <span className="flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            {getRoleLabel(user.role)}
                              </span>
                        </Badge>
                            </div>
                      {getUnreadCount(user._id) > 0 && (
                        <Badge className="bg-primary text-primary-foreground h-5 min-w-5 flex items-center justify-center text-xs px-1.5">
                          {getUnreadCount(user._id)}
                        </Badge>
                      )}
                            </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      {user.isOnline ? (
                        <>
                          <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                          <span>Çevrimiçi</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          <span className="truncate">{formatLastSeen(user.lastSeen || '')}</span>
                        </>
                      )}
                        </div>
                      </div>
                  </div>
              </div>
            ))}
          </div>
          </div>

        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col">
            {!selectedUser ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Bir kullanıcı seçin</h3>
                <p className="text-sm text-muted-foreground">Mesajlaşmaya başlamak için sol taraftan birini seçin</p>
                </div>
              </div>
            ) : (
              <>
              {/* HEADER */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {selectedUser.avatar && <AvatarImage src={`${getApiUrl()}${selectedUser.avatar}`} />}
                    <AvatarFallback>{selectedUser.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                      <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{selectedUser.name}</p>
                      <Badge variant={getRoleVariant(selectedUser.role)} className="text-xs px-1.5 py-0">
                        <span className="flex items-center gap-1">
                          {getRoleIcon(selectedUser.role)}
                          {getRoleLabel(selectedUser.role)}
                        </span>
                      </Badge>
                      </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {selectedUser.isOnline ? (
                        <>
                          <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                          <span>Çevrimiçi</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          <span>{formatLastSeen(selectedUser.lastSeen || '')}</span>
                        </>
                      )}
                    </div>
                    </div>
                  </div>
                </div>

              {/* MESSAGES */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentChat?.messages.map((msg, index) => {
                  const isSender = (typeof msg.sender === 'string' ? msg.sender : msg.sender._id) === currentUserId;
                  const isImage = msg.fileType?.startsWith('image/');
                  
                  const showDateSeparator = index === 0 || 
                    new Date(currentChat.messages[index - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                      
                      return (
                    <div key={msg._id}>
                          {showDateSeparator && (
                        <div className="flex justify-center my-4">
                          <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                            {formatDateSeparator(msg.createdAt)}
                              </div>
                            </div>
                          )}
                          
                      <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} group`}>
                        <Card className={`max-w-md p-3 ${isSender ? 'bg-primary text-primary-foreground' : ''}`}>
                          {isImage && msg.fileUrl ? (
                                <div className="space-y-2">
                              <img 
                                src={`${getApiBaseUrl()}${msg.fileUrl}`}
                                alt={msg.fileName || 'Resim'}
                                className="rounded-md cursor-pointer hover:opacity-80 transition-opacity max-h-80 w-full object-cover"
                                onClick={() => window.open(`${getApiBaseUrl()}${msg.fileUrl}`, '_blank')}
                              />
                              {msg.content && !msg.content.includes('📎') && (
                                <p className="text-sm">{msg.content}</p>
                                  )}
                                </div>
                          ) : msg.type === 'file' && msg.fileUrl ? (
                                <div className="space-y-2">
                              <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                                <Paperclip className="h-4 w-4" />
                                    <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{msg.fileName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {msg.fileSize ? `${Math.round(msg.fileSize / 1024)} KB` : ''}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                            <p className="text-sm">{msg.content}</p>
                          )}
                          
                          <div className={`flex items-center justify-end gap-1 mt-1 ${isSender ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            <span className="text-xs">{formatTime(msg.createdAt)}</span>
                            {isSender && getMessageStatusIcon(msg)}
                            </div>
                            
                          {isSender && msg._id && !msg._id.startsWith('temp_') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMessage(msg._id!)}
                              className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                              <X className="h-3 w-3" />
                              </Button>
                            )}
                        </Card>
                          </div>
                        </div>
                      );
                    })}
                    
                    {isTyping && (
                      <div className="flex justify-start">
                    <Card className="p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                    </Card>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>

              {/* FILE PREVIEW */}
                {selectedFile && (
                <div className="px-4 py-2 border-t">
                  <Card className="p-2 flex items-center gap-2">
                      {filePreview ? (
                      <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Paperclip className="h-5 w-5" />
                        </div>
                      )}
                    <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                      onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                      >
                      <X className="h-4 w-4" />
                      </Button>
                  </Card>
                  </div>
                )}

              {/* INPUT */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="file-upload"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                      />
                      <Button
                    variant="outline"
                        size="icon"
                        onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                      </Button>
                    
                      <Input
                    ref={inputRef}
                    placeholder="Mesaj yazın..."
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          handleTyping();
                        }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                        disabled={sending}
                    className="flex-1"
                      />
                    
                    <Button
                    onClick={() => handleSendMessage()}
                      disabled={(!message.trim() && !selectedFile) || sending}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
    </div>
  );
}
