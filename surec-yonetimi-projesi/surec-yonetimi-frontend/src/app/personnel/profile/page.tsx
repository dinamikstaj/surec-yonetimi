"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Mail, Phone, User, Shield, Calendar } from "lucide-react";
import PersonnelProfileModal from "@/components/PersonnelProfileModal";
import PasswordChangeModal from "@/components/PasswordChangeModal";
import ActivityHistoryModal from "@/components/ActivityHistoryModal";
import Sidebar from "@/components/sidebar";
import { toast } from "sonner";
import { getApiUrl, getApiBaseUrl } from "@/lib/utils";

export default function PersonnelProfilePage() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Kullanıcı ID'si localStorage'dan al
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
      } catch (error) {
        console.error("Kullanıcı bilgileri yüklenirken hata:", error);
        toast.error("Profil bilgileri yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

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
      case 'kullanici':
        return 'Personel';
      default:
        return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'kullanici':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getAvatarFallback = (name: string, email: string) => {
    if (name && name.length > 0) {
      return name.charAt(0).toUpperCase();
    }
    if (email && email.length > 0) {
      return email.charAt(0).toUpperCase();
    }
    return "U";
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
                  onClick={() => window.location.href = '/personnel/login'}
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
        <div className="w-full max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Profilim</h1>
            <p className="text-muted-foreground">
              Profil bilgilerinizi görüntüleyin ve güncelleyin
            </p>
          </div>

          {/* Main Profile Card */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    {user.avatar && (
                      <AvatarImage 
                        src={`${getApiUrl()}${user.avatar}`}
                        alt={user.name || user.email}
                      />
                    )}
                    <AvatarFallback className="text-lg font-semibold">
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

          {/* Hızlı İşlemler */}
          <Card>
            <CardHeader>
              <CardTitle>Hızlı İşlemler</CardTitle>
              <CardDescription>
                Profil ile ilgili hızlı işlemlerinizi buradan yapabilirsiniz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowProfileModal(true)}
                  className="gap-2 h-auto py-4 flex-col"
                >
                  <Edit className="h-6 w-6" />
                  <span>Profili Düzenle</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="gap-2 h-auto py-4 flex-col"
                  onClick={() => setShowPasswordModal(true)}
                >
                  <Shield className="h-6 w-6" />
                  <span>Şifre Değiştir</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="gap-2 h-auto py-4 flex-col"
                  onClick={() => setShowActivityModal(true)}
                >
                  <Calendar className="h-6 w-6" />
                  <span>Etkinlik Geçmişi</span>
                </Button>
              </div>
            </CardContent>
          </Card>
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
