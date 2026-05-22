import * as React from 'react';

const HeroChartImpl = React.lazy(() => import('./HeroChartImpl'));

export interface HeroChartProps {
  data: { x: string; y: number }[];
  height?: number;
  className?: string;
}

export function HeroChart({ data, height = 200, className }: HeroChartProps) {
  return (
    <React.Suspense fallback={<div style={{ height }} className={className} />}>
      <HeroChartImpl data={data} height={height} className={className} />
    </React.Suspense>
  );
}
