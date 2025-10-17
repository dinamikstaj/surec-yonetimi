'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  CheckCircle,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { getApiBaseUrl, getApiUrl } from '@/lib/utils';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  tasks: Task[];
}

export default function AdminCalendarWidget() {
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
    fetchAllTasks();
  }, []);

  useEffect(() => {
    if (tasks.length >= 0) {
      generateCalendar();
    }
  }, [currentDate, tasks]);

  const fetchAllTasks = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/tasks`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        console.error('Görevler yüklenemedi');
      }
    } catch (error) {
      console.error('Görevler yüklenirken hata:', error);
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
    if (status === 'in-progress') return <Clock className="h-3 w-3 text-blue-600" />;
    return <AlertCircle className="h-3 w-3 text-gray-400" />;
  };

  return (
    <>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 shadow-md">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-slate-700 dark:text-slate-200 font-bold">
                Görev Takvimi
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handlePrevMonth}
                className="border-slate-300 hover:bg-slate-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 shadow-md">
                <span className="text-sm font-bold text-white min-w-[120px] text-center block">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleNextMonth}
                className="border-slate-300 hover:bg-slate-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-sm text-gray-500">Yükleniyor...</div>
            </div>
          ) : (
            <>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {daysOfWeek.map((day) => (
                  <div 
                    key={day} 
                    className="text-center font-bold text-xs py-2 rounded-t-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 text-slate-700 dark:text-slate-200"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    onClick={() => day.tasks.length > 0 && handleDayClick(day)}
                    className={`
                      min-h-20 p-2 rounded-lg text-center transition-all duration-200
                      ${day.tasks.length > 0 ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : 'cursor-default'}
                      ${!day.isCurrentMonth 
                        ? 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 opacity-50' 
                        : isToday(day.date)
                          ? 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 shadow-lg ring-2 ring-slate-400 dark:ring-slate-500'
                          : isPast(day.date)
                            ? 'bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-800 dark:to-gray-900'
                            : 'bg-gradient-to-br from-white to-slate-100 dark:from-gray-800 dark:to-gray-700 hover:from-slate-50 hover:to-slate-200'
                      }
                      ${day.tasks.length > 0 && day.isCurrentMonth ? 'border-2 border-slate-400 dark:border-slate-600' : 'border border-slate-200 dark:border-gray-700'}
                    `}
                  >
                    <div className={`
                      text-sm font-bold mb-1
                      ${isToday(day.date) 
                        ? 'text-white bg-white/20 rounded-full w-7 h-7 flex items-center justify-center mx-auto backdrop-blur-sm shadow-md' 
                        : !day.isCurrentMonth 
                          ? 'text-gray-400 dark:text-gray-600' 
                          : 'text-slate-600 dark:text-slate-300'}
                    `}>
                      {day.date.getDate()}
                    </div>
                    
                    {day.tasks.length > 0 && (
                      <div className="space-y-1">
                        {day.tasks.slice(0, 2).map((task) => (
                          <div
                            key={task._id}
                            className={`
                              flex items-center justify-center gap-1 px-1 py-0.5 rounded
                              ${isToday(day.date) 
                                ? 'bg-white/20 backdrop-blur-sm' 
                                : 'bg-slate-200/80 dark:bg-gray-700/80'}
                            `}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(task.priority)} shadow-sm`} />
                            {getStatusIcon(task.status)}
                          </div>
                        ))}
                        {day.tasks.length > 2 && (
                          <div className={`
                            text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block
                            ${isToday(day.date)
                              ? 'bg-white/30 text-white'
                              : 'bg-slate-300 dark:bg-gray-600 text-slate-700 dark:text-slate-200'}
                          `}>
                            +{day.tasks.length - 2}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-700 backdrop-blur-sm border border-slate-300 dark:border-gray-600 shadow-md">
                <h4 className="text-xs font-bold mb-3 text-slate-700 dark:text-slate-200">Öncelik Seviyeleri</h4>
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm" />
                    <span className="font-medium text-green-700 dark:text-green-300">Düşük</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm" />
                    <span className="font-medium text-yellow-700 dark:text-yellow-300">Orta</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm" />
                    <span className="font-medium text-orange-700 dark:text-orange-300">Yüksek</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" />
                    <span className="font-medium text-red-700 dark:text-red-300">Acil</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Day Detail Modal */}
      <Dialog open={showDayModal} onOpenChange={setShowDayModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 shadow-md">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-700 dark:text-slate-200">
                  {selectedDay && selectedDay.date.toLocaleDateString('tr-TR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
                <p className="text-sm text-muted-foreground font-normal">
                  {selectedDay?.tasks.length} görev planlanmış
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedDay && (
            <div className="space-y-3 mt-4">
              {selectedDay.tasks.map((task) => (
                <Card 
                  key={task._id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                  onClick={() => router.push(`/admin/tasks`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold flex items-center gap-2">
                          {task.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                          <span className={task.status === 'completed' ? 'line-through text-gray-500' : 'text-slate-700 dark:text-slate-100'}>
                            {task.title}
                          </span>
                        </h3>
                        {task.assignedTo && (
                          <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-slate-100 dark:bg-gray-700/50">
                            <Avatar className="h-7 w-7 border-2 border-slate-300 dark:border-gray-600">
                              <AvatarImage src={task.assignedTo.avatar ? `${getApiUrl()}${task.assignedTo.avatar}` : undefined} />
                              <AvatarFallback className="text-xs bg-gradient-to-br from-slate-600 to-slate-700 text-white">
                                {task.assignedTo.name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                {task.assignedTo.name || task.assignedTo.email}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`w-4 h-4 rounded-full ${getPriorityColor(task.priority)} shadow-md ring-2 ring-white dark:ring-gray-800`} />
                        <Badge 
                          variant={task.status === 'completed' ? 'default' : 'outline'} 
                          className={`text-xs ${
                            task.status === 'completed' ? 'bg-green-500 text-white' :
                            task.status === 'in-progress' ? 'bg-slate-600 text-white border-0' :
                            task.status === 'pending-approval' ? 'bg-orange-500 text-white border-0' :
                            'border-slate-300'
                          }`}
                        >
                          {task.status === 'pending' && 'Bekliyor'}
                          {task.status === 'in-progress' && 'Devam Ediyor'}
                          {task.status === 'completed' && 'Tamamlandı'}
                          {task.status === 'pending-approval' && 'Onay Bekliyor'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 bg-slate-50/50 dark:bg-gray-700/30 p-2 rounded-lg">
                      {task.description}
                    </p>
                    {task.dueDate && (
                      <div className="flex items-center gap-2 text-xs mt-3 p-2 rounded-lg bg-slate-100 dark:bg-gray-700/50 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-gray-600">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          {new Date(task.dueDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 