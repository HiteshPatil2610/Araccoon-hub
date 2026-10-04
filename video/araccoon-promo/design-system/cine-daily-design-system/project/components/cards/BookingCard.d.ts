/** @startingPoint section="Cards" subtitle="Dark ticket card — map, cinema, date, time, Book Now" viewport="700x420" */
export interface BookingCardProps {
  kicker?: string;
  title?: string;
  cinema?: string;
  date?: string;
  time?: string;
  /** Optional map image for the map tile; otherwise a dark hatch placeholder */
  mapSrc?: string;
  onBook?: () => void;
  onMap?: () => void;
  style?: React.CSSProperties;
}
export declare function BookingCard(props: BookingCardProps): JSX.Element;
