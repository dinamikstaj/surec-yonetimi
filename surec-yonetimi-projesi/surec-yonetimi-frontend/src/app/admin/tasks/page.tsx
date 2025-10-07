"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Sidebar from "@/components/sidebar";
import { getUserId, requireAuth } from "@/lib/auth";
import { 
  Plus, 
  Clock, 
  User, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  X,
  BarChart3,
  TrendingUp,
  Target
} from "lucide-react";
import { toast } from "sonner";
import { getApiUrl, getApiBaseUrl } from '@/lib/utils';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  assignedTo: User;
  assignedBy: User;
  status: 'pending' | 'in-progress' | 'pending-approval' | 'completed' | 'cancelled' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const userId = getUserId();
    console.log('getUserId result:', userId);
    
    if (userId) {
      setCurrentUserId(userId);
      console.log('Current userId set:', userId);
    } else {
      console.error('userId bulunamadı');
      toast.error('Oturum bilgisi bulunamadı, lütfen tekrar giriş yapın');
      requireAuth('/login');
      return;
    }
    
    fetchTasks();
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filtreleme ve arama işlemleri
    let filtered = tasks;

    // Arama
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignedTo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignedTo.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Durum filtresi
    if (statusFilter !== "all") {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Öncelik filtresi
    if (priorityFilter !== "all") {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Atanan kişi filtresi
    if (assigneeFilter !== "all") {
      filtered = filtered.filter(task => task.assignedTo._id === assigneeFilter);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, statusFilter, priorityFilter, assigneeFilter]);

  const fetchTasks = async () => {
    try {
      console.log('Görevler çekiliyor...');
      const response = await fetch(`${getApiBaseUrl()}/tasks`);
      console.log('Tasks API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Alınan görev verisi:', data);
        setTasks(data);
      } else {
        console.error('Tasks API hatası:', response.status);
        toast.error('Görevler yüklenemedi');
      }
    } catch (error) {
      console.error('Görevler yüklenirken hata:', error);
      toast.error('Görevler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Kullanıcılar çekiliyor...');
      const response = await fetch(`${getApiBaseUrl()}/users`);
      console.log('Users API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Alınan kullanıcı verisi:', data);
        const personnelUsers = data.filter((user: User) => user.role === 'kullanici');
        console.log('Filtrelenmiş personel kullanıcıları:', personnelUsers);
        setUsers(personnelUsers);
      } else {
        console.error('Users API hatası:', response.status);
      }
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
      toast.error('Kullanıcılar yüklenemedi');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Görev oluşturma başlatıldı:', {
      title,
      description,
      assignedTo,
      currentUserId,
      priority,
      dueDate,
      notes
    });
    
    if (!title || !description || !assignedTo) {
      toast.error('Başlık, açıklama ve atanan kişi zorunludur');
      return;
    }

    if (!currentUserId) {
      toast.error('Kullanıcı kimliği bulunamadı');
      return;
    }

    setCreating(true);

    try {
      const taskData = {
        title,
        description,
        assignedTo,
        assignedBy: currentUserId,
        priority,
        dueDate: dueDate || null,
        notes,
      };
      
      console.log('API\'ye gönderilecek veri:', taskData);
      
      const response = await fetch(`${getApiBaseUrl()}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      console.log('API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Görev oluşturma başarılı:', result);
        toast.success('Görev başarıyla oluşturuldu!');
        resetForm();
        setShowCreateModal(false);
        fetchTasks();
      } else {
        const errorData = await response.json();
        console.error('API hatası:', errorData);
        toast.error(errorData.msg || 'Görev oluşturulamadı');
      }
    } catch (error) {
      console.error('Görev oluşturma hatası:', error);
      toast.error('Görev oluşturulamadı: ' + (error as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          userId: currentUserId,
        }),
      });

      if (response.ok) {
        toast.success('Görev durumu güncellendi');
        fetchTasks();
      } else {
        const errorData = await response.json();
        toast.error(errorData.msg || 'Durum güncellenemedi');
      }
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      toast.error('Durum güncellenemedi');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Görev silindi');
        fetchTasks();
      } else {
        toast.error('Görev silinemedi');
      }
    } catch (error) {
      console.error('Görev silme hatası:', error);
      toast.error('Görev silinemedi');
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setPriority("medium");
    setDueDate("");
    setNotes("");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setAssigneeFilter("all");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending-approval': return 'secondary';
      case 'in-progress': return 'secondary';
      case 'pending': return 'outline';
      case 'cancelled': return 'destructive';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending-approval': return <Clock className="h-4 w-4 text-amber-600" />;
      case 'in-progress': return <Play className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAvatarFallback = (name: string, email: string) => {
    if (name && name.length > 0) {
      return name.charAt(0).toUpperCase();
    }
    if (email && email.length > 0) {
      return email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const pendingApproval = tasks.filter(t => t.status === 'pending-approval').length;
    const overdue = tasks.filter(t => t.dueDate && isOverdue(t.dueDate) && t.status !== 'completed').length;
    
    return { total, completed, inProgress, pending, pendingApproval, overdue };
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
              <h1 className="text-3xl font-bold mb-2">Görev Yönetimi</h1>
              <p className="text-muted-foreground">
                Tüm görevleri yönetin, durumlarını takip edin ve yeni görevler oluşturun
              </p>
            </div>
            
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Yeni Görev
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]" aria-describedby="task-create-description">
                <DialogHeader>
                  <DialogTitle>Yeni Görev Oluştur</DialogTitle>
                </DialogHeader>
                <div id="task-create-description" className="sr-only">
                  Personele yeni görev atamak için formu doldurun.
                </div>
                
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="title">Görev Başlığı *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Görev başlığını girin"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Açıklama *</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Görev açıklamasını girin"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="assignedTo">Atanan Kişi *</Label>
                        <Select value={assignedTo} onValueChange={setAssignedTo}>
                          <SelectTrigger>
                            <SelectValue placeholder="Personel seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user._id} value={user._id}>
                                {user.name || user.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="priority">Öncelik</Label>
                        <Select value={priority} onValueChange={setPriority}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Düşük</SelectItem>
                            <SelectItem value="medium">Orta</SelectItem>
                            <SelectItem value="high">Yüksek</SelectItem>
                            <SelectItem value="urgent">Acil</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="dueDate">Bitiş Tarihi</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Notlar</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ek notlar (opsiyonel)"
                        rows={2}
                      />
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
                      {creating ? 'Oluşturuluyor...' : 'Görev Oluştur'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Devam Eden</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inProgress}</div>
              </CardContent>
            </Card>
            <Card className={stats.pendingApproval > 0 ? "border-amber-200 bg-amber-50/50" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Onay Bekleyen</CardTitle>
                <AlertCircle className={`h-4 w-4 ${stats.pendingApproval > 0 ? 'text-amber-600 animate-pulse' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.pendingApproval > 0 ? 'text-amber-600' : ''}`}>
                  {stats.pendingApproval}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
              </CardContent>
            </Card>
            <Card className={stats.overdue > 0 ? "border-destructive/50 bg-destructive/5" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Geciken</CardTitle>
                <AlertCircle className={`h-4 w-4 ${stats.overdue > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-destructive' : ''}`}>
                  {stats.overdue}
                </div>
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
              <div className="grid gap-4 md:grid-cols-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Görev ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="pending">Bekleyen</SelectItem>
                    <SelectItem value="in-progress">Devam Eden</SelectItem>
                    <SelectItem value="pending-approval">Onay Bekleyen</SelectItem>
                    <SelectItem value="completed">Tamamlanan</SelectItem>
                    <SelectItem value="cancelled">İptal</SelectItem>
                    <SelectItem value="rejected">Reddedildi</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Öncelik" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Öncelikler</SelectItem>
                    <SelectItem value="urgent">Acil</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="medium">Orta</SelectItem>
                    <SelectItem value="low">Düşük</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Atanan Kişi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Personel</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={clearFilters}>
                  Temizle
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tasks List */}
          <Card>
            <CardHeader>
              <CardTitle>
                Görevler ({filteredTasks.length})
              </CardTitle>
              <CardDescription>
                Filtrelenmiş görev listesi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Görevler yükleniyor...</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {tasks.length === 0 ? 'Henüz görev yok' : 'Filtre kriterlerinize uygun görev bulunamadı'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {tasks.length === 0 
                      ? 'İlk görevini oluşturmak için yukarıdaki butonu kullan'
                      : 'Filtreleri temizleyerek tüm görevleri görüntüleyebilirsiniz'
                    }
                  </p>
                  {tasks.length === 0 ? (
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Görev
                    </Button>
                  ) : (
                    <Button onClick={clearFilters} variant="outline">
                      Filtreleri Temizle
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <div key={task._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{task.title}</h3>
                            <Badge variant={getPriorityColor(task.priority)}>
                              {task.priority === 'low' ? 'Düşük' : 
                               task.priority === 'medium' ? 'Orta' :
                               task.priority === 'high' ? 'Yüksek' : 'Acil'}
                            </Badge>
                            <Badge variant={getStatusColor(task.status)} className="gap-1">
                              {getStatusIcon(task.status)}
                              {task.status === 'pending' ? 'Beklemede' :
                               task.status === 'in-progress' ? 'Devam Ediyor' :
                               task.status === 'pending-approval' ? 'Onay Bekliyor' :
                               task.status === 'completed' ? 'Tamamlandı' :
                               task.status === 'rejected' ? 'Reddedildi' : 'İptal'}
                            </Badge>
                            {task.dueDate && isOverdue(task.dueDate) && task.status !== 'completed' && (
                              <Badge variant="destructive" className="animate-pulse">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Gecikmiş
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-muted-foreground mb-3">{task.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                {task.assignedTo?.avatar && (
                                  <AvatarImage 
                                    src={`${getApiUrl()}${task.assignedTo.avatar}`}
                                    alt={task.assignedTo?.name || task.assignedTo?.email}
                                  />
                                )}
                                <AvatarFallback className="text-xs">
                                  {getAvatarFallback(task.assignedTo?.name || '', task.assignedTo?.email || '')}
                                </AvatarFallback>
                              </Avatar>
                              <span>{task.assignedTo?.name || task.assignedTo?.email || 'Bilinmiyor'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(task.createdAt)}</span>
                            </div>
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span className={isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-destructive font-medium' : ''}>
                                  Bitiş: {formatDate(task.dueDate)}
                                  {isOverdue(task.dueDate) && task.status !== 'completed' && (
                                    <span className="ml-2 text-destructive font-semibold">(Gecikmiş)</span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTask(task);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Select
                            value={task.status}
                            onValueChange={(value) => handleStatusUpdate(task._id, value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Beklemede</SelectItem>
                              <SelectItem value="in-progress">Devam Ediyor</SelectItem>
                              <SelectItem value="pending-approval">Onay Bekliyor</SelectItem>
                              <SelectItem value="completed">Tamamlandı</SelectItem>
                              <SelectItem value="cancelled">İptal</SelectItem>
                              <SelectItem value="rejected">Reddedildi</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTask(task._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Task Detail Modal */}
        {selectedTask && (
          <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
            <DialogContent className="sm:max-w-[600px]" aria-describedby="task-detail-description">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Görev Detayları
                </DialogTitle>
              </DialogHeader>
              <div id="task-detail-description" className="sr-only">
                Seçilen görevin detaylı bilgilerini görüntüleyin.
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{selectedTask.title}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant={getPriorityColor(selectedTask.priority)}>
                      {selectedTask.priority === 'low' ? 'Düşük' : 
                       selectedTask.priority === 'medium' ? 'Orta' :
                       selectedTask.priority === 'high' ? 'Yüksek' : 'Acil'}
                    </Badge>
                    <Badge variant={getStatusColor(selectedTask.status)} className="gap-1">
                      {getStatusIcon(selectedTask.status)}
                      {selectedTask.status === 'pending' ? 'Beklemede' :
                       selectedTask.status === 'in-progress' ? 'Devam Ediyor' :
                       selectedTask.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{selectedTask.description}</p>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Atanan Kişi</h4>
                                         <div className="flex items-center gap-2">
                       <Avatar className="h-8 w-8">
                         {selectedTask.assignedTo?.avatar && (
                           <AvatarImage 
                             src={`${getApiUrl()}${selectedTask.assignedTo.avatar}`}
                             alt={selectedTask.assignedTo?.name || selectedTask.assignedTo?.email}
                           />
                         )}
                         <AvatarFallback className="text-sm">
                           {getAvatarFallback(selectedTask.assignedTo?.name || '', selectedTask.assignedTo?.email || '')}
                         </AvatarFallback>
                       </Avatar>
                       <div>
                         <p className="font-medium">{selectedTask.assignedTo?.name || selectedTask.assignedTo?.email || 'Bilinmiyor'}</p>
                         <p className="text-sm text-muted-foreground">{selectedTask.assignedTo?.email || ''}</p>
                       </div>
                     </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Atan Kişi</h4>
                                         <div className="flex items-center gap-2">
                       <Avatar className="h-8 w-8">
                         {selectedTask.assignedBy?.avatar && (
                           <AvatarImage 
                             src={`${getApiUrl()}${selectedTask.assignedBy.avatar}`}
                             alt={selectedTask.assignedBy?.name || selectedTask.assignedBy?.email}
                           />
                         )}
                         <AvatarFallback className="text-sm">
                           {getAvatarFallback(selectedTask.assignedBy?.name || '', selectedTask.assignedBy?.email || '')}
                         </AvatarFallback>
                       </Avatar>
                       <div>
                         <p className="font-medium">{selectedTask.assignedBy?.name || selectedTask.assignedBy?.email || 'Bilinmiyor'}</p>
                         <p className="text-sm text-muted-foreground">{selectedTask.assignedBy?.email || ''}</p>
                       </div>
                     </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-1">Oluşturulma Tarihi</h4>
                    <p className="text-muted-foreground">{formatDate(selectedTask.createdAt)}</p>
                  </div>
                  
                  {selectedTask.dueDate && (
                    <div>
                      <h4 className="font-medium mb-1">Bitiş Tarihi</h4>
                      <p className={`${isOverdue(selectedTask.dueDate) && selectedTask.status !== 'completed' ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                        {formatDate(selectedTask.dueDate)}
                        {isOverdue(selectedTask.dueDate) && selectedTask.status !== 'completed' && (
                          <span className="ml-2 text-destructive font-semibold animate-pulse">⚠️ (Gecikmiş)</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {selectedTask.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notlar</h4>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm">{selectedTask.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
} 