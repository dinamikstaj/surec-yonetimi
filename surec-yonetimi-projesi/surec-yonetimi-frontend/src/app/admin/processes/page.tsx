"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import Sidebar from '@/components/sidebar';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Workflow, 
  Clock, 
  Play, 
  CheckCircle, 
  BarChart3,
  Users,
  Calendar,
  Filter,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Target,
  TrendingUp
} from 'lucide-react';

interface Process {
  _id: string;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTeam: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  startDate?: string;
  endDate?: string;
  progress: number;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  tags: string[];
  budget?: number;
  estimatedDuration?: number;
}

interface ProcessStats {
  total: number;
  active: number;
  completed: number;
  planning: number;
  onHold: number;
  completionRate: number;
  averageDuration: number;
}

export default function ProcessesPage() {
  const router = useRouter();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [filteredProcesses, setFilteredProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [creating, setCreating] = useState(false);
  const [progressValue, setProgressValue] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    assignedTeam: [] as string[],
    startDate: "",
    endDate: "",
    tags: "",
    budget: "",
    estimatedDuration: "",
  });

  useEffect(() => {
    fetchProcesses();
  }, []);

  useEffect(() => {
    // Filtreleme ve arama işlemleri
    let filtered = processes;

    if (searchTerm) {
      filtered = filtered.filter(process => 
        process.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        process.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        process.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(process => process.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(process => process.priority === priorityFilter);
    }

    setFilteredProcesses(filtered);
  }, [processes, searchTerm, statusFilter, priorityFilter]);

  const fetchProcesses = async () => {
    try {
      console.log('Süreçler çekiliyor...');
      const response = await fetch(`${getApiBaseUrl()}/processes`);
      console.log('Processes API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Alınan süreç verisi:', data);
        setProcesses(data);
      } else {
        console.error('Processes API hatası:', response.status);
        toast.error('Süreçler yüklenemedi');
      }
    } catch (error) {
      console.error('Süreçler yüklenirken hata:', error);
      toast.error('Süreçler yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

  const handleCreateProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast.error('Başlık ve açıklama zorunludur');
      return;
    }

    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      toast.error('Oturum bilgisi bulunamadı');
      return;
    }

    setCreating(true);

    try {
      const processData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        budget: formData.budget ? parseFloat(formData.budget) : null,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : null,
        createdBy: currentUserId
      };

      console.log('API\'ye gönderilecek süreç verisi:', processData);

      const response = await fetch(`${getApiBaseUrl()}/processes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processData),
      });

      console.log('Process creation API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Süreç oluşturma başarılı:', result);
        toast.success('Süreç başarıyla oluşturuldu!');
        resetForm();
        setShowCreateModal(false);
        fetchProcesses();
      } else {
        const errorData = await response.json();
        console.error('Process creation API hatası:', errorData);
        toast.error(errorData.msg || 'Süreç oluşturulamadı');
      }
    } catch (error) {
      console.error('Süreç oluşturma hatası:', error);
      toast.error('Süreç oluşturulamadı: ' + (error as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusUpdate = async (processId: string, newStatus: string) => {
    try {
      const currentUserId = localStorage.getItem('userId');
      
      const response = await fetch(`${getApiBaseUrl()}/processes/${processId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          userId: currentUserId,
        }),
      });

      if (response.ok) {
        toast.success('Süreç durumu güncellendi');
        fetchProcesses();
      } else {
        const errorData = await response.json();
        toast.error(errorData.msg || 'Durum güncellenemedi');
      }
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      toast.error('Durum güncellenemedi');
    }
  };

  const handleProgressUpdate = async (processId: string, newProgress: number) => {
    try {
      const currentUserId = localStorage.getItem('userId');
      
      const response = await fetch(`${getApiBaseUrl()}/processes/${processId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progress: newProgress,
          userId: currentUserId,
        }),
      });

      if (response.ok) {
        toast.success('Süreç ilerlemesi güncellendi');
        fetchProcesses();
        // Modal'ı kapat
        setShowDetailModal(false);
        setSelectedProcess(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.msg || 'İlerleme güncellenemedi');
      }
    } catch (error) {
      console.error('İlerleme güncelleme hatası:', error);
      toast.error('İlerleme güncellenemedi');
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      assignedTeam: [],
      startDate: "",
      endDate: "",
      tags: "",
      budget: "",
      estimatedDuration: "",
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'active': return 'secondary';
      case 'planning': return 'outline';
      case 'on-hold': return 'destructive';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'active': return <Play className="h-4 w-4" />;
      case 'planning': return <Clock className="h-4 w-4" />;
      case 'on-hold': return <AlertCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Belirtilmemiş';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const getStats = (): ProcessStats => {
    const total = processes.length;
    const active = processes.filter(p => p.status === 'active').length;
    const completed = processes.filter(p => p.status === 'completed').length;
    const planning = processes.filter(p => p.status === 'planning').length;
    const onHold = processes.filter(p => p.status === 'on-hold').length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const avgDuration = processes.length > 0 
      ? processes.reduce((acc, p) => acc + (p.estimatedDuration || 0), 0) / processes.length 
      : 0;

    return {
      total,
      active,
      completed,
      planning,
      onHold,
      completionRate,
      averageDuration: avgDuration
    };
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
              <h1 className="text-3xl font-bold mb-2">Süreç Yönetimi</h1>
              <p className="text-muted-foreground">
                İş süreçlerini takip edin, yönetin ve optimize edin
              </p>
            </div>
            
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Yeni Süreç
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]" aria-describedby="process-create-description">
                <DialogHeader>
                  <DialogTitle>Yeni Süreç Oluştur</DialogTitle>
                </DialogHeader>
                <div id="process-create-description" className="sr-only">
                  Yeni iş süreci oluşturmak için formu doldurun.
                </div>
                
                <form onSubmit={handleCreateProcess} className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="title">Süreç Adı *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                        placeholder="Süreç adını girin"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Açıklama *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                        placeholder="Süreç açıklamasını girin"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="priority">Öncelik</Label>
                        <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({...prev, priority: value}))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Düşük</SelectItem>
                            <SelectItem value="medium">Orta</SelectItem>
                            <SelectItem value="high">Yüksek</SelectItem>
                            <SelectItem value="critical">Kritik</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="estimatedDuration">Tahmini Süre (gün)</Label>
                        <Input
                          id="estimatedDuration"
                          type="number"
                          value={formData.estimatedDuration}
                          onChange={(e) => setFormData(prev => ({...prev, estimatedDuration: e.target.value}))}
                          placeholder="90"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData(prev => ({...prev, startDate: e.target.value}))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="endDate">Bitiş Tarihi</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData(prev => ({...prev, endDate: e.target.value}))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="budget">Bütçe (TL)</Label>
                      <Input
                        id="budget"
                        type="number"
                        value={formData.budget}
                        onChange={(e) => setFormData(prev => ({...prev, budget: e.target.value}))}
                        placeholder="50000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="tags">Etiketler</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => setFormData(prev => ({...prev, tags: e.target.value}))}
                        placeholder="teknoloji, modernizasyon, sistem (virgülle ayırın)"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end space-x-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateModal(false)}
                    >
                      İptal
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? 'Oluşturuluyor...' : 'Süreç Oluştur'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-5 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Süreç</CardTitle>
                <Workflow className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktif</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Planlama</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.planning}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tamamlanma %</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
                <Progress value={stats.completionRate} className="mt-2" />
              </CardContent>
                </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
                  <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtreler ve Arama
                    </CardTitle>
                  </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Süreç ara..."
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
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="planning">Planlama</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="completed">Tamamlanan</SelectItem>
                    <SelectItem value="on-hold">Beklemede</SelectItem>
                    <SelectItem value="cancelled">İptal</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Öncelik" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Öncelikler</SelectItem>
                    <SelectItem value="critical">Kritik</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="medium">Orta</SelectItem>
                    <SelectItem value="low">Düşük</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={clearFilters}>
                  Filtreleri Temizle
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Processes Grid */}
          <Card>
                  <CardHeader>
              <CardTitle>
                Süreçler ({filteredProcesses.length})
                    </CardTitle>
              <CardDescription>
                Aktif ve planlanan iş süreçleri
              </CardDescription>
                  </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Süreçler yükleniyor...</p>
                </div>
              ) : filteredProcesses.length === 0 ? (
                <div className="text-center py-8">
                  <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {processes.length === 0 ? 'Henüz süreç yok' : 'Filtre kriterlerinize uygun süreç bulunamadı'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {processes.length === 0 
                      ? 'İlk süreci oluşturmak için yukarıdaki butonu kullanın'
                      : 'Filtreleri temizleyerek tüm süreçleri görüntüleyebilirsiniz'
                    }
                  </p>
                  {processes.length === 0 ? (
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      İlk Süreci Oluştur
                    </Button>
                  ) : (
                    <Button onClick={clearFilters} variant="outline">
                      Filtreleri Temizle
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredProcesses.map((process) => (
                    <Card key={process._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2">{process.title}</h3>
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant={getPriorityColor(process.priority)}>
                                {process.priority === 'low' ? 'Düşük' : 
                                 process.priority === 'medium' ? 'Orta' :
                                 process.priority === 'high' ? 'Yüksek' : 'Kritik'}
                              </Badge>
                              <Badge variant={getStatusColor(process.status)} className="gap-1">
                                {getStatusIcon(process.status)}
                                {process.status === 'planning' ? 'Planlama' :
                                 process.status === 'active' ? 'Aktif' :
                                 process.status === 'completed' ? 'Tamamlandı' :
                                 process.status === 'on-hold' ? 'Beklemede' : 'İptal'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <p className="text-muted-foreground text-sm mb-4">
                          {process.description}
                        </p>

                        {/* Progress */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">İlerleme</span>
                            <span className="text-sm text-muted-foreground">{process.progress}%</span>
                          </div>
                          <Progress value={process.progress} className="h-2" />
                        </div>

                        {/* Info */}
                        <div className="space-y-2 text-xs text-muted-foreground mb-4">
                          {process.budget && (
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-3 w-3" />
                              <span>Bütçe: {formatCurrency(process.budget)}</span>
                            </div>
                          )}
                          {process.estimatedDuration && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>Süre: {process.estimatedDuration} gün</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>Oluşturulma: {formatDate(process.createdAt)}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        {process.tags.length > 0 && (
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-1">
                              {process.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {process.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{process.tags.length - 3}
                                </Badge>
            )}
          </div>
                          </div>
                        )}

                        <Separator className="mb-4" />

                        {/* Actions */}
                        <div className="flex justify-between gap-2">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProcess(process);
                                setProgressValue(process.progress);
                                setShowDetailModal(true);
                              }}
                              className="gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              Detay
                            </Button>
                          </div>

                          <div className="flex gap-2">
                            <Select
                              value={process.status}
                              onValueChange={(value) => handleStatusUpdate(process._id, value)}
                            >
                              <SelectTrigger className="w-[110px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="planning">Planlama</SelectItem>
                                <SelectItem value="active">Aktif</SelectItem>
                                <SelectItem value="completed">Tamamlandı</SelectItem>
                                <SelectItem value="on-hold">Beklemede</SelectItem>
                                <SelectItem value="cancelled">İptal</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Process Detail Modal */}
        {selectedProcess && (
          <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
            <DialogContent className="sm:max-w-[700px]" aria-describedby="process-detail-description">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5" />
                  Süreç Detayları
                </DialogTitle>
              </DialogHeader>
              <div id="process-detail-description" className="sr-only">
                Seçilen sürecin detaylı bilgilerini görüntüleyin.
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{selectedProcess.title}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant={getPriorityColor(selectedProcess.priority)}>
                      {selectedProcess.priority === 'low' ? 'Düşük' : 
                       selectedProcess.priority === 'medium' ? 'Orta' :
                       selectedProcess.priority === 'high' ? 'Yüksek' : 'Kritik'}
                    </Badge>
                    <Badge variant={getStatusColor(selectedProcess.status)} className="gap-1">
                      {getStatusIcon(selectedProcess.status)}
                      {selectedProcess.status === 'planning' ? 'Planlama' :
                       selectedProcess.status === 'active' ? 'Aktif' :
                       selectedProcess.status === 'completed' ? 'Tamamlandı' :
                       selectedProcess.status === 'on-hold' ? 'Beklemede' : 'İptal'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{selectedProcess.description}</p>
                </div>

                <Separator />

                {/* Progress Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">İlerleme Durumu</h4>
                    <span className="text-sm text-muted-foreground">{selectedProcess.progress}%</span>
                  </div>
                  <Progress value={selectedProcess.progress} className="mb-4" />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={progressValue}
                      onChange={(e) => setProgressValue(parseInt(e.target.value) || 0)}
                      placeholder="İlerleme yüzdesi"
                    />
                    <Button 
                      onClick={() => handleProgressUpdate(selectedProcess._id, progressValue)}
                      variant="outline"
                    >
                      İlerlemeyi Güncelle
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Details Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Süreç Bilgileri</h4>
                    <div className="space-y-2 text-sm">
                      {selectedProcess.startDate && (
                        <div>
                          <span className="font-medium">Başlangıç:</span> {formatDate(selectedProcess.startDate)}
                        </div>
                      )}
                      {selectedProcess.endDate && (
                        <div>
                          <span className="font-medium">Bitiş:</span> {formatDate(selectedProcess.endDate)}
                        </div>
                      )}
                      {selectedProcess.estimatedDuration && (
                        <div>
                          <span className="font-medium">Tahmini Süre:</span> {selectedProcess.estimatedDuration} gün
                        </div>
                      )}
                      {selectedProcess.budget && (
                        <div>
                          <span className="font-medium">Bütçe:</span> {formatCurrency(selectedProcess.budget)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Sistem Bilgileri</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Oluşturulma:</span> {formatDate(selectedProcess.createdAt)}
                      </div>
                      <div>
                        <span className="font-medium">Son Güncelleme:</span> {formatDate(selectedProcess.updatedAt)}
                      </div>
                      <div>
                        <span className="font-medium">Oluşturan:</span> {selectedProcess.createdBy.name} ({selectedProcess.createdBy.email})
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned Team */}
                {selectedProcess.assignedTeam && selectedProcess.assignedTeam.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Atanan Ekip</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProcess.assignedTeam.map((member) => (
                        <div key={member._id} className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{member.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedProcess.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Etiketler</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProcess.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}