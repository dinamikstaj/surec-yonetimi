'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Sidebar from '@/components/sidebar';
import { 
  Bell,
  CheckCheck,
  Trash2,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Zap,
  MessageSquare,
  Clock,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { getApiBaseUrl, getApiUrl } from '@/lib/utils';

interface Notification {
  _id: string;
  type: 'task' | 'nudge' | 'approval' | 'rejection' | 'info' | 'warning';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedTask?: string;
  sender?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export default function PersonnelNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, activeTab]);

  const fetchNotifications = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${getApiBaseUrl()}/notifications/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        toast.error('Bildirimler yüklenemedi');
      }
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
      toast.error('Bildirimler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = [...notifications];
    
    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (activeTab === 'read') {
      filtered = filtered.filter(n => n.read);
    } else if (activeTab !== 'all') {
      filtered = filtered.filter(n => n.type === activeTab);
    }
    
    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Bildirim okundu olarak işaretlenemedi:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${getApiBaseUrl()}/notifications/${userId}/read-all`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast.success('Tüm bildirimler okundu olarak işaretlendi');
      }
    } catch (error) {
      console.error('Bildirimler işaretlenemedi:', error);
      toast.error('İşlem başarısız');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        toast.success('Bildirim silindi');
      }
    } catch (error) {
      console.error('Bildirim silinemedi:', error);
      toast.error('Silme işlemi başarısız');
    }
  };

  const deleteAllRead = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${getApiBaseUrl()}/notifications/${userId}/delete-read`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => !n.read));
        toast.success('Okunan bildirimler silindi');
      }
    } catch (error) {
      console.error('Bildirimler silinemedi:', error);
      toast.error('Silme işlemi başarısız');
    }
  };

  const getNotificationIcon = (type: string): React.ReactElement => {
    const icons: Record<string, React.ReactElement> = {
      'task': <CheckCircle className="h-5 w-5" />,
      'nudge': <Zap className="h-5 w-5" />,
      'approval': <CheckCheck className="h-5 w-5" />,
      'rejection': <XCircle className="h-5 w-5" />,
      'info': <Info className="h-5 w-5" />,
      'warning': <AlertCircle className="h-5 w-5" />,
    };
    return icons[type] || icons['info'];
  };

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      'task': 'border-l-blue-500',
      'nudge': 'border-l-orange-500',
      'approval': 'border-l-green-500',
      'rejection': 'border-l-red-500',
      'info': 'border-l-blue-500',
      'warning': 'border-l-yellow-500',
    };
    return colors[type] || colors['info'];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    if (notification.relatedTask) {
      router.push(`/personnel/tasks/${notification.relatedTask}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <div className="text-lg">Yükleniyor...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Bell className="h-8 w-8" />
                Bildirimler
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount} Yeni
                  </Badge>
                )}
              </h1>
              <p className="text-gray-600 mt-1">Tüm bildirimlerinizi buradan görüntüleyin</p>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Tümünü Okundu İşaretle
                </Button>
              )}
              <Button variant="outline" onClick={deleteAllRead}>
                <Trash2 className="mr-2 h-4 w-4" />
                Okunanları Sil
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Toplam</div>
              <div className="text-2xl font-bold mt-1">{notifications.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Okunmamış</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{unreadCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Dürtler</div>
              <div className="text-2xl font-bold text-orange-600 mt-1">
                {notifications.filter(n => n.type === 'nudge').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Görev</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {notifications.filter(n => n.type === 'task').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">
                  Tümü ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="unread">
                  Okunmamış ({unreadCount})
                </TabsTrigger>
                <TabsTrigger value="task">
                  Görevler
                </TabsTrigger>
                <TabsTrigger value="nudge">
                  Dürtler
                </TabsTrigger>
                <TabsTrigger value="approval">
                  Onaylar
                </TabsTrigger>
                <TabsTrigger value="read">
                  Okunanlar
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Bell className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Bildirim yok</p>
                <p className="text-sm">Bu kategoride görüntülenecek bildirim bulunmuyor</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md
                      ${getNotificationColor(notification.type)}
                      ${notification.read ? 'opacity-75' : ''}
                    `}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                        
                        <p className={`text-sm ${!notification.read ? 'text-gray-700' : 'text-gray-500'} mb-2`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(notification.createdAt)}
                          </span>
                          
                          {notification.sender && (
                            <span className="flex items-center gap-1">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={notification.sender.avatar ? `${getApiUrl()}${notification.sender.avatar}` : ''} />
                                <AvatarFallback className="text-xs">
                                  {notification.sender.name?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              {notification.sender.name || notification.sender.email}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-1 flex-shrink-0">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                            className="h-8 w-8"
                          >
                            <CheckCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 