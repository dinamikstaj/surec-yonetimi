"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  MessageSquare, 
  Send, 
  Users, 
  Phone, 
  Search,
  Building,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Customer {
  _id: string;
  company: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  status: string;
}

interface SMSHistory {
  phone: string;
  message: string;
  customerName?: string;
  sentAt: string;
  status: 'success' | 'failed';
}

export default function SMSPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [smsHistory, setSmsHistory] = useState<SMSHistory[]>([]);
  const [sendType, setSendType] = useState<'manual' | 'customer'>('manual');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/customers`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Müşteriler yüklenirken hata:', error);
    }
  };

  const handleSendSMS = async () => {
    let targetPhone = '';
    let customerName = '';

    if (sendType === 'customer') {
      if (!selectedCustomer) {
        toast.error('Lütfen bir müşteri seçin');
        return;
      }
      const customer = customers.find(c => c._id === selectedCustomer);
      if (!customer) {
        toast.error('Müşteri bulunamadı');
        return;
      }
      targetPhone = customer.phone;
      customerName = customer.company;
    } else {
      if (!phone) {
        toast.error('Lütfen telefon numarası girin');
        return;
      }
      targetPhone = phone;
    }

    if (!message || message.trim() === '') {
      toast.error('Lütfen mesaj yazın');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/sms/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: targetPhone,
          message: message
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('SMS başarıyla gönderildi!');
        
        // Add to history
        const newHistory: SMSHistory = {
          phone: targetPhone,
          message: message,
          customerName: customerName || undefined,
          sentAt: new Date().toISOString(),
          status: 'success'
        };
        setSmsHistory(prev => [newHistory, ...prev]);

        // Reset form
        setMessage('');
        if (sendType === 'manual') {
          setPhone('');
        } else {
          setSelectedCustomer('');
        }
      } else {
        toast.error(data.message || 'SMS gönderilemedi');
        
        // Add failed to history
        const newHistory: SMSHistory = {
          phone: targetPhone,
          message: message,
          customerName: customerName || undefined,
          sentAt: new Date().toISOString(),
          status: 'failed'
        };
        setSmsHistory(prev => [newHistory, ...prev]);
      }
    } catch (error) {
      console.error('SMS gönderme hatası:', error);
      toast.error('SMS gönderilirken hata oluştu');
    } finally {
      setSending(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    !customerSearch ||
    customer.company.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch) ||
    customer.city?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const stats = {
    totalSent: smsHistory.filter(h => h.status === 'success').length,
    totalFailed: smsHistory.filter(h => h.status === 'failed').length,
    totalCustomers: customers.length,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 p-6 lg:p-8 ml-16 lg:ml-0">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                SMS Gönder
              </h1>
              <p className="text-muted-foreground mt-2">
                Müşterilerinize toplu veya tekil SMS gönderin
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Başarılı SMS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.totalSent}</div>
                <p className="text-xs text-muted-foreground mt-1">Bu oturumda gönderildi</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Başarısız SMS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats.totalFailed}</div>
                <p className="text-xs text-muted-foreground mt-1">Gönderilemedi</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Toplam Müşteri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalCustomers}</div>
                <p className="text-xs text-muted-foreground mt-1">Kayıtlı müşteri</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* SMS Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  SMS Gönder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Send Type Selector */}
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                  <Button
                    type="button"
                    variant={sendType === 'manual' ? 'default' : 'ghost'}
                    className="flex-1"
                    onClick={() => setSendType('manual')}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Manuel Numara
                  </Button>
                  <Button
                    type="button"
                    variant={sendType === 'customer' ? 'default' : 'ghost'}
                    className="flex-1"
                    onClick={() => setSendType('customer')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Müşteri Seç
                  </Button>
                </div>

                <Separator />

                {/* Manual Phone Input */}
                {sendType === 'manual' && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon Numarası</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="05551234567 veya 905551234567"
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Türkiye formatı: 05XX XXX XX XX veya 905XX XXX XX XX
                    </p>
                  </div>
                )}

                {/* Customer Selection */}
                {sendType === 'customer' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Müşteri Ara</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Şirket adı, telefon veya şehir ara..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer">Müşteri Seçin</Label>
                      <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                        <SelectTrigger>
                          <SelectValue placeholder="Müşteri seçin" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {filteredCustomers.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                              Müşteri bulunamadı
                            </div>
                          ) : (
                            filteredCustomers.map((customer) => (
                              <SelectItem key={customer._id} value={customer._id}>
                                <div className="flex items-center justify-between w-full gap-4">
                                  <span className="font-medium">{customer.company}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {customer.phone}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedCustomer && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
                        {(() => {
                          const customer = customers.find(c => c._id === selectedCustomer);
                          return customer ? (
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-900 dark:text-blue-100">
                                  {customer.company}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-blue-600" />
                                <span className="text-blue-700 dark:text-blue-300">
                                  {customer.phone}
                                </span>
                              </div>
                              {customer.city && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-blue-600" />
                                  <span className="text-blue-700 dark:text-blue-300">
                                    {customer.city}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Input */}
                <div className="space-y-2">
                  <Label htmlFor="message">Mesaj İçeriği</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Mesajınızı buraya yazın..."
                    rows={5}
                    className="resize-none"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Karakter: {message.length}</span>
                    <span>SMS: {Math.ceil(message.length / 160) || 1}</span>
                  </div>
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleSendSMS}
                  disabled={sending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      SMS Gönder
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* SMS History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Gönderim Geçmişi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {smsHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Henüz SMS gönderilmedi</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {smsHistory.map((item, index) => (
                      <div 
                        key={index}
                        className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {item.status === 'success' ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="font-medium text-sm">
                              {item.customerName || item.phone}
                            </span>
                          </div>
                          <Badge variant={item.status === 'success' ? 'default' : 'destructive'}>
                            {item.status === 'success' ? 'Başarılı' : 'Başarısız'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {item.message}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {item.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(item.sentAt).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

