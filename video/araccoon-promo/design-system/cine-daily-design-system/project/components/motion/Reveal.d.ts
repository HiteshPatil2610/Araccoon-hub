export interface RevealProps {
  /** Entrance effect */
  effect?: 'fade' | 'rise' | 'drop' | 'slide-left' | 'slide-right' | 'pop' | 'spin' | 'blur' | 'mask' | 'wipe-x';
  /** ms before the entrance starts (use the CUE tables in readme) */
  delay?: number;
  /** ms — default 900 (--dur-reveal is 1100) */
  duration?: number;
  /** px travelled by rise/drop/slide effects */
  distance?: number;
  /** Extra rotation (deg) in the hidden state — e.g. 12 for a card that swings in */
  rotate?: number;
  /** Resting rotation (deg) once revealed */
  restRotate?: number;
  /** Play only the first time it enters the viewport (default false: replays on re-entry) */
  once?: boolean;
  /** Fraction visible before playing */
  threshold?: number;
  /** Change to force a replay (e.g. carousel slide index) */
  replayKey?: string | number;
  as?: 'div' | 'span' | 'section' | 'li';
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function Reveal(props: RevealProps): JSX.Element;
