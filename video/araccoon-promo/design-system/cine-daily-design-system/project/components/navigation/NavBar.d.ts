/** @startingPoint section="Navigation" subtitle="Top bar — wordmark, dotted nav, circle icons" viewport="1280x220" */
export interface NavBarProps {
  tone?: 'dark' | 'light';
  items?: string[];
  /** Index of active item — marked with a small red diamond beneath */
  active?: number;
  onNavigate?: (index: number) => void;
  onMenu?: () => void;
  /** Optional raster logo; falls back to plain-type Wordmark */
  logoSrc?: string;
  style?: React.CSSProperties;
}
export declare function NavBar(props: NavBarProps): JSX.Element;
