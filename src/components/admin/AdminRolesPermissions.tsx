import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

type RoleAction = 'change_user_role' | 'suspend_user' | 'unsuspend_user';
type Direction = 'promote' | 'demote';

// Role hierarchy: user → staff (moderator) → admin
const ROLE_HIERARCHY = ['user', 'moderator', 'admin'] as const;

function getHighestRole(roles: string[]): string {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('moderator')) return 'moderator';
  return 'user';
}

function canPromote(role: string): boolean {
  return role !== 'admin';
}

function canDemote(role: string): boolean {
  return role !== 'user';
}

function getNextRole(currentRole: string, direction: Direction): string {
  const currentIndex = ROLE_HIERARCHY.indexOf(currentRole as typeof ROLE_HIERARCHY[number]);
  if (direction === 'promote') {
    return ROLE_HIERARCHY[Math.min(currentIndex + 1, ROLE_HIERARCHY.length - 1)];
  }
  return ROLE_HIERARCHY[Math.max(currentIndex - 1, 0)];
}

function getRoleLabel(role: string): string {
  if (role === 'moderator') return 'Staff';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

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
    direction?: Direction;
  }>({ open: false, user: null, action: 'change_user_role' });

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

  const handleConfirmAction = async () => {
    const { user, action, direction } = confirmDialog;
    if (!user) return;

    setActionLoading(user.id);
    try {
      let body: Record<string, unknown>;
      
      switch (action) {
        case 'change_user_role':
          body = { 
            action: 'change_user_role', 
            targetUserId: user.id,
            direction
          };
          break;
        case 'suspend_user':
          body = { action: 'suspend_user', targetUserId: user.id };
          break;
        case 'unsuspend_user':
          body = { action: 'unsuspend_user', targetUserId: user.id };
          break;
      }

      const response = await supabase.functions.invoke('admin-user-management', { body });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast.success(response.data.message || 'Action completed successfully');
      fetchUsers();
    } catch (error: any) {
      console.error('Role action error:', error);
      toast.error(error.message || 'Failed to perform action');
    } finally {
      setActionLoading(null);
      setConfirmDialog({ open: false, user: null, action: 'change_user_role' });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'moderator': return 'secondary';
      default: return 'outline';
    }
  };

  const getDialogContent = () => {
    const { user, action, direction } = confirmDialog;
    if (!user) return { title: '', description: '' };

    const highestRole = getHighestRole(user.roles);
    
    switch (action) {
      case 'change_user_role': {
        const nextRole = direction ? getNextRole(highestRole, direction) : highestRole;
        const verb = direction === 'promote' ? 'Promote' : 'Demote';
        return {
          title: `${verb} User?`,
          description: `${verb} ${user.email} from ${getRoleLabel(highestRole)} to ${getRoleLabel(nextRole)}?`
        };
      }
      case 'suspend_user':
        return {
          title: 'Suspend User?',
          description: `Suspend ${user.email}? They will not be able to access the app until unsuspended.`
        };
      case 'unsuspend_user':
        return {
          title: 'Unsuspend User?',
          description: `Restore access for ${user.email}?`
        };
    }
  };

  const dialogContent = getDialogContent();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Roles & Permissions
          </CardTitle>
          <CardDescription>
            Manage user roles: Admin → Staff → User (progressive hierarchy)
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
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {filteredUsers.map((user) => {
                const highestRole = getHighestRole(user.roles);
                const isAdmin = highestRole === 'admin';
                const isUser = highestRole === 'user';
                const showPromote = canPromote(highestRole);
                const showDemote = canDemote(highestRole);
                
                return (
                  <div 
                    key={user.id} 
                    className="p-4 rounded-lg border bg-card"
                  >
                    {/* User info row */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-medium truncate flex-1 min-w-0">{user.email}</span>
                      <Badge variant={getRoleBadgeVariant(highestRole)} className="capitalize shrink-0">
                        {getRoleLabel(highestRole)}
                      </Badge>
                      {user.is_suspended && (
                        <Badge variant="destructive" className="gap-1 shrink-0">
                          <Ban className="h-3 w-3" />
                          Suspended
                        </Badge>
                      )}
                    </div>

                    {/* Action buttons - responsive grid */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                      {/* Promote button */}
                      {showPromote && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmDialog({
                            open: true,
                            user,
                            action: 'change_user_role',
                            direction: 'promote'
                          })}
                          disabled={actionLoading === user.id}
                          className="gap-1.5 h-9"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ArrowUpCircle className="h-3.5 w-3.5" />
                          )}
                          <span>Promote</span>
                        </Button>
                      )}
                      
                      {/* Demote button */}
                      {showDemote && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmDialog({
                            open: true,
                            user,
                            action: 'change_user_role',
                            direction: 'demote'
                          })}
                          disabled={actionLoading === user.id}
                          className="gap-1.5 h-9"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ArrowDownCircle className="h-3.5 w-3.5" />
                          )}
                          <span>Demote</span>
                        </Button>
                      )}

                      {/* Suspend/Unsuspend - only for users with role === 'user' */}
                      {isUser && !isAdmin && (
                        <Button
                          variant={user.is_suspended ? "default" : "destructive"}
                          size="sm"
                          onClick={() => setConfirmDialog({
                            open: true,
                            user,
                            action: user.is_suspended ? 'unsuspend_user' : 'suspend_user'
                          })}
                          disabled={actionLoading === user.id}
                          className="gap-1.5 h-9 col-span-2 sm:col-span-1"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : user.is_suspended ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>Unsuspend</span>
                            </>
                          ) : (
                            <>
                              <Ban className="h-3.5 w-3.5" />
                              <span>Suspend</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredUsers.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No users match your search' : 'No users found'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => 
        setConfirmDialog(prev => ({ ...prev, open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
