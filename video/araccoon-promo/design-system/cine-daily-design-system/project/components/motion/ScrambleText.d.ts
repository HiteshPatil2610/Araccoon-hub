export interface ScrambleTextProps {
  /** Final text */
  text?: string;
  duration?: number;
  delay?: number;
  /** Characters cycled through while decoding */
  charset?: string;
  once?: boolean;
  threshold?: number;
  replayKey?: string | number;
  as?: 'span' | 'div';
  style?: React.CSSProperties;
}
export declare function ScrambleText(props: ScrambleTextProps): JSX.Element;
