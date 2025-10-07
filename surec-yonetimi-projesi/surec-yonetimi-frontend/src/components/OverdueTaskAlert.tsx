"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Calendar, Eye } from "lucide-react";

interface OverdueTask {
  _id: string;
  title: string;
  dueDate: string;
  assignedTo: {
    name?: string;
    email: string;
  };
  priority: string;
}

interface OverdueTaskAlertProps {
  overdueTasks: OverdueTask[];
  onViewTask?: (taskId: string) => void;
  className?: string;
}

export default function OverdueTaskAlert({ 
  overdueTasks, 
  onViewTask, 
  className = "" 
}: OverdueTaskAlertProps) {
  if (!overdueTasks || overdueTasks.length === 0) {
    return null;
  }

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
    });
  };

  return (
    <Card className={`border-destructive/50 bg-destructive/5 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5 animate-pulse" />
          Geciken Görevler ({overdueTasks.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {overdueTasks.slice(0, 5).map((task) => {
            const daysOverdue = getDaysOverdue(task.dueDate);
            return (
              <div 
                key={task._id} 
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-destructive/20"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{task.title}</h4>
                    <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{task.assignedTo.name || task.assignedTo.email}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    {daysOverdue === 1 ? '1 gün' : `${daysOverdue} gün`} gecikme
                  </Badge>
                  {onViewTask && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewTask(task._id)}
                      className="h-7 w-7 p-0"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          
          {overdueTasks.length > 5 && (
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                ve {overdueTasks.length - 5} görev daha...
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 