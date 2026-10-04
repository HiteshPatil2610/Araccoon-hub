export interface StickerBadgeProps {
  text?: string;
  /** Sticker artwork */
  src?: string;
  size?: number;
  /** Optional overlapping index bubble on the left ("03") */
  index?: number;
  spin?: boolean;
  style?: React.CSSProperties;
}
export declare function StickerBadge(props: StickerBadgeProps): JSX.Element;
