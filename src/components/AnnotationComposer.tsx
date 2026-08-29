import { useState } from 'react';
import type { FieldNoteTarget } from '../types';

interface AnnotationComposerProps {
  target: FieldNoteTarget;
  onSave: (comment: string) => void;
  onCancel: () => void;
}

export function AnnotationComposer({ target, onSave, onCancel }: AnnotationComposerProps) {
  const [comment, setComment] = useState('');

  return (
    <div className="rfn-root rfn-composer">
      <p className="rfn-composer-label">{target.label}</p>
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
