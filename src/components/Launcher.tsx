import { IconSquarePen } from '../icons';

export type LauncherPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

interface LauncherProps {
  position: LauncherPosition;
  onClick: () => void;
}

export function Launcher({ position, onClick }: LauncherProps) {
  return (
    <div className={`rfn-root rfn-launcher rfn-launcher--${position}`}>
      <button type="button" aria-label="Open field notes" onClick={onClick}>
        <IconSquarePen size={18} />
      </button>
    </div>
  );
}
