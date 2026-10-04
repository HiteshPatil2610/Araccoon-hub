export interface MediaFrameProps {
  src?: string;
  /** rect (4px radius), chamfer (clipped opposite corners), circle */
  shape?: 'rect' | 'chamfer' | 'circle';
  width?: number | string;
  height?: number | string;
  /** Chamfer size in px */
  cut?: number;
  /** Placeholder caption when no src */
  label?: string;
  radius?: number;
  /** Red multiply wash for red-graded stills */
  tint?: boolean;
  style?: React.CSSProperties;
}
export declare function MediaFrame(props: MediaFrameProps): JSX.Element;
