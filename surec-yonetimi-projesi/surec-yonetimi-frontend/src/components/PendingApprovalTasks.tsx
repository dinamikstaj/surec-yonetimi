"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  X, 
  Clock, 
  User, 
  Calendar,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { getApiUrl, getApiBaseUrl } from "@/lib/utils";

interface Task {
  _id: string;
  title: string;
  description: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  } | null;
  assignedBy?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  } | null;
  priority: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

interface PendingApprovalTasksProps {
  tasks: Task[];
  onRefresh: () => void;
  className?: string;
}

export default function PendingApprovalTasks({ 
  tasks, 
  onRefresh, 
  className = "" 
}: PendingApprovalTasksProps) {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleApproval = async (taskId: string, approved: boolean) => {
    setProcessing(true);
    
    try {
      const currentUserId = localStorage.getItem('userId');
      
      const response = await fetch(`${getApiBaseUrl()}/tasks/${taskId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved,
          rejectionReason: approved ? null : rejectionReason,
          userId: currentUserId,
        }),
      });

      if (response.ok) {
        toast.success(approved ? 'Görev onaylandı!' : 'Görev reddedildi!');
        setShowApprovalModal(false);
        setSelectedTask(null);
        setRejectionReason("");
        onRefresh();
      } else {
        const errorData = await response.json();
        toast.error(errorData.msg || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Onay/red hatası:', error);
      toast.error('İşlem sırasında hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const openApprovalModal = (task: Task) => {
    setSelectedTask(task);
    setRejectionReason("");
    setShowApprovalModal(true);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAvatarFallback = (name: string, email: string) => {
    if (name && name.length > 0) return name.charAt(0).toUpperCase();
    if (email && email.length > 0) return email.charAt(0).toUpperCase();
    return "U";
  };

  if (!tasks || tasks.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
            Onay Bekleyen Görevler
          </CardTitle>
          <CardDescription>Personel tarafından tamamlanan görevleri onaylayın</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Onay bekleyen görev yok</p>
            <p className="text-sm text-muted-foreground mt-1">
              Personel görevleri tamamladığında burada görünecek
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-amber-200 bg-amber-50/50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-700">
          <AlertCircle className="h-5 w-5 animate-pulse" />
          Onay Bekleyen Görevler ({tasks.length})
        </CardTitle>
        <CardDescription>Personel tarafından tamamlanan görevleri onaylayın</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.slice(0, 3).map((task) => (
            <div 
              key={task._id} 
              className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-amber-200"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-sm truncate">{task.title}</h4>
                  <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                    {task.priority}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <Avatar className="h-5 w-5">
                      {task.assignedTo?.avatar && (
                        <AvatarImage src={`${getApiUrl()}${task.assignedTo.avatar}`} />
                      )}
                      <AvatarFallback className="text-xs">
                        {task.assignedTo ? getAvatarFallback(task.assignedTo.name, task.assignedTo.email) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{task.assignedTo?.name || task.assignedTo?.email || 'Bilinmeyen Kullanıcı'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Tamamlandı: {formatDate(task.updatedAt)}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground truncate">
                  {task.description}
                </p>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Button
                  size="sm"
                  onClick={() => handleApproval(task._id, true)}
                  disabled={processing}
                  className="gap-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-3 w-3" />
                  Onayla
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openApprovalModal(task)}
                  className="gap-1"
                >
                  <Eye className="h-3 w-3" />
                  İncele
                </Button>
              </div>
            </div>
          ))}
          
          {tasks.length > 3 && (
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                ve {tasks.length - 3} görev daha onay bekliyor...
              </p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Approval Modal */}
      {selectedTask && (
        <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
          <DialogContent className="sm:max-w-[500px]" aria-describedby="approval-description">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Görev Onayı
              </DialogTitle>
            </DialogHeader>
            <div id="approval-description" className="sr-only">
              Tamamlanan görevi onaylayın veya reddedin.
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{selectedTask.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{selectedTask.description}</p>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      {selectedTask.assignedTo?.avatar && (
                        <AvatarImage src={`${getApiUrl()}${selectedTask.assignedTo.avatar}`} />
                      )}
                      <AvatarFallback className="text-xs">
                        {selectedTask.assignedTo ? getAvatarFallback(selectedTask.assignedTo.name, selectedTask.assignedTo.email) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{selectedTask.assignedTo?.name || selectedTask.assignedTo?.email || 'Bilinmeyen Kullanıcı'}</span>
                    <span className="text-xs text-muted-foreground">tarafından tamamlandı</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tamamlanma tarihi: {formatDate(selectedTask.updatedAt)}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium">Red Sebebi (Opsiyonel)</label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Görevi reddediyorsanız sebebini belirtin..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowApprovalModal(false)}
                  disabled={processing}
                >
                  İptal
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleApproval(selectedTask._id, false)}
                  disabled={processing || !rejectionReason.trim()}
                  className="gap-2"
                >
                  <ThumbsDown className="h-4 w-4" />
                  {processing ? 'İşleniyor...' : 'Reddet'}
                </Button>
                <Button
                  onClick={() => handleApproval(selectedTask._id, true)}
                  disabled={processing}
                  className="gap-2"
                >
                  <ThumbsUp className="h-4 w-4" />
                  {processing ? 'İşleniyor...' : 'Onayla'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
} 