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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import Sidebar from '@/components/sidebar';
import { toast } from 'sonner';
import { getApiBaseUrl, getApiUrl } from '@/lib/utils';
import { 
  Users,
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
  Calendar,
  DollarSign,
  Timer,
  Play,
  FileText,
  Wrench,
  Settings,
  BarChart3,
  Shield,
  Zap
} from 'lucide-react';

interface Customer {
  _id: string;
  company: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  hasMaintenanceContract?: boolean;
  maintenanceEndDate?: string;
}

interface MaintenanceSupport {
  _id: string;
  supportNumber: string;
  customer: Customer | null;
  maintenanceType: 'preventive' | 'corrective' | 'predictive' | 'emergency' | 'scheduled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'rescheduled';
  assignedTechnician?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    specialization: string[];
  };
  scheduledDate: string;
  estimatedDuration: number;
  actualDuration?: number;
  description: string;
  maintenanceItems: Array<{
    item: string;
    status: 'pending' | 'completed' | 'failed';
    notes?: string;
  }>;
  cost: {
    estimated: number;
    actual?: number;
    parts?: number;
    currency: string;
  };
  contractInfo?: {
    contractId: string;
    remainingVisits: number;
    totalVisits: number;
    contractEndDate: string;
  };
  equipmentChecked?: string[];
  issuesFound?: string[];
  recommendations?: string[];
  nextMaintenanceDate?: string;
  completedAt?: string;
  createdAt: string;
}

