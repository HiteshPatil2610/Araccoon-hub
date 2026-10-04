export interface SlideIndexProps {
  count?: number;
  active?: number;
  onChange?: (index: number) => void;
  tone?: 'dark' | 'light';
  /** Spread numbers across the full width (source layout) */
  spread?: boolean;
  style?: React.CSSProperties;
}
export declare function SlideIndex(props: SlideIndexProps): JSX.Element;
