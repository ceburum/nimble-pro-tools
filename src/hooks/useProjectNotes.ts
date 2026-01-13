import { useState, useEffect, useCallback } from 'react';
import { GlobalNote } from '@/types/notes';
import { generateLocalId } from '@/lib/localDb';
import { 
  getStoredNotes, 
  saveStoredNotes, 
  NOTES_CHANGE_EVENT 
} from './useNotesSync';

export function useProjectNotes(projectId: string) {
  const [notes, setNotes] = useState<GlobalNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notes for this project and subscribe to changes
  useEffect(() => {
    const loadNotes = () => {
      const allNotes = getStoredNotes();
      const projectNotes = allNotes.filter(n => n.projectIds.includes(projectId));
      setNotes(projectNotes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
      setLoading(false);
    };

    loadNotes();

    // Listen for changes from other hook instances
    const handleChange = () => loadNotes();
    window.addEventListener(NOTES_CHANGE_EVENT, handleChange);
    
    return () => {
      window.removeEventListener(NOTES_CHANGE_EVENT, handleChange);
    };
  }, [projectId]);

  // Add a new note (automatically assigned to this project)
  const addNote = useCallback((body: string, title?: string): GlobalNote => {
    const now = new Date();
    const newNote: GlobalNote = {
      id: generateLocalId(),
      projectIds: [projectId], // Automatically assign to current project
      title: title?.trim() || undefined,
      body: body.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const allNotes = getStoredNotes();
    const updatedNotes = [newNote, ...allNotes];
    saveStoredNotes(updatedNotes);
    
    return newNote;
  }, [projectId]);

  // Update an existing note
  const updateNote = useCallback((noteId: string, updates: { title?: string; body?: string }): boolean => {
    const allNotes = getStoredNotes();
    const noteIndex = allNotes.findIndex(n => n.id === noteId);
    
    if (noteIndex === -1) return false;

    const updatedNote = {
      ...allNotes[noteIndex],
      ...(updates.title !== undefined && { title: updates.title.trim() || undefined }),
      ...(updates.body !== undefined && { body: updates.body }),
      updatedAt: new Date(),
    };

    allNotes[noteIndex] = updatedNote;
    saveStoredNotes(allNotes);

    return true;
  }, []);

  // Delete a note
  const deleteNote = useCallback((noteId: string): boolean => {
    const allNotes = getStoredNotes();
    const filtered = allNotes.filter(n => n.id !== noteId);
    
    if (filtered.length === allNotes.length) return false;

    saveStoredNotes(filtered);
    return true;
  }, []);

  // Remove note from this project only (doesn't delete globally)
  const removeFromProject = useCallback((noteId: string): boolean => {
    const allNotes = getStoredNotes();
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return false;

    note.projectIds = note.projectIds.filter(id => id !== projectId);
    note.updatedAt = new Date();
    saveStoredNotes(allNotes);
    return true;
  }, [projectId]);

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    removeFromProject,
  };
}
