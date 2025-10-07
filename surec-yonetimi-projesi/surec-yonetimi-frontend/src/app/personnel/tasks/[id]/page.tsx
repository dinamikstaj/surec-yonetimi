'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import Sidebar from '@/components/sidebar';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle,
  FileText,
  MessageSquare,
  Paperclip,
  Send,
  BarChart3,
  TrendingUp,
  Edit,
  Trash2,
  Flag,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { getApiBaseUrl, getApiUrl } from '@/lib/utils';

interface User {
  _id: string;
  name: string;
  email: string;
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
  updatedAt?: string;
  notes?: string;
  completedAt?: string;
  rejectionReason?: string;
}

interface TaskActivity {
  _id: string;
  action: string;
  user: User;
  createdAt: string;
  details?: string;
}

interface Comment {
  _id: string;
  user: User;
  text: string;
  createdAt: string;
}

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
      fetchActivities();
      fetchComments();
    }
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/tasks/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data);
      } else {
        toast.error('Görev detayları yüklenemedi');
      }
    } catch (error) {
      console.error('Görev detayları yüklenirken hata:', error);
      toast.error('Görev detayları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/tasks/${taskId}/activities`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Aktiviteler yüklenirken hata:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/tasks/${taskId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Yorumlar yüklenirken hata:', error);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    setSending(true);
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${getApiBaseUrl()}/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, text: newComment }),
      });

      if (response.ok) {
        setNewComment('');
        fetchComments();
        toast.success('Yorum eklendi');
      } else {
        toast.error('Yorum eklenemedi');
      }
    } catch (error) {
      console.error('Yorum eklenirken hata:', error);
      toast.error('Yorum eklenemedi');
    } finally {
      setSending(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('Durum güncellendi');
        fetchTaskDetails();
        fetchActivities();
      } else {
        toast.error('Durum güncellenemedi');
      }
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
      toast.error('Durum güncellenemedi');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'pending': { label: 'Bekliyor', variant: 'outline' },
      'in-progress': { label: 'Devam Ediyor', variant: 'default' },
      'pending-approval': { label: 'Onay Bekliyor', variant: 'secondary' },
      'completed': { label: 'Tamamlandı', variant: 'default' },
      'cancelled': { label: 'İptal Edildi', variant: 'destructive' },
      'rejected': { label: 'Reddedildi', variant: 'destructive' },
    };
    const config = statusConfig[status] || statusConfig['pending'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { label: string; className: string }> = {
      'low': { label: 'Düşük', className: 'bg-green-100 text-green-800' },
      'medium': { label: 'Orta', className: 'bg-yellow-100 text-yellow-800' },
      'high': { label: 'Yüksek', className: 'bg-orange-100 text-orange-800' },
      'urgent': { label: 'Acil', className: 'bg-red-100 text-red-800' },
    };
    const config = priorityConfig[priority] || priorityConfig['medium'];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Belirtilmemiş';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = () => {
    if (!task) return 0;
    const statusProgress: Record<string, number> = {
      'pending': 0,
      'in-progress': 50,
      'pending-approval': 75,
      'completed': 100,
      'cancelled': 0,
      'rejected': 0,
    };
    return statusProgress[task.status] || 0;
  };

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

  if (!task) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Görev Bulunamadı</h2>
            <Button onClick={() => router.push('/personnel/tasks')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Görevlere Dön
            </Button>
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
          <Button 
            variant="ghost" 
            onClick={() => router.push('/personnel/tasks')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Görevlere Dön
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{task.title}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                {getStatusBadge(task.status)}
                {getPriorityBadge(task.priority)}
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="mr-1 h-4 w-4" />
                  Bitiş: {formatDate(task.dueDate)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">İlerleme</span>
                <span className="text-gray-600">{getProgressPercentage()}%</span>
              </div>
              <Progress value={getProgressPercentage()} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Görev Detayları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Açıklama</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
                </div>
                
                {task.notes && (
                  <div>
                    <h3 className="font-semibold mb-2">Notlar</h3>
                    <p className="text-gray-700 whitespace-pre-wrap bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      {task.notes}
                    </p>
                  </div>
                )}

                {task.rejectionReason && (
                  <div>
                    <h3 className="font-semibold mb-2 text-red-600">Red Nedeni</h3>
                    <p className="text-gray-700 whitespace-pre-wrap bg-red-50 p-4 rounded-lg border border-red-200">
                      {task.rejectionReason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {task.status !== 'completed' && task.status !== 'cancelled' && (
              <Card>
                <CardHeader>
                  <CardTitle>Hızlı İşlemler</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {task.status === 'pending' && (
                    <Button onClick={() => handleStatusUpdate('in-progress')}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Göreve Başla
                    </Button>
                  )}
                  {task.status === 'in-progress' && (
                    <Button onClick={() => handleStatusUpdate('pending-approval')}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Onaya Gönder
                    </Button>
                  )}
                  <Button variant="outline">
                    <Paperclip className="mr-2 h-4 w-4" />
                    Dosya Ekle
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Yorumlar ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Comment List */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Henüz yorum yok</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment._id} className="flex gap-3 p-4 bg-muted rounded-lg">
                        <Avatar>
                          <AvatarImage src={comment.user.avatar ? `${getApiUrl()}${comment.user.avatar}` : ''} />
                          <AvatarFallback>{comment.user.name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">{comment.user.name || comment.user.email}</span>
                            <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-gray-700">{comment.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* New Comment */}
                <Separator />
                <div className="space-y-2">
                  <Textarea
                    placeholder="Yorum ekle..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleSendComment} 
                    disabled={!newComment.trim() || sending}
                    className="w-full"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {sending ? 'Gönderiliyor...' : 'Yorum Gönder'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Görev Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Atayan</div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={task.assignedBy.avatar ? `${getApiUrl()}${task.assignedBy.avatar}` : ''} />
                      <AvatarFallback>{task.assignedBy.name?.[0] || 'A'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{task.assignedBy.name || task.assignedBy.email}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="text-sm text-gray-600 mb-1">Atanan</div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={task.assignedTo.avatar ? `${getApiUrl()}${task.assignedTo.avatar}` : ''} />
                      <AvatarFallback>{task.assignedTo.name?.[0] || 'A'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{task.assignedTo.name || task.assignedTo.email}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="text-sm text-gray-600 mb-1">Oluşturulma</div>
                  <div className="text-sm font-medium">{formatDate(task.createdAt)}</div>
                </div>

                {task.completedAt && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Tamamlanma</div>
                      <div className="text-sm font-medium">{formatDate(task.completedAt)}</div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Aktivite Geçmişi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Aktivite yok</p>
                ) : (
                  <div className="space-y-4">
                    {activities.slice(0, 5).map((activity, index) => (
                      <div key={activity._id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          {index < activities.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-gray-500">{formatDate(activity.createdAt)}</p>
                          {activity.details && (
                            <p className="text-xs text-gray-600 mt-1">{activity.details}</p>
                          )}
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