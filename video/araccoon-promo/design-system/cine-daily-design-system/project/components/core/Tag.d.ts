export interface TagProps {
  children?: React.ReactNode;
  tone?: 'dark' | 'light';
  /** Filled state */
  active?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function Tag(props: TagProps): JSX.Element;
