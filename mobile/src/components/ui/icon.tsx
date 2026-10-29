import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

// Same icon set as design/shared.js (24x24, 2px stroke, round caps).
const paths = {
  nb: (
    <>
      <Rect x="5" y="3" width="14" height="18" rx="2" />
      <Path d="M9 3v18M12.5 8h3.5M12.5 12h3.5" />
    </>
  ),
  book: (
    <>
      <Path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
      <Path d="M4 21V5" />
    </>
  ),
  cal: (
    <>
      <Rect x="3" y="5" width="18" height="16" rx="3" />
      <Path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  plus: <Path d="M12 5v14M5 12h14" />,
  back: <Path d="M15 5l-7 7 7 7" />,
  brush: (
    <>
      <Path d="M14 4l6 6-8 8-6-6z" />
      <Path d="M6 12l-2 6 6-2" />
    </>
  ),
  share: (
    <>
      <Path d="M12 3v12M7 8l5-5 5 5" />
      <Path d="M5 13v6h14v-6" />
    </>
  ),
  img: (
    <>
      <Rect x="3" y="4" width="18" height="16" rx="3" />
      <Circle cx="9" cy="10" r="2" />
      <Path d="M21 16l-5-5-9 9" />
    </>
  ),
  redo: <Path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5" />,
  more: (
    <>
      <Circle cx="5" cy="12" r="1" />
      <Circle cx="12" cy="12" r="1" />
      <Circle cx="19" cy="12" r="1" />
    </>
  ),
  dl: <Path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  chat: <Path d="M4 5h16v11H9l-5 4z" />,
  x: <Path d="M6 6l12 12M18 6L6 18" />,
  check: <Path d="M5 12l5 5 9-10" />,
  me: (
    <>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
    </>
  ),
};

export type IconName = keyof typeof paths;

type Props = { name: IconName; size?: number; color?: string; strokeWidth?: number; opacity?: number };

export function Icon({ name, size = 24, color = colors.ink, strokeWidth = 2, opacity }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}>
      {paths[name]}
    </Svg>
  );
}
