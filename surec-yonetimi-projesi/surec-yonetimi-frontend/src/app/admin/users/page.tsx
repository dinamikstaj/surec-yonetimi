"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import Sidebar from '@/components/sidebar';
import { 
  UserPlus, 
  Users, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Shield,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl, getApiBaseUrl } from '@/lib/utils';

interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: 'yonetici' | 'kullanici';
  username?: string;
  avatar?: string;
  createdAt?: string;
  lastLogin?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "kullanici" as "yonetici" | "kullanici",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filtreleme ve arama işlemleri
    let filtered = users;

    // Arama
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Rol filtresi
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
      toast.error('Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      toast.error('Tüm alanlar zorunludur');
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Kullanıcı başarıyla oluşturuldu!');
        resetForm();
        setShowCreateModal(false);
        fetchUsers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.msg || 'Kullanıcı oluşturulamadı');
      }
    } catch (error) {
      console.error('Kullanıcı oluşturma hatası:', error);
      toast.error('Kullanıcı oluşturulamadı');
    } finally {
      setCreating(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !formData.name || !formData.email || !formData.phone) {
      toast.error('Tüm alanlar zorunludur');
      return;
    }

    setUpdating(true);

    try {
      const updateData: any = { ...formData };
      if (!updateData.password) {
        delete updateData.password; // Şifre boşsa güncelleme
      }

      const response = await fetch(`${getApiBaseUrl()}/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast.success('Kullanıcı başarıyla güncellendi!');
        resetForm();
        setShowEditModal(false);
        setSelectedUser(null);
      fetchUsers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.msg || 'Kullanıcı güncellenemedi');
      }
    } catch (error) {
      console.error('Kullanıcı güncelleme hatası:', error);
      toast.error('Kullanıcı güncellenemedi');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`"${userName}" kullanıcısını silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Kullanıcı silindi');
        fetchUsers();
      } else {
        toast.error('Kullanıcı silinemedi');
      }
    } catch (error) {
      console.error('Kullanıcı silme hatası:', error);
      toast.error('Kullanıcı silinemedi');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      phone: user.phone,
      role: user.role,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "kullanici",
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
  };

  const getAvatarFallback = (name: string, email: string) => {
    if (name && name.length > 0) return name.charAt(0).toUpperCase();
    if (email && email.length > 0) return email.charAt(0).toUpperCase();
    return "U";
  };

  const getRoleDisplayName = (role: string) => {
    return role === 'yonetici' ? 'Yönetici' : 'Personel';
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'yonetici' ? 'destructive' : 'secondary';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Bilinmiyor';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getStats = () => {
    const total = users.length;
    const admins = users.filter(u => u.role === 'yonetici').length;
    const personnel = users.filter(u => u.role === 'kullanici').length;
    
    return { total, admins, personnel };
  };

  const stats = getStats();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-8 pr-8 bg-background overflow-y-auto">
        <div className="w-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Kullanıcı Yönetimi</h1>
              <p className="text-muted-foreground">
                Sistem kullanıcılarını yönetin, yeni kullanıcılar ekleyin ve rollerini düzenleyin
              </p>
            </div>
            
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Yeni Kullanıcı
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]" aria-describedby="user-create-description">
                <DialogHeader>
                  <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
                </DialogHeader>
                <div id="user-create-description" className="sr-only">
                  Sisteme yeni kullanıcı eklemek için formu doldurun.
                </div>
                
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="name">Ad Soyad *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                        placeholder="Kullanıcının tam adı"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">E-posta *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                        placeholder="kullanici@email.com"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="password">Şifre *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                          placeholder="Güvenli şifre"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Telefon *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                          placeholder="0555 123 45 67"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="role">Rol *</Label>
                      <Select value={formData.role} onValueChange={(value: "yonetici" | "kullanici") => setFormData(prev => ({...prev, role: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kullanici">Personel</SelectItem>
                          <SelectItem value="yonetici">Yönetici</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end space-x-3">
            <Button
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateModal(false)}
                    >
                      İptal
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
            </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Yöneticiler</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.admins}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Personel</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.personnel}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtreler ve Arama
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Kullanıcı ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
        </div>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Roller</SelectItem>
                    <SelectItem value="yonetici">Yönetici</SelectItem>
                    <SelectItem value="kullanici">Personel</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={clearFilters}>
                  Filtreleri Temizle
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Grid */}
          <Card>
            <CardHeader>
              <CardTitle>
                Kullanıcılar ({filteredUsers.length})
              </CardTitle>
              <CardDescription>
                Sistem kullanıcılarını yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Kullanıcılar yükleniyor...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {users.length === 0 ? 'Henüz kullanıcı yok' : 'Filtre kriterlerinize uygun kullanıcı bulunamadı'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {users.length === 0 
                      ? 'İlk kullanıcıyı oluşturmak için yukarıdaki butonu kullanın'
                      : 'Filtreleri temizleyerek tüm kullanıcıları görüntüleyebilirsiniz'
                    }
                  </p>
                  {users.length === 0 ? (
                    <Button onClick={() => setShowCreateModal(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      İlk Kullanıcıyı Oluştur
                    </Button>
                  ) : (
                    <Button onClick={clearFilters} variant="outline">
                      Filtreleri Temizle
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredUsers.map((user) => (
                    <Card key={user._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4 mb-4">
                          <Avatar className="h-12 w-12">
                            {user.avatar && (
                              <AvatarImage 
                                src={`${getApiUrl()}${user.avatar}`}
                                alt={user.name}
                              />
                            )}
                            <AvatarFallback className="text-lg font-semibold">
                              {getAvatarFallback(user.name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{user.name}</h3>
                            <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                              {getRoleDisplayName(user.role)}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{user.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Üyelik: {formatDate(user.createdAt)}</span>
                          </div>
        </div>

                        <Separator className="my-4" />

                        <div className="flex justify-between gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(user)}
                            className="gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Düzenle
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user._id, user.name)}
                            className="gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                            Sil
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
            ))}
          </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit User Modal */}
        {selectedUser && (
          <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent className="sm:max-w-[500px]" aria-describedby="user-edit-description">
              <DialogHeader>
                <DialogTitle>Kullanıcı Düzenle</DialogTitle>
              </DialogHeader>
              <div id="user-edit-description" className="sr-only">
                Seçilen kullanıcının bilgilerini düzenleyin.
              </div>
              
              <form onSubmit={handleEditUser} className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="edit-name">Ad Soyad *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-email">E-posta *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-password">Yeni Şifre</Label>
                      <Input
                        id="edit-password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                        placeholder="Boş bırakılırsa değişmez"
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-phone">Telefon *</Label>
                      <Input
                        id="edit-phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-role">Rol *</Label>
                    <Select value={formData.role} onValueChange={(value: "yonetici" | "kullanici") => setFormData(prev => ({...prev, role: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kullanici">Personel</SelectItem>
                        <SelectItem value="yonetici">Yönetici</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowEditModal(false)}
                  >
                    İptal
                  </Button>
                  <Button type="submit" disabled={updating}>
                    {updating ? 'Güncelleniyor...' : 'Kullanıcıyı Güncelle'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
