"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import Sidebar from '@/components/sidebar';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils';
import { 
  Wrench, 
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
  Shield,
  CheckCircle,
  XCircle,
  Trash2,
  Zap,
  AlertTriangle,
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

export default function OnsiteServicePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  
  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Add customer form
  const [formData, setFormData] = useState({
    company: '',
    vkn: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    postalCode: '',
    country: 'Türkiye',
    hasServiceContract: true,
    serviceStartDate: '',
    serviceEndDate: '',
    serviceValue: '',
    authorizedPerson: {
      name: '',
      title: '',
      phone: '',
      email: ''
    },
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/customers`);
      
      if (response.ok) {
        const data = await response.json();
        // SADECE servis anlaşması OLAN müşterileri göster (yerinde servis için)
        const serviceContractCustomers = data.filter((c: Customer) => c.hasServiceContract === true);
        setCustomers(serviceContractCustomers);
      } else {
        toast.error('Müşteriler yüklenemedi');
      }
    } catch (error) {
      console.error('Müşteriler yüklenirken hata:', error);
      toast.error('Müşteriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAddCustomer = async () => {
    if (!formData.company || !formData.vkn || !formData.email || !formData.phone || 
        !formData.address || !formData.city || !formData.district) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    if (!formData.serviceStartDate || !formData.serviceEndDate || !formData.serviceValue) {
      toast.error('Lütfen servis anlaşması bilgilerini doldurun');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          serviceValue: parseFloat(formData.serviceValue),
          status: 'active'
        }),
      });

      if (response.ok) {
        toast.success('Müşteri ve servis anlaşması başarıyla eklendi!');
        setShowAddCustomerModal(false);
        // Reset form
        setFormData({
          company: '',
          vkn: '',
          name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          district: '',
          postalCode: '',
          country: 'Türkiye',
          hasServiceContract: true,
          serviceStartDate: '',
          serviceEndDate: '',
          serviceValue: '',
          authorizedPerson: {
            name: '',
            title: '',
            phone: '',
            email: ''
          },
          notes: ''
        });
        fetchCustomers();
      } else {
        const error = await response.json();
        toast.error(error.msg || 'Müşteri eklenemedi');
      }
    } catch (error) {
      console.error('Add customer error:', error);
      toast.error('İşlem sırasında hata oluştu');
    } finally {
      setIsProcessing(false);
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
                  <Wrench className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Yerinde Servis
                  </h1>
                  <p className="text-muted-foreground">
                    Servis anlaşmalı müşterilere yerinde hizmet verin
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setShowAddCustomerModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Müşteri Ekle
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Toplam Müşteri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{customers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Servis anlaşmalı</p>
              </CardContent>
            </Card>

            <Card className="border hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Servis Anlaşmalı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {customers.filter(c => c.hasServiceContract).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Anlaşmalı müşteri</p>
              </CardContent>
            </Card>

            <Card className="border hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Servis Anlaşmasız
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {customers.filter(c => !c.hasServiceContract).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Anlaşmasız müşteri</p>
              </CardContent>
            </Card>

            <Card className="border hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Bu Ay Eklenen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {customers.filter(c => {
                    const createdDate = new Date(c.createdAt);
                    const now = new Date();
                    return createdDate.getMonth() === now.getMonth() && 
                           createdDate.getFullYear() === now.getFullYear();
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Yeni kayıt</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="border">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Şirket adı, yetkili kişi, şehir veya email ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
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
                      <Wrench className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Müşteri bulunamadı</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchTerm ? 'Arama kriterlerinize uygun müşteri bulunmamaktadır.' : 'Henüz müşteri kaydı bulunmamaktadır.'}
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
              filteredCustomers.map((customer) => (
                <Card 
                  key={customer._id} 
                  className="border shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-blue-600 shadow-sm">
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
                        {customer.hasServiceContract && (
                          <Badge className="bg-green-600 text-white border-0 text-xs">
                            <Wrench className="h-3 w-3 mr-1" />
                            Servis Anlaşmalı
                          </Badge>
                        )}
                        {customer.hasMaintenanceContract && (
                          <Badge className="bg-blue-600 text-white border-0 text-xs">
                            Bakım Anlaşmalı
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

                    {/* Service Status */}
                    <div className="border p-3 rounded-lg flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        <span className="font-semibold">Yerinde Servis Müşterisi</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          Servis Hazır
                        </div>
                      </div>
                    </div>

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
                          onClick={() => router.push(`/admin/support/onsite`)}
                        >
                          <Wrench className="h-4 w-4 mr-2" />
                          Servis Ver
                        </Button>
                      </div>
                      <Button 
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => handleDelete(customer)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Müşteriyi Sil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Results Count */}
          {!loading && filteredCustomers.length > 0 && (
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{filteredCustomers.length}</strong> müşteri gösteriliyor
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
              <Wrench className="h-5 w-5 text-blue-600" />
              Müşteri Detayları - Yerinde Servis
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

              {/* Anlaşma Durumu */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Anlaşma Durumu
                </h3>
                <div className="grid gap-3 md:grid-cols-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                  <div>
                    <Label className="text-xs text-muted-foreground">Bakım Anlaşması</Label>
                    <div className="mt-1">
                      {selectedCustomer.hasMaintenanceContract ? (
                        <Badge className="bg-green-600 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Var
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <XCircle className="h-3 w-3 mr-1" />
                          Yok
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Servis Anlaşması</Label>
                    <div className="mt-1">
                      {selectedCustomer.hasServiceContract ? (
                        <Badge className="bg-purple-600 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Var
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <XCircle className="h-3 w-3 mr-1" />
                          Yok
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Müşteri Durumu</Label>
                    <div className="mt-1">
                      {selectedCustomer.status === 'active' ? (
                        <Badge className="bg-green-600 text-white">Aktif</Badge>
                      ) : selectedCustomer.status === 'inactive' ? (
                        <Badge className="bg-red-600 text-white">Pasif</Badge>
                      ) : (
                        <Badge variant="outline">Beklemede</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Kayıt Tarihi</Label>
                    <p className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      {new Date(selectedCustomer.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Hızlı İşlemler */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Hızlı İşlemler
                </h3>
                <div className="grid gap-2 md:grid-cols-2">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setShowDetailModal(false);
                      router.push(`/admin/support/onsite`);
                    }}
                  >
                    <Wrench className="h-4 w-4 mr-2" />
                    Yerinde Servis Ver
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/admin/customers?id=${selectedCustomer._id}`)}
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Müşteri Sayfası
                  </Button>
                  {!selectedCustomer.hasServiceContract && (
                    <Button
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => {
                        setShowDetailModal(false);
                        router.push(`/admin/service/non-contracted`);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Servis Anlaşması Ekle
                    </Button>
                  )}
                  {!selectedCustomer.hasMaintenanceContract && (
                    <Button
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => {
                        setShowDetailModal(false);
                        router.push(`/admin/maintenance/active`);
                      }}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Bakım Anlaşması Ekle
                    </Button>
                  )}
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

      {/* Add Customer Modal */}
      <Dialog open={showAddCustomerModal} onOpenChange={setShowAddCustomerModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Yeni Müşteri ve Servis Anlaşması Ekle
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Müşteri otomatik olarak servis anlaşmalı olarak eklenecektir
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Tüm zorunlu alanları doldurunuz
                  </p>
                </div>
              </div>
            </div>

            {/* Şirket Bilgileri */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Building className="h-5 w-5" />
                Şirket Bilgileri
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Şirket Adı *</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="ABC Şirket A.Ş."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vkn">VKN (10 haneli) *</Label>
                  <Input
                    id="vkn"
                    value={formData.vkn}
                    onChange={(e) => handleInputChange('vkn', e.target.value)}
                    placeholder="1234567890"
                    maxLength={10}
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* İletişim Bilgileri */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Phone className="h-5 w-5" />
                İletişim Bilgileri
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="info@sirket.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="0212 123 45 67"
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Adres Bilgileri */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Adres Bilgileri
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Adres *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Cadde, Sokak, No"
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">Şehir *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="İstanbul"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">İlçe *</Label>
                    <Input
                      id="district"
                      value={formData.district}
                      onChange={(e) => handleInputChange('district', e.target.value)}
                      placeholder="Kadıköy"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Posta Kodu</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      placeholder="34000"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Yetkili Kişi */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Yetkili Kişi Bilgileri
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="authName">Ad Soyad *</Label>
                  <Input
                    id="authName"
                    value={formData.authorizedPerson.name}
                    onChange={(e) => handleInputChange('authorizedPerson.name', e.target.value)}
                    placeholder="Ahmet Yılmaz"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authTitle">Ünvan</Label>
                  <Input
                    id="authTitle"
                    value={formData.authorizedPerson.title}
                    onChange={(e) => handleInputChange('authorizedPerson.title', e.target.value)}
                    placeholder="Genel Müdür"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authPhone">Telefon</Label>
                  <Input
                    id="authPhone"
                    value={formData.authorizedPerson.phone}
                    onChange={(e) => handleInputChange('authorizedPerson.phone', e.target.value)}
                    placeholder="0532 123 45 67"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authEmail">E-posta</Label>
                  <Input
                    id="authEmail"
                    type="email"
                    value={formData.authorizedPerson.email}
                    onChange={(e) => handleInputChange('authorizedPerson.email', e.target.value)}
                    placeholder="yetkili@sirket.com"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Servis Anlaşması */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-purple-600" />
                Servis Anlaşması Bilgileri
              </h3>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 rounded-lg space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="serviceStartDate">Başlangıç Tarihi *</Label>
                    <Input
                      id="serviceStartDate"
                      type="date"
                      value={formData.serviceStartDate}
                      onChange={(e) => handleInputChange('serviceStartDate', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceEndDate">Bitiş Tarihi *</Label>
                    <Input
                      id="serviceEndDate"
                      type="date"
                      value={formData.serviceEndDate}
                      onChange={(e) => handleInputChange('serviceEndDate', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceValue">Anlaşma Değeri (₺) *</Label>
                  <Input
                    id="serviceValue"
                    type="number"
                    value={formData.serviceValue}
                    onChange={(e) => handleInputChange('serviceValue', e.target.value)}
                    placeholder="50000"
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Notlar */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notlar (Opsiyonel)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Müşteri hakkında notlar..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowAddCustomerModal(false)}
                disabled={isProcessing}
              >
                İptal
              </Button>
              <Button 
                onClick={handleAddCustomer}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Ekleniyor...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Müşteri Ekle
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
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
    </div>
  );
}
