import { useState, useEffect, useCallback } from 'react';
import { GlobalNote } from '@/types/notes';
import { generateLocalId } from '@/lib/localDb';

// Storage key for global notes in localStorage (shared with useGlobalNotes)
const NOTES_STORAGE_KEY = 'nimble_global_notes';

function getStoredNotes(): GlobalNote[] {
  try {
    const stored = localStorage.getItem(NOTES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((n: any) => ({
        ...n,
        projectIds: n.projectIds || (n.projectId ? [n.projectId] : []),
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

export function useProjectNotes(projectId: string) {
  const [notes, setNotes] = useState<GlobalNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notes for this project
  useEffect(() => {
    const allNotes = getStoredNotes();
    const projectNotes = allNotes.filter(n => n.projectIds.includes(projectId));
    setNotes(projectNotes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
    setLoading(false);
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
    
    setNotes(prev => [newNote, ...prev]);
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

    setNotes(prev => 
      prev.map(n => n.id === noteId ? { ...updatedNote, createdAt: new Date(updatedNote.createdAt), updatedAt: new Date(updatedNote.updatedAt) } : n)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    );
    return true;
  }, []);

  // Delete a note
  const deleteNote = useCallback((noteId: string): boolean => {
    const allNotes = getStoredNotes();
    const filtered = allNotes.filter(n => n.id !== noteId);
    
    if (filtered.length === allNotes.length) return false;

    saveStoredNotes(filtered);
    setNotes(prev => prev.filter(n => n.id !== noteId));
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
    setNotes(prev => prev.filter(n => n.id !== noteId));
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
