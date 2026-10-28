export type TargetMode = 'element' | 'region';

export type CaptureMode = 'tap' | 'region' | 'code' | 'off';

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

export interface FieldNoteSource {
  filePath: string;
  lineNumber?: number;
  componentName?: string;
}

export interface FieldNoteTarget {
  label: string;
  domPath: string;
  rect: CaptureRect;
  text?: string;
  componentStack?: string;
  source?: FieldNoteSource;
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
