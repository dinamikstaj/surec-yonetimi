// src/app/admin/nudge/page.tsx

"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import Sidebar from '@/components/sidebar';
import { toast } from 'sonner';
import { getApiUrl, getApiBaseUrl } from '@/lib/utils';
import { 
  Zap, 
  Bell, 
  Users, 
  Calendar, 
  Clock,
  AlertCircle,
  CheckCircle,
  Send,
  History,
  Filter,
  Search,
  RefreshCw,
  MessageSquare,
  Target,
  TrendingDown,
  User
} from 'lucide-react';

interface Personnel {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  lastActivity?: string;
  tasksOverdue: number;
  tasksInProgress: number;
  responseRate: number;
}

interface NudgeTemplate {
  id: string;
  name: string;
  subject: string;
  message: string;
  type: 'reminder' | 'urgent' | 'friendly' | 'formal';
}

interface NudgeHistory {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  message: string;
  type: string;
  sentAt: string;
  responded: boolean;
  responseTime?: number;
}

export default function NudgePage() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [filteredPersonnel, setFilteredPersonnel] = useState<Personnel[]>([]);
  const [nudgeHistory, setNudgeHistory] = useState<NudgeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [responseFilter, setResponseFilter] = useState("all");

  // Form states
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [nudgeType, setNudgeType] = useState<'reminder' | 'urgent' | 'friendly' | 'formal'>('reminder');
  const [includeTaskDetails, setIncludeTaskDetails] = useState(true);
  const [scheduleNudge, setScheduleNudge] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [personnelTasks, setPersonnelTasks] = useState<any[]>([]);

  const nudgeTemplates: NudgeTemplate[] = [
    {
      id: '1',
      name: 'Nazik Hatırlatma',
      type: 'friendly',
      subject: 'Görevleriniz Hakkında Hatırlatma',
      message: `Merhaba {name},

Umarım iyi günler geçiriyorsundur. 

Bazı görevlerinin henüz tamamlanmadığını fark ettik. Tabii ki herkesin kendi temposu var, sadece unutmuş olabileceğin düşüncesiyle hatırlatmak istedik.

Yoğun bir dönemindesin eğer, lütfen bizimle paylaş ki birlikte çözüm bulalım.

İyi çalışmalar! 😊`
    },
    {
      id: '2',
      name: 'Acil Uyarı',
      type: 'urgent',
      subject: '🚨 ACİL: Geciken Görevler Hakkında',
      message: `{name},

Bazı görevlerin kritik gecikme durumunda.

Bu görevlerin acilen tamamlanması gerekiyor. Lütfen öncelik ver ve bugün içinde durumu güncelle.

Herhangi bir engel varsa derhal iletişime geç.

Acil durum protokolü aktif.`
    },
    {
      id: '3',
      name: 'Resmi Bildiri',
      type: 'formal',
      subject: 'Görev Takip Bildirisi',
      message: `Sayın {name},

İş takip sistemimizden yapılan kontrollerde, sizin sorumluluğunuzdaki bazı görevlerde gecikme tespit edilmiştir.

Lütfen ilgili görevleri en kısa sürede tamamlayarak sistem üzerinden durumlarını güncelleyiniz.

Destek gereksinimi duymanız halinde yönetim ekibiyle iletişime geçebilirsiniz.

Saygılarımızla,
Yönetim`
    },
    {
      id: '4',
      name: 'Motivasyonel',
      type: 'friendly',
      subject: 'Hadi, Son Spurt! 💪',
      message: `Hey {name}! 🌟

Harika iş çıkarıyorsun! Sadece birkaç görev daha kaldı finish line'a ulaşmak için.

Biliyoruz ki çok yoğunsun, ama bu son görevleri de hallettikten sonra rahat bir nefes alabilirsin.

Sen yaparsın! Ekip olarak arkandayız. 🚀

Keep going! 💪`
    }
  ];

  useEffect(() => {
    fetchPersonnelData();
    fetchNudgeHistory();
  }, []);

  useEffect(() => {
    // Filtreleme ve arama
    let filtered = personnel;

    if (searchTerm) {
      filtered = filtered.filter(person => 
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter === 'overdue') {
      filtered = filtered.filter(person => person.tasksOverdue > 0);
    } else if (statusFilter === 'slow') {
      filtered = filtered.filter(person => person.responseRate < 70);
    }

    if (responseFilter === 'low') {
      filtered = filtered.filter(person => person.responseRate < 50);
    } else if (responseFilter === 'high') {
      filtered = filtered.filter(person => person.responseRate >= 80);
    }

    setFilteredPersonnel(filtered);
  }, [personnel, searchTerm, statusFilter, responseFilter]);

  const fetchPersonnelData = async () => {
    try {
      // Kullanıcıları ve görevlerini çek
      const [usersRes, tasksRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/users`),
        fetch(`${getApiBaseUrl()}/tasks`)
      ]);

      if (usersRes.ok && tasksRes.ok) {
        const users = await usersRes.json();
        const tasks = await tasksRes.json();
        
        // Personnel listesi oluştur
        const personnelList = users
          .filter((user: any) => user.role === 'kullanici')
          .map((user: any) => {
            const userTasks = tasks.filter((task: any) => task.assignedTo && task.assignedTo._id === user._id);
            const overdueTasks = userTasks.filter((task: any) => 
              task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
            );
            const inProgressTasks = userTasks.filter((task: any) => task.status === 'in-progress');
            
            // Response rate hesaplama
            const completedTasks = userTasks.filter((task: any) => task.status === 'completed');
            const responseRate = userTasks.length > 0 ? (completedTasks.length / userTasks.length) * 100 : 100;

            return {
              _id: user._id,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
              role: user.role,
              lastActivity: user.lastActivity,
              tasksOverdue: overdueTasks.length,
              tasksInProgress: inProgressTasks.length,
              responseRate: Math.round(responseRate)
            };
          });

        setPersonnel(personnelList);
      }
    } catch (error) {
      console.error('Personnel verileri yüklenirken hata:', error);
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNudge = async (personId: string, message: string, taskId?: string, taskTitle?: string) => {
    setSending(true);
    try {
      const senderId = localStorage.getItem('userId');
      if (!senderId) {
        toast.error('Kullanıcı kimliği bulunamadı');
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/users/${personId}/nudge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message || 'Yönetici sizi dürtüyor!',
          senderId: senderId,
          taskId: taskId,
          taskTitle: taskTitle
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`${data.targetUser} başarıyla dürtüldü!`);
        setShowCustomModal(false);
        setCustomMessage('');
        setSelectedTask(null);
        fetchNudgeHistory();
      } else {
        const error = await response.json();
        toast.error(error.msg || 'Dürt gönderilemedi');
      }
    } catch (error) {
      console.error('Dürt gönderme hatası:', error);
      toast.error('Dürt gönderilirken hata oluştu');
    } finally {
      setSending(false);
    }
  };

  const fetchNudgeHistory = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/users/nudges/history`);
      if (response.ok) {
        const data = await response.json();
        setNudgeHistory(data);
      } else {
        setNudgeHistory([]);
      }
    } catch (error) {
      console.error('Dürt geçmişi yüklenirken hata:', error);
      setNudgeHistory([]);
    }
  };

  const handleQuickNudge = async (person: Personnel, template: NudgeTemplate) => {
    setSending(true);
    
    try {
      const personalizedMessage = template.message.replace('{name}', person.name);
      
      const senderId = localStorage.getItem('userId');
      if (!senderId) {
        toast.error('Kullanıcı kimliği bulunamadı');
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/users/${person._id}/nudge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: personalizedMessage,
          senderId: senderId,
          subject: template.subject,
          type: template.type,
          includeTaskDetails
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`${person.name} başarıyla dürtüldü!`);
        fetchNudgeHistory();
      } else {
        const error = await response.json();
        toast.error(error.msg || 'Dürt gönderilemedi');
      }
      
    } catch (error) {
      console.error('Dürtme hatası:', error);
      toast.error('Dürtme başarısız');
    } finally {
      setSending(false);
    }
  };

  const handleCustomNudge = async () => {
    if (!selectedPersonnel) {
      toast.error('Personel seçmelisiniz');
      return;
    }

    if (!customMessage || customMessage.trim() === '') {
      toast.error('Mesaj yazmalısınız');
      return;
    }

    // Görev seçimi opsiyonel - var ise gönder, yoksa sadece mesaj gönder
    await handleSendNudge(
      selectedPersonnel._id, 
      customMessage, 
      selectedTask?._id, 
      selectedTask?.title
    );
      setSelectedPersonnel(null);
  };

  const bulkNudge = async (template: NudgeTemplate) => {
    const overduePersonnel = personnel.filter(p => p.tasksOverdue > 0);
    
    if (overduePersonnel.length === 0) {
      toast.info('Geciken görevi olan personel bulunamadı');
      return;
    }

    if (!confirm(`${overduePersonnel.length} personele dürt gönderilecek. Emin misiniz?`)) {
      return;
    }

    setSending(true);

    try {
      for (const person of overduePersonnel) {
        await handleQuickNudge(person, template);
        // Rate limiting için kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast.success(`${overduePersonnel.length} personele toplu dürt gönderildi!`);
    } catch (error) {
      console.error('Toplu dürt hatası:', error);
      toast.error('Toplu dürt başarısız');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 80) return 'default';
    if (rate >= 60) return 'secondary';
    return 'destructive';
  };

  const getAvatarFallback = (name: string, email: string) => {
    if (name && name.length > 0) return name.charAt(0).toUpperCase();
    if (email && email.length > 0) return email.charAt(0).toUpperCase();
    return "U";
  };

  const getStats = () => {
    const total = personnel.length;
    const needsNudge = personnel.filter(p => p.tasksOverdue > 0).length;
    const lowPerformance = personnel.filter(p => p.responseRate < 70).length;
    const avgResponseRate = personnel.length > 0 
      ? personnel.reduce((acc, p) => acc + p.responseRate, 0) / personnel.length 
      : 0;

    return { total, needsNudge, lowPerformance, avgResponseRate };
  };

  const stats = getStats();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-8 pr-8 bg-background overflow-y-auto">
        <div className="w-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Personel Dürt Sistemi</h1>
              <p className="text-muted-foreground">
                Personel performansını takip edin ve gerektiğinde hatırlatma gönderin
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={fetchPersonnelData} 
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Yenile
              </Button>
              
              <Dialog open={showCustomModal} onOpenChange={setShowCustomModal}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Özel Dürt
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]" aria-describedby="custom-nudge-description">
                  <DialogHeader>
                    <DialogTitle>Özel Dürt Gönder</DialogTitle>
                  </DialogHeader>
                  <div id="custom-nudge-description" className="sr-only">
                    Personele özel dürt mesajı gönderin.
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Personel Seç</Label>
                      <Select value={selectedPersonnel?._id || ''} onValueChange={(value) => {
                        const person = personnel.find(p => p._id === value);
                        setSelectedPersonnel(person || null);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Personel seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {personnel.map((person) => (
                            <SelectItem key={person._id} value={person._id}>
                              {person.name} ({person.tasksOverdue} geciken görev)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Dürt Tipi</Label>
                      <Select value={nudgeType} onValueChange={(value: any) => setNudgeType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friendly">Dostça</SelectItem>
                          <SelectItem value="reminder">Hatırlatma</SelectItem>
                          <SelectItem value="urgent">Acil</SelectItem>
                          <SelectItem value="formal">Resmi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="customMessage">Özel Mesaj <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="customMessage"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Dürt mesajınızı yazın... (Görev seçmek zorunlu değil)"
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Görev detaylarını ekle <span className="text-xs text-muted-foreground">(Opsiyonel)</span></Label>
                      <Switch
                        checked={includeTaskDetails}
                        onCheckedChange={setIncludeTaskDetails}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Zamanlanmış gönderim</Label>
                      <Switch
                        checked={scheduleNudge}
                        onCheckedChange={setScheduleNudge}
                      />
                    </div>

                    {scheduleNudge && (
                      <div>
                        <Label htmlFor="scheduleTime">Gönderim Zamanı</Label>
                        <Input
                          id="scheduleTime"
                          type="datetime-local"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                        />
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-end space-x-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowCustomModal(false)}
                      >
                        İptal
                      </Button>
                      <Button 
                        onClick={handleCustomNudge}
                        disabled={sending || !selectedPersonnel || !customMessage}
                      >
                        {sending ? 'Gönderiliyor...' : 'Dürt Gönder'}
          </Button>
        </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Personel</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card className={stats.needsNudge > 0 ? "border-destructive/50 bg-destructive/5" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dürt Gerekli</CardTitle>
                <AlertCircle className={`h-4 w-4 ${stats.needsNudge > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.needsNudge > 0 ? 'text-destructive' : ''}`}>
                  {stats.needsNudge}
                </div>
              </CardContent>
            </Card>
            <Card className={stats.lowPerformance > 0 ? "border-amber-200 bg-amber-50/50" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Düşük Performans</CardTitle>
                <TrendingDown className={`h-4 w-4 ${stats.lowPerformance > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.lowPerformance > 0 ? 'text-amber-600' : ''}`}>
                  {stats.lowPerformance}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ortalama Başarı</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getPerformanceColor(stats.avgResponseRate)}`}>
                  {stats.avgResponseRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="personnel" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personnel">Personel Listesi</TabsTrigger>
              <TabsTrigger value="templates">Dürt Şablonları</TabsTrigger>
              <TabsTrigger value="history">Dürt Geçmişi</TabsTrigger>
            </TabsList>

            {/* Personnel Tab */}
            <TabsContent value="personnel">
              {/* Filters */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtreler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Personel ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Durum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tümü</SelectItem>
                        <SelectItem value="overdue">Geciken Görevli</SelectItem>
                        <SelectItem value="slow">Yavaş Çalışan</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={responseFilter} onValueChange={setResponseFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Performans" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Performans</SelectItem>
                        <SelectItem value="high">Yüksek (80%+)</SelectItem>
                        <SelectItem value="low">Düşük (50%-)</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline" onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setResponseFilter('all');
                    }}>
                      Temizle
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Personnel Grid */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Personel Listesi ({filteredPersonnel.length})</CardTitle>
                      <CardDescription>Personel performansı ve dürt seçenekleri</CardDescription>
                    </div>
                    
                    {stats.needsNudge > 0 && (
                      <div className="flex gap-2">
                        {nudgeTemplates.slice(0, 2).map((template) => (
                          <Button
                            key={template.id}
                            variant="outline"
                            size="sm"
                            onClick={() => bulkNudge(template)}
                            disabled={sending}
                            className="gap-2"
                          >
                            <Zap className="h-3 w-3" />
                            Toplu {template.name}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Personel verileri yükleniyor...</p>
                    </div>
                  ) : filteredPersonnel.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Personel bulunamadı</h3>
                      <p className="text-muted-foreground">
                        Filtre kriterlerinize uygun personel yok
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredPersonnel.map((person) => (
                        <Card key={person._id} className={`hover:shadow-md transition-shadow ${person.tasksOverdue > 0 ? 'border-destructive/50' : ''}`}>
                          <CardContent className="p-6">
                            <div className="flex items-center space-x-4 mb-4">
                              <Avatar className="h-12 w-12">
                                {person.avatar && (
                                  <AvatarImage 
                                    src={`${getApiUrl()}${person.avatar}`}
                                    alt={person.name}
                                  />
                                )}
                                <AvatarFallback className="text-lg font-semibold">
                                  {getAvatarFallback(person.name, person.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate">{person.name}</h3>
                                <p className="text-sm text-muted-foreground">{person.email}</p>
                              </div>
                            </div>

                            {/* Performance Metrics */}
                            <div className="space-y-3 mb-4">
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Başarı Oranı</span>
                                <Badge variant={getPerformanceBadge(person.responseRate)}>
                                  {person.responseRate}%
                                </Badge>
                              </div>
                              
                              {person.tasksOverdue > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Geciken Görev</span>
                                  <Badge variant="destructive">
                                    {person.tasksOverdue}
                                  </Badge>
                                </div>
                              )}
                              
                              {person.tasksInProgress > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Devam Eden</span>
                                  <Badge variant="secondary">
                                    {person.tasksInProgress}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            <Separator className="mb-4" />

                            {/* Quick Nudge Buttons - Her Zaman Aktif */}
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <Button
                                  variant={person.tasksOverdue > 0 ? "destructive" : "outline"}
                                    size="sm"
                                  onClick={() => handleQuickNudge(person, nudgeTemplates[person.tasksOverdue > 0 ? 1 : 0])}
                                    disabled={sending}
                                    className="gap-1"
                                  >
                                  <Zap className="h-3 w-3" />
                                  {person.tasksOverdue > 0 ? 'Acil Dürt' : 'Hızlı Dürt'}
                                  </Button>
                                  <Button
                                  variant="outline"
                                    size="sm"
                                  onClick={() => {
                                    setSelectedPersonnel(person);
                                    setShowCustomModal(true);
                                  }}
                                    disabled={sending}
                                    className="gap-1"
                                  >
                                  <MessageSquare className="h-3 w-3" />
                                  Mesaj Yaz
                  </Button>
                </div>
                              {person.tasksOverdue > 0 && (
                                <div className="text-center py-1">
                                  <Badge variant="destructive" className="text-xs">
                                    {person.tasksOverdue} geciken görev!
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates">
              <Card>
                <CardHeader>
                  <CardTitle>Dürt Şablonları</CardTitle>
                  <CardDescription>Hazır dürt mesajı şablonları</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {nudgeTemplates.map((template) => (
                      <Card key={template.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <Badge variant={
                              template.type === 'urgent' ? 'destructive' :
                              template.type === 'formal' ? 'default' :
                              template.type === 'friendly' ? 'secondary' : 'outline'
                            }>
                              {template.type}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm font-medium mb-2">{template.subject}</p>
                          <p className="text-xs text-muted-foreground line-clamp-4">
                            {template.message}
                          </p>
                        </CardContent>
              </Card>
            ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Dürt Geçmişi</CardTitle>
                  <CardDescription>Gönderilen dürt mesajlarının geçmişi</CardDescription>
                </CardHeader>
                <CardContent>
                  {nudgeHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Henüz dürt gönderilmemiş</p>
          </div>
        ) : (
                    <div className="space-y-4">
                      {nudgeHistory.map((nudge) => (
                        <div key={nudge.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{nudge.recipientName}</h4>
                                <Badge variant="outline">{nudge.type}</Badge>
                                <Badge variant={nudge.responded ? 'default' : 'secondary'}>
                                  {nudge.responded ? 'Yanıtlandı' : 'Beklemede'}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-2">
                                {nudge.message}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Gönderilme: {formatDate(nudge.sentAt)}</span>
                                {nudge.responseTime && (
                                  <span>Yanıt süresi: {nudge.responseTime} saat</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
          </div>
        )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}