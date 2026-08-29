import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { FieldNote, FieldNoteTarget, TargetMode } from './types';
import { DEFAULT_STORAGE_KEY, loadNotes, persistNotes, toMarkdown } from './lib/fieldNotesStore';

interface DraftSelection {
  mode: TargetMode;
  target: FieldNoteTarget;
}

type CaptureMode = 'tap' | 'region' | 'off';

interface FieldNotesContextValue {
  active: boolean;
  mode: CaptureMode;
  notes: FieldNote[];
  draft: DraftSelection | null;
  showList: boolean;
  registerLogoTap: () => void;
  toggle: () => void;
  registerTap: (tapCount?: number) => void;
  setMode: (mode: CaptureMode) => void;
  setShowList: (value: boolean) => void;
  beginDraft: (draft: DraftSelection) => void;
  cancelDraft: () => void;
  commitDraft: (comment: string) => void;
  deleteNote: (id: string) => void;
  clearAll: () => void;
  exportMarkdown: () => string;
  exit: () => void;
}

interface FieldNotesProviderProps {
  enabled: boolean;
  storageKey?: string;
  tapCount?: number;
  tapWindowMs?: number;
  children: React.ReactNode;
}

const NOOP_VALUE: FieldNotesContextValue = {
  active: false,
  mode: 'off',
  notes: [],
  draft: null,
  showList: false,
  registerLogoTap: () => {},
  toggle: () => {},
  registerTap: () => {},
  setMode: () => {},
  setShowList: () => {},
  beginDraft: () => {},
  cancelDraft: () => {},
  commitDraft: () => {},
  deleteNote: () => {},
  clearAll: () => {},
  exportMarkdown: () => '',
  exit: () => {},
};

const FieldNotesContext = createContext<FieldNotesContextValue | null>(null);

export function useFieldNotes(): FieldNotesContextValue {
  return useContext(FieldNotesContext) ?? NOOP_VALUE;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export function FieldNotesProvider({
  enabled,
  storageKey = DEFAULT_STORAGE_KEY,
  tapCount = 7,
  tapWindowMs = 3000,
  children,
}: FieldNotesProviderProps) {
  const [active, setActive] = useState(false);
  const [mode, setMode] = useState<CaptureMode>('off');
  const [showList, setShowList] = useState(false);
  const [draft, setDraft] = useState<DraftSelection | null>(null);
  const [notes, setNotes] = useState<FieldNote[]>(() => (enabled ? loadNotes(storageKey) : []));
  const tapsRef = useRef<number[]>([]);

  useEffect(() => {
    if (enabled) persistNotes(storageKey, notes);
  }, [enabled, storageKey, notes]);

  // When the overlay deactivates, drop back to navigate mode so the next
  // activation starts without a capture layer blocking the app.
  useEffect(() => {
    if (!active) setMode('off');
  }, [active]);

  const registerTap = useCallback(
    (overrideCount?: number) => {
      if (!enabled) return;
      const required = overrideCount && overrideCount > 0 ? overrideCount : tapCount;
      const now = Date.now();
      tapsRef.current = [...tapsRef.current.filter((t) => now - t < tapWindowMs), now];
      if (tapsRef.current.length >= required) {
        tapsRef.current = [];
        setActive((current) => !current);
      }
    },
    [enabled, tapCount, tapWindowMs],
  );

  const registerLogoTap = useCallback(() => registerTap(), [registerTap]);

  const toggle = useCallback(() => {
    if (!enabled) return;
    tapsRef.current = [];
    setActive((current) => !current);
  }, [enabled]);

  const beginDraft = useCallback((next: DraftSelection) => setDraft(next), []);
  const cancelDraft = useCallback(() => setDraft(null), []);

  const commitDraft = useCallback(
    (comment: string) => {
      if (!draft) return;
      const note: FieldNote = {
        id: newId(),
        createdAt: Date.now(),
        route: `${window.location.pathname}${window.location.search}`,
        mode: draft.mode,
        comment,
        target: draft.target,
      };
      setNotes((prev) => [...prev, note]);
      setDraft(null);
    },
    [draft],
  );

  const deleteNote = useCallback((id: string) => setNotes((prev) => prev.filter((n) => n.id !== id)), []);
  const clearAll = useCallback(() => setNotes([]), []);
  const exportMarkdown = useCallback(() => toMarkdown(notes), [notes]);

  const exit = useCallback(() => {
    setActive(false);
    setDraft(null);
    setShowList(false);
  }, []);

  const value = useMemo<FieldNotesContextValue>(
    () => ({
      active,
      mode,
      notes,
      draft,
      showList,
      registerLogoTap,
      toggle,
      registerTap,
      setMode,
      setShowList,
      beginDraft,
      cancelDraft,
      commitDraft,
      deleteNote,
      clearAll,
      exportMarkdown,
      exit,
    }),
    [active, mode, notes, draft, showList, registerLogoTap, toggle, registerTap, beginDraft, cancelDraft, commitDraft, deleteNote, clearAll, exportMarkdown, exit],
  );

  return <FieldNotesContext.Provider value={value}>{children}</FieldNotesContext.Provider>;
}
