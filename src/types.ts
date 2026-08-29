export type TargetMode = 'element' | 'region';

export interface CaptureRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RegionElementSummary {
  label: string;
  domPath: string;
  text?: string;
}

export interface FieldNoteTarget {
  label: string;
  domPath: string;
  rect: CaptureRect;
  text?: string;
  componentStack?: string;
  elementCount?: number;
  elements?: RegionElementSummary[];
}

export interface FieldNote {
  id: string;
  createdAt: number;
  route: string;
  mode: TargetMode;
  comment: string;
  target: FieldNoteTarget;
}
