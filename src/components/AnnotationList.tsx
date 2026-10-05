import { useEffect, useRef, useState } from 'react';
import type { FieldNote } from '../types';
import { toMarkdown } from '../lib/fieldNotesStore';
import { IconCheck, IconCopy, IconTrash, IconX } from '../icons';

const COPY_FEEDBACK_MS = 2000;

type CopyStatus = 'idle' | 'copied' | 'failed';

interface NoteCopy {
  id: string;
  status: Exclude<CopyStatus, 'idle'>;
}

const NOTE_COPY_LABEL = {
  idle: 'Copy note',
  copied: 'Copied',
  failed: 'Copy failed, try again',
} as const;

interface AnnotationListProps {
  notes: FieldNote[];
  onDelete: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function AnnotationList({ notes, onDelete, onClear, onClose }: AnnotationListProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const resetTimer = useRef<number | undefined>(undefined);

  const [noteCopy, setNoteCopy] = useState<NoteCopy | null>(null);
  const noteResetTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(resetTimer.current);
      window.clearTimeout(noteResetTimer.current);
    },
    [],
  );

  const handleCopyNote = async (note: FieldNote) => {
    try {
      await navigator.clipboard.writeText(toMarkdown([note]));
      setNoteCopy({ id: note.id, status: 'copied' });
    } catch {
      setNoteCopy({ id: note.id, status: 'failed' });
    }
    window.clearTimeout(noteResetTimer.current);
    noteResetTimer.current = window.setTimeout(() => setNoteCopy(null), COPY_FEEDBACK_MS);
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(toMarkdown(notes));
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopyStatus('idle'), COPY_FEEDBACK_MS);
  };

  return (
    <div className="rfn-root rfn-list">
      <div className="rfn-list-header">
        <p className="rfn-list-title">Field Notes ({notes.length})</p>
        <button type="button" className="rfn-icon-btn" aria-label="Close list" onClick={onClose}>
          <IconX size={16} />
        </button>
      </div>

      <div className="rfn-list-toolbar">
        <button type="button" data-active="true" onClick={() => void handleCopyAll()} disabled={notes.length === 0}>
          {copyStatus === 'copied' ? (
            <>
              <IconCheck /> Copied!
            </>
          ) : copyStatus === 'failed' ? (
            'Copy failed — try again'
          ) : (
            'Copy all'
          )}
        </button>
        <button type="button" onClick={onClear} disabled={notes.length === 0}>
          Clear all
        </button>
      </div>

      <div className="rfn-notes">
        {notes.map((note) => {
          const status: CopyStatus = noteCopy?.id === note.id ? noteCopy.status : 'idle';
          return (
            <div key={note.id} className="rfn-note">
              <div>
                <div className="rfn-note-label">{note.target.label}</div>
                <div className="rfn-note-comment">{note.comment}</div>
                <div className="rfn-note-meta">
                  {note.route} · {note.target.domPath}
                </div>
              </div>
              <div className="rfn-note-actions">
                <button
                  type="button"
                  className="rfn-icon-btn"
                  aria-label={NOTE_COPY_LABEL[status]}
                  title={NOTE_COPY_LABEL[status]}
                  data-status={status}
                  onClick={() => void handleCopyNote(note)}
                >
                  {status === 'copied' ? <IconCheck size={16} /> : status === 'failed' ? <IconX size={16} /> : <IconCopy size={16} />}
                </button>
                <button
                  type="button"
                  className="rfn-icon-btn"
                  aria-label="Delete note"
                  onClick={() => onDelete(note.id)}
                >
                  <IconTrash size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
