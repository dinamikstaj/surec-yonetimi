'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import io from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import Sidebar from '@/components/sidebar';
import ChatButton from '@/components/ChatButton';
import { requireRole, isPersonnel } from '@/lib/auth';
import { 
  Clock, 
  CheckCircle, 
  BellRing, 
  Trash2,
  TrendingUp,
  AlertTriangle,
  Target,
  Users,
  Calendar,
  Activity,
  Award,
  BarChart3,
  ListChecks,
  Timer,
  Zap,
  Eye
} from 'lucide-react';
import { getApiUrl, getApiBaseUrl } from '@/lib/utils';

interface NotificationType {
  id?: string;
  message: string;
  type?: string;
  timestamp?: string;
  read: boolean;
  createdAt?: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  assignedTo: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  assignedBy?: {
    name: string;
    email: string;
  };
}

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  activeTasks: number;
  completedTasks: number;
}

const PersonnelDashboard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [teamTasks, setTeamTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // URL parametresinden gelen tab'ı uygula
  useEffect(() => {
    if (urlTab && ['overview', 'my-tasks', 'team', 'history'].includes(urlTab)) {
      setSelectedTab(urlTab);
    }
  }, [urlTab]);

  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    pendingApprovalTasks: 0,
    completionRate: 0,
    thisWeekCompleted: 0,
    lastWeekCompleted: 0
  });

  useEffect(() => {
    if (!isPersonnel()) {
      toast.error('Bu sayfaya erişim yetkiniz yok');
      router.push('/login');
      return;
    }
    
    setUserRole('kullanici');
    console.log('Personnel dashboard erişim onaylandı');

    const socket = io(getApiUrl());
        const userId = localStorage.getItem('userId');

    fetchDashboardData();
    fetchMyTasks();
    fetchTeamData();

    socket.on('new_notification', (newNotification: NotificationType) => {
      toast.info(`Yeni Bildirim: ${newNotification.message}`);
      setNotifications(prev => [newNotification, ...prev]);
      fetchDashboardData();
    });

    socket.on('task_approved', () => {
      fetchMyTasks();
      fetchDashboardData();
    });

    socket.on('task_rejected', () => {
      fetchMyTasks();
      fetchDashboardData();
    });

    socket.on('new_task_assigned', (data: any) => {
      if (data.assignedTo === userId) {
        toast.success(`Yeni görev atandı: "${data.title}"`);
        fetchMyTasks();
        fetchDashboardData();
      }
    });

    // Dürt bildirimi dinle
    socket.on('nudge_notification', (data: any) => {
      if (data.userId === userId) {
        // Görev bilgisi varsa özel mesaj göster
        const taskInfo = data.taskTitle ? `\n📋 Görev: ${data.taskTitle}` : '';
        const motivationMsg = data.motivationalMessage || '';
        
        toast.warning(data.message, {
          duration: 7000,
          description: (
            <div className="space-y-1">
              <p className="font-medium">{data.senderName} tarafından gönderildi</p>
              {data.taskTitle && (
                <p className="text-sm">📋 Görev: <span className="font-semibold">{data.taskTitle}</span></p>
              )}
              {motivationMsg && (
                <p className="text-sm font-medium text-orange-600">{motivationMsg}</p>
              )}
            </div>
          ),
          action: data.taskId ? {
            label: 'Göreve Git',
            onClick: () => router.push('/personnel/tasks')
          } : undefined
        });
        
        const nudgeNotification: NotificationType = {
          id: Date.now().toString(),
          message: data.message + (data.taskTitle ? ` - ${data.taskTitle}` : ''),
          type: 'nudge',
          timestamp: data.timestamp,
          read: false
        };
        setNotifications(prev => [nudgeNotification, ...prev]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch(`${getApiBaseUrl()}/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setUserName(userData.name || userData.email);
      }
    } catch (error) {
      console.error("Dashboard verileri çekilirken hata oluştu:", error);
    }
  };

  const fetchMyTasks = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch(`${getApiBaseUrl()}/tasks/user/${userId}`);
      if (response.ok) {
        const tasks = await response.json();
        setMyTasks(tasks);
        
        // Calculate stats
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        
        const completed = tasks.filter((t: Task) => t.status === 'completed');
        const inProgress = tasks.filter((t: Task) => t.status === 'in-progress');
        const overdue = tasks.filter((t: Task) => 
          t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
        );
        const pendingApproval = tasks.filter((t: Task) => t.status === 'pending-approval');
        
        const thisWeek = completed.filter((t: Task) => 
          new Date(t.createdAt) >= weekAgo
        );
        const lastWeek = completed.filter((t: Task) => 
          new Date(t.createdAt) >= twoWeeksAgo && new Date(t.createdAt) < weekAgo
        );

        setStats({
          totalTasks: tasks.length,
          completedTasks: completed.length,
          inProgressTasks: inProgress.length,
          overdueTasks: overdue.length,
          pendingApprovalTasks: pendingApproval.length,
          completionRate: tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0,
          thisWeekCompleted: thisWeek.length,
          lastWeekCompleted: lastWeek.length
        });
      }
    } catch (error) {
      console.error("Görevler çekilirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamData = async () => {
    try {
      const [usersRes, tasksRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/users`),
        fetch(`${getApiBaseUrl()}/tasks`)
      ]);

      if (usersRes.ok && tasksRes.ok) {
        const users = await usersRes.json();
        const allTasks = await tasksRes.json();
        
        const currentUserId = localStorage.getItem('userId');
        
        // Filter team members (exclude current user)
        const team = users
          .filter((u: any) => u.role === 'kullanici' && u._id !== currentUserId)
          .map((user: any) => {
            const userTasks = allTasks.filter((t: any) => t.assignedTo?._id === user._id);
            const completed = userTasks.filter((t: any) => t.status === 'completed');
            const active = userTasks.filter((t: any) => 
              t.status === 'in-progress' || t.status === 'pending'
            );

            return {
              _id: user._id,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
              activeTasks: active.length,
              completedTasks: completed.length
            };
          });

        setTeamMembers(team);
        
        // Get team tasks (other users' tasks)
        const otherTasks = allTasks.filter((t: Task) => 
          t.assignedTo?._id !== currentUserId && t.status !== 'completed'
        );
        setTeamTasks(otherTasks.slice(0, 10)); // Show latest 10
      }
    } catch (error) {
      console.error("Takım verileri çekilirken hata:", error);
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

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      'completed': { label: 'Tamamlandı', variant: 'default', color: 'bg-green-100 text-green-800' },
      'in-progress': { label: 'Devam Ediyor', variant: 'default', color: 'bg-blue-100 text-blue-800' },
      'pending': { label: 'Beklemede', variant: 'secondary', color: 'bg-yellow-100 text-yellow-800' },
      'pending-approval': { label: 'Onay Bekliyor', variant: 'outline', color: 'bg-purple-100 text-purple-800' }
    };
    const config = statusMap[status] || { label: status, variant: 'outline', color: '' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "Tünaydın";
    return "İyi Akşamlar";
  };

  const getPerformanceTrend = () => {
    const diff = stats.thisWeekCompleted - stats.lastWeekCompleted;
    if (diff > 0) return { icon: TrendingUp, text: `+${diff} görev bu hafta`, color: 'text-green-600' };
    if (diff < 0) return { icon: TrendingUp, text: `${diff} görev bu hafta`, color: 'text-red-600' };
    return { icon: Activity, text: 'Aynı seviye', color: 'text-gray-600' };
  };

  const upcomingDeadlines = myTasks
    .filter(t => t.dueDate && t.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  if (userRole !== 'kullanici') {
    return null;
  }

  return (
    <>
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                {getGreeting()}, {userName || 'Personel'}! 👋
              </h1>
              <p className="text-muted-foreground mt-2">
                İşte bugünkü görevleriniz ve performans özeti
              </p>
            </div>
            <Button onClick={() => router.push('/personnel/tasks')} className="gap-2">
              <ListChecks className="h-4 w-4" />
              Tüm Görevler
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Görevim</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.totalTasks}</div>
                <Progress value={(stats.completedTasks / stats.totalTasks) * 100 || 0} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.completedTasks} tamamlandı
                </p>
            </CardContent>
          </Card>

          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Devam Eden</CardTitle>
                <Timer className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.inProgressTasks}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Aktif olarak üzerinde çalışıyorum
                </p>
              </CardContent>
            </Card>

            <Card className={stats.overdueTasks > 0 ? "border-red-200 bg-red-50" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Geciken</CardTitle>
                <AlertTriangle className={`h-4 w-4 ${stats.overdueTasks > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${stats.overdueTasks > 0 ? 'text-red-600' : ''}`}>
                  {stats.overdueTasks}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Hemen üzerine düş!
                </p>
            </CardContent>
          </Card>

          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tamamlanma Oranı</CardTitle>
                <Award className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completionRate.toFixed(0)}%</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  {(() => {
                    const trend = getPerformanceTrend();
                    return (
                      <>
                        <trend.icon className={`h-3 w-3 ${trend.color}`} />
                        <span className={trend.color}>{trend.text}</span>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Genel Bakış
              </TabsTrigger>
              <TabsTrigger value="my-tasks" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Görevlerim
              </TabsTrigger>
              <TabsTrigger value="team" className="gap-2">
                <Users className="h-4 w-4" />
                Takım
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <Clock className="h-4 w-4" />
                Geçmiş
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Upcoming Deadlines */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Yaklaşan Deadline'lar
                    </CardTitle>
                    <CardDescription>Öncelikli görevleriniz</CardDescription>
            </CardHeader>
            <CardContent>
                    {upcomingDeadlines.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                        <p>Harika! Yaklaşan deadline yok</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingDeadlines.map((task) => (
                          <div key={task._id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{task.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                                  {task.priority}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(task.dueDate)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
            </CardContent>
          </Card>

                {/* Team Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Takım Üyeleri
                    </CardTitle>
                    <CardDescription>Arkadaşlarınızın durumu</CardDescription>
            </CardHeader>
            <CardContent>
                    {teamMembers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-2" />
                        <p>Takım üyesi bulunamadı</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {teamMembers.slice(0, 5).map((member) => (
                          <div key={member._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                            <Avatar className="h-10 w-10">
                              {member.avatar && (
                                <AvatarImage src={`${getApiUrl()}${member.avatar}`} />
                              )}
                              <AvatarFallback>
                                {member.name?.charAt(0) || member.email.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{member.name || member.email}</p>
                              <p className="text-xs text-muted-foreground">
                                {member.activeTasks} aktif • {member.completedTasks} tamamlandı
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* My Tasks Tab */}
            <TabsContent value="my-tasks" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Görevlerim</CardTitle>
                  <CardDescription>Tüm görevlerinizi görüntüleyin ve yönetin</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <Activity className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  ) : myTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                      <p>Henüz görev atanmamış</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myTasks.slice(0, 8).map((task) => (
                        <div key={task._id} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <p className="font-medium">{task.title}</p>
                              {getStatusBadge(task.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <Badge variant={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              {task.dueDate && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(task.dueDate)}
                                </span>
                              )}
                              {task.assignedBy && (
                                <span>Atayan: {task.assignedBy.name || task.assignedBy.email}</span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push('/personnel/tasks')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Takım Görevleri</CardTitle>
                  <CardDescription>Arkadaşlarınızın üzerinde çalıştığı görevler</CardDescription>
                </CardHeader>
                <CardContent>
                  {teamTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2" />
                      <p>Takım görevi bulunamadı</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teamTasks.map((task) => (
                        <div key={task._id} className="flex items-start gap-3 p-4 border rounded-lg">
                          <Avatar className="h-8 w-8">
                            {task.assignedTo?.avatar && (
                              <AvatarImage src={`${getApiUrl()}${task.assignedTo.avatar}`} />
                            )}
                            <AvatarFallback>
                              {task.assignedTo?.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <p className="font-medium text-sm">{task.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {task.assignedTo?.name || task.assignedTo?.email}
                                </p>
                              </div>
                              {getStatusBadge(task.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
            </CardContent>
          </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
        <Card>
          <CardHeader>
                  <CardTitle>Görev Geçmişi</CardTitle>
                  <CardDescription>Tamamlanan görevleriniz</CardDescription>
          </CardHeader>
                <CardContent>
                  {myTasks.filter(t => t.status === 'completed').length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-2" />
                      <p>Henüz tamamlanmış görev yok</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myTasks
                        .filter(t => t.status === 'completed')
                        .slice(0, 10)
                        .map((task) => (
                          <div key={task._id} className="flex items-start gap-3 p-4 border rounded-lg bg-green-50/50">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium">{task.title}</p>
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Tamamlandı: {formatDate(task.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
          </CardContent>
        </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
    
    {/* Chat Button */}
    <ChatButton />
    </>
  );
};

export default PersonnelDashboard;
