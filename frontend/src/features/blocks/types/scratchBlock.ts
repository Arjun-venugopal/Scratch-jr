export type BlockCategory =
  | 'motion'
  | 'looks'
  | 'sound'
  | 'events'
  | 'control'
  | 'sensing'
  | 'operators'
  | 'variables'
  | 'messages'
  | 'myblocks';

export type BlockShape =
  | 'hat'
  | 'stack'
  | 'c-block'
  | 'cap'
  | 'reporter'
  | 'boolean';

export interface BlockInputDefinition {
  name: string;
  type: 'number' | 'text' | 'select' | 'color' | 'reporter';
  defaultValue: string | number;
  options?: { label: string; value: string }[];
}

export interface BlockDefinition {
  type: string;
  category: BlockCategory;
  shape: BlockShape;
  label: string; // e.g. "🏃 Move %1" or "🔁 Repeat %1"
  inputs?: BlockInputDefinition[];
  icon?: string;
  defaultSubstack?: boolean;
}

export interface ScratchBlockData {
  id: string;
  type: string;
  category: BlockCategory;
  shape: BlockShape;
  inputs: Record<string, string | number | ScratchBlockData>;
  parent: string | null;
  next: string | null;
  substack?: string | null;
  x?: number;
  y?: number;
}

export interface BlockDimensions {
  width: number;
  height: number;
  notchY?: number;
  cBranchY?: number;
  cBranchHeight?: number;
}

export type SnapType =
  | 'stack-below'
  | 'stack-above'
  | 'substack-inside'
  | 'input-slot';

export interface SnapTarget {
  targetBlockId: string;
  snapType: SnapType;
  inputName?: string;
  x: number;
  y: number;
  distance: number;
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}
