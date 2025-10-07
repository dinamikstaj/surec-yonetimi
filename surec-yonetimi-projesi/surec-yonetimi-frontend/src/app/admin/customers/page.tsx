"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Sidebar from '@/components/sidebar';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils';
import { 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  User, 
  Eye, 
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  Users,
  Building2,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Wrench,
  Star,
  Clock,
  Globe
} from 'lucide-react';

interface Branch {
  name: string;
  address: string;
  city: string;
  district: string;
  postalCode?: string;
  phone: string;
  email: string;
  authorizedPerson: {
    name: string;
    title: string;
    phone: string;
    email: string;
  };
  isMain: boolean;
}

interface Customer {
  _id: string;
  company: string;
  vkn: string;
  address: string;
  city: string;
  district: string;
  postalCode?: string;
  country: string;
  phone: string;
  email: string;
  authorizedPerson: {
    name: string;
    title: string;
    phone: string;
    email: string;
  };
  branches: Branch[];
  notes?: string;
  status: 'active' | 'inactive' | 'pending';
  hasMaintenanceContract: boolean;
  hasServiceContract: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [contractFilter, setContractFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [cities, setCities] = useState<string[]>([]);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    company: '',
    vkn: '',
    address: '',
    city: '',
    district: '',
    postalCode: '',
    country: 'Türkiye',
    phone: '',
    email: '',
    authorizedPerson: {
      name: '',
      title: '',
      phone: '',
      email: ''
    },
    notes: '',
    status: 'active' as 'active' | 'inactive' | 'pending',
    hasMaintenanceContract: false,
    hasServiceContract: false
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, statusFilter, cityFilter, contractFilter]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/customers`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched customers:', data);
        setCustomers(data);
        
        const uniqueCities = [...new Set(data.map((customer: Customer) => customer.city))].filter((city): city is string => Boolean(city));
        setCities(uniqueCities);
      } else {
        toast.error('Müşteriler yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Müşteri yükleme hatası:', error);
      toast.error('Müşteriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.vkn.includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
      );
    }

    // Durum filtresi
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    // Şehir filtresi
    if (cityFilter !== 'all') {
      filtered = filtered.filter(customer => customer.city === cityFilter);
    }

    // Sözleşme filtresi
    if (contractFilter === 'maintenance') {
      filtered = filtered.filter(customer => customer.hasMaintenanceContract);
    } else if (contractFilter === 'service') {
      filtered = filtered.filter(customer => customer.hasServiceContract);
    } else if (contractFilter === 'both') {
      filtered = filtered.filter(customer => customer.hasMaintenanceContract && customer.hasServiceContract);
    } else if (contractFilter === 'none') {
      filtered = filtered.filter(customer => !customer.hasMaintenanceContract && !customer.hasServiceContract);
    }

    setFilteredCustomers(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Aktif</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Pasif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Beklemede</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getContractBadges = (customer: Customer) => {
    // Debug için console.log ekleyelim
    console.log('Customer data:', {
      company: customer.company,
      hasMaintenanceContract: customer.hasMaintenanceContract,
      hasServiceContract: customer.hasServiceContract
    });
    
    const badges = [];
    
    if (customer.hasMaintenanceContract) {
      badges.push(
        <Badge key="maintenance" className="bg-blue-100 text-blue-800 border-blue-200">
          <Shield className="w-3 h-3 mr-1" />Bakım
        </Badge>
      );
    }
    
    if (customer.hasServiceContract) {
      badges.push(
        <Badge key="service" className="bg-purple-100 text-purple-800 border-purple-200">
          <Wrench className="w-3 h-3 mr-1" />Servis
        </Badge>
      );
    }
    
    if (badges.length === 0) {
      badges.push(
        <Badge key="none" variant="outline" className="text-gray-500">
          Sözleşme Yok
        </Badge>
      );
    }
    
    return badges;
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditFormData({
      company: customer.company,
      vkn: customer.vkn,
      address: customer.address,
      city: customer.city,
      district: customer.district,
      postalCode: customer.postalCode || '',
      country: customer.country,
      phone: customer.phone,
      email: customer.email,
      authorizedPerson: customer.authorizedPerson || {
        name: '',
        title: '',
        phone: '',
        email: ''
      },
      notes: customer.notes || '',
      status: customer.status,
      hasMaintenanceContract: customer.hasMaintenanceContract,
      hasServiceContract: customer.hasServiceContract
    });
    setShowEditModal(true);
  };

  const handleDelete = (customer: Customer) => {
    setDeletingCustomer(customer);
    setShowDeleteModal(true);
  };

  const handleEditInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/customers/${editingCustomer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        toast.success('Müşteri başarıyla güncellendi');
        setShowEditModal(false);
        setEditingCustomer(null);
        fetchCustomers(); // Listeyi yenile
      } else {
        const error = await response.json();
        toast.error(error.message || 'Müşteri güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Müşteri güncelleme hatası:', error);
      toast.error('Müşteri güncellenirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/customers/${deletingCustomer._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Müşteri başarıyla silindi');
        setShowDeleteModal(false);
        setDeletingCustomer(null);
        fetchCustomers(); // Listeyi yenile
      } else {
        const error = await response.json();
        toast.error(error.message || 'Müşteri silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Müşteri silme hatası:', error);
      toast.error('Müşteri silinirken hata oluştu');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Müşteriler yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 p-6 lg:p-8 ml-16 lg:ml-0">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Müşteri Yönetimi</h1>
              <p className="text-muted-foreground mt-1">
                Müşterilerinizi yönetin ve takip edin
              </p>
            </div>
            <Button 
              onClick={() => window.location.href = '/admin/customers/new'}
              className="bg-foreground hover:bg-foreground/90 text-background"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Müşteri
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Toplam Müşteri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{customers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Kayıtlı müşteri</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Aktif Müşteri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {customers.filter(c => c.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Aktif durum</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Bakım Anlaşmalı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {customers.filter(c => c.hasMaintenanceContract).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Bakım anlaşması</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
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
                <p className="text-xs text-muted-foreground mt-1">Servis anlaşması</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtreler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Arama</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Şirket, VKN, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Durum</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Pasif</SelectItem>
                      <SelectItem value="pending">Beklemede</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Şehir</Label>
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Şehir seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contract">Anlaşma</Label>
                  <Select value={contractFilter} onValueChange={setContractFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Anlaşma türü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="maintenance">Bakım</SelectItem>
                      <SelectItem value="service">Servis</SelectItem>
                      <SelectItem value="both">Her İkisi</SelectItem>
                      <SelectItem value="none">Anlaşmasız</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer List */}
          <Card className="border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Müşteri Listesi ({filteredCustomers.length})
                </CardTitle>
                <Badge variant="outline" className="text-sm">
                  <Users className="w-4 h-4 mr-1" />
                  {filteredCustomers.length} müşteri
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCustomers.map((customer) => (
                  <Card key={customer._id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{customer.company}</h3>
                          <p className="text-sm text-muted-foreground">{customer.vkn}</p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {getStatusBadge(customer.status)}
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        {customer.authorizedPerson && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{customer.authorizedPerson.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{customer.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{customer.city}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {getContractBadges(customer)}
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Eye className="h-4 w-4 mr-1" />
                              Detay
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center">
                                <Building className="w-5 h-5 mr-2" />
                                {customer.company} - Detay Bilgileri
                              </DialogTitle>
                            </DialogHeader>
                            <CustomerDetailModal customer={customer} />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(customer)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Düzenle
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(customer)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {filteredCustomers.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Müşteri bulunamadı</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' || cityFilter !== 'all' || contractFilter !== 'all'
                    ? 'Arama kriterlerinize uygun müşteri bulunamadı.'
                    : 'Henüz müşteri kaydı bulunmuyor.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="w-5 h-5 mr-2" />
              Müşteri Düzenle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-company">Şirket Adı</Label>
                <Input
                  id="edit-company"
                  value={editFormData.company}
                  onChange={(e) => handleEditInputChange('company', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-vkn">VKN</Label>
                <Input
                  id="edit-vkn"
                  value={editFormData.vkn}
                  onChange={(e) => handleEditInputChange('vkn', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => handleEditInputChange('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Telefon</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone}
                  onChange={(e) => handleEditInputChange('phone', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-address">Adres</Label>
              <Textarea
                id="edit-address"
                value={editFormData.address}
                onChange={(e) => handleEditInputChange('address', e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-city">Şehir</Label>
                <Input
                  id="edit-city"
                  value={editFormData.city}
                  onChange={(e) => handleEditInputChange('city', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-district">İlçe</Label>
                <Input
                  id="edit-district"
                  value={editFormData.district}
                  onChange={(e) => handleEditInputChange('district', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Durum</Label>
                <Select value={editFormData.status} onValueChange={(value) => handleEditInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Pasif</SelectItem>
                    <SelectItem value="pending">Beklemede</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-maintenance"
                  checked={editFormData.hasMaintenanceContract}
                  onChange={(e) => handleEditInputChange('hasMaintenanceContract', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="edit-maintenance" className="flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Bakım Anlaşması
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-service"
                  checked={editFormData.hasServiceContract}
                  onChange={(e) => handleEditInputChange('hasServiceContract', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="edit-service" className="flex items-center">
                  <Wrench className="w-4 h-4 mr-2" />
                  Servis Anlaşması
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-notes">Notlar</Label>
              <Textarea
                id="edit-notes"
                value={editFormData.notes}
                onChange={(e) => handleEditInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                İptal
              </Button>
              <Button onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Kaydet
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <Trash2 className="w-5 h-5 mr-2" />
              Müşteri Sil
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              <strong>{deletingCustomer?.company}</strong> müşterisini silmek istediğinizden emin misiniz?
            </p>
            <p className="text-sm text-gray-500">
              Bu işlem geri alınamaz ve müşteriye ait tüm veriler silinecektir.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                İptal
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Siliniyor...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Sil
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Müşteri Detay Modal Komponenti
function CustomerDetailModal({ customer }: { customer: Customer }) {
  return (
    <div className="space-y-6">
      {/* Genel Bilgiler */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <Building className="w-5 h-5 mr-2" />
          Genel Bilgiler
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Şirket Adı</label>
            <p className="text-sm">{customer.company}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">VKN</label>
            <p className="text-sm">{customer.vkn}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Durum</label>
            <div className="mt-1">
              {customer.status === 'active' && <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aktif</Badge>}
              {customer.status === 'inactive' && <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Pasif</Badge>}
              {customer.status === 'pending' && <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Beklemede</Badge>}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Sözleşmeler</label>
            <div className="flex space-x-1 mt-1">
              {customer.hasMaintenanceContract && (
                <Badge className="bg-blue-100 text-blue-800">
                  <Shield className="w-3 h-3 mr-1" />Bakım
                </Badge>
              )}
              {customer.hasServiceContract && (
                <Badge className="bg-purple-100 text-purple-800">
                  <Wrench className="w-3 h-3 mr-1" />Servis
                </Badge>
              )}
              {!customer.hasMaintenanceContract && !customer.hasServiceContract && (
                <Badge variant="outline">Sözleşme Yok</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* İletişim Bilgileri */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <Phone className="w-5 h-5 mr-2" />
          İletişim Bilgileri
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-sm flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              {customer.email}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Telefon</label>
            <p className="text-sm flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              {customer.phone}
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-500">Adres</label>
            <p className="text-sm flex items-start">
              <MapPin className="w-4 h-4 mr-2 mt-0.5" />
              {customer.address}, {customer.district}, {customer.city} {customer.postalCode && `- ${customer.postalCode}`}, {customer.country}
            </p>
          </div>
        </div>
      </div>

      {/* Yetkili Kişi */}
      {customer.authorizedPerson && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Yetkili Kişi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Ad Soyad</label>
              <p className="text-sm">{customer.authorizedPerson.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Ünvan</label>
              <p className="text-sm">{customer.authorizedPerson.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Telefon</label>
              <p className="text-sm">{customer.authorizedPerson.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-sm">{customer.authorizedPerson.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Şubeler */}
      {customer.branches && customer.branches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Şubeler ({customer.branches.length})
          </h3>
          <div className="space-y-4">
            {customer.branches.map((branch, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium">{branch.name}</h4>
                  {branch.isMain && (
                    <Badge className="bg-green-100 text-green-800">
                      <Star className="w-3 h-3 mr-1" />Ana Şube
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Adres</label>
                    <p className="text-xs">{branch.address}, {branch.district}, {branch.city}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">İletişim</label>
                    <p className="text-xs">{branch.phone} - {branch.email}</p>
                  </div>
                  {branch.authorizedPerson && (
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-gray-500">Yetkili</label>
                      <p className="text-xs">{branch.authorizedPerson.name} ({branch.authorizedPerson.title})</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Notlar */}
      {customer.notes && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Notlar
          </h3>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{customer.notes}</p>
        </div>
      )}

      {/* Tarih Bilgileri */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Tarih Bilgileri
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Oluşturulma</label>
            <p className="text-sm">{new Date(customer.createdAt).toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Son Güncelleme</label>
            <p className="text-sm">{new Date(customer.updatedAt).toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}