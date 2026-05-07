import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';

interface ChartCardProps {
  title: string;
  subtitle: string;
  option: EChartsOption;
  height?: number;
}

export function ChartCard({ title, subtitle, option, height = 260 }: ChartCardProps) {
  return (
    <section className="chart-card">
      <header>
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </header>
      <ReactECharts option={option} notMerge lazyUpdate style={{ height, width: '100%' }} />
    </section>
  );
}
