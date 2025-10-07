"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import io from 'socket.io-client';
import Sidebar from '@/components/sidebar';
import PendingApprovalTasks from '@/components/PendingApprovalTasks';
import AdminCalendarWidget from '@/components/AdminCalendarWidget';
import ChatButton from '@/components/ChatButton';
import {
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Eye,
  Settings,
  BarChart3,
  Activity,
  Calendar,
  Target,
  Zap,
  Mail,
  UserCheck,
  ClipboardList,
  Building,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getApiUrl, getApiBaseUrl } from '@/lib/utils';

interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  pendingApprovalTasks: number;
  tasksThisWeek: number;
  tasksLastWeek: number;
  completionRate: number;
  maintenanceContracts: number;
  upcomingServices: number;
}

interface RecentActivity {
  _id: string;
  message: string;
  username: string;
  createdAt: string;
  type: 'user' | 'task' | 'system';
}

interface TaskSummary {
  _id: string;
  title: string;
  description?: string;
  assignedTo: {
    name: string;
    email: string;
    avatar?: string;
  };
  assignedBy?: {
    name: string;
    email: string;
    avatar?: string;
  };
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [userRole, setUserRole] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    pendingApprovalTasks: 0,
    tasksThisWeek: 0,
    tasksLastWeek: 0,
    completionRate: 0,
    maintenanceContracts: 0,
    upcomingServices: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [recentTasks, setRecentTasks] = useState<TaskSummary[]>([]);
  const [pendingApprovalTasks, setPendingApprovalTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Calendar states
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [allTasks, setAllTasks] = useState<TaskSummary[]>([]);
  const [selectedDay, setSelectedDay] = useState<{date: Date, tasks: TaskSummary[]} | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (!role || role !== 'yonetici') {
      toast.error('Bu sayfaya erişim yetkiniz yok.');
      router.push('/login');
    } else {
      setUserRole(role);
      fetchDashboardData();
      
      // Socket.io bağlantısı - SSR uyumlu
      const socket = io(getApiUrl());

      socket.on('new_task_assigned', () => {
        fetchDashboardData();
      });
      
      socket.on('task_status_updated', () => {
        fetchDashboardData();
      });

      // Onay bekleyen görev bildirimi
      socket.on('task_needs_approval', (data) => {
        toast.info(`Onay bekliyor: "${data.title}"`);
        fetchDashboardData();
      });

      // Görev onaylandığında/reddedildiğinde
      socket.on('task_approved', () => {
        fetchDashboardData();
      });

      socket.on('task_rejected', () => {
        fetchDashboardData();
      });

    return () => {
        socket.disconnect();
    };
    }
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Paralel olarak tüm verileri çek
      const [usersRes, tasksRes, activitiesRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/users`),
        fetch(`${getApiBaseUrl()}/tasks`),
        fetch(`${getApiBaseUrl()}/notifications`), // Genel aktiviteler için
      ]);

      if (usersRes.ok && tasksRes.ok) {
        const users = await usersRes.json();
        const tasks = await tasksRes.json();
        
        // İstatistikleri hesapla
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        
        const tasksThisWeek = tasks.filter((task: any) => 
          new Date(task.createdAt) >= weekAgo
        ).length;
        
        const tasksLastWeek = tasks.filter((task: any) => 
          new Date(task.createdAt) >= twoWeeksAgo && new Date(task.createdAt) < weekAgo
        ).length;

        const overdueTasks = tasks.filter((task: any) => 
          task.dueDate && new Date(task.dueDate) < now && task.status !== 'completed'
        ).length;

        const completedTasks = tasks.filter((task: any) => task.status === 'completed').length;
        const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

        // Müşteri verilerini al
        const customersResponse = await fetch(`${getApiBaseUrl()}/customers`);
        let customerStats = { totalCustomers: 0, activeCustomers: 0, maintenanceContracts: 0 };
        
        if (customersResponse.ok) {
          const customers = await customersResponse.json();
          customerStats = {
            totalCustomers: customers.length,
            activeCustomers: customers.filter((customer: any) => customer.status === 'active').length,
            maintenanceContracts: customers.filter((customer: any) => customer.hasMaintenanceContract).length,
          };
        }

        setStats({
          ...customerStats,
          totalTasks: tasks.length,
          completedTasks,
          pendingTasks: tasks.filter((task: any) => task.status === 'pending').length,
          overdueTasks,
          pendingApprovalTasks: tasks.filter((task: any) => task.status === 'pending-approval').length,
          tasksThisWeek,
          tasksLastWeek,
          completionRate,
          upcomingServices: 0, // Şimdilik 0
        });

        // Son 5 görevi al
        setRecentTasks(tasks.slice(0, 5));
        
        // Onay bekleyen görevleri tasks'tan filtrele
        const pendingApprovalTasks = tasks.filter((task: any) => task.status === 'pending-approval');
        setPendingApprovalTasks(pendingApprovalTasks);
      }

      // Aktiviteleri al
      if (activitiesRes.ok) {
        const activities = await activitiesRes.json();
        setRecentActivities(activities.slice(0, 6));
      }

    } catch (error) {
      console.error('Dashboard verileri alınamadı:', error);
      toast.error('Dashboard verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "Tünaydın";
    return "İyi Akşamlar";
  };

  const getTaskChangePercentage = () => {
    if (stats.tasksLastWeek === 0) return stats.tasksThisWeek > 0 ? 100 : 0;
    return ((stats.tasksThisWeek - stats.tasksLastWeek) / stats.tasksLastWeek) * 100;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getAvatarFallback = (name: string, email: string) => {
    if (name && name.length > 0) return name.charAt(0).toUpperCase();
    if (email && email.length > 0) return email.charAt(0).toUpperCase();
    return "U";
  };

  if (userRole !== 'yonetici') {
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-8 pr-8 bg-background overflow-y-auto">
        <div className="w-full space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {getGreeting()}, Yönetici!
              </h1>
              <p className="text-muted-foreground">
                İşte sisteminizdeki güncel durum özeti
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => router.push('/admin/tasks')}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Yeni Görev
                </Button>
                                    <Button 
                variant="outline" 
                onClick={fetchDashboardData}
                className="gap-2"
              >
                <Activity className="h-4 w-4" />
                Yenile
                                    </Button>
                </div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Müşteri</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeCustomers} aktif müşteri
                </p>
              </CardContent>
            </Card>

            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Görev</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.totalTasks}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getTaskChangePercentage() >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  {Math.abs(getTaskChangePercentage()).toFixed(1)}% bu hafta
                </div>
            </CardContent>
          </Card>
          
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tamamlanma Oranı</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
                <Progress value={stats.completionRate} className="mt-2" />
            </CardContent>
          </Card>
          
            <Card className={stats.overdueTasks > 0 ? "border-destructive/50 bg-destructive/5" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Geciken Görevler</CardTitle>
                <AlertTriangle className={`h-4 w-4 ${stats.overdueTasks > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${stats.overdueTasks > 0 ? 'text-destructive' : ''}`}>
                  {stats.overdueTasks}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingTasks} bekleyen görev
                </p>
            </CardContent>
          </Card>
        </div>

          {/* Onay Bekleyen Görevler */}
          {pendingApprovalTasks.length > 0 && (
            <PendingApprovalTasks
              tasks={pendingApprovalTasks as any}
              onRefresh={fetchDashboardData}
              className="mb-6"
            />
          )}

          {/* Görev Takvimi */}
          <div className="mb-6">
            <AdminCalendarWidget />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Tasks */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Son Görevler</CardTitle>
                  <CardDescription>
                    En son oluşturulan görevler ve durumları
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push('/admin/tasks')}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Tümünü Gör
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-muted rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : recentTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Henüz görev oluşturulmamış</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => router.push('/admin/tasks')}
                    >
                      İlk Görevi Oluştur
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentTasks.map((task) => (
                      <div key={task._id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0">
                          {getStatusIcon(task.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium truncate">{task.title}</p>
                            <div className="flex items-center space-x-2">
                              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                                {task.priority}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Avatar className="h-5 w-5">
                                {task.assignedTo?.avatar && (
                                  <AvatarImage src={`${getApiUrl()}${task.assignedTo.avatar}`} />
                                )}
                                <AvatarFallback className="text-xs">
                                  {getAvatarFallback(task.assignedTo?.name || '', task.assignedTo?.email || '')}
                                </AvatarFallback>
                              </Avatar>
                              <span>{task.assignedTo?.name || task.assignedTo?.email || 'Bilinmiyor'}</span>
                            </div>
                            <span>{formatDate(task.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions & Recent Activity */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
            <CardHeader>
              <CardTitle>Hızlı İşlemler</CardTitle>
                  <CardDescription>
                    Sık kullanılan yönetim işlemleri
                  </CardDescription>
            </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start gap-3" 
                    onClick={() => router.push('/admin/tasks')}
                  >
                    <Plus className="h-4 w-4" />
                    Yeni Görev Oluştur
              </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3"
                    onClick={() => router.push('/admin/users')}
                  >
                    <UserCheck className="h-4 w-4" />
                    Kullanıcı Yönetimi
              </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3"
                    onClick={() => router.push('/admin/mail')}
                  >
                    <Mail className="h-4 w-4" />
                    Mail Gönder
              </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3"
                    onClick={() => router.push('/admin/nudge')}
                  >
                    <Zap className="h-4 w-4" />
                    Personel Dürt
              </Button>
            </CardContent>
          </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Son Aktiviteler</CardTitle>
                  <CardDescription>
                    Sistemdeki son işlemler
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-8 bg-muted rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : recentActivities.length === 0 ? (
                    <div className="text-center py-6">
                      <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Henüz aktivite yok</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentActivities.map((activity, index) => (
                        <div key={activity._id || index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {activity.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(activity.createdAt)}
                            </p>
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
      </main>
      
      {/* Chat Button */}
      <ChatButton />
    </div>
  );
}