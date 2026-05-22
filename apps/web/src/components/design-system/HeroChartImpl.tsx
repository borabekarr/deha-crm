import * as React from 'react';

export interface HeroChartImplProps {
  data: { x: string; y: number }[];
  height?: number;
  className?: string;
}

const LazyChart = React.lazy(async () => {
  const {
    AreaChart,
    Area,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
  } = await import('recharts');

  function ChartImpl({ data, height = 200, className }: HeroChartImplProps) {
    return (
      <div className={className}>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={data}
            margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="heroStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6EE7B7" />
                <stop offset="50%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>

              <linearGradient id="heroAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>

              <filter id="heroLineShadow" x="-10%" y="-10%" width="120%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#ffffff" floodOpacity={0.4} />
              </filter>
            </defs>

            <CartesianGrid horizontal={false} vertical={false} />
            <XAxis dataKey="x" hide />
            <YAxis hide />
            <Tooltip active={false} content={<></>} />

            <Area
              type="monotone"
              dataKey="y"
              stroke="url(#heroStrokeGradient)"
              strokeWidth={2.5}
              fill="url(#heroAreaFill)"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              style={{ filter: 'url(#heroLineShadow)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return { default: ChartImpl };
});

export default function HeroChartImpl(props: HeroChartImplProps) {
  return (
    <React.Suspense fallback={<div style={{ height: props.height ?? 200 }} className={props.className} />}>
      <LazyChart {...props} />
    </React.Suspense>
  );
}
