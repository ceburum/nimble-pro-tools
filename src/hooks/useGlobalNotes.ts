import { useState, useEffect, useCallback } from 'react';
import { GlobalNote } from '@/types/notes';
import { generateLocalId } from '@/lib/localDb';

// Storage key for global notes in localStorage
const NOTES_STORAGE_KEY = 'nimble_global_notes';

function getStoredNotes(): GlobalNote[] {
  try {
    const stored = localStorage.getItem(NOTES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((n: any) => ({
        ...n,
        projectIds: n.projectIds || (n.projectId ? [n.projectId] : []), // Migration from old format
        createdAt: new Date(n.createdAt),
        updatedAt: new Date(n.updatedAt),
      }));
    }
  } catch (error) {
    console.error('Error reading notes:', error);
  }
  return [];
}

function saveStoredNotes(notes: GlobalNote[]): void {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error('Error saving notes:', error);
  }
}

export function useGlobalNotes() {
  const [notes, setNotes] = useState<GlobalNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all notes
  useEffect(() => {
    const allNotes = getStoredNotes();
    setNotes(allNotes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
    setLoading(false);
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
    
    setNotes(updatedNotes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
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

    setNotes(allNotes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
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
      setNotes([...allNotes].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
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
    setNotes([...allNotes].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
    return true;
  }, []);

  // Delete a note
  const deleteNote = useCallback((noteId: string): boolean => {
    const allNotes = getStoredNotes();
    const filtered = allNotes.filter(n => n.id !== noteId);
    
    if (filtered.length === allNotes.length) return false;

    saveStoredNotes(filtered);
    setNotes(filtered);
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
