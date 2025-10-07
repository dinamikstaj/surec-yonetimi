// components/sidebar.tsx

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { getApiUrl, getApiBaseUrl } from '@/lib/utils';
import {
  Home,
  FileText,
  Users,
  BarChart,
  LogOut,
  Settings,
  Menu,
  UserCircle,
  Mail,
  Zap,
  UserPlus,
  Building,
  Wrench,
  Shield,
  Calendar,
  ChevronDown,
  ChevronRight,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Award,
  MessageSquare,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

// Kategori sistemli navigation
const adminNavCategories = [
  {
    name: 'Ana Sayfa',
    href: '/admin/dashboard',
    icon: Home,
    type: 'single'
  },
  {
    name: 'Müşteri Yönetimi',
    icon: Building,
    type: 'category',
    items: [
      { name: 'Yeni Kayıt', href: '/admin/customers/new', icon: UserPlus },
      { name: 'Müşteri Listesi', href: '/admin/customers', icon: Users },
      { name: 'Bakım Anlaşması Var', href: '/admin/customers/maintenance', icon: Shield },
      { name: 'Bakım Anlaşması Yok', href: '/admin/customers/no-maintenance', icon: Users },
    ]
  },
  {
    name: 'Servis Yönetimi',
    icon: Wrench,
    type: 'category',
    items: [
      { name: 'Yerinde Servis', href: '/admin/service/onsite', icon: Wrench },
      { name: 'Anlaşmalı Müşteriler', href: '/admin/service/contracted', icon: Shield },
      { name: 'Anlaşmasız Müşteriler', href: '/admin/service/non-contracted', icon: Users },
    ]
  },
  {
    name: 'Bakım Anlaşmaları',
    icon: Shield,
    type: 'category',
    items: [
      { name: 'Aktif Anlaşmalar', href: '/admin/maintenance/active', icon: Shield },
      { name: 'Pasif Anlaşmalar', href: '/admin/maintenance/inactive', icon: Users },
      { name: 'Yenileme Zamanı', href: '/admin/maintenance/renewal', icon: Calendar },
    ]
  },
  {
    name: 'Destek Servisi',
    icon: Calendar,
    type: 'category',
    items: [
      { name: 'Yerinde Destek', href: '/admin/support/onsite', icon: Wrench },
      { name: 'Uzaktan Destek', href: '/admin/support/remote', icon: Shield },
      { name: 'Bakım Desteği', href: '/admin/support/maintenance', icon: Users },
      { name: 'Tüm Talepler', href: '/admin/support/all', icon: Calendar },
    ]
  },
  {
    name: 'Süreç Yönetimi',
    icon: FileText,
    type: 'category',
    items: [
      { name: 'Süreçler', href: '/admin/processes', icon: FileText },
      { name: 'Görev Yönetimi', href: '/admin/tasks', icon: BarChart },
      { name: 'Dürt', href: '/admin/nudge', icon: Zap },
    ]
  },
  {
    name: 'Müşteri Sorunları',
    href: '/admin/issues',
    icon: AlertCircle,
    type: 'single'
  },
  {
    name: 'Sistem Yönetimi',
    icon: Settings,
    type: 'category',
    items: [
      { name: 'Kullanıcılar', href: '/admin/users', icon: Users },
      { name: 'Mail Gönder', href: '/admin/mail', icon: Mail },
      { name: 'SMS Gönder', href: '/admin/sms', icon: MessageSquare },
      { name: 'Ayarlar', href: '/admin/settings', icon: Settings },
    ]
  },
  {
    name: 'Profilim',
    href: '/admin/profile',
    icon: UserCircle,
    type: 'single'
  },
];

const personnelNavItems = [
  {
    name: 'Ana Sayfa',
    href: '/personnel/dashboard',
    icon: Home,
    type: 'single'
  },
  {
    name: 'Görevlerim',
    icon: FileText,
    type: 'category',
    items: [
      { name: 'Tüm Görevler', href: '/personnel/tasks', icon: FileText },
      { name: 'Devam Edenler', href: '/personnel/tasks?filter=in-progress', icon: Clock },
      { name: 'Tamamlananlar', href: '/personnel/tasks?filter=completed', icon: CheckCircle },
      { name: 'Gecikenler', href: '/personnel/tasks?filter=overdue', icon: AlertCircle },
    ]
  },
  {
    name: 'Takvim',
    href: '/personnel/calendar',
    icon: Calendar,
    type: 'single'
  },
  {
    name: 'Müşteri Sorunları',
    href: '/personnel/issues',
    icon: AlertCircle,
    type: 'single'
  },
  {
    name: 'Bildirimler',
    href: '/personnel/notifications',
    icon: Bell,
    type: 'single'
  },
  {
    name: 'Raporlar',
    icon: BarChart,
    type: 'category',
    items: [
      { name: 'Performans', href: '/personnel/reports?tab=performance', icon: TrendingUp },
      { name: 'Başarılar', href: '/personnel/reports?tab=achievements', icon: Award },
      { name: 'Analizler', href: '/personnel/reports?tab=analytics', icon: BarChart },
    ]
  },
  {
    name: 'Profilim',
    href: '/personnel/profile',
    icon: UserCircle,
    type: 'single'
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');
    
    setUserRole(role || '');
    
    // Kullanıcı bilgilerini al
    if (userId) {
      fetchUserData(userId);
    }
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setUserName(userData.name || userData.email || 'Kullanıcı');
        setUserAvatar(userData.avatar || '');
      }
    } catch (error) {
      console.error('Kullanıcı bilgileri alınamadı:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    toast.success('Başarıyla çıkış yaptınız.');
    router.push('/login');
  };

  const getNavItems = () => {
    return userRole === 'yonetici' ? adminNavCategories : personnelNavItems;
  };

  const toggleCategory = (categoryName: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const getSidebarTitle = () => {
    return userRole === 'yonetici' ? 'Yönetici Paneli' : 'Personel Paneli';
  };

  const getRoleDisplayName = () => {
    return userRole === 'yonetici' ? 'Yönetici' : 'Personel';
  };

  const getAvatarFallback = () => {
    if (userName && userName.length > 0) {
      return userName.charAt(0).toUpperCase();
    }
    return userRole === 'yonetici' ? 'Y' : 'P';
  };

  const NavContent = () => (
    <nav className="space-y-2">
      {getNavItems().map((item: any) => {
        if (item.type === 'single') {
          const isActive = pathname === item.href;
          return (
            <Button
              key={item.name}
              variant={isActive ? 'default' : 'ghost'}
              className="w-full justify-start text-lg font-medium"
              onClick={() => router.push(item.href)}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Button>
          );
        }

        if (item.type === 'category') {
          const isOpen = openCategories.includes(item.name);
          const hasActiveChild = item.items?.some((subItem: any) => pathname === subItem.href);
          
          return (
            <div key={item.name} className="space-y-1">
              <Button
                variant={hasActiveChild ? 'default' : 'ghost'}
                className="w-full justify-start text-lg font-medium"
                onClick={() => toggleCategory(item.name)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
                {isOpen ? (
                  <ChevronDown className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronRight className="ml-auto h-4 w-4" />
                )}
              </Button>
              
              {isOpen && (
                <div className="ml-6 space-y-1">
                  {item.items?.map((subItem: any) => {
                    const isActive = pathname === subItem.href;
                    return (
                      <Button
                        key={subItem.name}
                        variant={isActive ? 'secondary' : 'ghost'}
                        className="w-full justify-start text-sm"
                        onClick={() => router.push(subItem.href)}
                      >
                        <subItem.icon className="mr-2 h-4 w-4" />
                        {subItem.name}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        return null;
      })}
    </nav>
  );

  const UserProfile = () => (
    <div className="p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          {userAvatar && (
            <AvatarImage 
              src={`${getApiUrl()}${userAvatar}`} 
              alt={userName}
            />
          )}
          <AvatarFallback className="text-sm font-semibold">
            {getAvatarFallback()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{userName}</p>
          <p className="text-xs text-muted-foreground">{getRoleDisplayName()}</p>
        </div>
      </div>
      
      {/* Hem admin hem personnel için profil görüntüle butonu */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full mt-2 justify-start text-sm"
        onClick={() => router.push(userRole === 'yonetici' ? '/admin/profile' : '/personnel/profile')}
      >
        <UserCircle className="mr-2 h-4 w-4" />
        Profili Görüntüle
      </Button>
    </div>
  );

  return (
    <>
      {/* Büyük ekranlar için sabit sidebar */}
      <aside className="hidden md:flex flex-col w-64 p-4 border-r bg-card text-card-foreground h-screen sticky top-0 overflow-y-auto">
        <div className="flex-1 flex flex-col min-h-0">
          <h1 className="text-2xl font-bold mb-8">{getSidebarTitle()}</h1>
          
          {/* User Profile Section */}
          <div className="mb-6 flex-shrink-0">
            <UserProfile />
          </div>
          
          <Separator className="mb-6 flex-shrink-0" />
          
          <div className="flex-1 overflow-y-auto">
            <NavContent />
          </div>
        </div>
        
        <div className="pt-4 border-t flex-shrink-0">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full text-lg font-medium"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Çıkış Yap
          </Button>
        </div>
      </aside>

      {/* Küçük ekranlar için mobil menü */}
      <div className="md:hidden p-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader className="mb-8">
              <SheetTitle className="text-2xl font-bold">Menü</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col justify-between h-[calc(100vh-80px)]">
              <div>
                {/* Mobile User Profile */}
                <div className="mb-6">
                  <UserProfile />
                </div>
                
                <Separator className="mb-6" />
                
                <NavContent />
              </div>
              
              <div className="mt-auto pt-4 border-t">
                <Button
                  onClick={handleLogout}
                  variant="destructive"
                  className="w-full text-lg font-medium"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Çıkış Yap
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}