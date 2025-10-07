"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import Sidebar from '@/components/sidebar';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils';
import { 
  Users, 
  ArrowLeft, 
  Building,
  Mail,
  Phone,
  MapPin,
  Search,
  Calendar,
  Clock,
  Plus,
  Eye,
  Edit,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Trash2,
  Save,
  CheckCircle,
  XCircle,
  Shield,
  Zap
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

export default function NonContractedServicePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  
  // Modals
  const [showAddContractModal, setShowAddContractModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Contract form
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [contractNotes, setContractNotes] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/customers`);
      
      if (response.ok) {
        const data = await response.json();
        // Sadece servis anlaşması OLMAYAN müşterileri filtrele
        const nonContractedCustomers = data.filter((c: Customer) => c.hasServiceContract !== true);
        setCustomers(nonContractedCustomers);
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

  const handleAddContract = (customer: Customer) => {
    setSelectedCustomer(customer);
    // Set default dates
    const today = new Date();
    const oneYearLater = new Date(today);
    oneYearLater.setFullYear(today.getFullYear() + 1);
    
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(oneYearLater.toISOString().split('T')[0]);
    setContractValue('');
    setContractNotes('');
    setShowAddContractModal(true);
  };

  const confirmAddContract = async () => {
    if (!selectedCustomer) return;
    
    if (!startDate || !endDate || !contractValue) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/customers/${selectedCustomer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hasServiceContract: true,
          serviceStartDate: startDate,
          serviceEndDate: endDate,
          serviceValue: parseFloat(contractValue),
          notes: contractNotes
        }),
      });

      if (response.ok) {
        toast.success(`${selectedCustomer.company} için servis anlaşması eklendi!`);
        setShowAddContractModal(false);
        setSelectedCustomer(null);
        fetchCustomers();
      } else {
        const error = await response.json();
        toast.error(error.msg || 'Anlaşma eklenemedi');
      }
    } catch (error) {
      console.error('Add contract error:', error);
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
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Anlaşmasız Müşteriler Servisi
                  </h1>
                  <p className="text-muted-foreground">
                    Servis anlaşması olmayan müşterileri yönetin
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => router.push('/admin/customers/new')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Müşteri
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Toplam Anlaşmasız
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{customers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Servis anlaşmasız</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Potansiyel Anlaşma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {customers.filter(c => !c.hasServiceContract).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Anlaşma fırsatı</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Sadece Bakım
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {customers.filter(c => c.hasMaintenanceContract && !c.hasServiceContract).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Bakım anlaşmalı</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Bu Ay Eklenen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
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
                      <Users className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Müşteri bulunamadı</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchTerm ? 'Arama kriterlerinize uygun müşteri bulunmamaktadır.' : 'Servis anlaşması olmayan müşteri bulunmamaktadır.'}
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
                      <div className="p-3 rounded-lg bg-orange-600 shadow-sm">
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
                        <Badge className="bg-orange-600 text-white border-0 text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Servis Anlaşmasız
                        </Badge>
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

                    {/* Service Opportunity */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg mb-4 border border-blue-200/50">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">Servis Anlaşma Fırsatı</span>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Bu müşteri ile servis anlaşması yapılabilir
                      </p>
                    </div>

                    {/* Service Status */}
                    <div className="bg-orange-600 text-white p-3 rounded-lg shadow-sm flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-semibold">Servis Anlaşması Yok</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs opacity-90">
                          Potansiyel Müşteri
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
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleAddContract(customer)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Anlaşma Ekle
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
              <Building className="h-5 w-5 text-orange-600" />
              Müşteri Detayları - Anlaşmasız
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
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Anlaşma Durumu
                </h3>
                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3 mb-3">
                    <XCircle className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-900 dark:text-orange-100">
                        Servis Anlaşması Bulunmuyor
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Bu müşteri ile servis anlaşması yapılabilir
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Bakım Anlaşması</Label>
                      <div className="mt-1">
                        {selectedCustomer.hasMaintenanceContract ? (
                          <Badge className="bg-green-600 text-white">
                            <Shield className="h-3 w-3 mr-1" />
                            Var
                          </Badge>
                        ) : (
                          <Badge variant="outline">Yok</Badge>
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
              </div>

              <Separator />

              {/* Hızlı İşlemler */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Hızlı İşlemler
                </h3>
                <div className="grid gap-2 md:grid-cols-2">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleAddContract(selectedCustomer);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Servis Anlaşması Ekle
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

      {/* Add Contract Modal */}
      <Dialog open={showAddContractModal} onOpenChange={setShowAddContractModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Servis Anlaşması Ekle
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      <strong>{selectedCustomer.company}</strong> için servis anlaşması oluşturulacak
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Bu işlem müşteriye servis anlaşması ekleyecektir.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="serviceStartDate">Başlangıç Tarihi *</Label>
                  <Input
                    id="serviceStartDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceEndDate">Bitiş Tarihi *</Label>
                  <Input
                    id="serviceEndDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceContractValue">Anlaşma Değeri (₺) *</Label>
                <Input
                  id="serviceContractValue"
                  type="number"
                  placeholder="Örn: 30000"
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceNotes">Notlar (Opsiyonel)</Label>
                <Textarea
                  id="serviceNotes"
                  placeholder="Servis anlaşması hakkında notlar..."
                  value={contractNotes}
                  onChange={(e) => setContractNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Separator />

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddContractModal(false)}
                  disabled={isProcessing}
                >
                  İptal
                </Button>
                <Button 
                  onClick={confirmAddContract}
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
                      Evet, Anlaşma Ekle
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
    </div>
  );
}