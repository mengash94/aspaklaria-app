import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { DailyEntry } from '@/api/entities';
import { UserNotifications } from '@/api/entities';
import { Meditation } from '@/api/entities';
import { Stage } from '@/api/entities';
import { NotificationSettings } from '@/api/entities';
import { CustomTrack } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Users, BarChart3, Settings, Bell, BookOpen, TrendingUp, Calendar, Shield, Activity,
  ArrowRight, Send, UserPlus, Search, Loader2, RefreshCcw, Menu
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';

// תפריט הצד כרכיב נפרד
const SidebarNav = ({ currentUser, activeSection, setActiveSection, onLinkClick, menuItems }) => {
  return (
    <div className="w-64 bg-white shadow-lg border-l h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-red-600" />
          <div>
            <h1 className="text-lg font-bold text-gray-800">לוח בקרה</h1>
            <p className="text-sm text-gray-600">{currentUser?.full_name}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Link to={createPageUrl('Home')} onClick={onLinkClick}>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <ArrowRight className="ml-2 h-4 w-4" />
              חזרה לאפליקציה
            </Button>
          </Link>
        </div>
      </div>

      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => { setActiveSection(item.id); onLinkClick && onLinkClick(); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors ${
                    activeSection === item.id
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t bg-gray-100 flex-shrink-0">
        <Button onClick={async () => { await User.logout(); window.location.href = '/'; }} variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-100 hover:text-red-700">
          התנתקות
        </Button>
      </div>
    </div>
  );
};


export default function AdminDashboardPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [activeSection, setActiveSection] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('all');
  const [loadingError, setLoadingError] = useState(null);

  const [userToDelete, setUserToDelete] = useState(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [selectedUserForMessage, setSelectedUserForMessage] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'סקירה כללית', icon: BarChart3 },
    { id: 'users', label: 'ניהול משתמשים', icon: Users },
    { id: 'content', label: 'ניהול תוכן', icon: BookOpen },
    { id: 'notifications', label: 'התראות', icon: Bell },
    { id: 'settings', label: 'הגדרות', icon: Settings }
  ];

    useEffect(() => {
        const checkAdminAccess = async () => {
        try {
            const user = await User.me();
            if (user.role !== 'admin') {
            window.location.href = createPageUrl('Home');
            return;
            }
            setCurrentUser(user);
            await loadDashboardData();
        } catch (error) {
            console.error('Access denied:', error);
            setLoadingError('שגיאה בגישה למערכת. ייתכן שאין לך הרשאות ניהול.');
            window.location.href = createPageUrl('Home');
        } finally {
            setIsLoading(false);
        }
        };
        checkAdminAccess();
    }, []);

    const loadDashboardData = async () => {
        setIsLoading(true);
        setLoadingError(null);
        try {
            const users = await User.list() || [];
            setAllUsers(users);

            const totalUsers = users.length;
            const activeUsers = users.filter(u => u.onboarding_completed).length;

            const tracksDistribution = users.reduce((acc, u) => {
                if (u.track) acc[u.track] = (acc[u.track] || 0) + 1;
                return acc;
            }, {});

            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const newUsersThisWeek = users.filter(u => u.created_date && new Date(u.created_date) > weekAgo).length;

            const [entries, meditations, customTracksData] = await Promise.all([
                DailyEntry.list().catch(() => []),
                Meditation.list().catch(() => []),
                CustomTrack.list().catch(() => [])
            ]);

            setStatistics({
                totalUsers, activeUsers, newUsersThisWeek, tracksDistribution,
                totalEntries: entries.length,
                totalMeditations: meditations.length,
                customTracks: customTracksData.length
            });
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setLoadingError(`שגיאה בטעינת נתונים: ${error.message || 'נסה לרענן את הדף.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = (user) => setUserToDelete(user);

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await User.delete(userToDelete.id);
            toast.success('המשתמש נמחק בהצלחה');
            setUserToDelete(null);
            loadDashboardData();
        } catch (error) {
            toast.error('שגיאה במחיקת המשתמש');
        }
    };

    const sendWhatsAppMessage = (user) => {
        if (!user.phone) {
            toast.error('למשתמש אין מספר טלפון רשום');
            return;
        }
        const cleanPhone = user.phone.replace(/[^\d]/g, '');
        const message = `שלום ${user.full_name}, יש לי עדכון חשוב עבורך מהמאמן הרוחני האישי.`;
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const openMessageDialog = (user) => {
        setSelectedUserForMessage(user);
        setMessageText('');
        setShowMessageDialog(true);
    };

    const sendInAppMessage = async () => {
        if (!selectedUserForMessage || !messageText.trim()) return;
        try {
            await UserNotifications.create({
                user_id: selectedUserForMessage.id,
                notification_type: 'community_messages',
                title: 'הודעה ממנהל המערכת',
                message: messageText,
                sent_at: new Date().toISOString()
            });
            toast.success('הה הודעה נשלחה בהצלחה');
            setShowMessageDialog(false);
        } catch (error) {
            toast.error('שגיאה בשליחת ההודעה');
        }
    };

    const filteredUsers = allUsers.filter(user =>
        (!searchTerm || user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedTrack === 'all' || user.track === selectedTrack)
    );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center" dir="rtl">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-lg text-gray-700">טוען לוח בקרה...</p>
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center" dir="rtl">
          <Alert className="max-w-md mx-auto mb-4" variant="destructive">
            <AlertDescription className="text-lg">{loadingError}</AlertDescription>
          </Alert>
          <Button onClick={() => window.location.reload()} className="mt-4">נסה שוב</Button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">סה"כ משתמשים</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">{statistics.newUsersThisWeek} חדשים השבוע</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">משתמשים פעילים</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">{statistics.totalUsers > 0 ? Math.round((statistics.activeUsers / statistics.totalUsers) * 100) : 0}% מהכלל</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">רישומים יומיים</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.totalEntries}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">תרגילי מדיטציה</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.totalMeditations}</div>
                  <p className="text-xs text-muted-foreground">{statistics.customTracks} מסלולים מותאמים</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>התפלגות מסלולים</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(statistics.tracksDistribution || {}).map(([track, count]) => (
                    <div key={track} className="flex items-center justify-between">
                      <span>{track}</span>
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-200 rounded-full h-2 w-24">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(count / statistics.totalUsers) * 100}%` }} />
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'users':
        return (
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle>ניהול משתמשים</CardTitle>
                <Button size="sm"><UserPlus className="w-4 h-4 ml-2" />הוסף משתמש</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input placeholder="חפש משתמש..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10" />
                </div>
                <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                  <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="סנן לפי מסלול" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל המסלולים</SelectItem>
                    <SelectItem value="מתמיד">מתמיד</SelectItem>
                    <SelectItem value="בקצב אישי">בקצב אישי</SelectItem>
                    <SelectItem value="מותאם אישית">מותאם אישית</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>שם</TableHead>
                      <TableHead>אימייל</TableHead>
                      <TableHead>מסלול</TableHead>
                      <TableHead>הצטרפות</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead className="text-center">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || 'ללא שם'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                        <TableCell>
                          {user.track ? <Badge variant="outline">{user.track}</Badge> : 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {user.created_date ? format(new Date(user.created_date), 'dd/MM/yy', { locale: he }) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge className={user.onboarding_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {user.onboarding_completed ? 'פעיל' : 'בהכנה'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-center flex-wrap">
                            <Button variant="outline" size="sm" onClick={() => sendWhatsAppMessage(user)} className="text-xs h-7">📱</Button>
                            <Button variant="outline" size="sm" onClick={() => openMessageDialog(user)} className="text-xs h-7">💬</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user)} className="text-xs h-7">🗑️</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );

      case 'content': return <div className="text-center text-gray-500 p-8">ניהול תוכן - יגיע בקרוב</div>;
      case 'notifications': return <div className="text-center text-gray-500 p-8">ניהול התראות - יגיע בקרוב</div>;
      case 'settings': return <div className="text-center text-gray-500 p-8">הגדרות מערכת - יגיע בקרוב</div>;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100" dir="rtl">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <SidebarNav
          currentUser={currentUser}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          menuItems={menuItems}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white shadow-sm p-2 border-b">
          <div className="flex items-center justify-between">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-64">
                <SidebarNav
                  currentUser={currentUser}
                  activeSection={activeSection}
                  setActiveSection={setActiveSection}
                  onLinkClick={() => setIsMenuOpen(false)}
                  menuItems={menuItems}
                />
              </SheetContent>
            </Sheet>
            <h2 className="text-lg font-bold">
              {menuItems.find(item => item.id === activeSection)?.label}
            </h2>
            <Button onClick={loadDashboardData} variant="ghost" size="icon">
                <RefreshCcw className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
          <div className="hidden md:flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {menuItems.find(item => item.id === activeSection)?.label}
            </h2>
            <Button onClick={loadDashboardData} variant="outline" size="sm">
                <RefreshCcw className="w-4 h-4 ml-2" />
                רענן נתונים
            </Button>
          </div>
          {renderContent()}
        </main>
      </div>

      {/* Dialogs */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <Card className="w-full max-w-md mx-4">
            <CardHeader><CardTitle>אישור מחיקת משתמש</CardTitle></CardHeader>
            <CardContent>
              <p>האם למחוק את המשתמש <strong>{userToDelete.full_name || userToDelete.email}</strong>? פעולה זו אינה הפיכה.</p>
              <div className="flex gap-2 justify-end mt-4">
                <Button variant="outline" onClick={() => setUserToDelete(null)}>ביטול</Button>
                <Button variant="destructive" onClick={confirmDeleteUser}>מחק</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showMessageDialog && selectedUserForMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <Card className="w-full max-w-md mx-4">
            <CardHeader><CardTitle>שליחת הודעה ל-{selectedUserForMessage.full_name}</CardTitle></CardHeader>
            <CardContent>
              <Textarea placeholder="כתוב הודעה..." value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={4} className="mb-4" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowMessageDialog(false)}>ביטול</Button>
                <Button onClick={sendInAppMessage} disabled={!messageText.trim()}><Send className="w-4 h-4 ml-2" />שלח</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}