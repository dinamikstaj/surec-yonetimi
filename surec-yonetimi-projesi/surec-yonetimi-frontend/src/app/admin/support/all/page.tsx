"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Sidebar from '@/components/sidebar';
import { toast } from 'sonner';
import { getApiBaseUrl, getApiUrl } from '@/lib/utils';
import { 
  Calendar,
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Building,
  Mail,
  Phone,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  DollarSign,
  Timer,
  Play,
  FileText,
  Wrench,
  Shield,
  Users,
  BarChart3,
  TrendingUp,
  Monitor,
  MapPin
} from 'lucide-react';

interface SupportRequest {
  _id: string;
  supportNumber: string;
  customer: {
    _id: string;
    company: string;
    name: string;
    email: string;
    phone: string;
    city?: string;
  } | null;
  supportCategory: 'onsite' | 'remote' | 'maintenance';
  supportType: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  assignedTechnician?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  scheduledDate: string;
  estimatedDuration: number;
  actualDuration?: number;
  description: string;
  cost: {
    estimated: number;
    actual?: number;
    currency: string;
  };
  location?: {
    city: string;
    address?: string;
  };
  completedAt?: string;
  createdAt: string;
}

export default function AllSupportPage() {
  const router = useRouter();
  const [supports, setSupports] = useState<SupportRequest[]>([]);
  const [filteredSupports, setFilteredSupports] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedSupport, setSelectedSupport] = useState<SupportRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    fetchAllSupports();
  }, []);

  useEffect(() => {
    let filtered = supports;

    if (searchTerm) {
      filtered = filtered.filter(support =>
        support.supportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (support.customer && support.customer.company?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (support.customer && support.customer.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        support.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(support => support.supportCategory === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(support => support.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(support => support.priority === priorityFilter);
    }

    setFilteredSupports(filtered);
  }, [supports, searchTerm, categoryFilter, statusFilter, priorityFilter]);

  const fetchAllSupports = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/support/all-requests`);
      if (response.ok) {
        const data = await response.json();
        // Sadece müşteri bilgisi olan destek taleplerini göster
        const validSupports = data.filter((s: SupportRequest) => s.customer != null);
        setSupports(validSupports);
      } else {
        setSupports([]);
        toast.error('Tüm destek talepleri yüklenemedi');
      }
    } catch (error) {
      console.error('All support fetch error:', error);
      setSupports([]);
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      'onsite': { variant: 'default' as const, label: 'Yerinde', icon: Wrench },
      'remote': { variant: 'secondary' as const, label: 'Uzaktan', icon: Shield },
      'maintenance': { variant: 'outline' as const, label: 'Bakım', icon: Users }
    };
    
    const config = variants[category as keyof typeof variants] || variants.onsite;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'requested': { variant: 'secondary' as const, label: 'Talep Edildi' },
      'scheduled': { variant: 'outline' as const, label: 'Planlandı' },
      'in-progress': { variant: 'default' as const, label: 'Devam Ediyor' },
      'completed': { variant: 'default' as const, label: 'Tamamlandı' },
      'cancelled': { variant: 'destructive' as const, label: 'İptal' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.requested;
    
    return (
      <Badge variant={config.variant}>
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

  const getStats = () => {
    const total = supports.length;
    const onsite = supports.filter(s => s.supportCategory === 'onsite').length;
    const remote = supports.filter(s => s.supportCategory === 'remote').length;
    const maintenance = supports.filter(s => s.supportCategory === 'maintenance').length;
    const completed = supports.filter(s => s.status === 'completed').length;
    const inProgress = supports.filter(s => s.status === 'in-progress').length;
    const critical = supports.filter(s => s.priority === 'critical').length;
    
    const totalRevenue = supports
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + (s.cost.actual || s.cost.estimated), 0);

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      onsite,
      remote,
      maintenance,
      completed,
      inProgress,
      critical,
      totalRevenue,
      completionRate
    };
  };

  const stats = getStats();

  const handleViewDetails = (support: SupportRequest) => {
    setSelectedSupport(support);
    setShowDetailModal(true);
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
                  <Calendar className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Tüm Destek Talepleri
                  </h1>
                  <p className="text-muted-foreground">
                    Yerinde, uzaktan ve bakım desteği taleplerinin genel görünümü
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Genel Raporlar
                </Button>
                <Button onClick={() => router.push('/admin/support/onsite')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Destek
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-9">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Toplam Talep
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">Tüm kategoriler</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Yerinde
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.onsite}</div>
                <p className="text-xs text-muted-foreground mt-1">Lokasyonda</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Uzaktan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.remote}</div>
                <p className="text-xs text-muted-foreground mt-1">Online</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Bakım
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.maintenance}</div>
                <p className="text-xs text-muted-foreground mt-1">Rutin</p>
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
                  <AlertTriangle className="h-4 w-4" />
                  Kritik
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">{stats.critical}</div>
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
              <TabsTrigger value="analytics">Analitik Görünümü</TabsTrigger>
              <TabsTrigger value="calendar">Takvim Görünümü</TabsTrigger>
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
                          placeholder="Destek numarası, müşteri ara..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[130px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tümü</SelectItem>
                          <SelectItem value="onsite">Yerinde</SelectItem>
                          <SelectItem value="remote">Uzaktan</SelectItem>
                          <SelectItem value="maintenance">Bakım</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[130px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Durum" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tüm Durumlar</SelectItem>
                          <SelectItem value="requested">Talep Edildi</SelectItem>
                          <SelectItem value="scheduled">Planlandı</SelectItem>
                          <SelectItem value="in-progress">Devam Ediyor</SelectItem>
                          <SelectItem value="completed">Tamamlandı</SelectItem>
                          <SelectItem value="cancelled">İptal</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-[120px]">
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
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Support List */}
              <div className="grid gap-4">
                {filteredSupports.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Calendar className="h-24 w-24 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-2xl font-semibold mb-2">Destek talebi bulunamadı</h3>
                      <p className="text-muted-foreground mb-6">
                        Arama kriterlerinize uygun destek talebi bulunmuyor.
                      </p>
                      <Button variant="outline" onClick={() => {
                        setSearchTerm('');
                        setCategoryFilter('all');
                        setStatusFilter('all');
                        setPriorityFilter('all');
                      }}>
                        Filtreleri Temizle
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  filteredSupports.map((support) => (
                    <Card key={support._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="p-3 rounded-lg border bg-muted/50">
                                {support.supportCategory === 'onsite' && <Wrench className="h-6 w-6" />}
                                {support.supportCategory === 'remote' && <Shield className="h-6 w-6" />}
                                {support.supportCategory === 'maintenance' && <Users className="h-6 w-6" />}
                              </div>
                              
                              <div className="flex-1 space-y-3">
                                <div>
                                  <h3 className="text-xl font-semibold">#{support.supportNumber}</h3>
                                  {support.customer ? (
                                  <p className="text-muted-foreground">{support.customer.company} - {support.customer.name}</p>
                                  ) : (
                                    <p className="text-muted-foreground text-red-500">Müşteri bilgisi eksik</p>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  {support.customer && (
                                    <>
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-4 w-4" />
                                    <span>{support.customer.email}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-4 w-4" />
                                    <span>{support.customer.phone}</span>
                                  </div>
                                    </>
                                  )}
                                  {support.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      <span>{support.location.city}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{new Date(support.scheduledDate).toLocaleDateString('tr-TR')}</span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                  {getCategoryBadge(support.supportCategory)}
                                  {getStatusBadge(support.status)}
                                  {getPriorityBadge(support.priority)}
                                  
                                  <Badge variant="outline">
                                    <Timer className="h-3 w-3 mr-1" />
                                    {support.estimatedDuration}sa
                                  </Badge>
                                  
                                  <Badge variant="secondary">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    ₺{support.cost.estimated.toLocaleString()}
                                  </Badge>
                                </div>

                                {support.assignedTechnician && (
                                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                    <Avatar className="h-6 w-6">
                                      {support.assignedTechnician.avatar && (
                                        <AvatarImage src={`${getApiUrl()}${support.assignedTechnician.avatar}`} />
                                      )}
                                      <AvatarFallback className="text-xs">
                                        {support.assignedTechnician.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">
                                      <strong>Teknisyen:</strong> {support.assignedTechnician.name}
                                    </span>
                                  </div>
                                )}

                                <div className="p-3 bg-muted/50 rounded-lg">
                                  <p className="text-sm">
                                    <strong>Açıklama:</strong> {support.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(support)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Detay
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-24 w-24 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-2xl font-semibold mb-2">Analitik Görünümü</h3>
                  <p className="text-muted-foreground mb-6">
                    Detaylı analitik raporlar yakında eklenecektir.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar">
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-24 w-24 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-2xl font-semibold mb-2">Takvim Görünümü</h3>
                  <p className="text-muted-foreground mb-6">
                    Destek taleplerinin takvim görünümü yakında eklenecektir.
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
            <DialogTitle>Destek Talebi Detayları</DialogTitle>
          </DialogHeader>
          
          {selectedSupport && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Müşteri Bilgileri</h4>
                  {selectedSupport.customer ? (
                    <div className="space-y-2 text-sm">
                      <p><strong>Şirket:</strong> {selectedSupport.customer.company}</p>
                      <p><strong>Yetkili:</strong> {selectedSupport.customer.name}</p>
                      <p><strong>E-posta:</strong> {selectedSupport.customer.email}</p>
                      <p><strong>Telefon:</strong> {selectedSupport.customer.phone}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-500">Müşteri bilgisi bulunamadı</p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Destek Bilgileri</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Destek No:</strong> {selectedSupport.supportNumber}</p>
                    <p><strong>Kategori:</strong> {getCategoryBadge(selectedSupport.supportCategory)}</p>
                    <p><strong>Durum:</strong> {getStatusBadge(selectedSupport.status)}</p>
                    <p><strong>Öncelik:</strong> {getPriorityBadge(selectedSupport.priority)}</p>
                    <p><strong>Planlanan Tarih:</strong> {new Date(selectedSupport.scheduledDate).toLocaleDateString('tr-TR')}</p>
                    <p><strong>Tahmini Süre:</strong> {selectedSupport.estimatedDuration} saat</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Destek Açıklaması</h4>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{selectedSupport.description}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  Kapat
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
