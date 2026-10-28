import { useState } from 'react';
import type { FieldNoteSource, FieldNoteTarget } from '../types';
import { formatSource } from '../lib/elementContext';
import { IconCode } from '../icons';

interface AnnotationComposerProps {
  target: FieldNoteTarget;
  onSave: (comment: string) => void;
  onCancel: () => void;
  onOpenSource?: (source: FieldNoteSource) => void;
}

export function AnnotationComposer({ target, onSave, onCancel, onOpenSource }: AnnotationComposerProps) {
  const [comment, setComment] = useState('');
  const { source } = target;

  return (
    <div className="rfn-root rfn-composer">
      <p className="rfn-composer-label">{target.label}</p>
      {source && onOpenSource && (
        <div className="rfn-source">
          <span className="rfn-source-path">{formatSource(source)}</span>
          <button
            type="button"
            className="rfn-icon-btn"
            aria-label="Open in editor"
            title="Open in editor"
            onClick={() => onOpenSource(source)}
          >
            <IconCode size={16} />
          </button>
        </div>
      )}
      <textarea
        autoFocus
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="What do you want to change here?"
        rows={3}
      />
      <div className="rfn-actions">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          data-active="true"
          onClick={() => onSave(comment)}
          disabled={comment.trim().length === 0}
        >
          Save
        </button>
      </div>
    </div>
  );
}
