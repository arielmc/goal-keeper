import { useState, useCallback, useEffect } from 'react';
import type { Clip, ClipCategory } from '../types/clips';
import { DEFAULT_CATEGORIES } from '../types/clips';
import { generateId } from '../utils/storage';

const CLIPS_KEY = 'goalkeeper_clips';
const CATEGORIES_KEY = 'goalkeeper_clip_categories';

function loadClips(): Clip[] {
  try {
    const data = localStorage.getItem(CLIPS_KEY);
    if (data) {
      return JSON.parse(data).map((c: Clip) => ({
        ...c,
        createdAt: new Date(c.createdAt),
      }));
    }
  } catch {
    // Fall through
  }
  return [];
}

function saveClips(clips: Clip[]): void {
  localStorage.setItem(CLIPS_KEY, JSON.stringify(clips));
}

function loadCategories(): ClipCategory[] {
  try {
    const data = localStorage.getItem(CATEGORIES_KEY);
    if (data) {
      return JSON.parse(data).map((c: ClipCategory) => ({
        ...c,
        createdAt: new Date(c.createdAt),
      }));
    }
  } catch {
    // Fall through
  }
  return DEFAULT_CATEGORIES;
}

function saveCategories(categories: ClipCategory[]): void {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function useClipCollections() {
  const [clips, setClips] = useState<Clip[]>(() => loadClips());
  const [categories, setCategories] = useState<ClipCategory[]>(() => loadCategories());

  // Persist on change
  useEffect(() => {
    saveClips(clips);
  }, [clips]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  // Add a new clip to a category
  const addClip = useCallback((
    text: string,
    categoryId: string,
    sourceMessageId?: string,
    note?: string
  ) => {
    const clip: Clip = {
      id: generateId(),
      text: text.slice(0, 500), // Limit length
      categoryId,
      sourceMessageId,
      note,
      createdAt: new Date(),
    };

    setClips(prev => [clip, ...prev]);
    return clip;
  }, []);

  // Remove a clip
  const removeClip = useCallback((clipId: string) => {
    setClips(prev => prev.filter(c => c.id !== clipId));
  }, []);

  // Update clip note
  const updateClipNote = useCallback((clipId: string, note: string) => {
    setClips(prev => prev.map(c =>
      c.id === clipId ? { ...c, note } : c
    ));
  }, []);

  // Move clip to different category
  const moveClip = useCallback((clipId: string, newCategoryId: string) => {
    setClips(prev => prev.map(c =>
      c.id === clipId ? { ...c, categoryId: newCategoryId } : c
    ));
  }, []);

  // Add a new category
  const addCategory = useCallback((name: string, emoji: string, color: string) => {
    const category: ClipCategory = {
      id: generateId(),
      name,
      emoji,
      color,
      createdAt: new Date(),
    };

    setCategories(prev => [...prev, category]);
    return category;
  }, []);

  // Remove a category (moves clips to 'ideas')
  const removeCategory = useCallback((categoryId: string) => {
    // Don't allow removing default categories
    if (DEFAULT_CATEGORIES.some(c => c.id === categoryId)) return;

    // Move clips to 'ideas' category
    setClips(prev => prev.map(c =>
      c.categoryId === categoryId ? { ...c, categoryId: 'ideas' } : c
    ));

    setCategories(prev => prev.filter(c => c.id !== categoryId));
  }, []);

  // Update category
  const updateCategory = useCallback((
    categoryId: string,
    updates: Partial<Pick<ClipCategory, 'name' | 'emoji' | 'color'>>
  ) => {
    setCategories(prev => prev.map(c =>
      c.id === categoryId ? { ...c, ...updates } : c
    ));
  }, []);

  // Get clips for a specific category
  const getClipsByCategory = useCallback((categoryId: string) => {
    return clips.filter(c => c.categoryId === categoryId);
  }, [clips]);

  // Get category by ID
  const getCategory = useCallback((categoryId: string) => {
    return categories.find(c => c.id === categoryId);
  }, [categories]);

  // Get clip counts per category
  const getCategoryCounts = useCallback(() => {
    const counts: Record<string, number> = {};
    clips.forEach(c => {
      counts[c.categoryId] = (counts[c.categoryId] || 0) + 1;
    });
    return counts;
  }, [clips]);

  return {
    clips,
    categories,
    addClip,
    removeClip,
    updateClipNote,
    moveClip,
    addCategory,
    removeCategory,
    updateCategory,
    getClipsByCategory,
    getCategory,
    getCategoryCounts,
  };
}
