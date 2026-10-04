/** @startingPoint section="Core" subtitle="Pill CTA — outline, solid red, ticket bar" viewport="700x260" */
export interface ButtonProps {
  /** outline = pill hairline (Book Now ↗); solid = red pill; bar = full-width red ticket bar; ghost = text */
  variant?: 'outline' | 'solid' | 'bar' | 'ghost';
  /** Background the button sits on */
  tone?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  /** Lucide icon name for trailing glyph; null to hide */
  icon?: string | null;
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}
export declare function Button(props: ButtonProps): JSX.Element;
