import { useState, useEffect, useCallback } from 'react';
import { GlobalNote } from '@/types/notes';
import { generateLocalId } from '@/lib/localDb';
import { 
  getStoredNotes, 
  saveStoredNotes, 
  NOTES_CHANGE_EVENT 
} from './useNotesSync';

export function useGlobalNotes() {
  const [notes, setNotes] = useState<GlobalNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all notes and subscribe to changes
  useEffect(() => {
    const loadNotes = () => {
      const allNotes = getStoredNotes();
      setNotes(allNotes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
      setLoading(false);
    };

    loadNotes();

    // Listen for changes from other hook instances
    const handleChange = () => loadNotes();
    window.addEventListener(NOTES_CHANGE_EVENT, handleChange);
    
    return () => {
      window.removeEventListener(NOTES_CHANGE_EVENT, handleChange);
    };
  }, []);

  // Get notes for a specific project
  const getNotesForProject = useCallback((projectId: string): GlobalNote[] => {
    return notes.filter(n => n.projectIds.includes(projectId));
  }, [notes]);

  // Get unassigned notes
  const getUnassignedNotes = useCallback((): GlobalNote[] => {
    return notes.filter(n => n.projectIds.length === 0);
  }, [notes]);

  // Add a new note
  const addNote = useCallback((body: string, title?: string, projectIds?: string[]): GlobalNote => {
    const now = new Date();
    const newNote: GlobalNote = {
      id: generateLocalId(),
      projectIds: projectIds || [],
      title: title?.trim() || undefined,
      body: body.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const allNotes = getStoredNotes();
    const updatedNotes = [newNote, ...allNotes];
    saveStoredNotes(updatedNotes);
    
    return newNote;
  }, []);

  // Update an existing note
  const updateNote = useCallback((noteId: string, updates: { title?: string; body?: string; projectIds?: string[] }): boolean => {
    const allNotes = getStoredNotes();
    const noteIndex = allNotes.findIndex(n => n.id === noteId);
    
    if (noteIndex === -1) return false;

    const updatedNote: GlobalNote = {
      ...allNotes[noteIndex],
      ...(updates.title !== undefined && { title: updates.title.trim() || undefined }),
      ...(updates.body !== undefined && { body: updates.body }),
      ...(updates.projectIds !== undefined && { projectIds: updates.projectIds }),
      updatedAt: new Date(),
    };

    allNotes[noteIndex] = updatedNote;
    saveStoredNotes(allNotes);

    return true;
  }, []);

  // Assign note to a project
  const assignToProject = useCallback((noteId: string, projectId: string): boolean => {
    const allNotes = getStoredNotes();
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return false;

    if (!note.projectIds.includes(projectId)) {
      note.projectIds = [...note.projectIds, projectId];
      note.updatedAt = new Date();
      saveStoredNotes(allNotes);
    }
    return true;
  }, []);

  // Remove note from a project
  const removeFromProject = useCallback((noteId: string, projectId: string): boolean => {
    const allNotes = getStoredNotes();
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return false;

    note.projectIds = note.projectIds.filter(id => id !== projectId);
    note.updatedAt = new Date();
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

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    getNotesForProject,
    getUnassignedNotes,
    assignToProject,
    removeFromProject,
  };
}
