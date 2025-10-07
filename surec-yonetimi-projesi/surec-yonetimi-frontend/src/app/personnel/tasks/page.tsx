"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Sidebar from "@/components/sidebar";
import { Clock, User, Calendar, AlertCircle, CheckCircle, Play, X, Filter, Search } from "lucide-react";
import { toast } from "sonner";
import io from 'socket.io-client';
import { Input } from "@/components/ui/input";
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
  notes?: string;
}

export default function PersonnelTasksPage() {
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get('filter');
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // URL parametresinden gelen filtreyi uygula
  useEffect(() => {
    if (urlFilter) {
      if (urlFilter === 'in-progress') {
        setStatusFilter('in-progress');
      } else if (urlFilter === 'completed') {
        setStatusFilter('completed');
      } else if (urlFilter === 'overdue') {
        setStatusFilter('overdue');
      }
    }
  }, [urlFilter]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setCurrentUserId(userId);
      fetchTasks(userId);
      
      // Socket.io bağlantısı kur
      const socket = io(getApiUrl());
      
      // Yeni görev atandığında dinle
      socket.on('new_task_assigned', (data) => {
        if (data.assignedTo === userId) {
          toast.success(`Yeni görev atandı: "${data.title}"`);
          fetchTasks(userId); // Görevleri yenile
        }
      });

      // Görev onaylandığında dinle
      socket.on('task_approved', (data) => {
        if (data.assignedTo === userId) {
          toast.success(`Göreviniz onaylandı: "${data.title}"`);
          fetchTasks(userId); // Görevleri yenile
        }
      });

      // Görev reddedildiğinde dinle
      socket.on('task_rejected', (data) => {
        if (data.assignedTo === userId) {
          toast.error(`Göreviniz reddedildi: "${data.title}" - ${data.rejectionReason}`);
          fetchTasks(userId); // Görevleri yenile
        }
      });

      // Dürt bildirimi dinle
      socket.on('nudge_notification', (data: any) => {
        if (data.userId === userId) {
          // Motivasyon mesajı ile birlikte göster
          const motivationMsg = data.motivationalMessage || '💪 Hadi, hızlanalım!';
          
          toast.warning(`🔔 ${data.message}`, {
            duration: 7000,
            description: (
              <div className="space-y-2 mt-1">
                <p className="font-medium text-sm">{data.senderName} tarafından gönderildi</p>
                {data.taskTitle && (
                  <div className="bg-blue-50 p-2 rounded border-l-4 border-blue-500">
                    <p className="text-sm font-semibold text-blue-900">📋 Görev: {data.taskTitle}</p>
                  </div>
                )}
                <p className="text-base font-bold text-orange-600 animate-pulse">{motivationMsg}</p>
              </div>
            )
          });
          
          // Eğer görev ID'si varsa, o görevi highlight et
          if (data.taskId) {
            fetchTasks(userId);
          }
        }
      });

      return () => {
        socket.disconnect();
      };
    } else {
      toast.error("Kullanıcı kimliği bulunamadı");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Filtreleme ve arama işlemleri
    let filtered = tasks;

    // Arama
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Durum filtresi
    if (statusFilter !== "all") {
      if (statusFilter === "overdue") {
        // Gecikmiş görevleri göster
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          const today = new Date();
          return dueDate < today && task.status !== 'completed' && task.status !== 'cancelled';
        });
      } else {
      filtered = filtered.filter(task => task.status === statusFilter);
      }
    }

    // Öncelik filtresi
    if (priorityFilter !== "all") {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  const fetchTasks = async (userId: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/tasks/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        toast.error('Görevler yüklenemedi');
      }
    } catch (error) {
      console.error('Görevler yüklenirken hata:', error);
      toast.error('Görevler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    setUpdatingStatus(taskId);
    
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
        if (newStatus === 'pending-approval') {
          toast.success('Görev tamamlandı! Yönetici onayına gönderildi.');
        } else {
          toast.success('Görev durumu güncellendi');
        }
        fetchTasks(currentUserId);
      } else {
        const errorData = await response.json();
        toast.error(errorData.msg || 'Durum güncellenemedi');
      }
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      toast.error('Durum güncellenemedi');
    } finally {
      setUpdatingStatus(null);
    }
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
      case 'pending': return <AlertCircle className="h-4 w-4" />;
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

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-8 pr-8 bg-background overflow-y-auto">
        <div className="w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Görevlerim</h1>
            <p className="text-muted-foreground">
              Size atanan görevleri görüntüleyin ve durumlarını güncelleyin
            </p>
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
              <div className="grid gap-4 md:grid-cols-4">
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

                <Button variant="outline" onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                }}>
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
                Size atanan görevleri görüntüleyin ve durumlarını güncelleyin
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
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {tasks.length === 0 ? 'Henüz görev yok' : 'Filtre kriterlerinize uygun görev bulunamadı'}
                  </h3>
                  <p className="text-muted-foreground">
                    {tasks.length === 0 
                      ? 'Size henüz görev atanmamış. Yeni görevler atandığında burada görünecek.'
                      : 'Filtreleri temizleyerek tüm görevleri görüntüleyebilirsiniz.'
                    }
                  </p>
                  {tasks.length > 0 && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                        setPriorityFilter("all");
                      }}
                    >
                      Filtreleri Temizle
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <div key={task._id} className="border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{task.title}</h3>
                            <Badge variant={getPriorityColor(task.priority)}>
                              {task.priority === 'low' ? 'Düşük' : 
                               task.priority === 'medium' ? 'Orta' :
                               task.priority === 'high' ? 'Yüksek' : 'Acil'}
                            </Badge>
                            {task.dueDate && isOverdue(task.dueDate) && task.status !== 'completed' && (
                              <Badge variant="destructive" className="animate-pulse">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Gecikmiş
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-muted-foreground mb-4">{task.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                {task.assignedBy.avatar && (
                                  <AvatarImage 
                                    src={`${getApiUrl()}${task.assignedBy.avatar}`}
                                    alt={task.assignedBy.name}
                                  />
                                )}
                                <AvatarFallback className="text-xs">
                                  {getAvatarFallback(task.assignedBy.name, task.assignedBy.email)}
                                </AvatarFallback>
                              </Avatar>
                              <span>Atan: {task.assignedBy.name || task.assignedBy.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Oluşturulma: {formatDate(task.createdAt)}</span>
                            </div>
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span className={isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-destructive font-medium' : ''}>
                                  Bitiş: {formatDate(task.dueDate)}
                                  {isOverdue(task.dueDate) && task.status !== 'completed' && (
                                    <span className="ml-2 text-destructive font-semibold animate-pulse">⚠️ Gecikmiş</span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                          {task.notes && (
                            <div className="bg-muted/50 p-3 rounded-lg mb-4">
                              <p className="text-sm"><strong>Notlar:</strong> {task.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(task.status)} className="gap-1">
                            {getStatusIcon(task.status)}
                            {task.status === 'pending' ? 'Beklemede' :
                             task.status === 'in-progress' ? 'Devam Ediyor' :
                             task.status === 'pending-approval' ? 'Onay Bekliyor' :
                             task.status === 'completed' ? 'Tamamlandı' :
                             task.status === 'rejected' ? 'Reddedildi' : 'İptal'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={task.status}
                            onValueChange={(value) => handleStatusUpdate(task._id, value)}
                            disabled={updatingStatus === task._id}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Beklemede</SelectItem>
                              <SelectItem value="in-progress">Başla</SelectItem>
                              <SelectItem value="pending-approval">Onay Bekliyor</SelectItem>
                              {task.status === 'rejected' && (
                                <SelectItem value="rejected" disabled>
                                  Reddedildi
                                </SelectItem>
                              )}
                              {task.status === 'completed' && (
                                <SelectItem value="completed" disabled>
                                  Tamamlandı
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          
                          {updatingStatus === task._id && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 