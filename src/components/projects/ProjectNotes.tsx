import { useState, useRef, useEffect } from 'react';
import { useProjectNotes } from '@/hooks/useProjectNotes';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Plus, FileText, Trash2, Pencil, Check, X, Loader2, Unlink } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ProjectNotesProps {
  projectId: string;
}

export function ProjectNotes({ projectId }: ProjectNotesProps) {
  const { notes, loading, addNote, updateNote, deleteNote, removeFromProject } = useProjectNotes(projectId);
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when adding
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

  const handleRemoveFromProject = (noteId: string) => {
    if (confirm('Remove this note from this project? (Note will remain in your Notepad)')) {
      removeFromProject(noteId);
      toast({ title: 'Note removed from project' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Note Button / Form */}
      {!isAdding ? (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsAdding(true)}
          className="w-full justify-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      ) : (
        <div className="border border-border rounded-lg p-3 space-y-3 bg-muted/30">
          <Input
            placeholder="Title (optional)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="text-sm"
          />
          <Textarea
            ref={textareaRef}
            placeholder="Write your note..."
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            rows={3}
            className="text-sm resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setIsAdding(false);
                setNewTitle('');
                setNewBody('');
              }}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleAddNote}
              disabled={!newBody.trim()}
            >
              Save Note
            </Button>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 && !isAdding ? (
        <div className="text-center py-8">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">No notes yet</p>
          <p className="text-muted-foreground text-xs mt-1">Add notes to keep track of project details</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div 
              key={note.id} 
              className={cn(
                "border border-border rounded-lg p-3 bg-card transition-colors",
                editingId === note.id && "ring-2 ring-primary"
              )}
            >
              {editingId === note.id ? (
                <div className="space-y-3">
                  <Input
                    placeholder="Title (optional)"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-sm"
                  />
                  <Textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={3}
                    className="text-sm resize-none"
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {note.title && (
                        <h4 className="font-medium text-sm text-foreground mb-1 truncate">
                          {note.title}
                        </h4>
                      )}
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words">
                        {note.body}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {note.projectIds.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleRemoveFromProject(note.id)}
                          title="Remove from this project"
                        >
                          <Unlink className="h-3.5 w-3.5" />
                        </Button>
                      )}
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
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(note.updatedAt, 'MMM d, yyyy h:mm a')}
                    {note.createdAt.getTime() !== note.updatedAt.getTime() && ' (edited)'}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
