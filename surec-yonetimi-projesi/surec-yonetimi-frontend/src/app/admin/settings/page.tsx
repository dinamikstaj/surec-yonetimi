"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/sidebar";
import { 
  Settings, 
  Database, 
  Bell, 
  Mail, 
  Shield, 
  Users,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Server,
  Globe,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { getApiBaseUrl } from '@/lib/utils';

interface SystemSettings {
  notifications: {
    emailNotifications: boolean;
    taskAssignmentNotifications: boolean;
    statusUpdateNotifications: boolean;
    overdueTaskNotifications: boolean;
    smsNotifications: boolean;
  };
  system: {
    maxFileSize: number;
    sessionTimeout: number;
    maxUsersPerOrg: number;
    backupEnabled: boolean;
    maintenanceMode: boolean;
    allowRegistration: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpSecure: boolean;
    fromName: string;
    fromEmail: string;
  };
  sms: {
    provider: string;
    apiKey: string;
    apiSecret: string;
    senderName: string;
    enabled: boolean;
  };
  security: {
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSpecialChars: boolean;
    passwordExpiryDays: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    twoFactorEnabled: boolean;
  };
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    notifications: {
      emailNotifications: true,
      taskAssignmentNotifications: true,
      statusUpdateNotifications: true,
      overdueTaskNotifications: true,
      smsNotifications: false,
    },
    system: {
      maxFileSize: 5,
      sessionTimeout: 60,
      maxUsersPerOrg: 100,
      backupEnabled: true,
      maintenanceMode: false,
      allowRegistration: true,
    },
    email: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpSecure: true,
      fromName: 'Süreç Yönetimi Sistemi',
      fromEmail: '',
    },
    sms: {
      provider: 'netgsm',
      apiKey: '',
      apiSecret: '',
      senderName: 'DEMO',
      enabled: false,
    },
    security: {
      passwordMinLength: 6,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecialChars: false,
      passwordExpiryDays: 90,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      twoFactorEnabled: false,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    database: 'connected',
    server: 'running',
    email: 'configured',
  });

  useEffect(() => {
    fetchSettings();
    checkSystemStatus();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        // Fallback to localStorage if API fails
        const saved = localStorage.getItem('adminSettings');
        if (saved) {
          setSettings(JSON.parse(saved));
        }
      }
    } catch (error) {
      console.error('Ayarlar yüklenemedi:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('adminSettings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
      toast.error('Ayarlar yüklenemedi, yerel veriler kullanılıyor');
    } finally {
      setLoading(false);
    }
  };

  const checkSystemStatus = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/settings/system-status`);
      if (response.ok) {
        const status = await response.json();
        setSystemStatus({
          database: status.database,
          server: status.server,
          email: status.email
        });
      } else {
        throw new Error('Status API failed');
      }
    } catch (error) {
      setSystemStatus({
        database: 'error',
        server: 'error',
        email: 'error'
      });
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Ayarlar başarıyla kaydedildi!');
        // Güncellenmiş ayarları state'e set et
        setSettings(data.settings);
        // Backup olarak localStorage'a da kaydet
        localStorage.setItem('adminSettings', JSON.stringify(data.settings));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Ayarlar kaydedilemedi');
      }
          } catch (error) {
        console.error('Ayarlar kaydedilemedi:', error);
        toast.error('Ayarlar kaydedilemedi: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
      // Fallback: localStorage'a kaydet
      localStorage.setItem('adminSettings', JSON.stringify(settings));
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = (key: keyof SystemSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const handleSystemChange = (key: keyof SystemSettings['system'], value: any) => {
    setSettings(prev => ({
      ...prev,
      system: {
        ...prev.system,
        [key]: value
      }
    }));
  };

  const handleEmailChange = (key: keyof SystemSettings['email'], value: any) => {
    setSettings(prev => ({
      ...prev,
      email: {
        ...prev.email,
        [key]: value
      }
    }));
  };

  const handleSmsChange = (key: keyof SystemSettings['sms'], value: any) => {
    setSettings(prev => ({
      ...prev,
      sms: {
        ...prev.sms,
        [key]: value
      }
    }));
  };

  const handleSecurityChange = (key: keyof SystemSettings['security'], value: any) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: value
      }
    }));
  };

  const handleTestEmail = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/settings/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: settings.email.smtpUser }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Test e-postası başarıyla gönderildi!');
      } else {
        toast.error(data.msg || 'Test e-postası gönderilemedi');
      }
    } catch (error) {
      console.error('Test email hatası:', error);
      toast.error('Test e-postası gönderilemedi');
    }
  };

  const handleTerminateSessions = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/settings/terminate-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(`${data.terminatedSessions} oturum başarıyla sonlandırıldı!`);
      } else {
        toast.error(data.msg || 'Oturumlar sonlandırılamadı');
      }
    } catch (error) {
      console.error('Oturum sonlandırma hatası:', error);
      toast.error('Oturumlar sonlandırılamadı');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'running':
      case 'configured':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'running':
      case 'configured':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Ayarlar yükleniyor...</p>
          </div>
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Sistem Ayarları</h1>
              <p className="text-muted-foreground">
                Sistem konfigürasyonunu ve güvenlik ayarlarını yönetin
              </p>
            </div>
            <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
            </Button>
          </div>

          {/* System Status */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Sistem Durumu
              </CardTitle>
              <CardDescription>
                Sistem bileşenlerinin güncel durumu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Veritabanı</span>
                  </div>
                  <Badge variant={getStatusColor(systemStatus.database)} className="gap-1">
                    {getStatusIcon(systemStatus.database)}
                    {systemStatus.database === 'connected' ? 'Bağlı' : 'Hata'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Sunucu</span>
                  </div>
                  <Badge variant={getStatusColor(systemStatus.server)} className="gap-1">
                    {getStatusIcon(systemStatus.server)}
                    {systemStatus.server === 'running' ? 'Çalışıyor' : 'Hata'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">E-posta</span>
                  </div>
                  <Badge variant={getStatusColor(systemStatus.email)} className="gap-1">
                    {getStatusIcon(systemStatus.email)}
                    {systemStatus.email === 'configured' ? 'Yapılandırılmış' : 'Hata'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Bildirim Ayarları
                </CardTitle>
                <CardDescription>
                  Sistem bildirimlerini yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>E-posta Bildirimleri</Label>
                    <p className="text-sm text-muted-foreground">
                      Sistem olayları için e-posta gönder
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(value) => handleNotificationChange('emailNotifications', value)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Görev Atama Bildirimleri</Label>
                    <p className="text-sm text-muted-foreground">
                      Yeni görev atandığında bildirim gönder
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.taskAssignmentNotifications}
                    onCheckedChange={(value) => handleNotificationChange('taskAssignmentNotifications', value)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Durum Güncelleme Bildirimleri</Label>
                    <p className="text-sm text-muted-foreground">
                      Görev durumu değiştiğinde bildirim gönder
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.statusUpdateNotifications}
                    onCheckedChange={(value) => handleNotificationChange('statusUpdateNotifications', value)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Geciken Görev Bildirimleri</Label>
                    <p className="text-sm text-muted-foreground">
                      Görevler geciktiğinde uyarı gönder
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.overdueTaskNotifications}
                    onCheckedChange={(value) => handleNotificationChange('overdueTaskNotifications', value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Sistem Ayarları
                </CardTitle>
                <CardDescription>
                  Genel sistem konfigürasyonu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="maxFileSize">Maksimum Dosya Boyutu (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={settings.system.maxFileSize}
                    onChange={(e) => handleSystemChange('maxFileSize', parseInt(e.target.value))}
                    min="1"
                    max="50"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sessionTimeout">Oturum Zaman Aşımı (dakika)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.system.sessionTimeout}
                    onChange={(e) => handleSystemChange('sessionTimeout', parseInt(e.target.value))}
                    min="15"
                    max="480"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="maxUsers">Maksimum Kullanıcı Sayısı</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={settings.system.maxUsersPerOrg}
                    onChange={(e) => handleSystemChange('maxUsersPerOrg', parseInt(e.target.value))}
                    min="1"
                    max="1000"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Otomatik Yedekleme</Label>
                    <p className="text-sm text-muted-foreground">
                      Günlük otomatik veritabanı yedeklemesi
                    </p>
                  </div>
                  <Switch
                    checked={settings.system.backupEnabled}
                    onCheckedChange={(value) => handleSystemChange('backupEnabled', value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Email Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  E-posta Yapılandırması
                </CardTitle>
                <CardDescription>
                  SMTP ayarlarını yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="smtpHost">SMTP Sunucusu</Label>
                  <Input
                    id="smtpHost"
                    value={settings.email.smtpHost}
                    onChange={(e) => handleEmailChange('smtpHost', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(e) => handleEmailChange('smtpPort', parseInt(e.target.value))}
                    placeholder="587"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="smtpUser">SMTP Kullanıcı Adı</Label>
                  <Input
                    id="smtpUser"
                    value={settings.email.smtpUser}
                    onChange={(e) => handleEmailChange('smtpUser', e.target.value)}
                    placeholder="your-email@gmail.com"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Güvenli Bağlantı (SSL/TLS)</Label>
                    <p className="text-sm text-muted-foreground">
                      E-posta gönderimi için güvenli bağlantı kullan
                    </p>
                  </div>
                  <Switch
                    checked={settings.email.smtpSecure}
                    onCheckedChange={(value) => handleEmailChange('smtpSecure', value)}
                  />
                </div>

                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={handleTestEmail}
                >
                  <Zap className="h-4 w-4" />
                  Test E-postası Gönder
                </Button>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Güvenlik Ayarları
                </CardTitle>
                <CardDescription>
                  Sistem güvenlik politikaları
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Şifre Politikası</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Minimum 6 karakter</li>
                    <li>• Büyük ve küçük harf içermeli</li>
                    <li>• En az bir sayı içermeli</li>
                    <li>• 90 günde bir değiştirilmeli</li>
                  </ul>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Oturum Güvenliği</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Otomatik çıkış: {settings.system.sessionTimeout} dakika</li>
                    <li>• Çoklu oturum koruması aktif</li>
                    <li>• IP bazlı güvenlik kontrolleri</li>
                  </ul>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={handleTerminateSessions}
                >
                  <Users className="h-4 w-4" />
                  Tüm Oturumları Sonlandır
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 