'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  Award,
  Target,
  XCircle
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/utils';

interface DetailedAnalyticsProps {
  userId: string;
}

export default function DetailedAnalytics({ userId }: DetailedAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [userId]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/users/${userId}/analytics`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Analiz verileri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-24 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics || !analytics.summary) {
    return <div className="text-center py-8 text-gray-500">Analiz verileri yüklenemedi</div>;
  }

  const { summary, priorityStats, monthlyPerformance, weeklyActivity, insights } = analytics;

  return (
    <div className="space-y-6">
      {/* Ana İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Performans Skoru */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-8 w-8 opacity-80" />
              <div className="text-4xl font-bold">{summary.performanceScore}</div>
            </div>
            <div className="text-sm opacity-90">Performans Skoru</div>
            <div className="text-xs opacity-75 mt-1">100 üzerinden</div>
          </CardContent>
        </Card>

        {/* Dürtülme Sayısı */}
        <Card className={summary.nudgeCount > 5 ? 'border-orange-500' : 'border-green-500'}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className={`h-8 w-8 ${summary.nudgeCount > 5 ? 'text-orange-500' : 'text-green-500'}`} />
              <div className="text-4xl font-bold">{summary.nudgeCount}</div>
            </div>
            <div className="text-sm font-medium">Dürtülme Sayısı</div>
            {summary.nudgeCount === 0 && (
              <Badge className="mt-2 bg-green-100 text-green-800">Mükemmel!</Badge>
            )}
            {summary.nudgeCount > 5 && (
              <Badge className="mt-2 bg-orange-100 text-orange-800">Dikkat!</Badge>
            )}
          </CardContent>
        </Card>

        {/* Zamanında Tamamlanan */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="text-4xl font-bold text-green-600">{summary.onTimeTasks}</div>
            </div>
            <div className="text-sm font-medium">Zamanında Tamamlanan</div>
            <div className="text-xs text-gray-500 mt-1">
              %{summary.onTimeRate} oranında zamanında
            </div>
          </CardContent>
        </Card>

        {/* Geciken Görevler */}
        <Card className={summary.overdueTasks > 3 ? 'border-red-500' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className={`h-8 w-8 ${summary.overdueTasks > 3 ? 'text-red-600' : 'text-yellow-600'}`} />
              <div className={`text-4xl font-bold ${summary.overdueTasks > 3 ? 'text-red-600' : 'text-yellow-600'}`}>
                {summary.overdueTasks}
              </div>
            </div>
            <div className="text-sm font-medium">Geciken Görev</div>
            {summary.overdueTasks > 3 && (
              <Badge className="mt-2 bg-red-100 text-red-800">İyileştirin!</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detaylı İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tamamlanma Oranı */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tamamlanma Başarısı</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Genel Tamamlanma</span>
                <span className="font-bold">{summary.completionRate}%</span>
              </div>
              <Progress value={summary.completionRate} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Zamanında Tamamlama</span>
                <span className="font-bold">{summary.onTimeRate}%</span>
              </div>
              <Progress value={summary.onTimeRate} className="h-3" />
            </div>
                         <div className="pt-2 border-t">
               <div className="text-sm text-gray-600">Ortalama Süre</div>
               <div className="text-2xl font-bold">
                 {summary.avgCompletionTime} {summary.avgCompletionTimeUnit || 'gün'}
               </div>
             </div>
          </CardContent>
        </Card>

        {/* Öncelik Bazlı Performans */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Öncelik Bazlı Başarı</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(priorityStats).map(([key, value]: [string, any]) => {
              const labels: Record<string, string> = {
                urgent: 'Acil',
                high: 'Yüksek',
                medium: 'Orta',
                low: 'Düşük'
              };
              const colors: Record<string, string> = {
                urgent: 'bg-red-500',
                high: 'bg-orange-500',
                medium: 'bg-yellow-500',
                low: 'bg-green-500'
              };
              const rate = value.total > 0 ? Math.round((value.completed / value.total) * 100) : 0;
              
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${colors[key]}`} />
                      {labels[key]}
                    </span>
                    <span className="font-medium">{value.completed}/{value.total}</span>
                  </div>
                  <Progress value={rate} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Haftalık Aktivite */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Haftalık Aktivite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weeklyActivity.map((week: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="text-sm font-medium">{week.week}</div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-600">Oluşturulan: {week.tasksCreated}</span>
                    <span className="text-green-600 font-semibold">Tamamlanan: {week.tasksCompleted}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Güçlü Yönler ve Gelişim Alanları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Güçlü Yönler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Güçlü Yönler
            </CardTitle>
            <CardDescription>Devam ettiğiniz başarılı alanlar</CardDescription>
          </CardHeader>
          <CardContent>
            {insights.strengths && insights.strengths.length > 0 ? (
              <div className="space-y-2">
                {insights.strengths.map((strength: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{strength}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Güçlü yönler analiz ediliyor...</p>
                <p className="text-xs text-gray-400 mt-1">Daha fazla görev tamamlayın</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gelişim Alanları */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Gelişim Alanları
            </CardTitle>
            <CardDescription>Odaklanmanız gereken noktalar</CardDescription>
          </CardHeader>
          <CardContent>
            {insights.improvements && insights.improvements.length > 0 ? (
              <div className="space-y-2">
                {insights.improvements.map((improvement: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{improvement}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-600">Harika gidiyorsunuz!</p>
                <p className="text-xs text-gray-500 mt-1">Şu an geliştirilmesi gereken alan yok</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aylık Performans Trendi */}
      <Card>
        <CardHeader>
          <CardTitle>Aylık Performans Trendi</CardTitle>
          <CardDescription>Son 6 aydaki görev tamamlanma oranınız</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-4">
            {monthlyPerformance.map((month: any, index: number) => {
              const isImproving = index > 0 && month.completionRate > monthlyPerformance[index - 1].completionRate;
              const isDeclining = index > 0 && month.completionRate < monthlyPerformance[index - 1].completionRate;
              
              return (
                <div key={index} className="text-center">
                  <div className="bg-gradient-to-t from-blue-500 to-blue-300 rounded-lg p-4 mb-2 relative overflow-hidden">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-blue-600 transition-all"
                      style={{ height: `${month.completionRate}%` }}
                    />
                    <div className="relative z-10">
                      <div className="text-2xl font-bold text-white">{month.completed}</div>
                      <div className="text-xs text-white opacity-75">/ {month.total}</div>
                    </div>
                    {index > 0 && (
                      <div className="absolute top-1 right-1">
                        {isImproving && <TrendingUp className="h-4 w-4 text-green-300" />}
                        {isDeclining && <TrendingDown className="h-4 w-4 text-red-300" />}
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-medium text-gray-700">{month.month}</div>
                  <div className="text-xs text-gray-500">{month.completionRate}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 