export interface RatingProps {
  value?: number;
  max?: number;
  size?: number;
  tone?: 'dark' | 'light';
  style?: React.CSSProperties;
}
export declare function Rating(props: RatingProps): JSX.Element;
