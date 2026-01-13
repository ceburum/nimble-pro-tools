import { useState, useRef, useEffect } from 'react';
import { useGlobalNotes } from '@/hooks/useGlobalNotes';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  FileText, 
  Trash2, 
  Pencil, 
  Check, 
  X, 
  Loader2,
  FolderKanban,
  Link2,
  Unlink,
  StickyNote,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Notepad() {
  const { notes, loading, addNote, updateNote, deleteNote, assignToProject, removeFromProject } = useGlobalNotes();
  const { projects } = useProjects();
  const { clients } = useClients();
  const { toast } = useToast();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter state
  const [filterProject, setFilterProject] = useState<string | 'all' | 'unassigned'>('all');

  useEffect(() => {
    if (isAdding && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAdding]);

  const handleAddNote = () => {
    if (!newBody.trim()) return;
    addNote(newBody, newTitle);
    setNewTitle('');
    setNewBody('');
    setIsAdding(false);
    toast({ title: 'Note saved' });
  };

  const handleStartEdit = (noteId: string, title?: string, body?: string) => {
    setEditingId(noteId);
    setEditTitle(title || '');
    setEditBody(body || '');
  };

  const handleSaveEdit = () => {
    if (!editingId || !editBody.trim()) return;
    updateNote(editingId, { title: editTitle, body: editBody });
    setEditingId(null);
    setEditTitle('');
    setEditBody('');
    toast({ title: 'Note updated' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditBody('');
  };

  const handleDelete = (noteId: string) => {
    if (confirm('Delete this note permanently?')) {
      deleteNote(noteId);
      toast({ title: 'Note deleted' });
    }
  };

  const openAssignDialog = (noteId: string) => {
    setSelectedNoteId(noteId);
    setAssignDialogOpen(true);
  };

  const handleToggleProjectAssignment = (projectId: string, isAssigned: boolean) => {
    if (!selectedNoteId) return;
    
    if (isAssigned) {
      removeFromProject(selectedNoteId, projectId);
    } else {
      assignToProject(selectedNoteId, projectId);
    }
  };

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  // Filter notes based on selection
  const filteredNotes = notes.filter(note => {
    if (filterProject === 'all') return true;
    if (filterProject === 'unassigned') return note.projectIds.length === 0;
    return note.projectIds.includes(filterProject);
  });

  // Get project name helper
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.title || 'Unknown Project';
  };

  const getClientName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return '';
    const client = clients.find(c => c.id === project.clientId);
    return client?.name || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notepad"
        description="Quick notes and thoughts. Assign notes to projects as needed."
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <Label className="text-sm text-muted-foreground">Filter:</Label>
        <Button
          variant={filterProject === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterProject('all')}
        >
          All Notes
        </Button>
        <Button
          variant={filterProject === 'unassigned' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterProject('unassigned')}
        >
          Unassigned
        </Button>
        {projects.slice(0, 5).map(project => (
          <Button
            key={project.id}
            variant={filterProject === project.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterProject(project.id)}
            className="max-w-[150px] truncate"
          >
            {project.title}
          </Button>
        ))}
      </div>

      {/* Add Note Section */}
      {!isAdding ? (
        <Button 
          onClick={() => setIsAdding(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      ) : (
        <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
          <Input
            placeholder="Title (optional)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Textarea
            ref={textareaRef}
            placeholder="Write your note..."
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button 
              variant="ghost" 
              onClick={() => {
                setIsAdding(false);
                setNewTitle('');
                setNewBody('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddNote}
              disabled={!newBody.trim()}
            >
              Save Note
            </Button>
          </div>
        </div>
      )}

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <StickyNote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No notes yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            {filterProject !== 'all' ? 'Try a different filter or ' : ''}
            Click "New Note" to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <div 
              key={note.id} 
              className={cn(
                "border border-border rounded-lg p-4 bg-card transition-all hover:shadow-md",
                editingId === note.id && "ring-2 ring-primary"
              )}
            >
              {editingId === note.id ? (
                <div className="space-y-3">
                  <Input
                    placeholder="Title (optional)"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <Textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={4}
                    className="resize-none"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit} disabled={!editBody.trim()}>
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      {note.title && (
                        <h3 className="font-semibold text-foreground mb-1 truncate">
                          {note.title}
                        </h3>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openAssignDialog(note.id)}
                        title="Assign to projects"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleStartEdit(note.id, note.title, note.body)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(note.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words line-clamp-4 mb-3">
                    {note.body}
                  </p>

                  {/* Project Tags */}
                  {note.projectIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {note.projectIds.map(projectId => (
                        <Badge 
                          key={projectId} 
                          variant="secondary" 
                          className="text-xs gap-1"
                        >
                          <FolderKanban className="h-3 w-3" />
                          {getProjectName(projectId)}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {format(note.updatedAt, 'MMM d, yyyy h:mm a')}
                    {note.createdAt.getTime() !== note.updatedAt.getTime() && ' (edited)'}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Assign to Projects Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Assign to Projects
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedNote && (
              <div className="p-3 bg-muted/50 rounded-lg">
                {selectedNote.title && (
                  <p className="font-medium text-sm mb-1">{selectedNote.title}</p>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">{selectedNote.body}</p>
              </div>
            )}

            <ScrollArea className="h-[300px]">
              <div className="space-y-2 pr-4">
                {projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No projects available
                  </p>
                ) : (
                  projects.map(project => {
                    const isAssigned = selectedNote?.projectIds.includes(project.id) || false;
                    const clientName = getClientName(project.id);
                    
                    return (
                      <div 
                        key={project.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                          isAssigned ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                        )}
                        onClick={() => handleToggleProjectAssignment(project.id, isAssigned)}
                      >
                        <Checkbox 
                          checked={isAssigned}
                          onCheckedChange={() => handleToggleProjectAssignment(project.id, isAssigned)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{project.title}</p>
                          {clientName && (
                            <p className="text-xs text-muted-foreground">{clientName}</p>
                          )}
                        </div>
                        {isAssigned && (
                          <Badge variant="default" className="text-xs">Assigned</Badge>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            <div className="flex justify-end">
              <Button onClick={() => setAssignDialogOpen(false)}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
