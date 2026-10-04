export interface FilmStripProps {
  /** Rotation in degrees */
  tilt?: number;
  holes?: number;
  height?: number;
  /** red band with black perforations, or dark band with light perforations */
  tone?: 'red' | 'dark';
  style?: React.CSSProperties;
}
export declare function FilmStrip(props: FilmStripProps): JSX.Element;
