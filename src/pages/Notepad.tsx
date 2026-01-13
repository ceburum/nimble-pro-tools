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
  Trash2, 
  Pencil, 
  Check, 
  X, 
  Loader2,
  FolderKanban,
  Link2,
  StickyNote,
  ArrowLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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
  
  // View modes: 'list' for note list, 'compose' for full-screen note editing
  const [viewMode, setViewMode] = useState<'list' | 'compose'>('list');
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
    if (viewMode === 'compose' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [viewMode]);

  const handleAddNote = () => {
    if (!newBody.trim()) return;
    addNote(newBody, newTitle);
    setNewTitle('');
    setNewBody('');
    setViewMode('list');
    toast({ title: 'Note saved' });
  };

  const handleStartEdit = (noteId: string, title?: string, body?: string) => {
    setEditingId(noteId);
    setEditTitle(title || '');
    setEditBody(body || '');
    setViewMode('compose');
  };

  const handleSaveEdit = () => {
    if (!editingId || !editBody.trim()) return;
    updateNote(editingId, { title: editTitle, body: editBody });
    setEditingId(null);
    setEditTitle('');
    setEditBody('');
    setViewMode('list');
    toast({ title: 'Note updated' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditBody('');
    setViewMode('list');
  };

  const handleCancelNew = () => {
    setNewTitle('');
    setNewBody('');
    setViewMode('list');
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

  // Full-screen compose mode
  if (viewMode === 'compose') {
    const isEditing = editingId !== null;
    const currentTitle = isEditing ? editTitle : newTitle;
    const currentBody = isEditing ? editBody : newBody;
    const setCurrentTitle = isEditing ? setEditTitle : setNewTitle;
    const setCurrentBody = isEditing ? setEditBody : setNewBody;

    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={isEditing ? handleCancelEdit : handleCancelNew}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <h1 className="text-lg font-semibold">
            {isEditing ? 'Edit Note' : 'New Note'}
          </h1>
          <Button 
            size="sm"
            onClick={isEditing ? handleSaveEdit : handleAddNote}
            disabled={!currentBody.trim()}
          >
            <Check className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>

        {/* Full-screen editor */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <Input
            placeholder="Title (optional)"
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            className="text-lg font-medium border-0 border-b rounded-none focus-visible:ring-0 px-0 mb-4"
          />
          <Textarea
            ref={textareaRef}
            placeholder="Start writing..."
            value={currentBody}
            onChange={(e) => setCurrentBody(e.target.value)}
            className="flex-1 resize-none border-0 focus-visible:ring-0 px-0 text-base leading-relaxed"
          />
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notepad</h1>
          <p className="text-muted-foreground">Quick notes and thoughts. Assign notes to projects as needed.</p>
        </div>
        <Button onClick={() => setViewMode('compose')}>
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

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
              className="border border-border rounded-lg p-4 bg-card transition-all hover:shadow-md cursor-pointer"
              onClick={() => handleStartEdit(note.id, note.title, note.body)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  {note.title && (
                    <h3 className="font-semibold text-foreground mb-1 truncate">
                      {note.title}
                    </h3>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAssignDialog(note.id);
                    }}
                    title="Assign to projects"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(note.id);
                    }}
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
                <div className="flex flex-wrap gap-1 mb-3" onClick={(e) => e.stopPropagation()}>
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