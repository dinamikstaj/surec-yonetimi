"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
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
  Users,
  Navigation
} from 'lucide-react';

interface Customer {
  _id: string;
  company: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  hasServiceContract?: boolean;
}

interface OnsiteSupport {
  _id: string;
  supportNumber: string;
  customer: Customer | null;
  supportType: 'installation' | 'maintenance' | 'repair' | 'training' | 'consultation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'requested' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
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
  location: {
    address: string;
    city: string;
    floor?: string;
    room?: string;
    contactPerson?: string;
    contactPhone?: string;
  };
  equipment?: string[];
  cost: {
    estimated: number;
    actual?: number;
    travelCost?: number;
    currency: string;
  };
  travelInfo: {
    distance?: number; // km
    estimatedTravelTime?: number; // minutes
    transportType?: 'car' | 'public' | 'flight';
  };
  notes?: string;
  photos?: string[];
  completionReport?: string;
  customerSignature?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OnsiteSupportPage() {
  const router = useRouter();
  const [supports, setSupports] = useState<OnsiteSupport[]>([]);
  const [filteredSupports, setFilteredSupports] = useState<OnsiteSupport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [selectedSupport, setSelectedSupport] = useState<OnsiteSupport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  
  // Create form
  const [createForm, setCreateForm] = useState({
    customerId: '',
    supportType: 'installation' as 'installation' | 'maintenance' | 'repair' | 'training' | 'consultation',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    scheduledDate: '',
    estimatedDuration: '',
    description: '',
    locationAddress: '',
    locationCity: '',
    locationFloor: '',
    locationRoom: '',
    contactPerson: '',
    contactPhone: '',
    equipment: '',
    estimatedCost: '',
    travelDistance: '',
    travelTime: '',
    transportType: 'car' as 'car' | 'public' | 'flight',
    notes: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchOnsiteSupports();
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/customers`);
      if (response.ok) {
        const data = await response.json();
        // Sadece servis anlaşmalı müşterileri göster
        const serviceCustomers = data.filter((c: Customer) => c.hasServiceContract === true);
        setCustomers(serviceCustomers);
      }
    } catch (error) {
      console.error('Customers fetch error:', error);
    }
  };

  useEffect(() => {
    let filtered = supports;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(support =>
        support.supportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (support.customer && support.customer.company?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (support.customer && support.customer.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        support.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        support.location.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(support => support.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(support => support.priority === priorityFilter);
    }

    // Technician filter
    if (technicianFilter !== 'all') {
      filtered = filtered.filter(support => support.assignedTechnician?._id === technicianFilter);
    }

    setFilteredSupports(filtered);
  }, [supports, searchTerm, statusFilter, priorityFilter, technicianFilter]);

  const fetchOnsiteSupports = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/support/onsite`);
      if (response.ok) {
        const data = await response.json();
        // Sadece müşteri bilgisi olan destek taleplerini göster
        const validSupports = data.filter((s: OnsiteSupport) => s.customer != null);
        setSupports(validSupports);
      } else {
        setSupports([]);
        toast.error('Yerinde destek talepleri yüklenemedi');
      }
    } catch (error) {
      console.error('Onsite support fetch error:', error);
      setSupports([]);
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'requested': { variant: 'secondary' as const, label: 'Talep Edildi', icon: FileText },
      'scheduled': { variant: 'outline' as const, label: 'Planlandı', icon: Calendar },
      'in-progress': { variant: 'default' as const, label: 'Devam Ediyor', icon: Play },
      'completed': { variant: 'default' as const, label: 'Tamamlandı', icon: CheckCircle },
      'cancelled': { variant: 'destructive' as const, label: 'İptal Edildi', icon: XCircle }
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
      'installation': { variant: 'default' as const, label: 'Kurulum' },
      'maintenance': { variant: 'secondary' as const, label: 'Bakım' },
      'repair': { variant: 'outline' as const, label: 'Onarım' },
      'training': { variant: 'default' as const, label: 'Eğitim' },
      'consultation': { variant: 'secondary' as const, label: 'Danışmanlık' }
    };
    
    const config = variants[type as keyof typeof variants] || variants.maintenance;
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getStats = () => {
    const total = supports.length;
    const requested = supports.filter(s => s.status === 'requested').length;
    const scheduled = supports.filter(s => s.status === 'scheduled').length;
    const inProgress = supports.filter(s => s.status === 'in-progress').length;
    const completed = supports.filter(s => s.status === 'completed').length;
    const cancelled = supports.filter(s => s.status === 'cancelled').length;
    
    // Calculate overdue
    const now = new Date();
    const overdue = supports.filter(s => {
      if (s.status === 'completed' || s.status === 'cancelled') return false;
      return new Date(s.scheduledDate) < now;
    }).length;
    
    const totalRevenue = supports
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + (s.cost.actual || s.cost.estimated), 0);
    
    const avgDuration = supports.filter(s => s.actualDuration).length > 0
      ? supports.filter(s => s.actualDuration).reduce((sum, s) => sum + (s.actualDuration || 0), 0) / supports.filter(s => s.actualDuration).length
      : 0;

    return {
      total,
      requested,
      scheduled,
      inProgress,
      completed,
      cancelled,
      overdue,
      totalRevenue,
      avgDuration
    };
  };

