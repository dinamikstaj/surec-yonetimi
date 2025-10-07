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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Sidebar from '@/components/sidebar';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils';
import { 
  Calendar, 
  ArrowLeft, 
  Search,
  Filter,
  Building,
  Mail,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Eye,
  Send,
  Calculator,
  TrendingUp,
  Zap,
  Bell,
  DollarSign,
  FileText,
  CalendarDays,
  Timer,
  Edit,
  Trash2,
  Ban,
  Save,
  XCircle
} from 'lucide-react';

interface Customer {
  _id: string;
  company: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  hasMaintenanceContract?: boolean;
  maintenanceStartDate?: string;
  maintenanceEndDate?: string;
  currentValue?: number;
  renewalValue?: number;
  daysUntilExpiry?: number;
  renewalProbability?: 'high' | 'medium' | 'low';
  lastContactDate?: string;
  remindersSent?: number;
  createdAt: string;
}

export default function RenewalMaintenancePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [probabilityFilter, setProbabilityFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  
  // Additional modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [cancelCustomer, setCancelCustomer] = useState<Customer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Edit form
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editNotes, setEditNotes] = useState('');


  useEffect(() => {
    fetchRenewalCustomers();
  }, []);

  const fetchRenewalCustomers = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/maintenance/renewal`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        toast.error('Yenileme anlaşmaları yüklenemedi');
      }
    } catch (error) {
      console.error('Yenileme anlaşmaları yüklenirken hata:', error);
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = customers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Urgency filter
    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(customer => {
        const days = customer.daysUntilExpiry || 0;
        switch (urgencyFilter) {
          case 'critical': return days <= 30;
          case 'urgent': return days > 30 && days <= 60;
          case 'normal': return days > 60;
          default: return true;
        }
      });
    }

    // Probability filter
    if (probabilityFilter !== 'all') {
      filtered = filtered.filter(customer => customer.renewalProbability === probabilityFilter);
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, urgencyFilter, probabilityFilter]);

  const getUrgencyBadge = (days?: number) => {
    if (!days) return null;
    
    if (days <= 30) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Kritik ({days} gün)
        </Badge>
      );
    } else if (days <= 60) {
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          Acil ({days} gün)
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="gap-1">
          <Calendar className="h-3 w-3" />
          Normal ({days} gün)
        </Badge>
      );
    }
  };

  const getProbabilityBadge = (probability?: string) => {
    const variants = {
      'high': { variant: 'default' as const, label: 'Yüksek', icon: TrendingUp },
      'medium': { variant: 'secondary' as const, label: 'Orta', icon: RefreshCw },
      'low': { variant: 'outline' as const, label: 'Düşük', icon: AlertTriangle }
    };
    
    const config = variants[probability as keyof typeof variants] || variants.medium;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label} İhtimal
      </Badge>
    );
  };

  const getStats = () => {
    const total = customers.length;
    const critical = customers.filter(c => (c.daysUntilExpiry || 0) <= 30).length;
    const urgent = customers.filter(c => {
      const days = c.daysUntilExpiry || 0;
      return days > 30 && days <= 60;
    }).length;
    const totalCurrentValue = customers.reduce((sum, c) => sum + (c.currentValue || 0), 0);
    const totalRenewalValue = customers.reduce((sum, c) => sum + (c.renewalValue || 0), 0);

    return { total, critical, urgent, totalCurrentValue, totalRenewalValue };
  };

  const stats = getStats();

  const handleSendReminder = async (customer: Customer) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/maintenance/renewal/${customer._id}/reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Bakım anlaşmanız yenileme zamanı yaklaşıyor.',
          type: 'email'
        }),
      });

      if (response.ok) {
        toast.success(`${customer.company} için hatırlatıcı gönderildi`);
        fetchRenewalCustomers();
      } else {
        toast.error('Hatırlatıcı gönderilemedi');
      }
    } catch (error) {
      console.error('Reminder error:', error);
      toast.error('İşlem sırasında hata oluştu');
    }
  };

  const handleStartRenewal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowRenewalModal(true);
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditStartDate(customer.maintenanceStartDate ? customer.maintenanceStartDate.split('T')[0] : '');
    setEditEndDate(customer.maintenanceEndDate ? customer.maintenanceEndDate.split('T')[0] : '');
    setEditValue('');
    setEditNotes('');
    setShowEditModal(true);
  };

  const confirmEdit = async () => {
    if (!editingCustomer) return;
    
    if (!editStartDate || !editEndDate) {
      toast.error('Lütfen tüm tarihleri doldurun');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/customers/${editingCustomer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maintenanceStartDate: editStartDate,
          maintenanceEndDate: editEndDate,
          ...(editValue && { maintenanceValue: parseFloat(editValue) }),
          ...(editNotes && { notes: editNotes })
        }),
      });

      if (response.ok) {
        toast.success(`${editingCustomer.company} için bakım anlaşması güncellendi!`);
        setShowEditModal(false);
        setEditingCustomer(null);
        fetchRenewalCustomers();
      } else {
        const error = await response.json();
        toast.error(error.msg || 'Güncelleme başarısız');
      }
    } catch (error) {
      console.error('Edit error:', error);
      toast.error('İşlem sırasında hata oluştu');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = (customer: Customer) => {
    setDeleteCustomer(customer);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteCustomer) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/customers/${deleteCustomer._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(`${deleteCustomer.company} başarıyla silindi`);
        setShowDeleteModal(false);
        setDeleteCustomer(null);
        fetchRenewalCustomers();
      } else {
        const error = await response.json();
        toast.error(error.msg || 'Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('İşlem sırasında hata oluştu');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = (customer: Customer) => {
    setCancelCustomer(customer);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!cancelCustomer) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/customers/${cancelCustomer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hasMaintenanceContract: false
        }),
      });

      if (response.ok) {
        toast.success(`${cancelCustomer.company} bakım anlaşması iptal edildi`);
        setShowCancelModal(false);
        setCancelCustomer(null);
        fetchRenewalCustomers();
      } else {
        const error = await response.json();
        toast.error(error.msg || 'İptal işlemi başarısız');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('İşlem sırasında hata oluştu');
    } finally {
      setIsProcessing(false);
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
                  <Calendar className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Yenileme Zamanı Gelen Anlaşmalar
                  </h1>
                  <p className="text-muted-foreground">
                    Yakında yenilenmesi gereken bakım anlaşmalarını takip edin
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Bell className="h-4 w-4 mr-2" />
                  Toplu Hatırlatıcı
                </Button>
                <Button onClick={() => router.push('/admin/maintenance/active')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Aktif Anlaşmalar
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Toplam Yenileme
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Anlaşma
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Kritik (≤30 gün)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">{stats.critical}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Acil işlem gerekli
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Acil (31-60 gün)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.urgent}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Yakında işlem
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Mevcut Değer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₺{stats.totalCurrentValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Toplam ciro
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Yenileme Değeri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₺{stats.totalRenewalValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Potansiyel ciro
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="list">Liste Görünümü</TabsTrigger>
              <TabsTrigger value="timeline">Zaman Çizelgesi</TabsTrigger>
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
                          placeholder="Müşteri, şirket veya şehir ara..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                        <SelectTrigger className="w-[150px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Aciliyet" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tümü</SelectItem>
                          <SelectItem value="critical">Kritik</SelectItem>
                          <SelectItem value="urgent">Acil</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={probabilityFilter} onValueChange={setProbabilityFilter}>
                        <SelectTrigger className="w-[150px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="İhtimal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tümü</SelectItem>
                          <SelectItem value="high">Yüksek</SelectItem>
                          <SelectItem value="medium">Orta</SelectItem>
                          <SelectItem value="low">Düşük</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer List */}
              <div className="grid gap-4">
                {filteredCustomers.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Calendar className="h-24 w-24 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-2xl font-semibold mb-2">Yenileme bulunamadı</h3>
                      <p className="text-muted-foreground mb-6">
                        Arama kriterlerinize uygun yenileme anlaşması bulunmuyor.
                      </p>
                      <Button variant="outline" onClick={() => {
                        setSearchTerm('');
                        setUrgencyFilter('all');
                        setProbabilityFilter('all');
                      }}>
                        Filtreleri Temizle
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  filteredCustomers.map((customer) => (
                    <Card key={customer._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="p-3 rounded-lg border bg-muted/50">
                                <Building className="h-6 w-6" />
                              </div>
                              
                              <div className="flex-1 space-y-3">
                                <div>
                                  <h3 className="text-xl font-semibold">{customer.company}</h3>
                                  <p className="text-muted-foreground">{customer.name}</p>
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-4 w-4" />
                                    <span>{customer.email}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-4 w-4" />
                                    <span>{customer.phone}</span>
                                  </div>
                                  {customer.city && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      <span>{customer.city}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-3">
                                  {getUrgencyBadge(customer.daysUntilExpiry)}
                                  {getProbabilityBadge(customer.renewalProbability)}
                                  <Badge variant="outline">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    ₺{customer.currentValue?.toLocaleString()} → ₺{customer.renewalValue?.toLocaleString()}
                                  </Badge>
                                  {customer.remindersSent && customer.remindersSent > 0 && (
                                    <Badge variant="secondary">
                                      <Bell className="h-3 w-3 mr-1" />
                                      {customer.remindersSent} hatırlatıcı
                                    </Badge>
                                  )}
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Yenileme süreci</span>
                                    <span>{customer.daysUntilExpiry} gün kaldı</span>
                                  </div>
                                  <Progress 
                                    value={Math.max(0, 100 - ((customer.daysUntilExpiry || 0) / 365 * 100))} 
                                    className="h-2"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleViewDetails(customer)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Detay
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleSendReminder(customer)}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Hatırlatıcı
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleStartRenewal(customer)}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Yenile
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleEdit(customer)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Düzenle
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-orange-600 border-orange-600 hover:bg-orange-50"
                                onClick={() => handleCancel(customer)}
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                İptal
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(customer)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Müşteriyi Sil
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="timeline">
              <Card>
                <CardContent className="p-12 text-center">
                  <CalendarDays className="h-24 w-24 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-2xl font-semibold mb-2">Zaman Çizelgesi</h3>
                  <p className="text-muted-foreground mb-6">
                    Zaman çizelgesi görünümü yakında eklenecektir.
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
                    Takvim görünümü yakında eklenecektir.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Bakım Anlaşmasını Düzenle
            </DialogTitle>
          </DialogHeader>
          
          {editingCustomer && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      <strong>{editingCustomer.company}</strong> bakım anlaşması güncelleniyor
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Değişiklikler anlaşma detaylarına yansıyacaktır.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editStartDate">Başlangıç Tarihi *</Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEndDate">Bitiş Tarihi *</Label>
                  <Input
                    id="editEndDate"
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editValue">Anlaşma Değeri (₺) (Opsiyonel)</Label>
                <Input
                  id="editValue"
                  type="number"
                  placeholder="Değiştirmek için giriniz"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Boş bırakırsanız mevcut değer korunur
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editNotes">Notlar (Opsiyonel)</Label>
                <Textarea
                  id="editNotes"
                  placeholder="Güncelleme notları..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Separator />

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditModal(false)}
                  disabled={isProcessing}
                >
                  İptal
                </Button>
                <Button 
                  onClick={confirmEdit}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Güncelleniyor...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Kaydet
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Contract Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Ban className="h-5 w-5" />
              Bakım Anlaşmasını İptal Et
            </DialogTitle>
          </DialogHeader>
          
          {cancelCustomer && (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900 dark:text-orange-100">
                      <strong>{cancelCustomer.company}</strong> bakım anlaşması iptal edilecek
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      Bu işlem anlaşmayı pasif hale getirecektir. Müşteri bilgileri korunacaktır.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCancelModal(false)}
                  disabled={isProcessing}
                >
                  Vazgeç
                </Button>
                <Button 
                  onClick={confirmCancel}
                  disabled={isProcessing}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      İptal Ediliyor...
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4 mr-2" />
                      Evet, İptal Et
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Müşteriyi Sil
            </DialogTitle>
          </DialogHeader>
          
          {deleteCustomer && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">
                      <strong>{deleteCustomer.company}</strong> müşterisi tamamen silinecek
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Bu işlem geri alınamaz. Tüm müşteri verileri kalıcı olarak silinecektir.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isProcessing}
                >
                  Vazgeç
                </Button>
                <Button 
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Siliniyor...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Evet, Sil
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yenileme Detayları</DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Müşteri Bilgileri</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Şirket:</strong> {selectedCustomer.company}</p>
                    <p><strong>Yetkili:</strong> {selectedCustomer.name}</p>
                    <p><strong>E-posta:</strong> {selectedCustomer.email}</p>
                    <p><strong>Telefon:</strong> {selectedCustomer.phone}</p>
                    {selectedCustomer.address && (
                      <p><strong>Adres:</strong> {selectedCustomer.address}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Anlaşma Bilgileri</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Başlangıç:</strong> {selectedCustomer.maintenanceStartDate ? new Date(selectedCustomer.maintenanceStartDate).toLocaleDateString('tr-TR') : 'Bilinmiyor'}</p>
                    <p><strong>Bitiş:</strong> {selectedCustomer.maintenanceEndDate ? new Date(selectedCustomer.maintenanceEndDate).toLocaleDateString('tr-TR') : 'Bilinmiyor'}</p>
                    <p><strong>Kalan Süre:</strong> {selectedCustomer.daysUntilExpiry} gün</p>
                    <p><strong>Mevcut Değer:</strong> ₺{selectedCustomer.currentValue?.toLocaleString() || '0'}</p>
                    <p><strong>Yenileme Değeri:</strong> ₺{selectedCustomer.renewalValue?.toLocaleString() || '0'}</p>
                    <p><strong>Son İletişim:</strong> {selectedCustomer.lastContactDate ? new Date(selectedCustomer.lastContactDate).toLocaleDateString('tr-TR') : 'Bilinmiyor'}</p>
                    <div className="mt-2">
                      <strong>Yenileme İhtimali:</strong>
                      <div className="mt-1">
                        {getProbabilityBadge(selectedCustomer.renewalProbability)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  Kapat
                </Button>
                <Button variant="outline" onClick={() => {
                  handleSendReminder(selectedCustomer);
                  setShowDetailModal(false);
                }}>
                  <Send className="h-4 w-4 mr-2" />
                  Hatırlatıcı Gönder
                </Button>
                <Button onClick={() => {
                  setShowDetailModal(false);
                  handleStartRenewal(selectedCustomer);
                }}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Yenileme Başlat
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Renewal Modal */}
      <Dialog open={showRenewalModal} onOpenChange={setShowRenewalModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yenileme Süreci Başlat</DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium">{selectedCustomer.company}</h4>
                <p className="text-sm text-muted-foreground">{selectedCustomer.name}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Mevcut Değer</label>
                  <p className="text-lg font-semibold">₺{selectedCustomer.currentValue?.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Yeni Değer</label>
                  <p className="text-lg font-semibold">₺{selectedCustomer.renewalValue?.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowRenewalModal(false)}>
                  İptal
                </Button>
                <Button onClick={() => {
                  toast.success(`${selectedCustomer.company} için yenileme süreci başlatıldı`);
                  setShowRenewalModal(false);
                }}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Yenileme Başlat
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 