import { useState, useEffect, useCallback } from 'react';
import { ProjectNote } from '@/types/notes';
import { getDb, generateLocalId } from '@/lib/localDb';

// Storage key prefix for notes in localStorage (simple, reliable)
const NOTES_STORAGE_KEY = 'nimble_project_notes';

function getStoredNotes(): ProjectNote[] {
  try {
    const stored = localStorage.getItem(NOTES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt),
        updatedAt: new Date(n.updatedAt),
      }));
    }
  } catch (error) {
    console.error('Error reading notes:', error);
  }
  return [];
}

function saveStoredNotes(notes: ProjectNote[]): void {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error('Error saving notes:', error);
  }
}

export function useProjectNotes(projectId: string) {
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notes for this project
  useEffect(() => {
    const allNotes = getStoredNotes();
    const projectNotes = allNotes.filter(n => n.projectId === projectId);
    setNotes(projectNotes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
    setLoading(false);
  }, [projectId]);

  // Add a new note
  const addNote = useCallback((body: string, title?: string): ProjectNote => {
    const now = new Date();
    const newNote: ProjectNote = {
      id: generateLocalId(),
      projectId,
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

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
  };
}