  const stats = getStats();

  const handleViewDetails = (support: OnsiteSupport) => {
    setSelectedSupport(support);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async (supportId: string, newStatus: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/support/onsite/${supportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success('Destek durumu güncellendi');
        fetchOnsiteSupports();
      } else {
        toast.error('Durum güncellenemedi');
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Güncelleme sırasında hata oluştu');
    }
  };

  const isOverdue = (support: OnsiteSupport) => {
    if (support.status === 'completed' || support.status === 'cancelled') return false;
    return new Date(support.scheduledDate) < new Date();
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
                    Yerinde Destek Servisi
                  </h1>
                  <p className="text-muted-foreground">
                    Müşteri lokasyonunda yapılan destek hizmetlerini yönetin
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
                  Yeni Yerinde Destek
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-9">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Toplam Talep
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">Yerinde</p>
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
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Destek numarası, müşteri, şehir ara..."
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
                      <SelectItem value="scheduled">Planlandı</SelectItem>
                      <SelectItem value="in-progress">Devam Ediyor</SelectItem>
                      <SelectItem value="completed">Tamamlandı</SelectItem>
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
                  <Wrench className="h-24 w-24 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-2xl font-semibold mb-2">Yerinde destek bulunamadı</h3>
                  <p className="text-muted-foreground mb-6">
                    Arama kriterlerinize uygun yerinde destek talebi bulunmuyor.
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
              filteredSupports.map((support) => (
                <Card key={support._id} className={`hover:shadow-md transition-shadow ${isOverdue(support) ? 'border-destructive' : ''}`}>
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
                                <h3 className="text-xl font-semibold">#{support.supportNumber}</h3>
                                {isOverdue(support) && (
                                  <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Gecikmiş
                                  </Badge>
                                )}
                              </div>
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
                                <MapPin className="h-4 w-4" />
                                <span>{support.location.city}</span>
                              </div>
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

                              {support.travelInfo.distance && (
                                <Badge variant="outline">
                                  <Navigation className="h-3 w-3 mr-1" />
                                  {support.travelInfo.distance}km
                                </Badge>
                              )}
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
                            onClick={() => handleUpdateStatus(support._id, 'scheduled')}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Planla
                          </Button>
                        )}
                        
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
            <DialogTitle>Yerinde Destek Detayları</DialogTitle>
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
                    <p><strong>Planlanan Tarih:</strong> {new Date(selectedSupport.scheduledDate).toLocaleDateString('tr-TR')}</p>
                    <p><strong>Tahmini Süre:</strong> {selectedSupport.estimatedDuration} saat</p>
                    {selectedSupport.actualDuration && (
                      <p><strong>Gerçek Süre:</strong> {selectedSupport.actualDuration} saat</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Lokasyon Bilgileri</h4>
                <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
                  <p><strong>Adres:</strong> {selectedSupport.location.address}</p>
                  <p><strong>Şehir:</strong> {selectedSupport.location.city}</p>
                  {selectedSupport.location.floor && (
                    <p><strong>Kat:</strong> {selectedSupport.location.floor}</p>
                  )}
                  {selectedSupport.location.room && (
                    <p><strong>Oda:</strong> {selectedSupport.location.room}</p>
                  )}
                  {selectedSupport.location.contactPerson && (
                    <p><strong>Yerinde İletişim:</strong> {selectedSupport.location.contactPerson} - {selectedSupport.location.contactPhone}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Destek Açıklaması</h4>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{selectedSupport.description}</p>
                </div>
              </div>

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

              <div>
                <h4 className="font-medium mb-2">Maliyet ve Seyahat</h4>
                <div className="grid gap-2 md:grid-cols-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm"><strong>Tahmini:</strong> ₺{selectedSupport.cost.estimated.toLocaleString()}</p>
                  </div>
                  {selectedSupport.cost.actual && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm"><strong>Gerçek:</strong> ₺{selectedSupport.cost.actual.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedSupport.cost.travelCost && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm"><strong>Seyahat:</strong> ₺{selectedSupport.cost.travelCost.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedSupport.equipment && selectedSupport.equipment.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Gerekli Ekipman</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSupport.equipment.map((item, index) => (
                      <Badge key={index} variant="outline">{item}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedSupport.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notlar</h4>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{selectedSupport.notes}</p>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  Kapat
                </Button>
                {selectedSupport && selectedSupport.status !== 'completed' && selectedSupport.status !== 'cancelled' && (
                  <Button onClick={() => {
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

      {/* Create Support Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              Yeni Yerinde Destek Talebi Oluştur
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Müşteri Seçimi */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Building className="h-5 w-5" />
                Müşteri Seçimi
              </h3>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Müşteri ara (şirket adı, email, telefon)..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select 
                  value={createForm.customerId} 
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin (Sadece servis anlaşmalı)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {customers
                      .filter(c => 
                        !customerSearch || 
                        c.company.toLowerCase().includes(customerSearch.toLowerCase()) ||
                        c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
                        c.phone.includes(customerSearch) ||
                        c.city?.toLowerCase().includes(customerSearch.toLowerCase())
                      )
                      .map((customer) => (
                        <SelectItem key={customer._id} value={customer._id}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{customer.company}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {customer.city} - {customer.phone}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    {customers.filter(c => 
                      !customerSearch || 
                      c.company.toLowerCase().includes(customerSearch.toLowerCase()) ||
                      c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
                      c.phone.includes(customerSearch) ||
                      c.city?.toLowerCase().includes(customerSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="p-4 text-center text-muted-foreground">
                        Servis anlaşmalı müşteri bulunamadı
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {createForm.customerId && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Müşteri seçildi: <strong>{customers.find(c => c._id === createForm.customerId)?.company}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Destek Bilgileri */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Destek Bilgileri
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supportType">Destek Türü *</Label>
                  <Select 
                    value={createForm.supportType} 
                    onValueChange={(value: any) => setCreateForm(prev => ({ ...prev, supportType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="installation">Kurulum</SelectItem>
                      <SelectItem value="maintenance">Bakım</SelectItem>
                      <SelectItem value="repair">Onarım</SelectItem>
                      <SelectItem value="training">Eğitim</SelectItem>
                      <SelectItem value="consultation">Danışmanlık</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Öncelik *</Label>
                  <Select 
                    value={createForm.priority} 
                    onValueChange={(value: any) => setCreateForm(prev => ({ ...prev, priority: value }))}
                  >
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
              </div>

              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Planlanan Tarih *</Label>
                  <Input
                    id="scheduledDate"
                    type="datetime-local"
                    value={createForm.scheduledDate}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedDuration">Tahmini Süre (saat) *</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    value={createForm.estimatedDuration}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                    placeholder="4"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="description">Açıklama *</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Destek talebi açıklaması..."
                  rows={3}
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Lokasyon Bilgileri */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Lokasyon Bilgileri
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="locationAddress">Adres *</Label>
                  <Input
                    id="locationAddress"
                    value={createForm.locationAddress}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, locationAddress: e.target.value }))}
                    placeholder="Müşteri adresi"
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="locationCity">Şehir *</Label>
                    <Input
                      id="locationCity"
                      value={createForm.locationCity}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, locationCity: e.target.value }))}
                      placeholder="İstanbul"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locationFloor">Kat</Label>
                    <Input
                      id="locationFloor"
                      value={createForm.locationFloor}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, locationFloor: e.target.value }))}
                      placeholder="3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locationRoom">Oda/Daire</Label>
                    <Input
                      id="locationRoom"
                      value={createForm.locationRoom}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, locationRoom: e.target.value }))}
                      placeholder="301"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Yerinde İletişim Kişisi</Label>
                    <Input
                      id="contactPerson"
                      value={createForm.contactPerson}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                      placeholder="Ahmet Yılmaz"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">İletişim Telefonu</Label>
                    <Input
                      id="contactPhone"
                      value={createForm.contactPhone}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                      placeholder="0532 123 45 67"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Maliyet ve Seyahat */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Maliyet ve Seyahat
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="estimatedCost">Tahmini Maliyet (₺) *</Label>
                  <Input
                    id="estimatedCost"
                    type="number"
                    value={createForm.estimatedCost}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, estimatedCost: e.target.value }))}
                    placeholder="5000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="travelDistance">Mesafe (km)</Label>
                  <Input
                    id="travelDistance"
                    type="number"
                    value={createForm.travelDistance}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, travelDistance: e.target.value }))}
                    placeholder="25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transportType">Ulaşım Tipi</Label>
                  <Select 
                    value={createForm.transportType} 
                    onValueChange={(value: any) => setCreateForm(prev => ({ ...prev, transportType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Araba</SelectItem>
                      <SelectItem value="public">Toplu Taşıma</SelectItem>
                      <SelectItem value="flight">Uçak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Ek Bilgiler */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="equipment">Gerekli Ekipman</Label>
                <Input
                  id="equipment"
                  value={createForm.equipment}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, equipment: e.target.value }))}
                  placeholder="Laptop, test cihazı (virgülle ayırın)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="travelTime">Tahmini Yol Süresi (dk)</Label>
                <Input
                  id="travelTime"
                  type="number"
                  value={createForm.travelTime}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, travelTime: e.target.value }))}
                  placeholder="45"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                value={createForm.notes}
                onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ek notlar ve özel talepler..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
                disabled={isCreating}
              >
                İptal
              </Button>
              <Button 
                onClick={async () => {
                  if (!createForm.customerId || !createForm.scheduledDate || !createForm.estimatedDuration || 
                      !createForm.description || !createForm.locationAddress || !createForm.locationCity || 
                      !createForm.estimatedCost) {
                    toast.error('Lütfen tüm zorunlu alanları doldurun');
                    return;
                  }

                  setIsCreating(true);
                  try {
                    const response = await fetch(`${getApiBaseUrl()}/support/onsite`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        customer: createForm.customerId,
                        supportType: createForm.supportType,
                        priority: createForm.priority,
                        scheduledDate: createForm.scheduledDate,
                        estimatedDuration: parseFloat(createForm.estimatedDuration),
                        description: createForm.description,
                        location: {
                          address: createForm.locationAddress,
                          city: createForm.locationCity,
                          floor: createForm.locationFloor,
                          room: createForm.locationRoom,
                          contactPerson: createForm.contactPerson,
                          contactPhone: createForm.contactPhone
                        },
                        equipment: createForm.equipment ? createForm.equipment.split(',').map(e => e.trim()) : [],
                        cost: {
                          estimated: parseFloat(createForm.estimatedCost),
                          currency: 'TRY'
                        },
                        travelInfo: {
                          distance: createForm.travelDistance ? parseFloat(createForm.travelDistance) : undefined,
                          estimatedTravelTime: createForm.travelTime ? parseFloat(createForm.travelTime) : undefined,
                          transportType: createForm.transportType
                        },
                        notes: createForm.notes
                      }),
                    });

                    if (response.ok) {
                      toast.success('Yerinde destek talebi başarıyla oluşturuldu!');
                      setShowCreateModal(false);
                      setCreateForm({
                        customerId: '',
                        supportType: 'installation',
                        priority: 'medium',
                        scheduledDate: '',
                        estimatedDuration: '',
                        description: '',
                        locationAddress: '',
                        locationCity: '',
                        locationFloor: '',
                        locationRoom: '',
                        contactPerson: '',
                        contactPhone: '',
                        equipment: '',
                        estimatedCost: '',
                        travelDistance: '',
                        travelTime: '',
                        transportType: 'car',
                        notes: ''
                      });
                      setCustomerSearch('');
                      fetchOnsiteSupports();
                    } else {
                      const error = await response.json();
                      toast.error(error.msg || 'Destek talebi oluşturulamadı');
                    }
                  } catch (error) {
                    console.error('Create support error:', error);
                    toast.error('İşlem sırasında hata oluştu');
                  } finally {
                    setIsCreating(false);
                  }
                }}
                disabled={isCreating || !createForm.customerId}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                <Plus className="h-4 w-4 mr-2" />
                    Destek Talebi Oluştur
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
