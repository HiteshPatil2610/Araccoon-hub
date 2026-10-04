export interface IconButtonProps {
  /** Lucide icon name (ignored for variant="menu") */
  icon?: string;
  /** outline = hairline circle; menu = solid two-line hamburger; accent = red; muted = small grey social dot */
  variant?: 'outline' | 'menu' | 'accent' | 'muted';
  tone?: 'dark' | 'light';
  size?: number;
  label?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
