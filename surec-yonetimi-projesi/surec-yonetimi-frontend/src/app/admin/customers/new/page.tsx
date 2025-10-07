"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Sidebar from '@/components/sidebar';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils';
import { 
  Building, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Plus, 
  X,
  Save,
  ArrowLeft,
  Shield,
  Wrench,
  Users,
  Building2
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

export default function NewCustomerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  const [formData, setFormData] = useState({
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

  const addBranch = () => {
    const newBranch: Branch = {
      name: '',
      address: '',
      city: '',
      district: '',
      postalCode: '',
      phone: '',
      email: '',
      authorizedPerson: {
        name: '',
        title: '',
        phone: '',
        email: ''
      },
      isMain: branches.length === 0 // İlk şube ana şube olur
    };
    setBranches([...branches, newBranch]);
  };

  const removeBranch = (index: number) => {
    const newBranches = branches.filter((_, i) => i !== index);
    // Eğer ana şube silinirse, ilk şubeyi ana yap
    if (branches[index].isMain && newBranches.length > 0) {
      newBranches[0].isMain = true;
    }
    setBranches(newBranches);
  };

  const updateBranch = (index: number, field: string, value: any) => {
    const newBranches = [...branches];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newBranches[index] = {
        ...newBranches[index],
        [parent]: {
          ...newBranches[index][parent as keyof Branch] as any,
          [child]: value
        }
      };
    } else {
      newBranches[index] = {
        ...newBranches[index],
        [field]: value
      };
    }
    setBranches(newBranches);
  };

  const setMainBranch = (index: number) => {
    const newBranches = branches.map((branch, i) => ({
      ...branch,
      isMain: i === index
    }));
    setBranches(newBranches);
  };

  const validateForm = () => {
    if (!formData.company.trim()) {
      toast.error('Şirket adı gereklidir');
      return false;
    }
    if (!formData.vkn.trim()) {
      toast.error('VKN gereklidir');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email gereklidir');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error('Telefon gereklidir');
      return false;
    }
    if (!formData.authorizedPerson.name.trim()) {
      toast.error('Yetkili kişi adı gereklidir');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const customerData = {
        ...formData,
        branches: branches.filter(branch => branch.name.trim() !== '') // Boş şubeleri filtrele
      };

      const response = await fetch(`${getApiBaseUrl()}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (response.ok) {
        toast.success('Müşteri başarıyla oluşturuldu');
        router.push('/admin/customers');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Müşteri oluşturulurken hata oluştu');
      }
    } catch (error) {
      console.error('Müşteri oluşturma hatası:', error);
      toast.error('Müşteri oluşturulurken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Yeni Müşteri Kaydı</h1>
                <p className="text-gray-600 mt-1">Yeni müşteri bilgilerini girin</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Genel Bilgiler */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Genel Bilgiler
                </CardTitle>
                <CardDescription>
                  Müşteri şirket bilgilerini girin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Şirket Adı *</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Şirket adını girin"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vkn">VKN *</Label>
                    <Input
                      id="vkn"
                      value={formData.vkn}
                      onChange={(e) => handleInputChange('vkn', e.target.value)}
                      placeholder="10 haneli VKN"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">Şehir *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Şehir"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="district">İlçe *</Label>
                    <Input
                      id="district"
                      value={formData.district}
                      onChange={(e) => handleInputChange('district', e.target.value)}
                      placeholder="İlçe"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Posta Kodu</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      placeholder="Posta kodu"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Adres *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Tam adres"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefon *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Telefon numarası"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Email adresi"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="country">Ülke</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Ülke"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Yetkili Kişi */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Yetkili Kişi
                </CardTitle>
                <CardDescription>
                  Şirket yetkili kişi bilgilerini girin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="authName">Ad Soyad *</Label>
                    <Input
                      id="authName"
                      value={formData.authorizedPerson.name}
                      onChange={(e) => handleInputChange('authorizedPerson.name', e.target.value)}
                      placeholder="Yetkili kişi adı"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="authTitle">Ünvan *</Label>
                    <Input
                      id="authTitle"
                      value={formData.authorizedPerson.title}
                      onChange={(e) => handleInputChange('authorizedPerson.title', e.target.value)}
                      placeholder="Ünvan"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="authPhone">Telefon</Label>
                    <Input
                      id="authPhone"
                      value={formData.authorizedPerson.phone}
                      onChange={(e) => handleInputChange('authorizedPerson.phone', e.target.value)}
                      placeholder="Yetkili kişi telefonu"
                    />
                  </div>
                  <div>
                    <Label htmlFor="authEmail">Email</Label>
                    <Input
                      id="authEmail"
                      type="email"
                      value={formData.authorizedPerson.email}
                      onChange={(e) => handleInputChange('authorizedPerson.email', e.target.value)}
                      placeholder="Yetkili kişi emaili"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Şubeler */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    Şubeler
                  </div>
                  <Button type="button" onClick={addBranch} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Şube Ekle
                  </Button>
                </CardTitle>
                <CardDescription>
                  Müşteri şubelerini ekleyin (opsiyonel)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {branches.map((branch, index) => (
                  <Card key={index} className="p-4 border-2">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">Şube {index + 1}</h4>
                        {branch.isMain && (
                          <Badge className="bg-green-100 text-green-800">
                            Ana Şube
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {!branch.isMain && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setMainBranch(index)}
                          >
                            Ana Yap
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBranch(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Şube Adı *</Label>
                        <Input
                          value={branch.name}
                          onChange={(e) => updateBranch(index, 'name', e.target.value)}
                          placeholder="Şube adı"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Şehir</Label>
                          <Input
                            value={branch.city}
                            onChange={(e) => updateBranch(index, 'city', e.target.value)}
                            placeholder="Şehir"
                          />
                        </div>
                        <div>
                          <Label>İlçe</Label>
                          <Input
                            value={branch.district}
                            onChange={(e) => updateBranch(index, 'district', e.target.value)}
                            placeholder="İlçe"
                          />
                        </div>
                        <div>
                          <Label>Posta Kodu</Label>
                          <Input
                            value={branch.postalCode || ''}
                            onChange={(e) => updateBranch(index, 'postalCode', e.target.value)}
                            placeholder="Posta kodu"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Adres</Label>
                        <Textarea
                          value={branch.address}
                          onChange={(e) => updateBranch(index, 'address', e.target.value)}
                          placeholder="Şube adresi"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Telefon</Label>
                          <Input
                            value={branch.phone}
                            onChange={(e) => updateBranch(index, 'phone', e.target.value)}
                            placeholder="Şube telefonu"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={branch.email}
                            onChange={(e) => updateBranch(index, 'email', e.target.value)}
                            placeholder="Şube emaili"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h5 className="font-medium mb-3">Şube Yetkili Kişi</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Ad Soyad</Label>
                            <Input
                              value={branch.authorizedPerson.name}
                              onChange={(e) => updateBranch(index, 'authorizedPerson.name', e.target.value)}
                              placeholder="Yetkili kişi adı"
                            />
                          </div>
                          <div>
                            <Label>Ünvan</Label>
                            <Input
                              value={branch.authorizedPerson.title}
                              onChange={(e) => updateBranch(index, 'authorizedPerson.title', e.target.value)}
                              placeholder="Ünvan"
                            />
                          </div>
                          <div>
                            <Label>Telefon</Label>
                            <Input
                              value={branch.authorizedPerson.phone}
                              onChange={(e) => updateBranch(index, 'authorizedPerson.phone', e.target.value)}
                              placeholder="Telefon"
                            />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={branch.authorizedPerson.email}
                              onChange={(e) => updateBranch(index, 'authorizedPerson.email', e.target.value)}
                              placeholder="Email"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                {branches.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Henüz şube eklenmedi</p>
                    <p className="text-sm">Yukarıdaki "Şube Ekle" butonuna tıklayarak şube ekleyebilirsiniz</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Durum ve Sözleşmeler */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Durum ve Sözleşmeler
                </CardTitle>
                <CardDescription>
                  Müşteri durumu ve sözleşme bilgilerini belirleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="status">Durum</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
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
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="maintenanceContract"
                      checked={formData.hasMaintenanceContract}
                      onChange={(e) => handleInputChange('hasMaintenanceContract', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="maintenanceContract" className="flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      Bakım Anlaşması
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="serviceContract"
                      checked={formData.hasServiceContract}
                      onChange={(e) => handleInputChange('hasServiceContract', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="serviceContract" className="flex items-center">
                      <Wrench className="w-4 h-4 mr-2" />
                      Servis Anlaşması
                    </Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notlar</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Müşteri hakkında notlar..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Müşteriyi Kaydet
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}