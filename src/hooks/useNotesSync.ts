// Shared notes event system for bidirectional sync between
// Global Notepad and Project Notes views

import { GlobalNote } from '@/types/notes';

// Custom event type for notes changes
export const NOTES_CHANGE_EVENT = 'nimble-notes-changed';

// Storage key (single source of truth)
export const NOTES_STORAGE_KEY = 'nimble_global_notes';

// Parse stored notes with proper Date objects
export function parseStoredNotes(stored: string): GlobalNote[] {
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((n: any) => ({
      ...n,
      projectIds: n.projectIds || (n.projectId ? [n.projectId] : []),
      createdAt: new Date(n.createdAt),
      updatedAt: new Date(n.updatedAt),
    }));
  } catch (error) {
    console.error('Error parsing notes:', error);
    return [];
  }
}

// Get all notes from storage
export function getStoredNotes(): GlobalNote[] {
  try {
    const stored = localStorage.getItem(NOTES_STORAGE_KEY);
    if (stored) {
      return parseStoredNotes(stored);
    }
  } catch (error) {
    console.error('Error reading notes:', error);
  }
  return [];
}

// Save notes and emit change event for other hooks to sync
export function saveStoredNotes(notes: GlobalNote[]): void {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    // Emit event so other hook instances can update
    window.dispatchEvent(new CustomEvent(NOTES_CHANGE_EVENT));
  } catch (error) {
    console.error('Error saving notes:', error);
  }
}
