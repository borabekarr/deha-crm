import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface HeroChartProps {
  data: { x: string; y: number }[];
  height?: number;
  className?: string;
}

export function HeroChart({ data, height = 200, className }: HeroChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            {/* Liquid gradient stroke: emerald → white → emerald */}
            <linearGradient id="heroStrokeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>

            {/* Area fill: white at top → transparent at bottom */}
            <linearGradient id="heroAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>

            {/* Soft white drop shadow filter under the line */}
            <filter id="heroLineShadow" x="-10%" y="-10%" width="120%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#ffffff" floodOpacity={0.4} />
            </filter>
          </defs>

          {/* Suppress decorative elements */}
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
