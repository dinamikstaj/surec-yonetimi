'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import io from 'socket.io-client';
import { getApiUrl } from '@/lib/utils';

export default function ChatButton() {
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const socket = io(getApiUrl());
    const userId = localStorage.getItem('userId');

    if (userId) {
      // Listen for new messages
      socket.on(`new_message_${userId}`, () => {
        setUnreadCount(prev => prev + 1);
      });
    }

    return () => {
      socket.disconnect();
    };
  }, []);

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

