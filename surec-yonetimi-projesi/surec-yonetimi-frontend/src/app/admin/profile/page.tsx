"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Mail, Phone, User, Shield, Calendar, Settings, BarChart3, Users, Volume2, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PersonnelProfileModal from "@/components/PersonnelProfileModal";
import PasswordChangeModal from "@/components/PasswordChangeModal";
import ActivityHistoryModal from "@/components/ActivityHistoryModal";
import Sidebar from "@/components/sidebar";
import { toast } from "sonner";
import { getApiUrl, getApiBaseUrl } from "@/lib/utils";

export default function AdminProfilePage() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    tasksCreated: 0,
    usersManaged: 0,
    systemActions: 0,
    loginCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        toast.error("Kullanıcı kimliği bulunamadı");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${getApiBaseUrl()}/users/${userId}`);
        
        if (!response.ok) {
          throw new Error("Kullanıcı bilgileri alınamadı");
        }
        
        const userData = await response.json();
        setUser(userData);
        
        // Admin istatistiklerini getir
        await fetchAdminStats();
      } catch (error) {
        console.error("Kullanıcı bilgileri yüklenirken hata:", error);
        toast.error("Profil bilgileri yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);


  const fetchAdminStats = async () => {
    try {
      // Paralel olarak istatistikleri çek
      const [tasksRes, usersRes, activitiesRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/tasks`),
        fetch(`${getApiBaseUrl()}/users`),
        fetch(`${getApiBaseUrl()}/users/${userId}/activities`),
      ]);

      let tasksCreated = 0;
      let usersManaged = 0;
      let loginCount = 0;

      if (tasksRes.ok) {
        const tasks = await tasksRes.json();
        tasksCreated = tasks.filter((task: any) => task.assignedBy._id === userId).length;
      }

      if (usersRes.ok) {
        const users = await usersRes.json();
        usersManaged = users.filter((user: any) => user.role === 'kullanici').length;
      }

      if (activitiesRes.ok) {
        const activities = await activitiesRes.json();
        loginCount = activities.filter((activity: any) => 
          activity.message.includes('giriş yaptı')
        ).length;
      }

      setStats({
        tasksCreated,
        usersManaged,
        systemActions: tasksCreated + usersManaged,
        loginCount,
      });
    } catch (error) {
      console.error("Admin istatistikleri alınamadı:", error);
    }
  };

  const handleProfileUpdate = () => {
    setShowProfileModal(false);
    // Profil güncellemesinden sonra verileri yenile
    window.location.reload();
  };

  const handlePasswordChange = () => {
    setShowPasswordModal(false);
    toast.success("Şifre başarıyla değiştirildi!");
  };

  const handleActivityClose = () => {
    setShowActivityModal(false);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'yonetici':
        return 'Sistem Yöneticisi';
      case 'kullanici':
        return 'Personel';
      default:
        return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'yonetici' ? 'destructive' : 'secondary';
  };

  const getAvatarFallback = (name: string, email: string) => {
    if (name && name.length > 0) {
      return name.charAt(0).toUpperCase();
    }
    if (email && email.length > 0) {
      return email.charAt(0).toUpperCase();
    }
    return "A";
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Profil bilgileri yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center bg-background">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <User className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">Kullanıcı Bulunamadı</h3>
                  <p className="text-sm text-muted-foreground">
                    Profil bilgileriniz yüklenemedi. Lütfen tekrar giriş yapmayı deneyin.
                  </p>
                </div>
                <Button 
                  onClick={() => window.location.href = '/login'}
                  className="w-full"
                >
                  Giriş Sayfasına Dön
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-8 pr-8 bg-background overflow-y-auto">
        <div className="w-full max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Yönetici Profili</h1>
            <p className="text-muted-foreground">
              Profil bilgilerinizi yönetin ve sistem istatistiklerinizi görüntüleyin
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Profile Card */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      {user.avatar && (
                        <AvatarImage 
                          src={`${getApiUrl()}${user.avatar}`}
                          alt={user.name || user.email}
                        />
                      )}
                      <AvatarFallback className="text-2xl font-semibold">
                        {getAvatarFallback(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl mb-1">
                        {user.name || user.email}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          <Shield className="h-3 w-3 mr-1" />
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => setShowProfileModal(true)} className="gap-2">
                    <Edit className="h-4 w-4" />
                    Profili Düzenle
                  </Button>
                </div>
              </CardHeader>
              
              <Separator />
              
              <CardContent className="pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* İletişim Bilgileri */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-3">İletişim Bilgileri</h3>
                    
                    <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">E-posta</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email || "Belirtilmemiş"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Telefon</p>
                        <p className="text-sm text-muted-foreground">
                          {user.phone || "Belirtilmemiş"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hesap Bilgileri */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-3">Hesap Bilgileri</h3>
                    
                    <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Kullanıcı Adı</p>
                        <p className="text-sm text-muted-foreground">
                          {user.username || user.email || "Belirtilmemiş"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Üyelik Tarihi</p>
                        <p className="text-sm text-muted-foreground">
                          {user.createdAt ? 
                            new Date(user.createdAt).toLocaleDateString('tr-TR') : 
                            "Bilinmiyor"
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Stats */}
            <div className="space-y-6">
              {/* İstatistikler */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Yönetici İstatistikleri
                  </CardTitle>
                  <CardDescription>
                    Sistem yönetim faaliyetleriniz
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Edit className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Oluşturulan Görev</p>
                          <p className="text-xs text-muted-foreground">Toplam atanan görev</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold">{stats.tasksCreated}</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Users className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Yönetilen Personel</p>
                          <p className="text-xs text-muted-foreground">Aktif personel sayısı</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold">{stats.usersManaged}</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Calendar className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Toplam Giriş</p>
                          <p className="text-xs text-muted-foreground">Sistem giriş sayısı</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold">{stats.loginCount}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>


              {/* Hızlı İşlemler */}
              <Card>
                <CardHeader>
                  <CardTitle>Profil İşlemleri</CardTitle>
                  <CardDescription>
                    Hesap yönetimi işlemleri
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowProfileModal(true)}
                    className="w-full justify-start gap-3"
                  >
                    <Edit className="h-4 w-4" />
                    Profili Düzenle
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full justify-start gap-3"
                  >
                    <Shield className="h-4 w-4" />
                    Şifre Değiştir
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setShowActivityModal(true)}
                    className="w-full justify-start gap-3"
                  >
                    <Calendar className="h-4 w-4" />
                    Etkinlik Geçmişi
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/admin/settings'}
                    className="w-full justify-start gap-3"
                  >
                    <Settings className="h-4 w-4" />
                    Sistem Ayarları
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showProfileModal && (
          <PersonnelProfileModal
            token={user._id}
            currentName={user.name || user.email}
            currentPhone={user.phone || ""}
            currentImage={user.avatar}
            currentEmail={user.email || ""}
            currentRole={user.role === "yonetici" ? "yonetici" : "kullanici"}
            onClose={handleProfileUpdate}
          />
        )}

        {showPasswordModal && userId && (
          <PasswordChangeModal
            userId={userId}
            onClose={() => setShowPasswordModal(false)}
          />
        )}

        {showActivityModal && userId && (
          <ActivityHistoryModal
            userId={userId}
            onClose={handleActivityClose}
          />
        )}
      </main>
    </div>
  );
} 