"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Sidebar from '@/components/sidebar';
import { toast } from 'sonner';
import { getApiBaseUrl, getApiUrl } from '@/lib/utils';
import {
  Wrench,
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Building,
  Mail,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  User,
  Calendar,
  DollarSign,
  Timer,
  Play,
  Pause,
  Square,
  FileText,
  Camera,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Users
} from 'lucide-react';

interface Customer {
  _id: string;
  company: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
}

interface ServiceTechnician {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  specialization: string[];
  currentJobs: number;
  rating: number;
}

interface ServiceJob {
  _id: string;
  jobNumber: string;
  customer: Customer;
  serviceType: 'installation' | 'maintenance' | 'repair' | 'upgrade' | 'consultation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'on-hold';
  assignedTechnician?: ServiceTechnician;
  scheduledDate: string;
  estimatedDuration: number; // hours
  actualDuration?: number;
  description: string;
  location: {
    address: string;
    city: string;
    coordinates?: { lat: number; lng: number; };
  };
  equipment?: string[];
  cost: {
    estimated: number;
    actual?: number;
    currency: string;
  };
  notes?: string;
  photos?: string[];
  customerSignature?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ServiceJobStats {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  onHold: number;
  overdue: number;
  totalRevenue: number;
  avgDuration: number;
  completionRate: number;
}

export default function ServiceJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<ServiceJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<ServiceJob[]>([]);
  const [technicians, setTechnicians] = useState<ServiceTechnician[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<ServiceJob | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    fetchServiceJobs();
    fetchTechnicians();
  }, []);

  useEffect(() => {
    let filtered = jobs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(job => job.priority === priorityFilter);
    }

    // Technician filter
    if (technicianFilter !== 'all') {
      filtered = filtered.filter(job => job.assignedTechnician?._id === technicianFilter);
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter, priorityFilter, technicianFilter]);

  const fetchServiceJobs = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/service-jobs`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      } else {
        // Fallback to empty array if API fails
        setJobs([]);
        toast.error('Servis işleri yüklenemedi');
      }
    } catch (error) {
      console.error('Service jobs fetch error:', error);
      setJobs([]);
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/technicians`);
      if (response.ok) {
        const data = await response.json();
        setTechnicians(data);
      } else {
        setTechnicians([]);
      }
    } catch (error) {
      console.error('Technicians fetch error:', error);
      setTechnicians([]);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'scheduled': { variant: 'secondary' as const, label: 'Planlandı', icon: Calendar },
      'in-progress': { variant: 'default' as const, label: 'Devam Ediyor', icon: Play },
      'completed': { variant: 'default' as const, label: 'Tamamlandı', icon: CheckCircle },
      'cancelled': { variant: 'destructive' as const, label: 'İptal Edildi', icon: XCircle },
      'on-hold': { variant: 'outline' as const, label: 'Beklemede', icon: Pause }
    };
    
    const config = variants[status as keyof typeof variants] || variants.scheduled;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      'low': { variant: 'secondary' as const, label: 'Düşük' },
      'medium': { variant: 'outline' as const, label: 'Orta' },
      'high': { variant: 'default' as const, label: 'Yüksek' },
      'critical': { variant: 'destructive' as const, label: 'Kritik' }
    };
    
    const config = variants[priority as keyof typeof variants] || variants.medium;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getServiceTypeBadge = (type: string) => {
    const variants = {
      'installation': { variant: 'default' as const, label: 'Kurulum' },
      'maintenance': { variant: 'secondary' as const, label: 'Bakım' },
      'repair': { variant: 'outline' as const, label: 'Onarım' },
      'upgrade': { variant: 'default' as const, label: 'Yükseltme' },
      'consultation': { variant: 'secondary' as const, label: 'Danışmanlık' }
    };
    
    const config = variants[type as keyof typeof variants] || variants.maintenance;
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getStats = (): ServiceJobStats => {
    const total = jobs.length;
    const scheduled = jobs.filter(j => j.status === 'scheduled').length;
    const inProgress = jobs.filter(j => j.status === 'in-progress').length;
    const completed = jobs.filter(j => j.status === 'completed').length;
    const cancelled = jobs.filter(j => j.status === 'cancelled').length;
    const onHold = jobs.filter(j => j.status === 'on-hold').length;
    
    // Calculate overdue jobs
    const now = new Date();
    const overdue = jobs.filter(j => {
      if (j.status === 'completed' || j.status === 'cancelled') return false;
      return new Date(j.scheduledDate) < now;
    }).length;
    
    const totalRevenue = jobs
      .filter(j => j.status === 'completed')
      .reduce((sum, j) => sum + (j.cost.actual || j.cost.estimated), 0);
    
    const completedJobs = jobs.filter(j => j.status === 'completed' && j.actualDuration);
    const avgDuration = completedJobs.length > 0 
      ? completedJobs.reduce((sum, j) => sum + (j.actualDuration || 0), 0) / completedJobs.length
      : 0;
    
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      scheduled,
      inProgress,
      completed,
      cancelled,
      onHold,
      overdue,
      totalRevenue,
      avgDuration,
      completionRate
    };
  };

  const stats = getStats();

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/service-jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success('İş durumu güncellendi');
        fetchServiceJobs();
      } else {
        toast.error('Durum güncellenemedi');
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Güncelleme sırasında hata oluştu');
    }
  };

  const handleViewDetails = (job: ServiceJob) => {
    setSelectedJob(job);
    setShowDetailModal(true);
  };

  const isOverdue = (job: ServiceJob) => {
    if (job.status === 'completed' || job.status === 'cancelled') return false;
    return new Date(job.scheduledDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
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
      
      <main className="flex-1 p-6 lg:p-8 ml-16 lg:ml-0">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/admin/dashboard')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg border">
                  <Wrench className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Servis İşleri Takibi
                  </h1>
                  <p className="text-muted-foreground">
                    Tüm servis işlerini takip edin ve yönetin
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Raporlar
                </Button>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Servis İşi
          </Button>
        </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-10">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Toplam İş
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">Servis</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Planlandı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.scheduled}</div>
                <p className="text-xs text-muted-foreground mt-1">Bekliyor</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Devam Ediyor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.inProgress}</div>
                <p className="text-xs text-muted-foreground mt-1">Aktif</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Tamamlandı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.completed}</div>
                <p className="text-xs text-muted-foreground mt-1">Başarılı</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  İptal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.cancelled}</div>
                <p className="text-xs text-muted-foreground mt-1">İptal</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Pause className="h-4 w-4" />
                  Beklemede
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.onHold}</div>
                <p className="text-xs text-muted-foreground mt-1">Durduruldu</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Gecikmiş
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">{stats.overdue}</div>
                <p className="text-xs text-muted-foreground mt-1">Acil</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Toplam Gelir
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₺{stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Tamamlanan</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Ort. Süre
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.avgDuration.toFixed(1)}sa</div>
                <p className="text-xs text-muted-foreground mt-1">Ortalama</p>
              </CardContent>
            </Card>

        <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Başarı Oranı
                </CardTitle>
          </CardHeader>
          <CardContent>
                <div className="text-3xl font-bold">{stats.completionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Tamamlama</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="list">Liste Görünümü</TabsTrigger>
              <TabsTrigger value="calendar">Takvim Görünümü</TabsTrigger>
              <TabsTrigger value="technicians">Teknisyen Takibi</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="İş numarası, müşteri, şehir ara..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Durum" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tüm Durumlar</SelectItem>
                          <SelectItem value="scheduled">Planlandı</SelectItem>
                          <SelectItem value="in-progress">Devam Ediyor</SelectItem>
                          <SelectItem value="completed">Tamamlandı</SelectItem>
                          <SelectItem value="cancelled">İptal</SelectItem>
                          <SelectItem value="on-hold">Beklemede</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-[130px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Öncelik" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tümü</SelectItem>
                          <SelectItem value="low">Düşük</SelectItem>
                          <SelectItem value="medium">Orta</SelectItem>
                          <SelectItem value="high">Yüksek</SelectItem>
                          <SelectItem value="critical">Kritik</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
                        <SelectTrigger className="w-[150px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Teknisyen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tüm Teknisyenler</SelectItem>
                          {technicians.map((tech) => (
                            <SelectItem key={tech._id} value={tech._id}>
                              {tech.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Jobs List */}
              <div className="grid gap-4">
                {filteredJobs.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Wrench className="h-24 w-24 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-2xl font-semibold mb-2">Servis işi bulunamadı</h3>
                      <p className="text-muted-foreground mb-6">
                        Arama kriterlerinize uygun servis işi bulunmuyor.
                      </p>
                      <Button variant="outline" onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setPriorityFilter('all');
                        setTechnicianFilter('all');
                      }}>
                        Filtreleri Temizle
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  filteredJobs.map((job) => (
                    <Card key={job._id} className={`hover:shadow-md transition-shadow ${isOverdue(job) ? 'border-destructive' : ''}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="p-3 rounded-lg border bg-muted/50">
                                <Wrench className="h-6 w-6" />
                              </div>
                              
                              <div className="flex-1 space-y-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-xl font-semibold">#{job.jobNumber}</h3>
                                    {isOverdue(job) && (
                                      <Badge variant="destructive" className="gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Gecikmiş
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground">{job.customer.company} - {job.customer.name}</p>
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-4 w-4" />
                                    <span>{job.customer.email}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-4 w-4" />
                                    <span>{job.customer.phone}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>{job.location.city}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{new Date(job.scheduledDate).toLocaleDateString('tr-TR')}</span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                  {getStatusBadge(job.status)}
                                  {getPriorityBadge(job.priority)}
                                  {getServiceTypeBadge(job.serviceType)}
                                  
                                  <Badge variant="outline">
                                    <Timer className="h-3 w-3 mr-1" />
                                    {job.estimatedDuration}sa
                                  </Badge>
                                  
                                  <Badge variant="secondary">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    ₺{job.cost.estimated.toLocaleString()}
                                  </Badge>
                                </div>

                                {job.assignedTechnician && (
                                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                    <Avatar className="h-6 w-6">
                                      {job.assignedTechnician.avatar && (
                                        <AvatarImage src={`${getApiUrl()}${job.assignedTechnician.avatar}`} />
                                      )}
                                      <AvatarFallback className="text-xs">
                                        {job.assignedTechnician.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">
                                      <strong>Teknisyen:</strong> {job.assignedTechnician.name}
                                    </span>
                                  </div>
                                )}

                                <div className="p-3 bg-muted/50 rounded-lg">
                                  <p className="text-sm">
                                    <strong>Açıklama:</strong> {job.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(job)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Detay
                            </Button>
                            
                            {job.status === 'scheduled' && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(job._id, 'in-progress')}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Başlat
                              </Button>
                            )}
                            
                            {job.status === 'in-progress' && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(job._id, 'completed')}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Tamamla
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="calendar">
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-24 w-24 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-2xl font-semibold mb-2">Takvim Görünümü</h3>
                  <p className="text-muted-foreground mb-6">
                    Servis işlerinin takvim görünümü yakında eklenecektir.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technicians">
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-24 w-24 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-2xl font-semibold mb-2">Teknisyen Takibi</h3>
                  <p className="text-muted-foreground mb-6">
                    Teknisyen performans takibi yakında eklenecektir.
                  </p>
          </CardContent>
        </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Servis İşi Detayları</DialogTitle>
          </DialogHeader>
          
          {selectedJob && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Müşteri Bilgileri</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Şirket:</strong> {selectedJob.customer.company}</p>
                    <p><strong>Yetkili:</strong> {selectedJob.customer.name}</p>
                    <p><strong>E-posta:</strong> {selectedJob.customer.email}</p>
                    <p><strong>Telefon:</strong> {selectedJob.customer.phone}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">İş Bilgileri</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>İş Numarası:</strong> {selectedJob.jobNumber}</p>
                    <p><strong>Servis Türü:</strong> {getServiceTypeBadge(selectedJob.serviceType)}</p>
                    <p><strong>Durum:</strong> {getStatusBadge(selectedJob.status)}</p>
                    <p><strong>Öncelik:</strong> {getPriorityBadge(selectedJob.priority)}</p>
                    <p><strong>Planlanan Tarih:</strong> {new Date(selectedJob.scheduledDate).toLocaleDateString('tr-TR')}</p>
                    <p><strong>Tahmini Süre:</strong> {selectedJob.estimatedDuration} saat</p>
                    {selectedJob.actualDuration && (
                      <p><strong>Gerçek Süre:</strong> {selectedJob.actualDuration} saat</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Lokasyon</h4>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{selectedJob.location.address}, {selectedJob.location.city}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">İş Açıklaması</h4>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{selectedJob.description}</p>
                </div>
              </div>

              {selectedJob.assignedTechnician && (
                <div>
                  <h4 className="font-medium mb-2">Atanan Teknisyen</h4>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Avatar>
                      {selectedJob.assignedTechnician.avatar && (
                        <AvatarImage src={`${getApiUrl()}${selectedJob.assignedTechnician.avatar}`} />
                      )}
                      <AvatarFallback>
                        {selectedJob.assignedTechnician.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedJob.assignedTechnician.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedJob.assignedTechnician.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Uzmanlık: {selectedJob.assignedTechnician.specialization.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedJob.equipment && selectedJob.equipment.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Gerekli Ekipman</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.equipment.map((item, index) => (
                      <Badge key={index} variant="outline">{item}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Maliyet</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm"><strong>Tahmini:</strong> ₺{selectedJob.cost.estimated.toLocaleString()}</p>
                  </div>
                  {selectedJob.cost.actual && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm"><strong>Gerçek:</strong> ₺{selectedJob.cost.actual.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedJob.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notlar</h4>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{selectedJob.notes}</p>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  Kapat
                </Button>
                {selectedJob.status !== 'completed' && selectedJob.status !== 'cancelled' && (
                  <Button onClick={() => {
                    // Edit functionality would go here
                    toast.info('Düzenleme özelliği yakında eklenecek');
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Düzenle
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Job Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Servis İşi Oluştur</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50 text-center">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Yeni servis işi oluşturma formu yakında eklenecektir.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                İptal
              </Button>
              <Button disabled>
                <Plus className="h-4 w-4 mr-2" />
                Oluştur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}