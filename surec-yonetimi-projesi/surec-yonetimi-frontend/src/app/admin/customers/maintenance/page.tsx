"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import Sidebar from '@/components/sidebar';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils';
import { 
  Shield,
  Building,
  Mail,
  Phone,
  MapPin,
  Search,
  ArrowLeft,
  CheckCircle,
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  Eye,
  Plus,
  X
} from 'lucide-react';

interface Customer {
  _id: string;
  company: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  district?: string;
  vkn?: string;
  hasMaintenanceContract?: boolean;
  maintenanceStartDate?: string;
  maintenanceEndDate?: string;
  status?: string;
  createdAt: string;
}

export default function MaintenanceCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    company: '',
    vkn: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    hasMaintenanceContract: true,
    maintenanceStartDate: '',
    maintenanceEndDate: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/customers`);
      
      if (response.ok) {
        const data = await response.json();
        const maintenanceCustomers = data.filter((c: Customer) => c.hasMaintenanceContract === true);
        setCustomers(maintenanceCustomers);
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company || !formData.vkn || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.district) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Müşteri başarıyla eklendi');
        setShowAddModal(false);
        setFormData({
          company: '',
          vkn: '',
          name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          district: '',
          hasMaintenanceContract: true,
          maintenanceStartDate: '',
          maintenanceEndDate: '',
        });
        fetchCustomers();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Müşteri eklenemedi');
      }
    } catch (error) {
      console.error('Müşteri ekleme hatası:', error);
      toast.error('Müşteri eklenirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMaintenanceStatus = (customer: Customer) => {
    if (!customer.maintenanceEndDate) return null;
    
    const endDate = new Date(customer.maintenanceEndDate);
    const now = new Date();
    const daysLeft = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return { text: 'Süresi Dolmuş', color: 'border-red-200 dark:border-red-900', icon: AlertTriangle, textColor: 'text-red-600' };
    } else if (daysLeft < 30) {
      return { text: `${daysLeft} gün kaldı`, color: 'border-orange-200 dark:border-orange-900', icon: Clock, textColor: 'text-orange-600' };
    } else {
      return { text: `${daysLeft} gün kaldı`, color: 'border-border', icon: CheckCircle, textColor: 'text-foreground' };
    }
  };

  const urgentRenewals = customers.filter(c => {
    if (!c.maintenanceEndDate) return false;
    const endDate = new Date(c.maintenanceEndDate);
    const now = new Date();
    const daysLeft = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft >= 0 && daysLeft < 30;
  }).length;

  const expiredContracts = customers.filter(c => {
    if (!c.maintenanceEndDate) return false;
    return new Date(c.maintenanceEndDate) < new Date();
  }).length;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-6 lg:p-8 ml-16 lg:ml-0">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/admin/customers')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg border-2 border-border bg-background">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Bakım Anlaşması Olan Müşteriler</h1>
                  <p className="text-sm text-muted-foreground">Aktif bakım anlaşmaları</p>
                </div>
              </div>
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Müşteri Ekle
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Toplam Müşteri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{customers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Bakım anlaşmalı</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Aktif Anlaşma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {customers.filter(c => {
                    if (!c.maintenanceEndDate) return false;
                    return new Date(c.maintenanceEndDate) > new Date();
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Geçerli anlaşmalar</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 dark:border-orange-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  Yenileme Gerekli
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{urgentRenewals}</div>
                <p className="text-xs text-muted-foreground mt-1">30 gün içinde</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Süresi Dolmuş
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{expiredContracts}</div>
                <p className="text-xs text-muted-foreground mt-1">İvedi işlem gerekli</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Yükleniyor...</p>
                  </CardContent>
                </Card>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="p-12 text-center">
                    <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Müşteri bulunamadı</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm ? 'Arama kriterlerinize uygun müşteri bulunmamaktadır.' : 'Bakım anlaşması olan müşteri bulunmamaktadır.'}
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
                    className={`group hover:shadow-lg transition-all ${maintenanceStatus?.color || ''}`}
                  >
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 rounded-lg border-2 border-border bg-muted/50">
                          <Building className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold mb-1 truncate">
                            {customer.company}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {customer.name}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          <Shield className="h-3 w-3 mr-1" />
                          Anlaşmalı
                        </Badge>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.city && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{customer.city}</span>
                          </div>
                        )}
                      </div>

                      {/* Maintenance Dates */}
                      {(customer.maintenanceStartDate || customer.maintenanceEndDate) && (
                        <div className="space-y-2 mb-4">
                          {customer.maintenanceStartDate && (
                            <div className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded-lg">
                              <span className="text-muted-foreground">Başlangıç</span>
                              <span className="font-medium">
                                {new Date(customer.maintenanceStartDate).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                          )}
                          {customer.maintenanceEndDate && (
                            <div className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded-lg">
                              <span className="text-muted-foreground">Bitiş</span>
                              <span className="font-medium">
                                {new Date(customer.maintenanceEndDate).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Status Badge */}
                      {maintenanceStatus && (
                        <div className={`p-3 rounded-lg border mb-4 ${maintenanceStatus.color}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-4 w-4 ${maintenanceStatus.textColor}`} />
                              <span className={`font-medium text-sm ${maintenanceStatus.textColor}`}>
                                {maintenanceStatus.text}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => router.push(`/admin/customers?id=${customer._id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Detaylar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Results */}
          {!loading && filteredCustomers.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    <strong className="text-foreground">{filteredCustomers.length}</strong> müşteri gösteriliyor
                    {searchTerm && <span> • <strong>"{searchTerm}"</strong> araması</span>}
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

      {/* Add Customer Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Müşteri Ekle (Bakım Anlaşmalı)</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="company">Şirket Adı <span className="text-red-500">*</span></Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="vkn">VKN <span className="text-red-500">*</span></Label>
                <Input
                  id="vkn"
                  value={formData.vkn}
                  onChange={(e) => handleInputChange('vkn', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Yetkili Adı</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon <span className="text-red-500">*</span></Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="address">Adres <span className="text-red-500">*</span></Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">Şehir <span className="text-red-500">*</span></Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="district">İlçe <span className="text-red-500">*</span></Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="startDate">Anlaşma Başlangıç</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.maintenanceStartDate}
                  onChange={(e) => handleInputChange('maintenanceStartDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Anlaşma Bitiş</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.maintenanceEndDate}
                  onChange={(e) => handleInputChange('maintenanceEndDate', e.target.value)}
                />
              </div>
            </div>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} disabled={isSaving}>
                İptal
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Kaydediliyor...' : 'Müşteri Ekle'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
