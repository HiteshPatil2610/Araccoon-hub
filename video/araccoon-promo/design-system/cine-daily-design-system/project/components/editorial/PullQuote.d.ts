export interface PullQuoteProps {
  children?: React.ReactNode;
  tone?: 'dark' | 'light';
  /** Trailing highlighted phrase (rendered in a tinted capsule) */
  highlight?: string;
  /** Show the red ↗ link arrow */
  link?: boolean;
  style?: React.CSSProperties;
}
export declare function PullQuote(props: PullQuoteProps): JSX.Element;
