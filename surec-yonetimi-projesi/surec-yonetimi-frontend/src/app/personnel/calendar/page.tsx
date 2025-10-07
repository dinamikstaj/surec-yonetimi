'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Sidebar from '@/components/sidebar';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  tasks: Task[];
}

export default function PersonnelCalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      generateCalendar();
    }
  }, [currentDate, tasks]);

  const fetchTasks = async () => {
    try {
      const userId = localStorage.getItem('userId');
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

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const days: CalendarDay[] = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        tasks: getTasksForDate(date)
      });
    }
    
    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        tasks: getTasksForDate(date)
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        tasks: getTasksForDate(date)
      });
    }
    
    setCalendarDays(days);
  };

  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay(day);
    setShowDayModal(true);
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-green-500',
      'medium': 'bg-yellow-500',
      'high': 'bg-orange-500',
      'urgent': 'bg-red-500',
    };
    return colors[priority] || colors['medium'];
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="h-3 w-3 text-green-600" />;
    if (status === 'in-progress') return <Clock className="h-3 w-3" />;
    return <AlertCircle className="h-3 w-3 text-gray-400" />;
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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <CalendarIcon className="h-8 w-8" />
                Görev Takvimi
              </h1>
              <p className="text-gray-600 mt-1">Görevlerinizi takvimde görüntüleyin</p>
            </div>
            <Button onClick={handleToday}>Bugüne Git</Button>
          </div>

          {/* Month Navigation */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-2xl font-semibold">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Bu Ay Toplam</div>
              <div className="text-2xl font-bold mt-1">
                {tasks.filter(t => {
                  if (!t.dueDate) return false;
                  const date = new Date(t.dueDate);
                  return date.getMonth() === currentDate.getMonth() && 
                         date.getFullYear() === currentDate.getFullYear();
                }).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Tamamlanan</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {tasks.filter(t => {
                  if (!t.dueDate || t.status !== 'completed') return false;
                  const date = new Date(t.dueDate);
                  return date.getMonth() === currentDate.getMonth() && 
                         date.getFullYear() === currentDate.getFullYear();
                }).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Devam Eden</div>
              <div className="text-2xl font-bold mt-1">
                {tasks.filter(t => {
                  if (!t.dueDate || t.status !== 'in-progress') return false;
                  const date = new Date(t.dueDate);
                  return date.getMonth() === currentDate.getMonth() && 
                         date.getFullYear() === currentDate.getFullYear();
                }).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Geciken</div>
              <div className="text-2xl font-bold text-red-600 mt-1">
                {tasks.filter(t => {
                  if (!t.dueDate || t.status === 'completed') return false;
                  const date = new Date(t.dueDate);
                  const today = new Date();
                  return date < today;
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-6">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center font-semibold text-gray-700 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  onClick={() => handleDayClick(day)}
                  className={`
                    min-h-24 p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md
                    ${!day.isCurrentMonth ? 'opacity-50' : ''}
                    ${isToday(day.date) ? 'ring-2 ring-primary' : ''}
                    ${isPast(day.date) && day.isCurrentMonth ? 'opacity-60' : ''}
                  `}
                >
                  <div className={`
                    text-sm font-semibold mb-1
                    ${isToday(day.date) ? 'text-primary' : ''}
                    ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                  `}>
                    {day.date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {day.tasks.slice(0, 3).map((task) => (
                      <div
                        key={task._id}
                        className={`
                          text-xs p-1 rounded flex items-center gap-1 truncate
                          ${task.status === 'completed' ? 'bg-green-50 border border-green-200 line-through' : 'bg-blue-50 border border-blue-200'}
                        `}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(task.priority)}`} />
                        <span className="truncate flex-1">{task.title}</span>
                        {getStatusIcon(task.status)}
                      </div>
                    ))}
                    {day.tasks.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{day.tasks.length - 3} daha
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Day Detail Modal */}
        <Dialog open={showDayModal} onOpenChange={setShowDayModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {selectedDay && selectedDay.date.toLocaleDateString('tr-TR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </DialogTitle>
            </DialogHeader>
            
            {selectedDay && (
              <div className="space-y-4 mt-4">
                {selectedDay.tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Bu gün için görev yok</p>
                  </div>
                ) : (
                  selectedDay.tasks.map((task) => (
                    <Card 
                      key={task._id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => router.push(`/personnel/tasks/${task._id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            {task.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
                            <span className={task.status === 'completed' ? 'line-through' : ''}>
                              {task.title}
                            </span>
                          </h3>
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant={task.status === 'completed' ? 'default' : 'outline'}>
                            {task.status === 'pending' && 'Bekliyor'}
                            {task.status === 'in-progress' && 'Devam Ediyor'}
                            {task.status === 'completed' && 'Tamamlandı'}
                            {task.status === 'pending-approval' && 'Onay Bekliyor'}
                          </Badge>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(task.dueDate!).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 