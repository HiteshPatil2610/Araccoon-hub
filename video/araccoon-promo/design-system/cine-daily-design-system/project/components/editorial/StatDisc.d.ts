export interface StatDiscProps {
  /** Small tilted label, e.g. "Trailer" */
  label?: string;
  /** Big value, e.g. 1:47" */
  value?: React.ReactNode;
  /** light = white disc, accent = red, dark = ink, outline = hairline */
  tone?: 'light' | 'accent' | 'dark' | 'outline';
  size?: number;
  style?: React.CSSProperties;
}
export declare function StatDisc(props: StatDiscProps): JSX.Element;
