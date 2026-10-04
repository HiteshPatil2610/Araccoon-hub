import React from 'react';
export function Icon({ name = 'arrow-up-right', size = 18, color = 'currentColor', style }) {
  const url = `https://unpkg.com/lucide-static@0.452.0/icons/${name}.svg`;
  return <span aria-hidden="true" style={{ display: 'inline-block', flex: 'none', width: size, height: size, background: color, WebkitMask: `url(${url}) center/contain no-repeat`, mask: `url(${url}) center/contain no-repeat`, ...style }} />;
}
