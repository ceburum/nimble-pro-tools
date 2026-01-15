import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Shield, ShieldCheck, UserCog, Loader2, Search, 
  ArrowUpCircle, ArrowDownCircle, Ban, CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserWithRole {
  id: string;
  email: string;
  roles: string[];
  is_suspended?: boolean;
}

type RoleAction = 'promote' | 'demote' | 'suspend' | 'unsuspend';

export function AdminRolesPermissions() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    user: UserWithRole | null;
    action: RoleAction;
    newRole?: string;
  }>({ open: false, user: null, action: 'promote' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'list_users' }
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      
      setUsers(response.data.users || []);
      setFilteredUsers(response.data.users || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
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
        user.email.toLowerCase().includes(query)
      ));
    }
  }, [searchQuery, users]);

  const handleRoleChange = async () => {
    const { user, action, newRole } = confirmDialog;
    if (!user) return;

    setActionLoading(user.id);
    try {
      const response = await supabase.functions.invoke('admin-user-management', {
        body: { 
          action: 'update_role', 
          targetUserId: user.id,
          roleAction: action,
          newRole: newRole
        }
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast.success(`User role updated successfully`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
      setConfirmDialog({ open: false, user: null, action: 'promote' });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'moderator': return 'secondary';
      default: return 'outline';
    }
  };

  const getHighestRole = (roles: string[]): string => {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('moderator')) return 'moderator';
    return 'user';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Roles & Permissions
          </CardTitle>
          <CardDescription>
            Manage user roles: Admin, Staff (Moderator), and User
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Admin
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Full access to all features and admin tools
              </p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 border">
              <div className="flex items-center gap-2 font-medium">
                <UserCog className="h-4 w-4" />
                Staff
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Limited admin access, can manage users
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 font-medium">
                <Shield className="h-4 w-4" />
                User
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Standard user, no admin access
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredUsers.map((user) => {
                const highestRole = getHighestRole(user.roles);
                const isAdmin = user.roles.includes('admin');
                
                return (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-medium truncate">{user.email}</span>
                      <Badge variant={getRoleBadgeVariant(highestRole)} className="capitalize">
                        {highestRole === 'moderator' ? 'Staff' : highestRole}
                      </Badge>
                      {user.is_suspended && (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="h-3 w-3" />
                          Suspended
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!isAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmDialog({
                              open: true,
                              user,
                              action: 'promote',
                              newRole: highestRole === 'user' ? 'moderator' : 'admin'
                            })}
                            disabled={actionLoading === user.id}
                            className="gap-1"
                          >
                            <ArrowUpCircle className="h-3 w-3" />
                            Promote
                          </Button>
                          
                          {highestRole !== 'user' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmDialog({
                                open: true,
                                user,
                                action: 'demote',
                                newRole: highestRole === 'admin' ? 'moderator' : 'user'
                              })}
                              disabled={actionLoading === user.id}
                              className="gap-1"
                            >
                              <ArrowDownCircle className="h-3 w-3" />
                              Demote
                            </Button>
                          )}

                          <Button
                            variant={user.is_suspended ? "default" : "destructive"}
                            size="sm"
                            onClick={() => setConfirmDialog({
                              open: true,
                              user,
                              action: user.is_suspended ? 'unsuspend' : 'suspend'
                            })}
                            disabled={actionLoading === user.id}
                            className="gap-1"
                          >
                            {user.is_suspended ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                Unsuspend
                              </>
                            ) : (
                              <>
                                <Ban className="h-3 w-3" />
                                Suspend
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => 
        setConfirmDialog(prev => ({ ...prev, open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'promote' && 'Promote User?'}
              {confirmDialog.action === 'demote' && 'Demote User?'}
              {confirmDialog.action === 'suspend' && 'Suspend User?'}
              {confirmDialog.action === 'unsuspend' && 'Unsuspend User?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'promote' && (
                <p>Promote <strong>{confirmDialog.user?.email}</strong> to {confirmDialog.newRole === 'moderator' ? 'Staff' : 'Admin'}?</p>
              )}
              {confirmDialog.action === 'demote' && (
                <p>Demote <strong>{confirmDialog.user?.email}</strong> to {confirmDialog.newRole === 'moderator' ? 'Staff' : 'User'}?</p>
              )}
              {confirmDialog.action === 'suspend' && (
                <p>Suspend <strong>{confirmDialog.user?.email}</strong>? They will not be able to access the app.</p>
              )}
              {confirmDialog.action === 'unsuspend' && (
                <p>Restore access for <strong>{confirmDialog.user?.email}</strong>?</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
