"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Sidebar from '@/components/sidebar';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils';
import { 
  Users, 
  ArrowLeft, 
  Search,
  Filter,
  Calendar,
  Building,
  Mail,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  RefreshCw,
  FileText,
  TrendingDown,
  XCircle,
  Eye,
  RotateCcw,
  Download,
  BarChart3,
  Trash2,
  Save
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
  contractEndReason?: 'expired' | 'cancelled' | 'terminated' | 'not-renewed';
  lastMaintenanceDate?: string;
  totalMaintenanceValue?: number;
  createdAt: string;
}

export default function InactiveMaintenancePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reactivateCustomer, setReactivateCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Reactivation form
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [notes, setNotes] = useState('');


  useEffect(() => {
    fetchInactiveCustomers();
  }, []);

  const fetchInactiveCustomers = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/maintenance/inactive`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        toast.error('Pasif bakım anlaşmaları yüklenemedi');
      }
    } catch (error) {
      console.error('Pasif bakım anlaşmaları yüklenirken hata:', error);
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

    // Reason filter
    if (reasonFilter !== 'all') {
      filtered = filtered.filter(customer => customer.contractEndReason === reasonFilter);
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, reasonFilter]);

  const getReasonBadge = (reason?: string) => {
    const variants = {
      'expired': { variant: 'secondary' as const, label: 'Süresi Doldu', icon: Clock },
      'cancelled': { variant: 'destructive' as const, label: 'İptal Edildi', icon: XCircle },
      'terminated': { variant: 'destructive' as const, label: 'Feshedildi', icon: AlertTriangle },
      'not-renewed': { variant: 'outline' as const, label: 'Yenilenmedi', icon: RefreshCw }
    };
    
    const config = variants[reason as keyof typeof variants] || variants.expired;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStats = () => {
    const total = customers.length;
    const expired = customers.filter(c => c.contractEndReason === 'expired').length;
    const cancelled = customers.filter(c => c.contractEndReason === 'cancelled').length;
    const notRenewed = customers.filter(c => c.contractEndReason === 'not-renewed').length;
    const totalValue = customers.reduce((sum, c) => sum + (c.totalMaintenanceValue || 0), 0);

    return { total, expired, cancelled, notRenewed, totalValue };
  };

  const stats = getStats();

  const handleReactivate = (customer: Customer) => {
    setReactivateCustomer(customer);
    // Set default dates
    const today = new Date();
    const oneYearLater = new Date(today);
    oneYearLater.setFullYear(today.getFullYear() + 1);
    
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(oneYearLater.toISOString().split('T')[0]);
    setContractValue('');
    setNotes('');
    setShowReactivateModal(true);
  };

  const confirmReactivate = async () => {
    if (!reactivateCustomer) return;
    
    if (!startDate || !endDate || !contractValue) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/maintenance/inactive/${reactivateCustomer._id}/reactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newStartDate: startDate,
          newEndDate: endDate,
          notes: notes
        }),
      });

      if (response.ok) {
        toast.success(`${reactivateCustomer.company} için bakım anlaşması yeniden aktifleştirildi!`);
        setShowReactivateModal(false);
        setReactivateCustomer(null);
        fetchInactiveCustomers();
      } else {
        const error = await response.json();
        toast.error(error.msg || 'Yeniden aktifleştirme başarısız');
      }
    } catch (error) {
      console.error('Reactivation error:', error);
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
        fetchInactiveCustomers();
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

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
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
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Pasif Bakım Anlaşmaları
                  </h1>
                  <p className="text-muted-foreground">
                    Sona ermiş ve iptal edilmiş bakım anlaşmalarını yönetin
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Rapor Al
                </Button>
                <Button onClick={() => router.push('/admin/maintenance/active')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
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
                  <Users className="h-4 w-4" />
                  Toplam Pasif
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
                  <Clock className="h-4 w-4" />
                  Süresi Doldu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.expired}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Doğal son
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  İptal Edildi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.cancelled}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Erken sonlandırma
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Yenilenmedi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.notRenewed}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Yenileme reddedildi
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Kayıp Değer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₺{stats.totalValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Toplam değer
                </p>
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
                      placeholder="Müşteri, şirket veya şehir ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={reasonFilter} onValueChange={setReasonFilter}>
                    <SelectTrigger className="w-[200px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Bitiş Nedeni" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Nedenler</SelectItem>
                      <SelectItem value="expired">Süresi Doldu</SelectItem>
                      <SelectItem value="cancelled">İptal Edildi</SelectItem>
                      <SelectItem value="terminated">Feshedildi</SelectItem>
                      <SelectItem value="not-renewed">Yenilenmedi</SelectItem>
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
                  <Users className="h-24 w-24 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-2xl font-semibold mb-2">Pasif anlaşma bulunamadı</h3>
                  <p className="text-muted-foreground mb-6">
                    Arama kriterlerinize uygun pasif bakım anlaşması bulunmuyor.
                  </p>
                  <Button variant="outline" onClick={() => {
                    setSearchTerm('');
                    setReasonFilter('all');
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
                              {getReasonBadge(customer.contractEndReason)}
                              <Badge variant="outline">
                                <Calendar className="h-3 w-3 mr-1" />
                                Son: {customer.maintenanceEndDate ? new Date(customer.maintenanceEndDate).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                              </Badge>
                              {customer.totalMaintenanceValue && (
                                <Badge variant="secondary">
                                  ₺{customer.totalMaintenanceValue.toLocaleString()}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(customer)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Detay
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReactivate(customer)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Yeniden Aktifleştir
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(customer)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Sil
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Reactivate Modal */}
      <Dialog open={showReactivateModal} onOpenChange={setShowReactivateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-green-600" />
              Bakım Anlaşmasını Yeniden Aktifleştir
            </DialogTitle>
          </DialogHeader>
          
          {reactivateCustomer && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      <strong>{reactivateCustomer.company}</strong> için yeni bakım anlaşması oluşturulacak
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Bu işlem müşterinin bakım anlaşmasını yeniden aktif hale getirecektir.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Başlangıç Tarihi *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Bitiş Tarihi *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractValue">Anlaşma Değeri (₺) *</Label>
                <Input
                  id="contractValue"
                  type="number"
                  placeholder="Örn: 50000"
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notlar (Opsiyonel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Anlaşma hakkında notlar..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Separator />

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowReactivateModal(false)}
                  disabled={isProcessing}
                >
                  İptal
                </Button>
                <Button 
                  onClick={confirmReactivate}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Evet, Aktifleştir
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
                      <strong>{deleteCustomer.company}</strong> müşterisi silinecek
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
                  İptal
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
            <DialogTitle>Anlaşma Detayları</DialogTitle>
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
                    <p><strong>Son Bakım:</strong> {selectedCustomer.lastMaintenanceDate ? new Date(selectedCustomer.lastMaintenanceDate).toLocaleDateString('tr-TR') : 'Bilinmiyor'}</p>
                    <p><strong>Toplam Değer:</strong> ₺{selectedCustomer.totalMaintenanceValue?.toLocaleString() || '0'}</p>
                    <div className="mt-2">
                      <strong>Bitiş Nedeni:</strong>
                      <div className="mt-1">
                        {getReasonBadge(selectedCustomer.contractEndReason)}
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
                <Button onClick={() => {
                  handleReactivate(selectedCustomer);
                  setShowDetailModal(false);
                }}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Yeniden Aktifleştir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 