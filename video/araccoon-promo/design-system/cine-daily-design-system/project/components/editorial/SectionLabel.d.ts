export interface SectionLabelProps {
  children?: React.ReactNode;
  tone?: 'dark' | 'light';
  /** Show the small red disc marker */
  marker?: boolean;
  /** Append the trailing " ." the source uses */
  trail?: boolean;
  style?: React.CSSProperties;
}
export declare function SectionLabel(props: SectionLabelProps): JSX.Element;
