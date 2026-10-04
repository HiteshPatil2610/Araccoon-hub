export interface HeadlineProps {
  /** mega (fluid poster title), xl 120, l 88, m 48, s 32, xs 24, 2xs 18 — or a raw px number */
  size?: 'mega' | 'xl' | 'l' | 'm' | 's' | 'xs' | '2xs' | number;
  tone?: 'dark' | 'light';
  /** Second-line grey (as in "EVERYTHING ABOUT THE FILM!") */
  muted?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'div' | 'span';
  align?: 'left' | 'center' | 'right';
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Headline(props: HeadlineProps): JSX.Element;
