import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { iconPaths, type IconName } from '@audixa/ui';

type TabBarIconProps = {
  name: IconName;
  color: string;
  size: number;
};

export function TabBarIcon({ name, color, size }: TabBarIconProps) {
  const pathData = iconPaths[name];

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d={pathData} />
    </Svg>
  );
}
