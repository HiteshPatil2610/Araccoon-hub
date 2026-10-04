export interface AvatarStackItem { name?: string; src?: string; color?: string; /** default true: photos are greyscale */ mono?: boolean; }
export interface AvatarStackProps {
  items?: AvatarStackItem[];
  size?: number;
  gap?: number;
  style?: React.CSSProperties;
}
export declare function AvatarStack(props: AvatarStackProps): JSX.Element;
