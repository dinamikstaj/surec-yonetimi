"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Sidebar from '@/components/sidebar';
import { 
  MessageSquare, 
  Search, 
  Mail, 
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils';

interface Customer {
  _id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
}

interface Communication {
  _id: string;
  customerId: string;
  customer: Customer;
  type: 'email' | 'sms' | 'both';
  subject: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt: string;
  sentBy: string;
}

export default function MailPage() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchCommunications();
  }, []);

  const fetchCommunications = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/communications`);
      if (response.ok) {
        const data = await response.json();
        setCommunications(data);
      }
    } catch (error) {
      console.error('İletişim geçmişi getirme hatası:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Gönderildi';
      case 'delivered':
        return 'Teslim Edildi';
      case 'failed':
        return 'Başarısız';
      case 'pending':
        return 'Bekliyor';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'both':
        return (
          <div className="flex gap-1">
            <Mail className="h-4 w-4 text-blue-500" />
            <MessageSquare className="h-4 w-4 text-green-500" />
          </div>
        );
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'email':
        return 'E-posta';
      case 'sms':
        return 'SMS';
      case 'both':
        return 'E-posta + SMS';
      default:
        return 'Bilinmiyor';
    }
  };

  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = comm.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || comm.status === statusFilter;
    const matchesType = typeFilter === 'all' || comm.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-8 pr-8 bg-background overflow-y-auto">
        <div className="w-full">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">İletişim Geçmişi</h1>
            <p className="text-muted-foreground">
                Müşterilerle yapılan tüm iletişimlerin geçmişi ve durumu
            </p>
            </div>
          </div>

        <Card>
          <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                İletişim Kayıtları
                      </CardTitle>
                      <CardDescription>
                Gönderilen mesajların durumu, geçmişi ve detayları
                      </CardDescription>
          </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filtreler */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Müşteri, konu veya mesaj içeriğinde ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Durum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Durumlar</SelectItem>
                      <SelectItem value="pending">Bekliyor</SelectItem>
                      <SelectItem value="sent">Gönderildi</SelectItem>
                      <SelectItem value="delivered">Teslim Edildi</SelectItem>
                      <SelectItem value="failed">Başarısız</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Tür" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Tüm Türler</SelectItem>
                      <SelectItem value="email">E-posta</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="both">E-posta + SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

                {/* İletişim Listesi */}
                <div className="space-y-3">
                  {filteredCommunications.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Henüz iletişim kaydı yok</h3>
                      <p className="text-muted-foreground">
                        Müşteri sayfasından iletişim kurarak ilk mesajınızı gönderin
                      </p>
                        </div>
                  ) : (
                    filteredCommunications.map((comm) => (
                      <div key={comm._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(comm.type)}
              <div>
                              <h4 className="font-medium">{comm.customer.name}</h4>
                              <p className="text-sm text-muted-foreground">{comm.customer.company}</p>
                            </div>
                </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {getTypeText(comm.type)}
                            </Badge>
                            <Badge className={getStatusColor(comm.status)}>
                              {getStatusIcon(comm.status)}
                              <span className="ml-1">{getStatusText(comm.status)}</span>
                            </Badge>
                          </div>
                        </div>

                        {comm.subject && (
                          <div className="mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Konu: </span>
                            <span className="text-sm">{comm.subject}</span>
                      </div>
                        )}

                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {comm.content}
                          </p>
                      </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {new Date(comm.sentAt).toLocaleString('tr-TR')}
                          </span>
                          <span>Gönderen: {comm.sentBy}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
                </CardContent>
              </Card>
        </div>
      </main>
    </div>
  );
}