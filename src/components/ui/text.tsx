import { Children } from 'react';
import { Text as RNText, type TextProps } from 'react-native';

import { toUpperCaseTr } from '@/lib/text';
import { type, type TypeVariant } from '@/theme';

type Props = TextProps & { variant?: TypeVariant; color?: string };

// Text with theme variants. `hand` (Caveat) is for one screen title only.
// `label` is always uppercase.
export function Text({ variant = 'body', color, style, children, ...rest }: Props) {
  const content =
    variant === 'label' ? Children.map(children, (c) => (typeof c === 'string' ? toUpperCaseTr(c) : c)) : children;
  return (
    <RNText {...rest} style={[type[variant], color ? { color } : null, style]}>
      {content}
    </RNText>
  );
}
