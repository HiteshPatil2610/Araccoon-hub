export interface IndexBadgeProps {
  /** Number — rendered zero-padded ("02") */
  n?: number;
  tone?: 'dark' | 'light';
  size?: number;
  style?: React.CSSProperties;
}
export declare function IndexBadge(props: IndexBadgeProps): JSX.Element;
