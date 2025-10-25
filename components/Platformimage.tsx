import React from 'react';
import { Platform, Image as RNImage, ImageProps as RNImageProps, View, StyleProp, ImageStyle } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

type Props = {
  uri: string;
  style?: StyleProp<ImageStyle>;
  alt?: string;
  resizeMode?: any;
} & Partial<RNImageProps>;

export default function PlatformImage({ uri, style, alt, resizeMode, ...rest }: Props) {
  // Web: use native <img> for best cross-origin behavior
  if (Platform.OS === 'web') {
    // render vanilla HTML img so browser image loading is used (avoids fetch/CORS problems)
    // Add crossOrigin/referrerPolicy — helps when providers block referer
    return (
      // @ts-ignore - this will render to <img /> in web
      <img
        src={uri}
        alt={alt ?? ''}
        style={Array.isArray(style) ? Object.assign({}, ...style) : (style as any) ?? { display: 'block', maxWidth: '100%' }}
        // try hiding referrer if provider blocks referrer info (optional)
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        loading="lazy"
        {...(rest as any)}
      />
    );
  }

  // Native (iOS/Android): use expo-image for caching/perf
  return <ExpoImage source={{ uri }} contentFit={resizeMode ?? 'cover'} style={style as any} {...(rest as any)} />;
}
