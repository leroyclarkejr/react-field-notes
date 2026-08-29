import { IconList, IconPointer, IconSquare, IconX } from '../icons';

type CaptureMode = 'tap' | 'region' | 'off';

interface FieldNotesToolbarProps {
  mode: CaptureMode;
  count: number;
  onModeChange: (mode: CaptureMode) => void;
  onShowList: () => void;
  onExit: () => void;
}

export function FieldNotesToolbar({ mode, count, onModeChange, onShowList, onExit }: FieldNotesToolbarProps) {
  return (
    <div className="rfn-root rfn-toolbar">
      <button
        type="button"
        data-active={mode === 'tap'}
        onClick={() => onModeChange(mode === 'tap' ? 'off' : 'tap')}
      >
        <IconPointer /> Tap
      </button>
      <button
        type="button"
        data-active={mode === 'region'}
        onClick={() => onModeChange(mode === 'region' ? 'off' : 'region')}
      >
        <IconSquare /> Region
      </button>
      <button type="button" aria-label="Show notes" onClick={onShowList}>
        <IconList />
        <span className="rfn-badge">{count}</span>
      </button>
      <button type="button" aria-label="Exit field notes" onClick={onExit}>
        <IconX /> Exit
      </button>
    </div>
  );
}
