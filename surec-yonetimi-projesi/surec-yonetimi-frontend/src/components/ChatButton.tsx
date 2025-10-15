'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';
import io from 'socket.io-client';
import { getApiBaseUrl } from '@/lib/utils';

export default function ChatButton() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userSound, setUserSound] = useState<string | undefined>(undefined);
  const router = useRouter();
  const pathname = usePathname();
  const socketRef = useRef<any>(null);

  // Nudge için ses çalma (kullanıcının seçtiği ses)
  const playNudgeSound = (soundType?: string) => {
    try {
      const chosen = soundType || userSound;
      if (!chosen) return; // default yok
      const file = `/sounds/${chosen}.mp3`;
      
      // Audio permission için user interaction simulation
      const playWithPermission = () => {
        const audio1 = new Audio(file);
        audio1.volume = 0.8;
        audio1.preload = 'auto';
        audio1.play().catch(() => {});
        
        setTimeout(() => {
          const audio2 = new Audio(file);
          audio2.volume = 0.8;
          audio2.play().catch(() => {});
        }, 200);
      };
      
      // İlk kez permission al
      if (!(window as any).audioPermissionGranted) {
        // Silent audio ile permission al
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
        silentAudio.volume = 0;
        silentAudio.play().then(() => {
          (window as any).audioPermissionGranted = true;
          playWithPermission();
        }).catch(() => {
          // Fallback: click simulation
          const clickEvent = new MouseEvent('click', { bubbles: true });
          document.dispatchEvent(clickEvent);
          (window as any).audioPermissionGranted = true;
          playWithPermission();
        });
      } else {
        playWithPermission();
      }
    } catch (e) {
      // noop
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    // Socket bağlantısı
    const backendUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.hostname}:5000`
      : 'http://localhost:5000';
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    socketRef.current = io(backendUrl, {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join_user', userId);
    });

    // Yeni mesaj geldiğinde sayacı artır
    socketRef.current.on('new_message', (data: any) => {
      // Chat sayfasında değilse veya farklı chat'teyse bildirim göster
      const isOnChatPage = pathname?.includes('/chat');
      if (!isOnChatPage) {
        setUnreadCount(prev => prev + 1);
      }
    });

    // Dürt bildirimi: her sayfada yakala ve ses çal + toast göster
    socketRef.current.on('nudge_notification', (data: any) => {
      try {
        if (!data || !data.userId) return;
        if (data.userId !== userId) return; // yalnızca hedef kullanıcı

        console.log('⚡ Nudge received (global):', data);
        
        // Backend'den gelen hedef kullanıcının sesini çal
        const soundToPlay = data.targetUserSound || userSound;
        playNudgeSound(soundToPlay);
        toast.warning('Dürtüldünüz! ' + (data.message || ''));
      } catch (err) {
        console.error('Nudge handle error (global):', err);
      }
    });

    // Unread count'u backend'den al
    fetchUnreadCount(userId);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [pathname]);

  // Kullanıcının seçtiği bildirimi sesi ve audio iznini al
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/users/${userId}`);
        if (res.ok) {
          const user = await res.json();
          if (user?.notificationSound) setUserSound(user.notificationSound);
        }
      } catch {}
    };

    const requestAudioPermission = async () => {
      try {
        const silent = new Audio('/sounds/hamzaaa.mp3');
        silent.volume = 0;
        await silent.play();
        silent.pause();
      } catch {}
    };

    fetchUser();
    requestAudioPermission();
  }, []);

  const fetchUnreadCount = async (userId: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/chat/user/${userId}/unread-count`);
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Fetch unread error:', error);
    }
  };

  const handleClick = () => {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'yonetici') {
      router.push('/admin/chat');
    } else {
      router.push('/personnel/chat');
    }
    setUnreadCount(0);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
      <Button
        onClick={handleClick}
        className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 relative group overflow-hidden"
      >
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-6 min-w-6 flex items-center justify-center bg-red-500 text-white text-xs font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
        <MessageSquare className="h-7 w-7 text-white group-hover:scale-110 transition-transform duration-300" />
        
        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-150 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
      </Button>
      
      <style jsx global>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(20px);
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
}

