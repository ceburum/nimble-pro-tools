import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Users, RefreshCw, Trash2, AlertTriangle, 
  ShieldCheck, Loader2, Building, Mail, Calendar, Search, FlaskConical 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ManagedUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  company_name: string | null;
  business_type: string | null;
  setup_completed: boolean;
  roles: string[];
  is_admin: boolean;
  is_test_user?: boolean;
}

export function AdminUserManagementPanel() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<'reset' | 'delete' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'list_users' }
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      
      // Mark test users (emails containing 'test', '+test', or specific test domains)
      const usersWithTestFlag = (response.data.users || []).map((user: ManagedUser) => ({
        ...user,
        is_test_user: isTestUser(user.email)
      }));
      
      setUsers(usersWithTestFlag);
      setFilteredUsers(usersWithTestFlag);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const isTestUser = (email: string): boolean => {
    const testPatterns = [
      /test/i,
      /\+test/i,
      /@example\./i,
      /@test\./i,
      /dummy/i,
      /fake/i,
    ];
    return testPatterns.some(pattern => pattern.test(email));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(user => 
        user.email.toLowerCase().includes(query) ||
        user.company_name?.toLowerCase().includes(query)
      ));
    }
  }, [searchQuery, users]);

  const handleResetUser = async () => {
    if (!selectedUser) return;
    
    setActionLoading(selectedUser.id);
    try {
      const response = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'reset_user', targetUserId: selectedUser.id }
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast.success(`User ${selectedUser.email} has been reset`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset user');
    } finally {
      setActionLoading(null);
      setSelectedUser(null);
      setConfirmAction(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setActionLoading(selectedUser.id);
    try {
      const response = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'delete_user', targetUserId: selectedUser.id }
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast.success(`User ${selectedUser.email} has been permanently deleted`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
      setSelectedUser(null);
      setConfirmAction(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage user accounts, reset data, and delete test users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Caution:</strong> These actions are irreversible. Only use on test accounts.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchUsers}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{filteredUsers.length} user(s)</span>
            <span>•</span>
            <span>{users.filter(u => u.is_test_user).length} test user(s)</span>
          </div>

          <Separator />

          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No users found</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">{user.email}</span>
                        {user.is_admin && (
                          <Badge variant="default" className="gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                        {user.is_test_user && (
                          <Badge variant="secondary" className="gap-1 bg-amber-500/20 text-amber-700 dark:text-amber-400">
                            <FlaskConical className="h-3 w-3" />
                            Test User
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {user.company_name && (
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {user.company_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={user.setup_completed ? "default" : "secondary"}>
                          {user.setup_completed ? "Setup Complete" : "Needs Setup"}
                        </Badge>
                        {user.business_type && (
                          <Badge variant="outline">
                            {user.business_type === 'mobile' ? 'Mobile' : 'Stationary'}
                          </Badge>
                        )}
                        {user.roles.map(role => (
                          <Badge key={role} variant="outline" className="capitalize">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setConfirmAction('reset');
                        }}
                        disabled={user.is_admin || actionLoading === user.id}
                        className="gap-1"
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        Reset
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setConfirmAction('delete');
                        }}
                        disabled={user.is_admin || actionLoading === user.id}
                        className="gap-1"
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator />

          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>Reset User (Keep Email):</strong> Clears all user data and returns the account to the first-time setup screen. Email remains registered.</p>
            <p><strong>Delete User (Free Email):</strong> Permanently deletes the user account and all associated data. Email can be reused.</p>
          </div>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={confirmAction === 'reset'} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-warning" />
              Reset User Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will reset <strong>{selectedUser?.email}</strong> to the initial setup state.
              </p>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>All projects, invoices, and client data will be deleted</li>
                <li>All settings will be cleared</li>
                <li>User must complete business setup on next login</li>
                <li>The email address will remain registered</li>
              </ul>
              <p className="font-medium text-destructive">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedUser(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleResetUser}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              Reset User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={confirmAction === 'delete'} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Permanently Delete User?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will permanently delete <strong>{selectedUser?.email}</strong> and all associated data.
              </p>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>The user's authentication record will be deleted</li>
                <li>All projects, invoices, and client data will be deleted</li>
                <li>All settings and files will be removed</li>
                <li>The email address can be reused for new registrations</li>
              </ul>
              <p className="font-medium text-destructive">This action is permanent and cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedUser(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete User Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