export default function MaintenanceSupportPage() {
  const router = useRouter();
  const [supports, setSupports] = useState<MaintenanceSupport[]>([]);
  const [filteredSupports, setFilteredSupports] = useState<MaintenanceSupport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedSupport, setSelectedSupport] = useState<MaintenanceSupport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchMaintenanceSupports();
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

    if (statusFilter !== 'all') {
      filtered = filtered.filter(support => support.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(support => support.maintenanceType === typeFilter);
    }

    setFilteredSupports(filtered);
  }, [supports, searchTerm, statusFilter, typeFilter]);

  const fetchMaintenanceSupports = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/support/maintenance-support`);
      if (response.ok) {
        const data = await response.json();
        // SADECE bakım anlaşması OLAN müşterilerin destek taleplerini göster
        const validSupports = data.filter((s: MaintenanceSupport) => 
          s.customer && s.customer.hasMaintenanceContract === true
        );
        setSupports(validSupports);
      } else {
        setSupports([]);
        toast.error('Bakım destek talepleri yüklenemedi');
      }
    } catch (error) {
      console.error('Maintenance support fetch error:', error);
      setSupports([]);
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'scheduled': { variant: 'secondary' as const, label: 'Planlandı', icon: Calendar },
      'in-progress': { variant: 'default' as const, label: 'Devam Ediyor', icon: Play },
      'completed': { variant: 'default' as const, label: 'Tamamlandı', icon: CheckCircle },
      'cancelled': { variant: 'destructive' as const, label: 'İptal Edildi', icon: XCircle },
      'rescheduled': { variant: 'outline' as const, label: 'Yeniden Planlandı', icon: Clock }
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

  const getMaintenanceTypeBadge = (type: string) => {
    const variants = {
      'preventive': { variant: 'default' as const, label: 'Önleyici Bakım', icon: Shield },
      'corrective': { variant: 'outline' as const, label: 'Düzeltici Bakım', icon: Wrench },
      'predictive': { variant: 'secondary' as const, label: 'Öngörülü Bakım', icon: BarChart3 },
      'emergency': { variant: 'destructive' as const, label: 'Acil Bakım', icon: AlertTriangle },
      'scheduled': { variant: 'default' as const, label: 'Planlı Bakım', icon: Calendar }
    };
    
    const config = variants[type as keyof typeof variants] || variants.preventive;
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

  const getStats = () => {
    const total = supports.length;
    const scheduled = supports.filter(s => s.status === 'scheduled').length;
    const inProgress = supports.filter(s => s.status === 'in-progress').length;
    const completed = supports.filter(s => s.status === 'completed').length;
    const cancelled = supports.filter(s => s.status === 'cancelled').length;
    
    const preventive = supports.filter(s => s.maintenanceType === 'preventive').length;
    const emergency = supports.filter(s => s.maintenanceType === 'emergency').length;
    
    const totalRevenue = supports
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + (s.cost.actual || s.cost.estimated), 0);

    return {
      total,
      scheduled,
      inProgress,
      completed,
      cancelled,
      preventive,
      emergency,
      totalRevenue
    };
  };

  const stats = getStats();

  const handleViewDetails = (support: MaintenanceSupport) => {
    setSelectedSupport(support);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async (supportId: string, newStatus: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/support/maintenance-support/${supportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success('Bakım durumu güncellendi');
        fetchMaintenanceSupports();
      } else {
        toast.error('Durum güncellenemedi');
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Güncelleme sırasında hata oluştu');
    }
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
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Bakım Desteği Servisi
                  </h1>
                  <p className="text-muted-foreground">
                    Sadece bakım anlaşmalı müşterilere özel destek hizmetleri
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Bakım Raporları
                </Button>
                <Button onClick={() => router.push('/admin/maintenance/active')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Bakım Anlaşmaları
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Toplam Bakım
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">Talep</p>
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
                  <Shield className="h-4 w-4" />
                  Önleyici Bakım
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.preventive}</div>
                <p className="text-xs text-muted-foreground mt-1">Proaktif</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Acil Bakım
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">{stats.emergency}</div>
                <p className="text-xs text-muted-foreground mt-1">Kritik</p>
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
                  <DollarSign className="h-4 w-4" />
                  Toplam Gelir
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₺{stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Tamamlanan</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Bakım numarası, müşteri ara..."
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
                      <SelectItem value="rescheduled">Yeniden Planlandı</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Bakım Türü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Türler</SelectItem>
                      <SelectItem value="preventive">Önleyici</SelectItem>
                      <SelectItem value="corrective">Düzeltici</SelectItem>
                      <SelectItem value="predictive">Öngörülü</SelectItem>
                      <SelectItem value="emergency">Acil</SelectItem>
                      <SelectItem value="scheduled">Planlı</SelectItem>
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
                  <Users className="h-24 w-24 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-2xl font-semibold mb-2">Bakım desteği bulunamadı</h3>
                  <p className="text-muted-foreground mb-6">
                    Sadece bakım anlaşmalı müşteriler için destek talebi oluşturulabilir.
                  </p>
                  <Button variant="outline" onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTypeFilter('all');
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
                            <Users className="h-6 w-6" />
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
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(support.scheduledDate).toLocaleDateString('tr-TR')}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                              {getStatusBadge(support.status)}
                              {getPriorityBadge(support.priority)}
                              {getMaintenanceTypeBadge(support.maintenanceType)}
                              
                              <Badge variant="outline">
                                <Timer className="h-3 w-3 mr-1" />
                                {support.estimatedDuration}sa
                              </Badge>
                              
                              <Badge variant="secondary">
                                <DollarSign className="h-3 w-3 mr-1" />
                                ₺{support.cost.estimated.toLocaleString()}
                              </Badge>
                            </div>

                            {support.contractInfo && (
                              <div className="p-2 bg-muted/50 rounded-lg">
                                <div className="flex items-center justify-between text-sm">
                                  <span><strong>Anlaşma Kapsamında</strong></span>
                                  <Badge variant="outline">
                                    {support.contractInfo.remainingVisits}/{support.contractInfo.totalVisits} kalan
                                  </Badge>
                                </div>
                              </div>
                            )}

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
                        
                        {support.status === 'scheduled' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(support._id, 'in-progress')}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Başlat
                          </Button>
                        )}
                        
                        {support.status === 'in-progress' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(support._id, 'completed')}
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
        </div>
      </main>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bakım Desteği Detayları</DialogTitle>
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
                  <h4 className="font-medium mb-2">Bakım Bilgileri</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Bakım No:</strong> {selectedSupport.supportNumber}</p>
                    <p><strong>Tür:</strong> {getMaintenanceTypeBadge(selectedSupport.maintenanceType)}</p>
                    <p><strong>Durum:</strong> {getStatusBadge(selectedSupport.status)}</p>
                    <p><strong>Öncelik:</strong> {getPriorityBadge(selectedSupport.priority)}</p>
                    <p><strong>Planlanan Tarih:</strong> {new Date(selectedSupport.scheduledDate).toLocaleDateString('tr-TR')}</p>
                    <p><strong>Tahmini Süre:</strong> {selectedSupport.estimatedDuration} saat</p>
                  </div>
                </div>
              </div>

              {selectedSupport.maintenanceItems && selectedSupport.maintenanceItems.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Bakım Kalemleri</h4>
                  <div className="space-y-2">
                    {selectedSupport.maintenanceItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <span className="text-sm">{item.item}</span>
                        <Badge variant={
                          item.status === 'completed' ? 'default' : 
                          item.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {item.status === 'completed' ? 'Tamamlandı' : 
                           item.status === 'failed' ? 'Başarısız' : 'Bekliyor'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSupport.contractInfo && (
                <div>
                  <h4 className="font-medium mb-2">Anlaşma Bilgileri</h4>
                  <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
                    <p><strong>Kalan Ziyaret:</strong> {selectedSupport.contractInfo.remainingVisits}/{selectedSupport.contractInfo.totalVisits}</p>
                    <p><strong>Anlaşma Bitiş:</strong> {new Date(selectedSupport.contractInfo.contractEndDate).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
              )}

              <Separator />

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
