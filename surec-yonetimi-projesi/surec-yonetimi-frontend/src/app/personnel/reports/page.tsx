'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Sidebar from '@/components/sidebar';
import DetailedAnalytics from '@/components/DetailedAnalytics';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Zap,
  Star,
  Medal,
  Trophy,
  Flame
} from 'lucide-react';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils';

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  completionRate: number;
  averageCompletionTime: number;
  averageCompletionTimeUnit?: string;
  onTimeTasks?: number;
  lateTasks?: number;
  onTimeRate?: number;
  nudgeCount?: number;
  performanceScore?: number;
}

interface MonthlyData {
  month: string;
  completed: number;
  total: number;
  completionRate?: number;
}

interface PriorityStats {
  low: number;
  medium: number;
  high: number;
  urgent: number;
}

interface DetailedAnalytics {
  summary: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
    onTimeTasks: number;
    lateTasks: number;
    onTimeRate: number;
    nudgeCount: number;
    avgCompletionTime: number;
    performanceScore: number;
  };
  priorityStats: any;
  monthlyPerformance: MonthlyData[];
  weeklyActivity: any[];
  insights: {
    strengths: string[];
    improvements: string[];
  };
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  target: number;
}

export default function PersonnelReportsPage() {
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    overdue: 0,
    completionRate: 0,
    averageCompletionTime: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [priorityStats, setPriorityStats] = useState<PriorityStats>({
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (id) {
      setUserId(id);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchMonthlyData();
    fetchAchievements();
  }, [selectedPeriod]);

  const fetchStats = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${getApiBaseUrl()}/users/${userId}/analytics`);
      if (response.ok) {
        const data = await response.json();
        
        // Summary verilerini stats'a map et
        if (data.summary) {
          setStats({
            total: data.summary.totalTasks,
            completed: data.summary.completedTasks,
            inProgress: data.summary.inProgressTasks,
            pending: data.summary.pendingTasks,
            overdue: data.summary.overdueTasks,
            completionRate: data.summary.completionRate,
            averageCompletionTime: data.summary.avgCompletionTime,
            averageCompletionTimeUnit: data.summary.avgCompletionTimeUnit
          });
        }
        
        // Priority stats'ı ayarla
        if (data.priorityStats) {
          setPriorityStats({
            low: data.priorityStats.low.total,
            medium: data.priorityStats.medium.total,
            high: data.priorityStats.high.total,
            urgent: data.priorityStats.urgent.total
          });
        }
        
        // Monthly data'yı ayarla
        if (data.monthlyPerformance) {
          setMonthlyData(data.monthlyPerformance);
        }
      }
    } catch (error) {
      console.error('İstatistikler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${getApiBaseUrl()}/tasks/user/${userId}/monthly`);
      if (response.ok) {
        const data = await response.json();
        setMonthlyData(data);
      }
    } catch (error) {
      console.error('Aylık veriler yüklenemedi:', error);
    }
  };

  const fetchAchievements = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${getApiBaseUrl()}/users/${userId}/achievements`);
      if (response.ok) {
        const data = await response.json();
        setAchievements(data);
      }
    } catch (error) {
      console.error('Başarılar yüklenemedi:', error);
    }
  };

  const getAchievementIcon = (iconName: string): React.ReactElement => {
    const icons: Record<string, React.ReactElement> = {
      'star': <Star className="h-8 w-8" />,
      'medal': <Medal className="h-8 w-8" />,
      'trophy': <Trophy className="h-8 w-8" />,
      'flame': <Flame className="h-8 w-8" />,
      'zap': <Zap className="h-8 w-8" />,
      'target': <Target className="h-8 w-8" />,
    };
    return icons[iconName] || icons['star'];
  };

  const getPerformanceLevel = () => {
    const rate = stats.completionRate;
    if (rate >= 90) return { label: 'Mükemmel', variant: 'default' as const };
    if (rate >= 75) return { label: 'Çok İyi', variant: 'secondary' as const };
    if (rate >= 60) return { label: 'İyi', variant: 'outline' as const };
    return { label: 'Geliştirilmeli', variant: 'outline' as const };
  };

  const performance = getPerformanceLevel();

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <div className="text-lg">Yükleniyor...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BarChart3 className="h-8 w-8" />
                Performans & Raporlar
              </h1>
              <p className="text-muted-foreground mt-1">İş performansınızı ve istatistiklerinizi görüntüleyin</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                onClick={() => setSelectedPeriod('week')}
              >
                Bu Hafta
              </Button>
              <Button 
                variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                onClick={() => setSelectedPeriod('month')}
              >
                Bu Ay
              </Button>
              <Button 
                variant={selectedPeriod === 'year' ? 'default' : 'outline'}
                onClick={() => setSelectedPeriod('year')}
              >
                Bu Yıl
              </Button>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <Card className="mb-6 border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Genel Performans</h2>
                <Badge variant={performance.variant} className="px-4 py-2 text-base">
                  {performance.label}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold mb-2">{stats.completionRate}%</div>
                <p className="text-muted-foreground">Tamamlanma Oranı</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="performance">Performans</TabsTrigger>
            <TabsTrigger value="achievements">Başarılar</TabsTrigger>
            <TabsTrigger value="analytics">Analizler</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Toplam Görev</p>
                      <p className="text-3xl font-bold mt-2">{stats.total}</p>
                    </div>
                    <BarChart3 className="h-10 w-10 text-blue-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Tamamlanan</p>
                      <p className="text-3xl font-bold mt-2 text-green-600">{stats.completed}</p>
                    </div>
                    <CheckCircle className="h-10 w-10 text-green-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Devam Eden</p>
                      <p className="text-3xl font-bold mt-2 text-blue-600">{stats.inProgress}</p>
                    </div>
                    <Clock className="h-10 w-10 text-blue-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Gecikmiş</p>
                      <p className="text-3xl font-bold mt-2 text-red-600">{stats.overdue}</p>
                    </div>
                    <AlertCircle className="h-10 w-10 text-red-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Öncelik Dağılımı</CardTitle>
                <CardDescription>Görevlerinizin öncelik seviyelerine göre dağılımı</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Düşük Öncelik</span>
                    <span className="text-sm text-gray-600">{priorityStats.low} görev</span>
                  </div>
                  <Progress value={(priorityStats.low / stats.total) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Orta Öncelik</span>
                    <span className="text-sm text-gray-600">{priorityStats.medium} görev</span>
                  </div>
                  <Progress value={(priorityStats.medium / stats.total) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Yüksek Öncelik</span>
                    <span className="text-sm text-gray-600">{priorityStats.high} görev</span>
                  </div>
                  <Progress value={(priorityStats.high / stats.total) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Acil</span>
                    <span className="text-sm text-gray-600">{priorityStats.urgent} görev</span>
                  </div>
                  <Progress value={(priorityStats.urgent / stats.total) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Tamamlanma Hızı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-5xl font-bold mb-2">
                      {stats.averageCompletionTime}
                      <span className="text-2xl text-gray-500 ml-2">{stats.averageCompletionTimeUnit || 'gün'}</span>
                    </div>
                    <p className="text-gray-600">Ortalama Tamamlanma Süresi</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Hedef İlerleme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Aylık Hedef</span>
                        <span className="text-sm text-gray-600">{stats.completed}/20</span>
                      </div>
                      <Progress value={(stats.completed / 20) * 100} className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Verimlilik</span>
                        <span className="text-sm text-gray-600">{stats.completionRate}%</span>
                      </div>
                      <Progress value={stats.completionRate} className="h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Aylık Performans Trendi</CardTitle>
                <CardDescription>Son 6 aydaki görev tamamlanma performansınız</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-4">
                  {monthlyData.slice(-6).map((data, index) => (
                    <div key={index} className="text-center">
                      <div className="bg-blue-100 rounded-lg p-4 mb-2">
                        <div className="text-2xl font-bold text-blue-600">{data.completed}</div>
                        <div className="text-xs text-gray-600">/ {data.total}</div>
                      </div>
                      <div className="text-xs font-medium text-gray-700">{data.month}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-24 bg-gray-200 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : achievements.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Henüz Başarı Yok</h3>
                  <p className="text-gray-600 mb-4">Görevleri tamamlayarak başarı rozetleri kazanın!</p>
                  <Button onClick={() => fetchAchievements()}>
                    Yenile
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <Card 
                    key={achievement.id}
                    className={achievement.unlocked ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50' : 'opacity-60'}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${achievement.unlocked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}>
                          {getAchievementIcon(achievement.icon)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold mb-1">{achievement.title}</h3>
                          <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                          {achievement.unlocked ? (
                            <Badge className="bg-yellow-500">
                              <Award className="mr-1 h-3 w-3" />
                              Kazanıldı
                            </Badge>
                          ) : (
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>İlerleme</span>
                                <span>{achievement.progress}/{achievement.target}</span>
                              </div>
                              <Progress value={(achievement.progress / achievement.target) * 100} className="h-2" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <DetailedAnalytics userId={userId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 