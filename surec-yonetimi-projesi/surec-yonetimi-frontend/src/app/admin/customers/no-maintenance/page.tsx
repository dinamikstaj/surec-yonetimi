"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Sidebar from '@/components/sidebar';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils';
import { 
  Building,
  Mail,
  Phone,
  MapPin,
  Search,
  ArrowLeft,
  Users,
  Eye,
  AlertCircle,
  UserPlus,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Shield
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
  maintenanceStartDate?: string;
  maintenanceEndDate?: string;
  status?: string;
  createdAt: string;
}

export default function NoMaintenanceCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/customers`);
      
      if (response.ok) {
        const data = await response.json();
        const noMaintenanceCustomers = data.filter((c: Customer) => !c.hasMaintenanceContract);
        setCustomers(noMaintenanceCustomers);
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

  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const inactiveCustomers = customers.filter(c => c.status === 'inactive').length;

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
              onClick={() => router.push('/admin/customers')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg border-2 border-border bg-background">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Bakım Anlaşması Olmayan Müşteriler</h1>
                  <p className="text-sm text-muted-foreground">Potansiyel anlaşma fırsatları</p>
                </div>
              </div>
            </div>
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
                <p className="text-xs text-muted-foreground mt-1">Anlaşmasız müşteri</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Aktif Müşteri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activeCustomers}</div>
                <p className="text-xs text-muted-foreground mt-1">Aktif durumda</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  Pasif Müşteri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{inactiveCustomers}</div>
                <p className="text-xs text-muted-foreground mt-1">Dikkat gerekli</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Potansiyel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activeCustomers}</div>
                <p className="text-xs text-muted-foreground mt-1">Anlaşma fırsatı</p>
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
                    <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Müşteri bulunamadı</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm ? 'Arama kriterlerinize uygun müşteri bulunmamaktadır.' : 'Bakım anlaşması olmayan müşteri bulunmamaktadır.'}
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
                const isActive = customer.status === 'active';
                const isNewCustomer = customer.createdAt && new Date(customer.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                
                return (
                  <Card 
                    key={customer._id} 
                    className={`group hover:shadow-lg transition-all ${!isActive ? 'border-red-200 dark:border-red-900' : ''}`}
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
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline">
                            <UserPlus className="h-3 w-3 mr-1" />
                            Potansiyel
                          </Badge>
                          {isNewCustomer && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Yeni
                            </Badge>
                          )}
                        </div>
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

                      {/* Status */}
                      {!isActive && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="text-red-600 font-medium">Pasif Müşteri - İnceleme Gerekli</span>
                          </div>
                        </div>
                      )}

                      {/* Customer Since */}
                      {customer.createdAt && (
                        <div className="mb-4 p-2 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Müşteri Tarihi
                            </span>
                            <span className="font-medium text-foreground">
                              {new Date(customer.createdAt).toLocaleDateString('tr-TR')}
                            </span>
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
                        <Button 
                          size="sm" 
                          className="flex-1"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Teklif Ver
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
    </div>
  );
}