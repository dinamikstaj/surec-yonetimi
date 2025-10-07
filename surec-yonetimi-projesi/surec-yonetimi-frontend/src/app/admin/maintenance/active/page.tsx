"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Sidebar from '@/components/sidebar';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils';
import { 
  Shield, 
  ArrowLeft, 
  Building,
  Mail,
  Phone,
  MapPin,
  Search,
  Users,
  Calendar,
  Clock,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Save,
  XCircle,
  Ban,
  Wrench,
  Zap
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface Customer {
  _id: string;
  company: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  taxNumber?: string;
  authorizedPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  hasMaintenanceContract?: boolean;
  hasServiceContract?: boolean;
  maintenanceStartDate?: string;
  maintenanceEndDate?: string;
  status?: string;
  createdAt: string;
}

export default function ActiveMaintenancePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateContractModal, setShowCreateContractModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [contractForm, setContractForm] = useState({
    customerId: '',
    startDate: '',
    endDate: '',
    value: '',
    contractType: 'standard',
    description: ''
  });
  const [pricingSuggestions, setPricingSuggestions] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  
  // Edit & Delete modals
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
    fetchCustomers();
    fetchAllCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/maintenance/active`);
      
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        toast.error('Aktif bakım anlaşmaları yüklenemedi');
      }
    } catch (error) {
      console.error('Aktif bakım anlaşmaları yüklenirken hata:', error);
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCustomers = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/customers`);
      if (response.ok) {
        const data = await response.json();
        // Sadece bakım anlaşması olmayan müşterileri göster
        const availableCustomers = data.filter((c: Customer) => !c.hasMaintenanceContract);
        setAllCustomers(availableCustomers);
      }
    } catch (error) {
      console.error('Tüm müşteriler yüklenirken hata:', error);
    }
  };

  const fetchPricingSuggestions = async (duration: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/maintenance-contracts/pricing-suggestions?duration=${duration}`);
      if (response.ok) {
        const data = await response.json();
        setPricingSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Fiyat önerileri yüklenirken hata:', error);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contractForm.customerId || !contractForm.startDate || !contractForm.endDate || !contractForm.value) {
      toast.error('Tüm gerekli alanları doldurun');
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/maintenance-contracts/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: contractForm.customerId,
          startDate: contractForm.startDate,
          endDate: contractForm.endDate,
          value: parseInt(contractForm.value),
          description: contractForm.description
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.msg);
        setShowCreateContractModal(false);
        setContractForm({
          customerId: '',
          startDate: '',
          endDate: '',
          value: '',
          contractType: 'standard',
          description: ''
        });
        fetchCustomers();
        fetchAllCustomers();
      } else {
        const error = await response.json();
        toast.error(error.msg || 'Anlaşma oluşturulamadı');
      }
    } catch (error) {
      console.error('Contract creation error:', error);
      toast.error('Anlaşma oluşturulurken hata oluştu');
    } finally {
      setCreating(false);
    }
  };

  const handleContractTypeChange = (type: string) => {
    setContractForm(prev => ({ ...prev, contractType: type }));
    
    // Calculate duration in months
    if (contractForm.startDate && contractForm.endDate) {
      const start = new Date(contractForm.startDate);
      const end = new Date(contractForm.endDate);
      const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
      fetchPricingSuggestions(months.toString());
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        fetchCustomers();
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
        fetchCustomers();
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
        fetchCustomers();
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

  const getMaintenanceStatus = (customer: Customer) => {
    if (!customer.maintenanceEndDate) return null;
    
    const endDate = new Date(customer.maintenanceEndDate);
    const now = new Date();
    const daysLeft = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 30) {
      return { 
        text: `${daysLeft} gün kaldı`, 
        textColor: 'text-warning',
        icon: Clock,
        daysLeft 
      };
    } else if (daysLeft < 90) {
      return { 
        text: `${daysLeft} gün kaldı`, 
        textColor: 'text-muted-foreground',
        icon: Calendar,
        daysLeft 
      };
    } else {
      return { 
        text: `${daysLeft} gün kaldı`, 
        textColor: 'text-foreground',
        icon: CheckCircle,
        daysLeft 
      };
    }
  };

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
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg border">
                  <Shield className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Aktif Bakım Anlaşmaları
                  </h1>
                  <p className="text-muted-foreground">
                    Aktif bakım anlaşmalarını yönetin ve takip edin
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => router.push('/admin/customers/maintenance')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Tüm Müşteriler
                </Button>
                <Button 
                  onClick={() => setShowCreateContractModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Anlaşma
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Aktif Anlaşma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{customers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Geçerli anlaşma</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Yenileme Gerekli
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {customers.filter(c => {
                    if (!c.maintenanceEndDate) return false;
                    const endDate = new Date(c.maintenanceEndDate);
                    const now = new Date();
                    const daysLeft = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    return daysLeft >= 0 && daysLeft < 30;
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">30 gün içinde</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Uzun Vadeli
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {customers.filter(c => {
                    if (!c.maintenanceEndDate) return false;
                    const endDate = new Date(c.maintenanceEndDate);
                    const now = new Date();
                    const daysLeft = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    return daysLeft >= 90;
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">90+ gün kaldı</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Çift Anlaşmalı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {customers.filter(c => c.hasMaintenanceContract && c.hasServiceContract).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Bakım + Servis</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="border shadow-sm">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Şirket adı, yetkili kişi, şehir veya email ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Grid */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <div className="col-span-full">
                <Card className="border shadow-sm">
                  <CardContent className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Yükleniyor...</p>
                  </CardContent>
                </Card>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="col-span-full">
                <Card className="border shadow-sm">
                  <CardContent className="p-12 text-center">
                    <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 w-24 h-24 flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Aktif anlaşma bulunamadı</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchTerm ? 'Arama kriterlerinize uygun aktif anlaşma bulunmamaktadır.' : 'Henüz aktif bakım anlaşması bulunmamaktadır.'}
                    </p>
                    {searchTerm && (
                      <Button onClick={() => setSearchTerm('')} variant="outline">
                        Aramayı Temizle
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              filteredCustomers.map((customer) => {
                const maintenanceStatus = getMaintenanceStatus(customer);
                const StatusIcon = maintenanceStatus?.icon || CheckCircle;
                
                return (
                  <Card 
                    key={customer._id} 
                    className="border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-green-600 shadow-sm">
                          <Building className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold mb-1 truncate">
                            {customer.company}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {customer.name}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge className="bg-green-600 text-white border-0 text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Aktif Anlaşma
                          </Badge>
                          {customer.hasServiceContract && (
                            <Badge className="bg-blue-600 text-white border-0 text-xs">
                              Servis Anlaşmalı
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <Mail className="h-4 w-4 text-blue-500" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <Phone className="h-4 w-4 text-green-500" />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.city && (
                          <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <MapPin className="h-4 w-4 text-red-500" />
                            <span>{customer.city}</span>
                          </div>
                        )}
                      </div>

                      {/* Maintenance Info */}
                      <div className="space-y-2 mb-4">
                        {customer.maintenanceStartDate && (
                          <div className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                            <span className="text-muted-foreground">Başlangıç</span>
                            <span className="font-medium">
                              {new Date(customer.maintenanceStartDate).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                        )}
                        {customer.maintenanceEndDate && (
                          <div className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                            <span className="text-muted-foreground">Bitiş</span>
                            <span className="font-medium">
                              {new Date(customer.maintenanceEndDate).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      {maintenanceStatus && (
                        <div className="border p-3 rounded-lg flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-5 w-5" />
                            <span className="font-semibold">{maintenanceStatus.text}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xs opacity-90">
                              Kalan Süre
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Detaylar
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleEdit(customer)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Düzenle
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            size="sm" 
                            className="flex-1 text-orange-600 border-orange-600 hover:bg-orange-50"
                            onClick={() => handleCancel(customer)}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            İptal Et
                          </Button>
                          <Button 
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDelete(customer)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Results Count */}
          {!loading && filteredCustomers.length > 0 && (
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{filteredCustomers.length}</strong> aktif anlaşma gösteriliyor
                    {searchTerm && <span> • <strong>"{searchTerm}"</strong> için arama sonuçları</span>}
                  </span>
                  {searchTerm && (
                    <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')}>
                      Aramayı Temizle
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Bakım Anlaşması Detayları
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Müşteri Bilgileri */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Müşteri Bilgileri
                </h3>
                <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">Şirket Adı</Label>
                    <p className="font-medium">{selectedCustomer.company}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Yetkili Kişi</Label>
                    <p className="font-medium">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">E-posta</Label>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      {selectedCustomer.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Telefon</Label>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-500" />
                      {selectedCustomer.phone}
                    </p>
                  </div>
                  {selectedCustomer.city && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Şehir</Label>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        {selectedCustomer.city}
                      </p>
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="md:col-span-2">
                      <Label className="text-xs text-muted-foreground">Adres</Label>
                      <p>{selectedCustomer.address}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Anlaşma Bilgileri */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Bakım Anlaşması Bilgileri
                </h3>
                <div className="grid gap-4 md:grid-cols-2 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                  <div>
                    <Label className="text-xs text-muted-foreground">Anlaşma Durumu</Label>
                    <div className="mt-1">
                      <Badge className="bg-green-600 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Aktif
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Anlaşma Tipi</Label>
                    <p className="font-medium">Bakım Anlaşması</p>
                  </div>
                  {selectedCustomer.maintenanceStartDate && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Başlangıç Tarihi</Label>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        {new Date(selectedCustomer.maintenanceStartDate).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {selectedCustomer.maintenanceEndDate && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Bitiş Tarihi</Label>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        {new Date(selectedCustomer.maintenanceEndDate).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {selectedCustomer.maintenanceEndDate && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Kalan Süre</Label>
                      <p className="font-medium text-green-600">
                        {Math.ceil((new Date(selectedCustomer.maintenanceEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} gün
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-muted-foreground">Ek Anlaşmalar</Label>
                    <div className="flex gap-1 mt-1">
                      {selectedCustomer.hasServiceContract && (
                        <Badge className="bg-purple-600 text-white">
                          <Wrench className="h-3 w-3 mr-1" />
                          Servis
                        </Badge>
                      )}
                      {!selectedCustomer.hasServiceContract && (
                        <Badge variant="outline">Sadece Bakım</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Hızlı İşlemler */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Hızlı İşlemler
                </h3>
                <div className="grid gap-2 md:grid-cols-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEdit(selectedCustomer);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Anlaşmayı Düzenle
                  </Button>
                  <Button
                    variant="outline"
                    className="text-orange-600 border-orange-600 hover:bg-orange-50"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleCancel(selectedCustomer);
                    }}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Anlaşmayı İptal Et
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/admin/customers?id=${selectedCustomer._id}`)}
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Müşteri Sayfası
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleDelete(selectedCustomer);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Müşteriyi Sil
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  Kapat
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

      {/* Create Contract Modal */}
      <Dialog open={showCreateContractModal} onOpenChange={setShowCreateContractModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Bakım Anlaşması Oluştur</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateContract} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="customer">Müşteri Seçin *</Label>
                <Select 
                  value={contractForm.customerId} 
                  onValueChange={(value) => setContractForm(prev => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCustomers.map((customer) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {customer.company} - {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contractType">Anlaşma Türü</Label>
                <Select 
                  value={contractForm.contractType} 
                  onValueChange={handleContractTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Temel Bakım</SelectItem>
                    <SelectItem value="standard">Standart Bakım</SelectItem>
                    <SelectItem value="premium">Premium Bakım</SelectItem>
                    <SelectItem value="enterprise">Kurumsal Bakım</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="startDate">Başlangıç Tarihi *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={contractForm.startDate}
                  onChange={(e) => setContractForm(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endDate">Bitiş Tarihi *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={contractForm.endDate}
                  onChange={(e) => {
                    setContractForm(prev => ({ ...prev, endDate: e.target.value }));
                    // Auto-fetch pricing when dates change
                    if (contractForm.startDate && e.target.value) {
                      const start = new Date(contractForm.startDate);
                      const end = new Date(e.target.value);
                      const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
                      if (months > 0) fetchPricingSuggestions(months.toString());
                    }
                  }}
                  required
                />
              </div>
            </div>

            {/* Pricing Suggestions */}
            {pricingSuggestions.length > 0 && (
              <div>
                <Label>Fiyat Önerileri</Label>
                <div className="grid gap-3 md:grid-cols-2 mt-2">
                  {pricingSuggestions.map((suggestion) => (
                    <Card 
                      key={suggestion.type} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        contractForm.contractType === suggestion.type ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => {
                        setContractForm(prev => ({ 
                          ...prev, 
                          contractType: suggestion.type,
                          value: suggestion.price.toString()
                        }));
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{suggestion.name}</h4>
                          <Badge variant="outline">₺{suggestion.price.toLocaleString()}</Badge>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {suggestion.features.slice(0, 3).map((feature: string, index: number) => (
                            <li key={index}>• {feature}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="value">Anlaşma Bedeli (₺) *</Label>
              <Input
                id="value"
                type="number"
                placeholder="Örn: 25000"
                value={contractForm.value}
                onChange={(e) => setContractForm(prev => ({ ...prev, value: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Yukarıdaki önerilerden birini seçebilir veya özel fiyat girebilirsiniz
              </p>
            </div>

            <div>
              <Label htmlFor="description">Anlaşma Açıklaması</Label>
              <Textarea
                id="description"
                placeholder="Anlaşma detayları, özel şartlar, notlar..."
                value={contractForm.description}
                onChange={(e) => setContractForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateContractModal(false)}
              >
                İptal
              </Button>
              <Button 
                type="submit" 
                disabled={creating || !contractForm.customerId || !contractForm.value}
              >
                {creating ? 'Oluşturuluyor...' : 'Anlaşma Oluştur'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}