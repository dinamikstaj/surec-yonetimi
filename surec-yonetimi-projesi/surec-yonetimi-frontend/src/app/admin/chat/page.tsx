'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Sidebar from '@/components/sidebar';
import { toast } from 'sonner';
import io from 'socket.io-client';
import { getApiBaseUrl, getApiUrl } from '@/lib/utils';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Users,
  Circle,
  ArrowLeft,
  Trash2
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  lastLogin?: string;
  lastSeen?: string;
  isOnline?: boolean;
  statusMessage?: string;
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
  statusDetails?: {
    sentAt?: string;
    deliveredAt?: string;
    readAt?: string;
    readBy?: Array<{
      user: string;
      readAt: string;
    }>;
  };
  replyTo?: string;
  forwarded?: boolean;
  forwardedFrom?: string;
  read: boolean;
  createdAt: string;
}

interface Chat {
  _id: string;
  participants: User[];
  messages: Message[];
  lastMessage?: string;
  lastMessageTime: string;
  unreadCount: Map<string, number>;
}

export default function ChatPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSnakeRain, setShowSnakeRain] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [isUserListCollapsed, setIsUserListCollapsed] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const currentUserEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
  
  // Özel yılan yağmuru özelliği kontrolü
  const canUseSnakeRain = currentUserEmail === 'pinar@dinamikotomasyon.com';

  // Socket bağlantısı için ayrı useEffect
  useEffect(() => {
    if (!currentUserId) return;

    console.log('Setting up socket connection for user:', currentUserId);
    
    // Socket.io connection - Auto detect backend URL
    const backendUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.hostname}:5000`
      : 'http://localhost:5000';
    
    console.log('Connecting to backend:', backendUrl);
    
    // Önceki bağlantıyı temizle
    if (socketRef.current) {
      console.log('Disconnecting previous socket connection');
      socketRef.current.disconnect();
    }
    
    socketRef.current = io(backendUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      forceNew: true, // Her seferinde yeni bağlantı oluştur
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    // Connection events
    socketRef.current.on('connect', () => {
      console.log('Socket connected successfully:', socketRef.current.id);
      // Join user room after connection
      socketRef.current.emit('join_user', currentUserId);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socketRef.current.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });

    socketRef.current.on('joined_room', (data: any) => {
      console.log('Successfully joined room:', data.room);
    });
    
    // Listen for new messages
    socketRef.current.on('new_message', (data: any) => {
      console.log('New message received:', data);
      console.log('Received chat ID:', data.chatId);
      
      // Güvenli kontrol - data ve data.message'ın varlığını kontrol et
      if (!data || !data.message || !data.chatId) {
        console.log('Invalid message data received');
        return;
      }
      
      console.log('Processing new message for chat:', data.chatId);
      
      // Mesajı state'e ekle - currentChat kontrolü setCurrentChat içinde yapılacak
      setCurrentChat(prev => {
        console.log('Current chat in state:', prev?._id);
        console.log('Message chat ID:', data.chatId);
        
        // Eğer şu anki chat yoksa veya farklı chat'e ait mesajsa işleme
        if (!prev || prev._id !== data.chatId) {
          console.log('Message not for current chat, ignoring');
          return prev;
        }
        
        // Duplicate mesaj kontrolü - sadece gerçek ID kontrolü
        const messageExists = prev.messages.some(msg => {
          if (!msg || !msg._id) return false;
          return msg._id === data.message._id;
        });
        
        if (messageExists) {
          console.log('Message already exists, skipping');
          return prev;
        }
        
        // Mesajları güvenli şekilde ekle
        if (!data.message || !data.message.sender || !data.message.content) {
          console.warn('Invalid message data:', data.message);
          return prev;
        }
        
        console.log('Adding message to current chat');
        const newMessages = [...prev.messages, data.message];
        console.log('Updated messages count:', newMessages.length);
        
        return {
          ...prev,
          messages: newMessages
        };
      });
    });

     // Listen for message deletion
     socketRef.current.on('message_deleted', (data: any) => {
       console.log('Message deleted:', data);
       
       if (data.chatId === currentChat?._id) {
         setCurrentChat(prev => {
           if (!prev) return prev;
           return {
             ...prev,
             messages: prev.messages.filter(msg => msg._id !== data.messageId)
           };
         });
       }
     });

     // Listen for typing events
     socketRef.current.on('typing_start', (data: any) => {
       if (data.chatId === currentChat?._id && data.userId !== currentUserId) {
         setIsTyping(true);
         setTypingUser(data.userName || 'Birisi');
       }
     });

     socketRef.current.on('typing_stop', (data: any) => {
       if (data.chatId === currentChat?._id && data.userId !== currentUserId) {
         setIsTyping(false);
         setTypingUser(null);
       }
     });

     // Listen for user status changes
     socketRef.current.on('user_status_changed', (data: any) => {
       console.log('User status changed:', data);
       setUsers(prev => prev.map(user => 
         user._id === data.userId 
           ? { ...user, isOnline: data.isOnline, lastSeen: data.lastSeen }
           : user
       ));
     });

     // Listen for messages read status
     socketRef.current.on('messages_read', (data: any) => {
       console.log('Messages read:', data);
       if (data.chatId === currentChat?._id) {
         // Update message status to read
         setCurrentChat(prev => {
           if (!prev) return prev;
           return {
             ...prev,
             messages: prev.messages.map(msg => {
               if (typeof msg.sender === 'string' ? msg.sender !== currentUserId : msg.sender._id !== currentUserId) {
                 return {
                   ...msg,
                   status: 'read',
                   statusDetails: {
                     ...msg.statusDetails,
                     readAt: data.readAt
                   }
                 };
               }
               return msg;
             })
           };
         });
       }
     });

      // Connection events daha önce tanımlandı, tekrar tanımlamaya gerek yok
    
    return () => {
      console.log('Cleaning up socket connection');
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentUserId]); // Sadece currentUserId değiştiğinde yeniden bağlan

  // Kullanıcıları fetch etmek için ayrı useEffect
  useEffect(() => {
    if (currentUserId) {
      fetchUsers();
    }
  }, [currentUserId]);

  // Online durumu güncelle
  useEffect(() => {
    if (!currentUserId) return;

    // Sayfa yüklendiğinde online olarak işaretle
    const updateOnlineStatus = async () => {
      try {
        await fetch(`${getApiBaseUrl()}/chat/user/${currentUserId}/online`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isOnline: true }),
        });
      } catch (error) {
        console.error('Online status update error:', error);
      }
    };

    updateOnlineStatus();

    // Sayfa kapatıldığında offline olarak işaretle
    const handleBeforeUnload = async () => {
      try {
        await fetch(`${getApiBaseUrl()}/chat/user/${currentUserId}/online`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isOnline: false }),
        });
      } catch (error) {
        console.error('Offline status update error:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Component unmount olduğunda offline olarak işaretle
      fetch(`${getApiBaseUrl()}/chat/user/${currentUserId}/online`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: false }),
      }).catch(console.error);
    };
  }, [currentUserId]);

  // Mesajları scroll'a kaydırmak için useEffect
  useEffect(() => {
    if (currentChat?.messages && currentChat.messages.length > 0) {
      scrollToBottom();
    }
  }, [currentChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  const handleSelectUser = async (user: User) => {
    setSelectedUser(user);
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/chat/get-or-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId1: currentUserId,
          userId2: user._id
        }),
      });
      
      if (response.ok) {
        const chat = await response.json();
        setCurrentChat(chat);
        
        // Mark as read
        await fetch(`${getApiBaseUrl()}/chat/${chat._id}/read/${currentUserId}`, {
          method: 'PUT'
        });
      }
    } catch (error) {
      console.error('Chat fetch error:', error);
      toast.error('Sohbet yüklenemedi');
    }
  };

  const fetchChatMessages = async (chatId: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/chat/user/${currentUserId}`);
      if (response.ok) {
        const chats = await response.json();
        const chat = chats.find((c: Chat) => c._id === chatId);
        if (chat) {
          setCurrentChat(chat);
        }
      }
    } catch (error) {
      console.error('Refresh messages error:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentChat || !currentUserId) return;

    console.log('Attempting to delete message:', messageId);
    console.log('Current chat ID:', currentChat._id);
    console.log('Current user ID:', currentUserId);

    try {
      const response = await fetch(`${getApiBaseUrl()}/chat/${currentChat._id}/message/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });

      console.log('Delete response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Message deleted successfully:', result);
        toast.success('Mesaj silindi');
        // Socket event will handle UI update
      } else {
        const errorData = await response.json();
        console.error('Delete error response:', errorData);
        toast.error(errorData.msg || 'Mesaj silinemedi');
      }
    } catch (error) {
      console.error('Delete message error:', error);
      toast.error('Mesaj silinemedi');
    }
  };

  const handleSnakeRain = () => {
    if (!canUseSnakeRain) return;
    
    setShowSnakeRain(true);
    setTimeout(() => setShowSnakeRain(false), 5000); // 5 saniye sonra durdur
  };

  const handleTyping = () => {
    if (!currentChat || !currentUserId || !socketRef.current) return;
    
    // Typing start event gönder
    socketRef.current.emit('typing_start', {
      chatId: currentChat._id,
      userId: currentUserId,
      userName: currentUserEmail || 'Kullanıcı'
    });
    
    // 3 saniye sonra typing stop gönder
    setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('typing_stop', {
          chatId: currentChat._id,
          userId: currentUserId
        });
      }
    }, 3000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Dosya bilgilerini doğru şekilde sakla
    const fileWithInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      url: null,
      uploaded: false
    };
    
    setSelectedFile(fileWithInfo as any);
    
    // Dosya önizlemesi oluştur
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
    
    // Dosyayı backend'e yükle
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${getApiBaseUrl()}/chat/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Dosya yüklendi:', result);
        
        // Yüklenen dosya bilgilerini selectedFile state'ine ekle
        const uploadedFile = {
          ...file,
          url: result.fileUrl,
          uploaded: true
        };
        setSelectedFile(uploadedFile as any);
        
        toast.success(`Dosya yüklendi: ${file.name}`);
        
        // Dosya yüklendikten sonra otomatik olarak mesaj gönder
        setTimeout(() => {
          handleSendMessage();
        }, 500);
        
      } else {
        const error = await response.json();
        toast.error(`Dosya yüklenemedi: ${error.msg}`);
      }
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      toast.error('Dosya yükleme hatası');
    }
    
    console.log('Dosya seçildi:', file.name);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleVideoCall = () => {
    // Görüntülü arama başlatma
    toast.info('Görüntülü arama özelliği yakında aktif olacak!');
  };

  const handleStatusUpdate = async () => {
    if (!statusMessage.trim() || !currentUserId) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/chat/user/${currentUserId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusMessage: statusMessage.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Status updated:', data);
        
        // Kullanıcı listesini yeniden yükle
        await fetchUsers();
        
        toast.success('Durum mesajı güncellendi');
        setShowStatusModal(false);
        setStatusMessage('');
      } else {
        const errorData = await response.json();
        toast.error(errorData.msg || 'Durum mesajı güncellenemedi');
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Durum mesajı güncellenemedi');
    }
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && !selectedFile) || !currentChat || !currentUserId || sending) return;

    const messageContent = message.trim();
    setSending(true);
    
    try {
      let content = messageContent;
      let type = 'text';
      let fileName = null;
      let fileSize = null;
      let fileType = null;
      let fileUrl = null;
      
      // Eğer dosya seçilmişse ve henüz yüklenmemişse
      if (selectedFile && !(selectedFile as any)?.uploaded) {
        toast.info('Dosya yükleniyor...');
        return; // Dosya yükleme işlemi devam ediyor, mesaj gönderme
      }
      
      // Eğer dosya seçilmişse ve yüklenmişse
      if (selectedFile && (selectedFile as any)?.uploaded) {
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
        fileType = selectedFile.type;
        fileUrl = (selectedFile as any)?.url;
        
        if (messageContent) {
          content = `${messageContent}\n\n📎 Dosya: ${fileName}`;
        } else {
          content = `📎 Dosya: ${fileName}`;
        }
        type = 'file';
      }
      
      const response = await fetch(`${getApiBaseUrl()}/chat/${currentChat._id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUserId,
          content: content,
          type: type,
          fileName: fileName,
          fileSize: fileSize,
          fileType: fileType,
          fileUrl: fileUrl
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Message sent successfully:', data);
        
        // Mesaj gönderildikten sonra input'u temizle
        setMessage('');
        
        // Dosya seçimini temizle
        setSelectedFile(null);
        setFilePreview(null);
        
        // Socket'ten gelecek mesajı bekle - optimistic update kaldırıldı
        // Bu sayede çift mesaj sorunu tamamen çözülür
        
      } else {
        const errorData = await response.json();
        toast.error(errorData.msg || 'Mesaj gönderme hatası');
        setMessage(messageContent); // Restore message if failed
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Mesaj gönderme hatası');
      setMessage(messageContent); // Restore message if failed
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredUsers = users
    .filter(user =>
      !searchTerm ||
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Online users first, then by name
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

  const getOtherParticipant = (chat: Chat): User | undefined => {
    return chat.participants.find(p => p._id !== currentUserId);
  };

  // WhatsApp benzeri mesaj durumu ikonları
  const getMessageStatusIcon = (message: Message) => {
    if (!message.status) return null;
    
    switch (message.status) {
      case 'sending':
        return <div className="w-3 h-3 border border-slate-400 rounded-full animate-pulse" />;
      case 'sent':
        return (
          <div className="flex">
            <div className="w-3 h-3 bg-slate-400 rounded-full" />
          </div>
        );
      case 'delivered':
        return (
          <div className="flex">
            <div className="w-3 h-3 bg-slate-400 rounded-full" />
            <div className="w-3 h-3 bg-slate-400 rounded-full -ml-1" />
          </div>
        );
      case 'read':
        return (
          <div className="flex">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <div className="w-3 h-3 bg-blue-500 rounded-full -ml-1" />
          </div>
        );
      default:
        return null;
    }
  };

  // Son görülme zamanını formatla
  const formatLastSeen = (lastSeen: string) => {
    if (!lastSeen) return 'Son görülme bilinmiyor';
    
    const now = new Date();
    const seen = new Date(lastSeen);
    const diffInMinutes = Math.floor((now.getTime() - seen.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Şimdi';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} gün önce`;
    
    return seen.toLocaleDateString('tr-TR');
  };

  // Mesaj zamanını formatla
  const formatMessageTime = (createdAt: string) => {
    const now = new Date();
    const messageTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Şimdi';
    if (diffInMinutes < 60) return `${diffInMinutes}dk`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}s`;
    
    return messageTime.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      
      <div className="flex-1 ml-16 lg:ml-0">
        <div className="h-screen flex">
          {/* Users List */}
          <div className={`${isUserListCollapsed ? 'w-0 md:w-16' : 'w-full md:w-80'} border-r border-slate-700 bg-slate-800 flex flex-col transition-all duration-300 overflow-hidden`}>
            <div className="p-4 border-b border-slate-700">
              {isUserListCollapsed ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-6 h-6 bg-slate-600 rounded flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsUserListCollapsed(false)}
                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    <div className="w-4 h-4 flex flex-col space-y-1">
                      <div className="w-full h-0.5 bg-current"></div>
                      <div className="w-full h-0.5 bg-current"></div>
                      <div className="w-full h-0.5 bg-current"></div>
                    </div>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-slate-600 rounded flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold text-white">Simple Chat</h2>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.history.back()}
                        className="text-slate-400 hover:text-white hover:bg-slate-700"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsUserListCollapsed(true)}
                        className="text-slate-400 hover:text-white hover:bg-slate-700"
                      >
                        <div className="w-4 h-4 flex flex-col space-y-1">
                          <div className="w-full h-0.5 bg-current"></div>
                          <div className="w-full h-0.5 bg-current"></div>
                          <div className="w-full h-0.5 bg-current"></div>
                        </div>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Recent Chats Section */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-white">RECENT CHATS</span>
                      <div className="bg-slate-600 text-white text-xs px-2 py-1 rounded-full">
                        {filteredUsers.length}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const currentUser = users.find(u => u._id === currentUserId);
                          setStatusMessage(currentUser?.statusMessage || '');
                          setShowStatusModal(true);
                        }}
                        className="text-slate-400 hover:text-white hover:bg-slate-700 h-6 w-6"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      <div className="w-4 h-4 text-slate-400">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7 10l5 5 5-5z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {!isUserListCollapsed && (
              <div className="flex-1 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="h-16 w-16 text-slate-400 mx-auto mb-4 opacity-50" />
                    <p className="text-slate-400 text-sm">Kullanıcı bulunamadı</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredUsers.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => handleSelectUser(user)}
                        className={`p-4 border-b border-slate-700 cursor-pointer transition-colors hover:bg-slate-700/50 ${
                          selectedUser?._id === user._id
                            ? 'bg-slate-700'
                            : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              {user.avatar && <AvatarImage src={`${getApiUrl()}${user.avatar}`} />}
                              <AvatarFallback className="bg-slate-600 text-white">
                                {(user.name || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-800 ${
                              user.isOnline ? 'bg-green-500' : 'bg-gray-500'
                            }`} />
                          </div>
                            <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-white truncate">
                                {user.name || 'İsimsiz Kullanıcı'}
                              </p>
                              <span className="text-xs text-slate-400">
                                {user.isOnline 
                                  ? 'Çevrimiçi' 
                                  : user.lastSeen 
                                    ? formatLastSeen(user.lastSeen)
                                    : 'Bilinmiyor'
                                }
                              </span>
                            </div>
                              <p className="text-xs text-slate-400 truncate">
                                {user.statusMessage || 'Hey! How have you been...'}
                              </p>
                            </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-slate-900">
            {!selectedUser ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-24 w-24 text-slate-400 mx-auto mb-4 opacity-30" />
                  <h3 className="text-2xl font-semibold text-slate-300 mb-2">Mesajlaşmaya Başlayın</h3>
                  <p className="text-slate-400">Sol taraftan bir kullanıcı seçin</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-700 bg-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedUser(null)}
                        className="md:hidden text-slate-400 hover:text-white hover:bg-slate-700"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <div>
                        <h3 className="text-white font-medium">{selectedUser.name || 'İsimsiz Kullanıcı'}</h3>
                        <p className="text-xs text-slate-400">
                          {selectedUser.isOnline 
                            ? 'Çevrimiçi' 
                            : selectedUser.lastSeen 
                              ? formatLastSeen(selectedUser.lastSeen)
                              : 'Son görülme bilinmiyor'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-white hover:bg-slate-700"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleVideoCall}
                      className="text-slate-400 hover:text-white hover:bg-slate-700"
                    >
                      <div className="w-5 h-5">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                        </svg>
                      </div>
                    </Button>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-800 to-slate-900 relative">
                  
                  <div className="p-4 space-y-4">
                    {currentChat?.messages?.filter(msg => msg && msg.sender).map((msg, index, messages) => {
                      // Güvenli kontrol - msg'ın varlığını ve sender property'sini kontrol et
                      if (!msg || !msg.sender) {
                        console.warn('Invalid message object:', msg);
                        return null;
                      }
                      
                      const isSender = typeof msg.sender === 'string' 
                        ? msg.sender === currentUserId 
                        : msg.sender._id === currentUserId;

                      // Tarih ayırıcısı kontrolü
                      const currentDate = new Date(msg.createdAt).toDateString();
                      const prevMessage = index > 0 ? messages[index - 1] : null;
                      const prevDate = prevMessage ? new Date(prevMessage.createdAt).toDateString() : null;
                      const showDateSeparator = currentDate !== prevDate;
                      
                      return (
                        <div key={msg._id || index}>
                          {/* Tarih Ayırıcısı */}
                          {showDateSeparator && (
                            <div className="flex justify-center py-4">
                              <div className="bg-slate-700 text-white text-xs px-3 py-1 rounded-full">
                                {new Date(msg.createdAt).toLocaleDateString('tr-TR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          )}
                          
                          <div
                            className={`flex ${isSender ? 'justify-end' : 'justify-start'} animate-slide-in group`}
                          >
                          <div className="relative flex items-end space-x-2">
                            {!isSender && (
                              <Avatar className="h-8 w-8">
                                {selectedUser.avatar && <AvatarImage src={`${getApiUrl()}${selectedUser.avatar}`} />}
                                <AvatarFallback className="bg-slate-600 text-white text-xs">
                                  {(selectedUser.name || 'U').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                                isSender
                                  ? 'bg-slate-800 text-white rounded-br-sm'
                                  : 'bg-slate-800 text-white rounded-bl-sm'
                              } transform transition-all duration-200 hover:scale-[1.02]`}
                            >
                              {/* Resim mesajı ise */}
                              {msg.type === 'file' && msg.fileName && msg.fileType?.startsWith('image/') ? (
                                <div className="space-y-2">
                                  {/* Resim önizlemesi */}
                                  <div 
                                    className="relative cursor-pointer group"
                                    onClick={() => {
                                      // Gerçek dosya URL'sini kullan
                                      const imageUrl = msg.fileUrl || 'https://via.placeholder.com/400x300/374151/ffffff?text=Resim+Yok';
                                      setSelectedImage(imageUrl);
                                      setShowImageModal(true);
                                    }}
                                  >
                                    <img 
                                      src={msg.fileUrl || 'https://via.placeholder.com/192x128/374151/ffffff?text=Resim+Yok'} // Placeholder resim
                                      alt={msg.fileName}
                                      className="w-48 h-32 object-cover rounded-lg hover:opacity-90 transition-opacity"
                                      onError={(e) => {
                                        // Resim yüklenemezse dosya ikonu göster
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                    <div className="hidden w-48 h-32 bg-slate-700 rounded-lg flex items-center justify-center">
                                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all duration-200">
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Dosya bilgileri */}
                                  <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span>{msg.fileName}</span>
                                    <span>{msg.fileSize ? formatFileSize(msg.fileSize) : ''}</span>
                                  </div>
                                  
                                  {/* Metin içeriği varsa */}
                                  {msg.content && !msg.content.includes('📎 Dosya:') && (
                                    <p className="text-sm break-words leading-relaxed">{msg.content}</p>
                                  )}
                                </div>
                              ) : msg.type === 'file' && msg.fileName ? (
                                /* Diğer dosya türleri */
                                <div className="space-y-2">
                                  {/* Dosya bilgileri */}
                                  <div className="flex items-center space-x-2 p-2 bg-slate-700 rounded-lg">
                                    <div className="w-8 h-8 bg-slate-600 rounded flex items-center justify-center">
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-white truncate">{msg.fileName}</p>
                                      <p className="text-xs text-slate-400">
                                        {msg.fileSize ? formatFileSize(msg.fileSize) : ''}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        // Dosya indirme işlemi
                                        const link = document.createElement('a');
                                        link.href = msg.fileUrl || '#'; // Gerçek dosya URL'si buraya gelecek
                                        link.download = msg.fileName || 'dosya';
                                        link.click();
                                        toast.info('Dosya indiriliyor...');
                                      }}
                                      className="text-slate-400 hover:text-white hover:bg-slate-600 h-6 w-6"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    </Button>
                                  </div>
                                  
                                  {/* Metin içeriği varsa */}
                                  {msg.content && !msg.content.includes('📎 Dosya:') && (
                                    <p className="text-sm break-words leading-relaxed">{msg.content}</p>
                                  )}
                                </div>
                              ) : (
                                /* Normal metin mesajı */
                                <p className="text-sm break-words leading-relaxed">{msg.content}</p>
                              )}
                              
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-[10px] text-slate-400">
                                  {formatMessageTime(msg.createdAt)}
                                </p>
                                {isSender && (
                                  <div className="flex items-center space-x-1">
                                    {getMessageStatusIcon(msg)}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {isSender && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-slate-600 text-white text-xs">
                                  {currentUserId?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            {/* Silme butonu - sadece gönderen görebilir */}
                            {isSender && msg._id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMessage(msg._id!)}
                                className="absolute -top-2 -right-2 h-6 w-6 bg-slate-600 hover:bg-slate-700 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            {selectedUser.avatar && <AvatarImage src={`${getApiUrl()}${selectedUser.avatar}`} />}
                            <AvatarFallback className="bg-slate-600 text-white text-xs">
                              {(selectedUser.name || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-slate-800 text-slate-400 text-sm px-4 py-3 rounded-2xl rounded-bl-sm">
                            {typingUser} yazıyor...
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* File Preview */}
                {selectedFile && (
                  <div className="p-4 border-t border-slate-700 bg-slate-800">
                    <div className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg">
                      {filePreview ? (
                        <img 
                          src={filePreview} 
                          alt="Preview" 
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-600 rounded flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {(selectedFile as any)?.name || 'Dosya'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatFileSize((selectedFile as any)?.size || 0)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={removeSelectedFile}
                        className="text-slate-400 hover:text-white hover:bg-slate-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <div className="p-4 border-t border-slate-700 bg-slate-800">
                  <div className="flex items-center space-x-3">
                    {/* Attachment Button */}
                    <div className="relative">
                      <input
                        type="file"
                        id="file-upload"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="rounded-full h-11 w-11 bg-slate-700 hover:bg-slate-600 text-white"
                      >
                        <div className="w-5 h-5">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                          </svg>
                        </div>
                      </Button>
                    </div>
                    
                    {/* Message Input */}
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type something..."
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          handleTyping();
                        }}
                        onKeyPress={handleKeyPress}
                        disabled={sending}
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 rounded-full px-4 py-3 pr-12 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      />
                    </div>
                    
                    {/* Send Button */}
                    <Button
                      onClick={handleSendMessage}
                      disabled={(!message.trim() && !selectedFile) || sending}
                      className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-full font-medium"
                    >
                      {sending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Send'
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>

      {/* Status Message Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-md w-full bg-slate-800 rounded-lg overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Durum Mesajı Ayarla</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            
            {/* Modal Content */}
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Durum Mesajınız
                  </label>
                  <Input
                    placeholder="Durum mesajınızı yazın..."
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    maxLength={100}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {statusMessage.length}/100 karakter
                  </p>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowStatusModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={!statusMessage.trim()}
                    className="bg-slate-700 hover:bg-slate-600 text-white"
                  >
                    Güncelle
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full bg-slate-800 rounded-lg overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Resim Görüntüle</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedImage;
                    link.download = 'resim.jpg';
                    link.click();
                    toast.success('Resim indiriliyor...');
                  }}
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowImageModal(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-4">
              <div className="text-white text-sm mb-2">
                Debug: {selectedImage}
              </div>
              <img 
                src={selectedImage || 'https://via.placeholder.com/400x300/374151/ffffff?text=Resim+Yok'} 
                alt="Büyük resim" 
                className="max-w-full max-h-96 object-contain rounded-lg"
                onLoad={() => console.log('Resim yüklendi:', selectedImage)}
                onError={(e) => {
                  console.log('Resim yüklenemedi:', selectedImage);
                  e.currentTarget.src = 'https://via.placeholder.com/400x300/374151/ffffff?text=Resim+Yuklenemedi';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

