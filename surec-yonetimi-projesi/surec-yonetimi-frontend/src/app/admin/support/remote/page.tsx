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
import Sidebar from '@/components/sidebar';
import { toast } from 'sonner';
import { getApiBaseUrl, getApiUrl } from '@/lib/utils';
import { 
  Shield,
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
  User,
  Calendar,
  DollarSign,
  Timer,
  Play,
  Pause,
  FileText,
  Monitor,
  Wifi,
  BarChart3,
  Users,
  Globe
} from 'lucide-react';

interface Customer {
  _id: string;
  company: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
}

interface RemoteSupport {
  _id: string;
  supportNumber: string;
  customer: Customer | null;
  supportType: 'remote-access' | 'phone-support' | 'email-support' | 'video-call' | 'screen-sharing';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'requested' | 'in-progress' | 'completed' | 'cancelled' | 'waiting-customer';
  assignedTechnician?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    specialization: string[];
  };
  scheduledDate: string;
  estimatedDuration: number; // hours
  actualDuration?: number;
  description: string;
  remoteAccessInfo?: {
    platform: 'teamviewer' | 'anydesk' | 'rdp' | 'vnc' | 'custom';
    connectionId?: string;
    password?: string;
    port?: number;
  };
  communicationChannel: 'phone' | 'email' | 'teams' | 'zoom' | 'whatsapp';
  cost: {
    estimated: number;
    actual?: number;
    currency: string;
  };
  sessionLogs?: Array<{
    startTime: string;
    endTime: string;
    duration: number;
    activities: string[];
  }>;
  notes?: string;
  customerFeedback?: {
    rating: number;
    comment: string;
  };
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function RemoteSupportPage() {
  const router = useRouter();
  const [supports, setSupports] = useState<RemoteSupport[]>([]);
  const [filteredSupports, setFilteredSupports] = useState<RemoteSupport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedSupport, setSelectedSupport] = useState<RemoteSupport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchRemoteSupports();
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

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(support => support.priority === priorityFilter);
    }

    setFilteredSupports(filtered);
  }, [supports, searchTerm, statusFilter, priorityFilter]);

  const fetchRemoteSupports = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/support/remote`);
      if (response.ok) {
        const data = await response.json();
        // Sadece müşteri bilgisi olan destek taleplerini göster
        const validSupports = data.filter((s: RemoteSupport) => s.customer != null);
        setSupports(validSupports);
      } else {
        setSupports([]);
        toast.error('Uzaktan destek talepleri yüklenemedi');
      }
    } catch (error) {
      console.error('Remote support fetch error:', error);
      setSupports([]);
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'requested': { variant: 'secondary' as const, label: 'Talep Edildi', icon: FileText },
      'in-progress': { variant: 'default' as const, label: 'Devam Ediyor', icon: Play },
      'completed': { variant: 'default' as const, label: 'Tamamlandı', icon: CheckCircle },
      'cancelled': { variant: 'destructive' as const, label: 'İptal Edildi', icon: XCircle },
      'waiting-customer': { variant: 'outline' as const, label: 'Müşteri Bekliyor', icon: Clock }
    };
    
    const config = variants[status as keyof typeof variants] || variants.requested;
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

  const getSupportTypeBadge = (type: string) => {
    const variants = {
      'remote-access': { variant: 'default' as const, label: 'Uzaktan Erişim', icon: Monitor },
      'phone-support': { variant: 'secondary' as const, label: 'Telefon Desteği', icon: Phone },
      'email-support': { variant: 'outline' as const, label: 'E-posta Desteği', icon: Mail },
      'video-call': { variant: 'default' as const, label: 'Video Görüşme', icon: Globe },
      'screen-sharing': { variant: 'secondary' as const, label: 'Ekran Paylaşımı', icon: Monitor }
    };
    
    const config = variants[type as keyof typeof variants] || variants['remote-access'];
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStats = () => {
    const total = supports.length;
    const requested = supports.filter(s => s.status === 'requested').length;
    const inProgress = supports.filter(s => s.status === 'in-progress').length;
    const completed = supports.filter(s => s.status === 'completed').length;
    const cancelled = supports.filter(s => s.status === 'cancelled').length;
    const waitingCustomer = supports.filter(s => s.status === 'waiting-customer').length;
    
    const totalRevenue = supports
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + (s.cost.actual || s.cost.estimated), 0);
    
    const avgDuration = supports.filter(s => s.actualDuration).length > 0
      ? supports.filter(s => s.actualDuration).reduce((sum, s) => sum + (s.actualDuration || 0), 0) / supports.filter(s => s.actualDuration).length
      : 0;

    const avgRating = supports.filter(s => s.customerFeedback?.rating).length > 0
      ? supports.filter(s => s.customerFeedback?.rating).reduce((sum, s) => sum + (s.customerFeedback?.rating || 0), 0) / supports.filter(s => s.customerFeedback?.rating).length
      : 0;

    return {
      total,
      requested,
      inProgress,
      completed,
      cancelled,
      waitingCustomer,
      totalRevenue,
      avgDuration,
      avgRating
    };
  };

  const stats = getStats();

  const handleViewDetails = (support: RemoteSupport) => {
    setSelectedSupport(support);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async (supportId: string, newStatus: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/support/remote/${supportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success('Destek durumu güncellendi');
        fetchRemoteSupports();
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
                  <Shield className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Uzaktan Destek Servisi
                  </h1>
                  <p className="text-muted-foreground">
                    Online ve uzaktan erişim ile destek hizmetlerini yönetin
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
                  Yeni Uzaktan Destek
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-9">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Toplam Destek
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">Uzaktan</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Talep Edildi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.requested}</div>
                <p className="text-xs text-muted-foreground mt-1">Yeni</p>
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
                  <Clock className="h-4 w-4" />
                  Müşteri Bekliyor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.waitingCustomer}</div>
                <p className="text-xs text-muted-foreground mt-1">Beklemede</p>
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
                  <Users className="h-4 w-4" />
                  Müşteri Puanı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.avgRating.toFixed(1)}/5</div>
                <p className="text-xs text-muted-foreground mt-1">Memnuniyet</p>
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
                      placeholder="Destek numarası, müşteri ara..."
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
                      <SelectItem value="requested">Talep Edildi</SelectItem>
                      <SelectItem value="in-progress">Devam Ediyor</SelectItem>
                      <SelectItem value="completed">Tamamlandı</SelectItem>
                      <SelectItem value="waiting-customer">Müşteri Bekliyor</SelectItem>
                      <SelectItem value="cancelled">İptal</SelectItem>
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support List */}
          <div className="grid gap-4">
            {filteredSupports.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Shield className="h-24 w-24 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-2xl font-semibold mb-2">Uzaktan destek bulunamadı</h3>
                  <p className="text-muted-foreground mb-6">
                    Arama kriterlerinize uygun uzaktan destek talebi bulunmuyor.
                  </p>
                  <Button variant="outline" onClick={() => {
                    setSearchTerm('');
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
                            <Shield className="h-6 w-6" />
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
                              {getSupportTypeBadge(support.supportType)}
                              
                              <Badge variant="outline">
                                <Timer className="h-3 w-3 mr-1" />
                                {support.estimatedDuration}sa
                              </Badge>
                              
                              <Badge variant="secondary">
                                <DollarSign className="h-3 w-3 mr-1" />
                                ₺{support.cost.estimated.toLocaleString()}
                              </Badge>

                              <Badge variant="outline">
                                <Wifi className="h-3 w-3 mr-1" />
                                {support.communicationChannel.toUpperCase()}
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
                        
                        {support.status === 'requested' && (
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
            <DialogTitle>Uzaktan Destek Detayları</DialogTitle>
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
                    <p><strong>Tür:</strong> {getSupportTypeBadge(selectedSupport.supportType)}</p>
                    <p><strong>Durum:</strong> {getStatusBadge(selectedSupport.status)}</p>
                    <p><strong>Öncelik:</strong> {getPriorityBadge(selectedSupport.priority)}</p>
                    <p><strong>İletişim Kanalı:</strong> {selectedSupport.communicationChannel.toUpperCase()}</p>
                    <p><strong>Tahmini Süre:</strong> {selectedSupport.estimatedDuration} saat</p>
                    {selectedSupport.actualDuration && (
                      <p><strong>Gerçek Süre:</strong> {selectedSupport.actualDuration} saat</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Destek Açıklaması</h4>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{selectedSupport.description}</p>
                </div>
              </div>

              {selectedSupport.remoteAccessInfo && (
                <div>
                  <h4 className="font-medium mb-2">Uzaktan Erişim Bilgileri</h4>
                  <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
                    <p><strong>Platform:</strong> {selectedSupport.remoteAccessInfo.platform.toUpperCase()}</p>
                    {selectedSupport.remoteAccessInfo.connectionId && (
                      <p><strong>Bağlantı ID:</strong> {selectedSupport.remoteAccessInfo.connectionId}</p>
                    )}
                    {selectedSupport.remoteAccessInfo.port && (
                      <p><strong>Port:</strong> {selectedSupport.remoteAccessInfo.port}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedSupport.assignedTechnician && (
                <div>
                  <h4 className="font-medium mb-2">Atanan Teknisyen</h4>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Avatar>
                      {selectedSupport.assignedTechnician.avatar && (
                        <AvatarImage src={`${getApiUrl()}${selectedSupport.assignedTechnician.avatar}`} />
                      )}
                      <AvatarFallback>
                        {selectedSupport.assignedTechnician.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedSupport.assignedTechnician.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedSupport.assignedTechnician.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Uzmanlık: {selectedSupport.assignedTechnician.specialization.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedSupport.customerFeedback && (
                <div>
                  <h4 className="font-medium mb-2">Müşteri Geri Bildirimi</h4>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">Puan:</span>
                      <Badge variant="default">{selectedSupport.customerFeedback.rating}/5</Badge>
                    </div>
                    <p className="text-sm">{selectedSupport.customerFeedback.comment}</p>
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

      {/* Create Support Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Uzaktan Destek Talebi</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Yeni uzaktan destek talebi oluşturma formu yakında eklenecektir.
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
