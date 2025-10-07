"use client";

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import Sidebar from '@/components/sidebar';
import { toast } from 'sonner';
import { getApiUrl, getApiBaseUrl } from '@/lib/utils';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Filter,
  Calendar,
  Users,
  Plus,
  X,
  MessageSquare,
  User,
  Trash2,
  Edit,
  ArrowRight,
  LayoutGrid,
  List,
  Table as TableIcon,
  Search,
  Download,
  Upload,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  Timer,
  Flag,
  Paperclip,
  Eye,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';

interface Attachment {
  _id: string;
  name: string;
  path: string;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  uploadedAt: string;
}

interface Issue {
  _id: string;
  title: string;
  description: string;
  customer?: {
    _id: string;
    company?: string;
    name?: string;
  };
  customerName?: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'technical' | 'billing' | 'support' | 'complaint' | 'other';
  assignedTo: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  createdBy: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  resolvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  dueDate?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  notes?: Array<{
    _id: string;
    user: {
      _id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    text: string;
    createdAt: string;
  }>;
  attachments?: Attachment[];
}

interface Personnel {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  last7Days: number;
  last30Days: number;
  resolvedLast7Days: number;
  avgResolutionTimeHours: number;
  categoryStats: Array<{ _id: string; count: number }>;
  priorityStats: Array<{ _id: string; count: number }>;
}

type ViewMode = 'list' | 'kanban' | 'table';

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('medium');
  const [category, setCategory] = useState<string>('other');
  const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  
  // Note state
  const [newNote, setNewNote] = useState('');

  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    fetchIssues();
    fetchPersonnel();
    fetchStats();
  }, [statusFilter, priorityFilter, categoryFilter, dateFilter, assignedToFilter]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      let url = `${getApiBaseUrl()}/issues?`;
      
      if (statusFilter && statusFilter !== 'all') {
        url += `status=${statusFilter}&`;
      }
      if (dateFilter) {
        url += `date=${dateFilter}&`;
      }
      if (assignedToFilter && assignedToFilter !== 'all') {
        url += `assignedTo=${assignedToFilter}&`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setIssues(data);
    } catch (error) {
      console.error('Sorunlar yüklenirken hata:', error);
      toast.error('Sorunlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonnel = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/users`);
      const data = await response.json();
      setPersonnel(data.filter((u: Personnel) => u.role === 'personnel'));
    } catch (error) {
      console.error('Personel yüklenirken hata:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/issues/stats/overview`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
    }
  };

  const handleCreateIssue = async () => {
    if (!title || !description) {
      toast.error('Başlık ve açıklama zorunludur');
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          priority,
          category,
          customerName: customerName || undefined,
          assignedTo: selectedPersonnel,
          dueDate: dueDate || undefined,
          createdBy: currentUserId,
        }),
      });

      if (response.ok) {
        toast.success('Sorun başarıyla oluşturuldu');
        setShowCreateModal(false);
        resetForm();
        fetchIssues();
        fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.msg || 'Sorun oluşturulamadı');
      }
    } catch (error) {
      console.error('Sorun oluşturma hatası:', error);
      toast.error('Sorun oluşturulurken hata oluştu');
    }
  };

  const handleFileUpload = async (issueId: string, file: File) => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadedBy', currentUserId || '');

      const response = await fetch(`${getApiBaseUrl()}/issues/${issueId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Dosya başarıyla yüklendi');
        const updated = await response.json();
        setSelectedIssue(updated);
      } else {
        toast.error('Dosya yüklenemedi');
      }
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      toast.error('Dosya yüklenirken hata oluştu');
    }
  };

  const handleDeleteAttachment = async (issueId: string, attachmentId: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/issues/${issueId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Dosya silindi');
        const updated = await response.json();
        setSelectedIssue(updated);
      } else {
        toast.error('Dosya silinemedi');
      }
    } catch (error) {
      console.error('Dosya silme hatası:', error);
      toast.error('Dosya silinirken hata oluştu');
    }
  };

  const handleSelfAssign = async (issueId: string, action: 'assign' | 'unassign') => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/issues/${issueId}/self-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          action,
        }),
      });

      if (response.ok) {
        toast.success(action === 'assign' ? 'Soruna atandınız' : 'Sorundan çıkarıldınız');
        fetchIssues();
        if (selectedIssue && selectedIssue._id === issueId) {
          const updated = await response.json();
          setSelectedIssue(updated);
        }
      } else {
        const error = await response.json();
        toast.error(error.msg || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Self-assign hatası:', error);
      toast.error('İşlem sırasında hata oluştu');
    }
  };

  const handleReassign = async (issueId: string, newAssignees: string[]) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/issues/${issueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedTo: newAssignees,
        }),
      });

      if (response.ok) {
        toast.success('Atama güncellendi');
        fetchIssues();
        if (selectedIssue && selectedIssue._id === issueId) {
          const updated = await response.json();
          setSelectedIssue(updated);
        }
      } else {
        toast.error('Atama güncellenemedi');
      }
    } catch (error) {
      console.error('Atama hatası:', error);
      toast.error('Atama güncellenirken hata oluştu');
    }
  };

  const handleRemoveAssignment = async (issueId: string, userId: string) => {
    const issue = issues.find(i => i._id === issueId);
    if (!issue) return;
    
    const newAssignees = issue.assignedTo.filter(u => u._id !== userId).map(u => u._id);
    await handleReassign(issueId, newAssignees);
  };

  const handleUpdateStatus = async (issueId: string, newStatus: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/issues/${issueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          resolvedBy: newStatus === 'resolved' ? currentUserId : undefined,
        }),
      });

      if (response.ok) {
        toast.success('Durum güncellendi');
        fetchIssues();
        fetchStats();
        if (selectedIssue && selectedIssue._id === issueId) {
          const updated = await response.json();
          setSelectedIssue(updated);
        }
      } else {
        toast.error('Durum güncellenemedi');
      }
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      toast.error('Durum güncellenirken hata oluştu');
    }
  };

  const handleAddNote = async (issueId: string) => {
    if (!newNote.trim()) {
      toast.error('Not boş olamaz');
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/issues/${issueId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          text: newNote,
        }),
      });

      if (response.ok) {
        toast.success('Not eklendi');
        setNewNote('');
        const updated = await response.json();
        setSelectedIssue(updated);
      } else {
        toast.error('Not eklenemedi');
      }
    } catch (error) {
      console.error('Not ekleme hatası:', error);
      toast.error('Not eklenirken hata oluştu');
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    if (!confirm('Bu sorunu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/issues/${issueId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Sorun silindi');
        fetchIssues();
        fetchStats();
        setShowDetailModal(false);
      } else {
        toast.error('Sorun silinemedi');
      }
    } catch (error) {
      console.error('Sorun silme hatası:', error);
      toast.error('Sorun silinirken hata oluştu');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setCategory('other');
    setSelectedPersonnel([]);
    setDueDate('');
    setCustomerName('');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string; color: string }> = {
      open: { variant: 'secondary', icon: AlertCircle, label: 'Açık', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      'in-progress': { variant: 'default', icon: Clock, label: 'Devam Ediyor', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      resolved: { variant: 'default', icon: CheckCircle, label: 'Çözüldü', color: 'bg-green-100 text-green-800 border-green-200' },
      closed: { variant: 'secondary', icon: CheckCircle, label: 'Kapatıldı', color: 'bg-gray-100 text-gray-800 border-gray-200' },
    };
    
    const config = variants[status] || variants.open;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} border`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      low: { variant: 'secondary', label: 'Düşük' },
      medium: { variant: 'outline', label: 'Orta' },
      high: { variant: 'default', label: 'Yüksek' },
      critical: { variant: 'destructive', label: 'Kritik' },
    };
    
    const config = variants[priority] || variants.medium;
    
    return (
      <Badge variant={config.variant}>
        <Flag className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      technical: 'Teknik',
      billing: 'Faturalama',
      support: 'Destek',
      complaint: 'Şikayet',
      other: 'Diğer',
    };
    return labels[category] || category;
  };

  const getAvatarFallback = (name: string, email: string) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const isAssignedToMe = (issue: Issue) => {
    return issue.assignedTo.some(u => u._id === currentUserId);
  };

  const getSLAStatus = (issue: Issue) => {
    if (!issue.dueDate) return null;
    
    const now = new Date();
    const due = new Date(issue.dueDate);
    const diff = due.getTime() - now.getTime();
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    
    if (issue.status === 'resolved' || issue.status === 'closed') {
      return { status: 'completed', text: 'Tamamlandı', variant: 'default' as const };
    }
    
    if (hoursLeft < 0) {
      return { status: 'overdue', text: `${Math.abs(hoursLeft)} saat gecikti`, variant: 'destructive' as const };
    } else if (hoursLeft < 24) {
      return { status: 'urgent', text: `${hoursLeft} saat kaldı`, variant: 'outline' as const };
    } else {
      const daysLeft = Math.floor(hoursLeft / 24);
      return { status: 'ok', text: `${daysLeft} gün kaldı`, variant: 'secondary' as const };
    }
  };

  const filteredIssues = issues.filter(issue => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!issue.title.toLowerCase().includes(query) && 
          !issue.description.toLowerCase().includes(query) &&
          !issue.customerName?.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    if (priorityFilter !== 'all' && issue.priority !== priorityFilter) {
      return false;
    }
    
    if (categoryFilter !== 'all' && issue.category !== categoryFilter) {
      return false;
    }
    
    return true;
  });

  const localStats = {
    total: filteredIssues.length,
    open: filteredIssues.filter(i => i.status === 'open').length,
    inProgress: filteredIssues.filter(i => i.status === 'in-progress').length,
    resolved: filteredIssues.filter(i => i.status === 'resolved').length,
    myIssues: filteredIssues.filter(i => isAssignedToMe(i)).length,
    critical: filteredIssues.filter(i => i.priority === 'critical').length,
    overdue: filteredIssues.filter(i => {
      const sla = getSLAStatus(i);
      return sla && sla.status === 'overdue';
    }).length,
  };

  // Kanban columns
  const kanbanColumns = {
    open: filteredIssues.filter(i => i.status === 'open'),
    'in-progress': filteredIssues.filter(i => i.status === 'in-progress'),
    resolved: filteredIssues.filter(i => i.status === 'resolved'),
    closed: filteredIssues.filter(i => i.status === 'closed'),
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-6 lg:p-8 ml-16 lg:ml-0">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <AlertCircle className="h-8 w-8 text-primary" />
                Müşteri Sorunları Yönetimi
              </h1>
              <p className="text-muted-foreground mt-1">
                Gelişmiş sorun takip ve yönetim sistemi
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={fetchIssues}
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenile
              </Button>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Sorun Ekle
              </Button>
            </div>
          </div>

          {/* Enhanced Stats Dashboard */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Toplam Sorun
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{localStats.total}</div>
                {stats && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    {stats.last7Days} yeni (7 gün)
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Açık
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{localStats.open}</div>
                <Progress value={(localStats.open / localStats.total) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Devam Eden
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{localStats.inProgress}</div>
                <Progress value={(localStats.inProgress / localStats.total) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Çözüldü
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{localStats.resolved}</div>
                {stats && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.resolvedLast7Days} son 7 günde
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Benim
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{localStats.myIssues}</div>
                <Progress value={(localStats.myIssues / localStats.total) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  Kritik
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{localStats.critical}</div>
                <Badge variant="destructive" className="mt-2">Acil Dikkat</Badge>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Gecikmiş
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{localStats.overdue}</div>
                {stats && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ort. {stats.avgResolutionTimeHours}sa çözüm
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Search and View Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Sorun başlığı, açıklama veya müşteri adı ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'kanban' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('kanban')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                  >
                    <TableIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={showFilters ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtreler
                    {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <Label>Durum</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tümü</SelectItem>
                          <SelectItem value="unresolved">Çözülmeyenler</SelectItem>
                          <SelectItem value="resolved">Çözülenler</SelectItem>
                          <SelectItem value="open">Açık</SelectItem>
                          <SelectItem value="in-progress">Devam Eden</SelectItem>
                          <SelectItem value="closed">Kapalı</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Öncelik</Label>
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tümü</SelectItem>
                          <SelectItem value="critical">Kritik</SelectItem>
                          <SelectItem value="high">Yüksek</SelectItem>
                          <SelectItem value="medium">Orta</SelectItem>
                          <SelectItem value="low">Düşük</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Kategori</Label>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tümü</SelectItem>
                          <SelectItem value="technical">Teknik</SelectItem>
                          <SelectItem value="billing">Faturalama</SelectItem>
                          <SelectItem value="support">Destek</SelectItem>
                          <SelectItem value="complaint">Şikayet</SelectItem>
                          <SelectItem value="other">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Atanan Kişi</Label>
                      <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tümü" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tümü</SelectItem>
                          {personnel.map((person) => (
                            <SelectItem key={person._id} value={person._id}>
                              {person.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {(statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || assignedToFilter || searchQuery) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setStatusFilter('all');
                        setPriorityFilter('all');
                        setCategoryFilter('all');
                        setAssignedToFilter('');
                        setSearchQuery('');
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Tüm Filtreleri Temizle
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Issues Display - List View */}
          {viewMode === 'list' && (
            <div className="space-y-4">
              {loading ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                    <p className="text-muted-foreground">Yükleniyor...</p>
                  </CardContent>
                </Card>
              ) : filteredIssues.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sorun bulunamadı</h3>
                    <p className="text-muted-foreground mb-4">
                      Filtreleri değiştirin veya yeni bir sorun oluşturun
                    </p>
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Sorun Ekle
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredIssues.map((issue) => {
                  const slaStatus = getSLAStatus(issue);
                  return (
                    <Card key={issue._id} className="hover:shadow-lg transition-all border-l-4" style={{
                      borderLeftColor: issue.priority === 'critical' ? '#ef4444' : 
                                       issue.priority === 'high' ? '#f97316' :
                                       issue.priority === 'medium' ? '#eab308' : '#3b82f6'
                    }}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold">{issue.title}</h3>
                                  {issue.attachments && issue.attachments.length > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      <Paperclip className="h-3 w-3 mr-1" />
                                      {issue.attachments.length}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {issue.description}
                                </p>
                              </div>
                              <div className="flex flex-col gap-2">
                                {getStatusBadge(issue.status)}
                                {getPriorityBadge(issue.priority)}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                              {issue.customerName && (
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  <span className="font-medium">{issue.customerName}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(issue.createdAt).toLocaleDateString('tr-TR')}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                <span>{getCategoryLabel(issue.category)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>Oluşturan: {issue.createdBy.name}</span>
                              </div>
                              {slaStatus && (
                                <div className="flex items-center gap-1 font-medium">
                                  <Timer className="h-4 w-4" />
                                  <Badge variant={slaStatus.variant}>{slaStatus.text}</Badge>
                                </div>
                              )}
                            </div>

                            {/* Assigned Personnel */}
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-sm font-medium">Atananlar:</span>
                              <div className="flex items-center gap-2">
                                {issue.assignedTo.length === 0 ? (
                                  <Badge variant="outline">Atama Yok</Badge>
                                ) : (
                                  <div className="flex -space-x-2">
                                    {issue.assignedTo.slice(0, 4).map((person) => (
                                      <Avatar key={person._id} className="h-8 w-8 border-2 border-background">
                                        {person.avatar && (
                                          <AvatarImage src={`${getApiUrl()}${person.avatar}`} alt={person.name} />
                                        )}
                                        <AvatarFallback className="text-xs">
                                          {getAvatarFallback(person.name, person.email)}
                                        </AvatarFallback>
                                      </Avatar>
                                    ))}
                                    {issue.assignedTo.length > 4 && (
                                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                        +{issue.assignedTo.length - 4}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedIssue(issue);
                                  setShowDetailModal(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Detaylar
                              </Button>
                              {isAssignedToMe(issue) ? (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleSelfAssign(issue._id, 'unassign')}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Kendimi Çıkar
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleSelfAssign(issue._id, 'assign')}
                                >
                                  <User className="h-4 w-4 mr-2" />
                                  Kendimi Ata
                                </Button>
                              )}
                              {issue.status !== 'resolved' && isAssignedToMe(issue) && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleUpdateStatus(issue._id, 'resolved')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Çözüldü Olarak İşaretle
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {/* Issues Display - Kanban View */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(kanbanColumns).map(([status, statusIssues]) => (
                <Card key={status} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {getStatusBadge(status)}
                        <span className="text-muted-foreground">({statusIssues.length})</span>
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-400px)]">
                    {statusIssues.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Sorun yok
                      </div>
                    ) : (
                      statusIssues.map((issue) => (
                        <Card 
                          key={issue._id} 
                          className="cursor-pointer hover:shadow-md transition-all border-l-4"
                          style={{
                            borderLeftColor: issue.priority === 'critical' ? '#ef4444' : 
                                           issue.priority === 'high' ? '#f97316' :
                                           issue.priority === 'medium' ? '#eab308' : '#3b82f6'
                          }}
                          onClick={() => {
                            setSelectedIssue(issue);
                            setShowDetailModal(true);
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold text-sm line-clamp-2">{issue.title}</h4>
                                {getPriorityBadge(issue.priority)}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {issue.description}
                              </p>
                              {issue.customerName && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  <span>{issue.customerName}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <div className="flex -space-x-1">
                                  {issue.assignedTo.slice(0, 3).map((person) => (
                                    <Avatar key={person._id} className="h-6 w-6 border-2 border-background">
                                      {person.avatar && (
                                        <AvatarImage src={`${getApiUrl()}${person.avatar}`} alt={person.name} />
                                      )}
                                      <AvatarFallback className="text-xs">
                                        {getAvatarFallback(person.name, person.email)}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(issue.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Issues Display - Table View */}
          {viewMode === 'table' && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-semibold">Başlık</th>
                        <th className="text-left p-4 font-semibold">Müşteri</th>
                        <th className="text-left p-4 font-semibold">Durum</th>
                        <th className="text-left p-4 font-semibold">Öncelik</th>
                        <th className="text-left p-4 font-semibold">Kategori</th>
                        <th className="text-left p-4 font-semibold">Atananlar</th>
                        <th className="text-left p-4 font-semibold">Tarih</th>
                        <th className="text-left p-4 font-semibold">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIssues.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-muted-foreground">
                            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Sorun bulunamadı</p>
                          </td>
                        </tr>
                      ) : (
                        filteredIssues.map((issue) => (
                          <tr key={issue._id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="p-4">
                              <div className="font-medium">{issue.title}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">{issue.description}</div>
                            </td>
                            <td className="p-4 text-sm">{issue.customerName || '-'}</td>
                            <td className="p-4">{getStatusBadge(issue.status)}</td>
                            <td className="p-4">{getPriorityBadge(issue.priority)}</td>
                            <td className="p-4 text-sm">{getCategoryLabel(issue.category)}</td>
                            <td className="p-4">
                              <div className="flex -space-x-2">
                                {issue.assignedTo.slice(0, 3).map((person) => (
                                  <Avatar key={person._id} className="h-6 w-6 border-2 border-background">
                                    {person.avatar && (
                                      <AvatarImage src={`${getApiUrl()}${person.avatar}`} alt={person.name} />
                                    )}
                                    <AvatarFallback className="text-xs">
                                      {getAvatarFallback(person.name, person.email)}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {issue.assignedTo.length > 3 && (
                                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                    +{issue.assignedTo.length - 3}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-sm">{new Date(issue.createdAt).toLocaleDateString('tr-TR')}</td>
                            <td className="p-4">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedIssue(issue);
                                  setShowDetailModal(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Create Issue Modal - Keep existing */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Sorun Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Başlık <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sorun başlığı"
              />
            </div>
            <div>
              <Label htmlFor="description">Açıklama <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Sorun detaylarını yazın..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Öncelik</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="medium">Orta</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="critical">Kritik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kategori</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Teknik</SelectItem>
                    <SelectItem value="billing">Faturalama</SelectItem>
                    <SelectItem value="support">Destek</SelectItem>
                    <SelectItem value="complaint">Şikayet</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="customerName">Müşteri Adı</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Müşteri adı (opsiyonel)"
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Bitiş Tarihi (SLA)</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Atanacak Personel (Opsiyonel)</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (!selectedPersonnel.includes(value)) {
                    setSelectedPersonnel([...selectedPersonnel, value]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Personel seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {personnel
                    .filter(p => !selectedPersonnel.includes(p._id))
                    .map((person) => (
                      <SelectItem key={person._id} value={person._id}>
                        {person.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedPersonnel.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPersonnel.map((personId) => {
                    const person = personnel.find(p => p._id === personId);
                    return person ? (
                      <Badge key={personId} variant="secondary" className="gap-1">
                        {person.name}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => setSelectedPersonnel(selectedPersonnel.filter(id => id !== personId))}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                İptal
              </Button>
              <Button onClick={handleCreateIssue}>
                <Plus className="h-4 w-4 mr-2" />
                Sorun Oluştur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Detail Modal with Attachments */}
      {selectedIssue && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span className="flex-1">{selectedIssue.title}</span>
                <div className="flex gap-2">
                  {getStatusBadge(selectedIssue.status)}
                  {getPriorityBadge(selectedIssue.priority)}
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Detaylar</TabsTrigger>
                <TabsTrigger value="notes">Notlar ({selectedIssue.notes?.length || 0})</TabsTrigger>
                <TabsTrigger value="attachments">Dosyalar ({selectedIssue.attachments?.length || 0})</TabsTrigger>
                <TabsTrigger value="timeline">Zaman Çizelgesi</TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <div>
                  <Label>Açıklama</Label>
                  <p className="text-sm mt-1 bg-muted p-3 rounded">{selectedIssue.description}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Kategori</Label>
                    <p>{getCategoryLabel(selectedIssue.category)}</p>
                  </div>
                  <div>
                    <Label>Oluşturan</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-6 w-6">
                        {selectedIssue.createdBy.avatar && (
                          <AvatarImage src={`${getApiUrl()}${selectedIssue.createdBy.avatar}`} alt={selectedIssue.createdBy.name} />
                        )}
                        <AvatarFallback className="text-xs">
                          {getAvatarFallback(selectedIssue.createdBy.name, selectedIssue.createdBy.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{selectedIssue.createdBy.name}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Oluşturma Tarihi</Label>
                    <p>{new Date(selectedIssue.createdAt).toLocaleString('tr-TR')}</p>
                  </div>
                  {selectedIssue.resolvedAt && (
                    <div>
                      <Label>Çözülme Tarihi</Label>
                      <p>{new Date(selectedIssue.resolvedAt).toLocaleString('tr-TR')}</p>
                    </div>
                  )}
                  {selectedIssue.customerName && (
                    <div>
                      <Label>Müşteri</Label>
                      <p>{selectedIssue.customerName}</p>
                    </div>
                  )}
                  {selectedIssue.dueDate && (
                    <div>
                      <Label>Bitiş Tarihi (SLA)</Label>
                      <p className="flex items-center gap-2">
                        {new Date(selectedIssue.dueDate).toLocaleString('tr-TR')}
                        {(() => {
                          const sla = getSLAStatus(selectedIssue);
                          return sla && (
                            <Badge variant={sla.variant}>
                              {sla.text}
                            </Badge>
                          );
                        })()}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <Label className="mb-2 block">Atanan Personel</Label>
                  <div className="space-y-2">
                    {selectedIssue.assignedTo.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Henüz kimse atanmamış</p>
                    ) : (
                      selectedIssue.assignedTo.map((person) => (
                        <div key={person._id} className="flex items-center justify-between bg-muted p-2 rounded">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              {person.avatar && (
                                <AvatarImage src={`${getApiUrl()}${person.avatar}`} alt={person.name} />
                              )}
                              <AvatarFallback className="text-xs">
                                {getAvatarFallback(person.name, person.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{person.name}</p>
                              <p className="text-xs text-muted-foreground">{person.email}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveAssignment(selectedIssue._id, person._id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                    <Select
                      value=""
                      onValueChange={(value) => {
                        const newAssignees = [...selectedIssue.assignedTo.map(u => u._id), value];
                        handleReassign(selectedIssue._id, newAssignees);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Personel ekle..." />
                      </SelectTrigger>
                      <SelectContent>
                        {personnel
                          .filter(p => !selectedIssue.assignedTo.some(u => u._id === p._id))
                          .map((person) => (
                            <SelectItem key={person._id} value={person._id}>
                              {person.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="mb-2 block">Durum Güncelle</Label>
                  <Select
                    value={selectedIssue.status}
                    onValueChange={(value) => handleUpdateStatus(selectedIssue._id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Açık</SelectItem>
                      <SelectItem value="in-progress">Devam Ediyor</SelectItem>
                      <SelectItem value="resolved">Çözüldü</SelectItem>
                      <SelectItem value="closed">Kapatıldı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="space-y-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedIssue.notes && selectedIssue.notes.length > 0 ? (
                    selectedIssue.notes.map((note) => (
                      <div key={note._id} className="bg-muted p-3 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            {note.user.avatar && (
                              <AvatarImage src={`${getApiUrl()}${note.user.avatar}`} alt={note.user.name} />
                            )}
                            <AvatarFallback className="text-xs">
                              {getAvatarFallback(note.user.name, note.user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{note.user.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(note.createdAt).toLocaleString('tr-TR')}
                          </span>
                        </div>
                        <p className="text-sm">{note.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Henüz not eklenmemiş</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Not ekle..."
                    rows={2}
                  />
                  <Button onClick={() => handleAddNote(selectedIssue._id)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Attachments Tab */}
              <TabsContent value="attachments" className="space-y-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedIssue.attachments && selectedIssue.attachments.length > 0 ? (
                    selectedIssue.attachments.map((attachment) => (
                      <div key={attachment._id} className="flex items-center justify-between bg-muted p-3 rounded">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{attachment.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{attachment.uploadedBy.name}</span>
                              <span>•</span>
                              <span>{new Date(attachment.uploadedAt).toLocaleDateString('tr-TR')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDeleteAttachment(selectedIssue._id, attachment._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Paperclip className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Henüz dosya eklenmemiş</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(selectedIssue._id, file);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Dosya Yükle
                  </Button>
                </div>
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <Plus className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="flex-1 w-px bg-border my-2" />
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium text-sm">Sorun Oluşturuldu</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedIssue.createdBy.name} tarafından {new Date(selectedIssue.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>

                  {selectedIssue.notes && selectedIssue.notes.map((note, idx) => (
                    <div key={note._id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-white" />
                        </div>
                        {idx < (selectedIssue.notes?.length || 0) - 1 && (
                          <div className="flex-1 w-px bg-border my-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-sm">Not Eklendi</p>
                        <p className="text-xs text-muted-foreground mb-1">
                          {note.user.name} tarafından {new Date(note.createdAt).toLocaleString('tr-TR')}
                        </p>
                        <p className="text-sm bg-muted p-2 rounded">{note.text}</p>
                      </div>
                    </div>
                  ))}

                  {selectedIssue.resolvedAt && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Sorun Çözüldü</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedIssue.resolvedBy?.name} tarafından {new Date(selectedIssue.resolvedAt).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="flex justify-between">
              <Button
                variant="destructive"
                onClick={() => handleDeleteIssue(selectedIssue._id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Sorunu Sil
              </Button>
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Kapat
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 