export interface TrackingRevealProps {
  /** Starting letter-spacing (wide) */
  from?: string;
  /** Resting letter-spacing — defaults to the display token */
  to?: string;
  /** Starting opacity — the source fades titles up from grey */
  fromOpacity?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
  threshold?: number;
  replayKey?: string | number;
  as?: 'div' | 'span' | 'h1' | 'h2';
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function TrackingReveal(props: TrackingRevealProps): JSX.Element;
