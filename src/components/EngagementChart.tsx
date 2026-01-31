import { useState, useEffect } from 'react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';

interface EngagementChartProps {
  data: Array<{
    date: string;
    engagements: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }>;
  defaultMetric?: 'engagements' | 'views' | 'likes' | 'comments' | 'shares';
  defaultRange?: '7d' | '30d' | '90d';
}

type MetricType = 'engagements' | 'views' | 'likes' | 'comments' | 'shares';
type RangeType = '7d' | '30d' | '90d';

export function EngagementChart({ data, defaultMetric = 'engagements', defaultRange = '30d' }: EngagementChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(defaultMetric);
  const [selectedRange, setSelectedRange] = useState<RangeType>(defaultRange);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getFilteredData = () => {
    const days = selectedRange === '7d' ? 7 : selectedRange === '30d' ? 30 : 90;
    return data.slice(-days);
  };

  const filteredData = getFilteredData();

  const getMetricColor = (metric: MetricType) => {
    const colors = {
      engagements: '#0ea5e9',
      views: '#8b5cf6',
      likes: '#ec4899',
      comments: '#f59e0b',
      shares: '#10b981'
    };
    return colors[metric];
  };

  const getMetricIcon = (metric: MetricType) => {
    const icons = {
      engagements: TrendingUp,
      views: Eye,
      likes: Heart,
      comments: MessageCircle,
      shares: Share2
    };
    return icons[metric];
  };

  const MetricIcon = getMetricIcon(selectedMetric);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0D0D0D] border border-white/[0.12] rounded-lg p-3 shadow-xl">
          <div className="text-xs text-slate-400 mb-1">{payload[0].payload.date}</div>
          <div className="text-base font-bold text-white">
            {payload[0].value.toLocaleString()}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-4 sm:p-6 overflow-hidden">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <MetricIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: getMetricColor(selectedMetric) }} />
          <h3 className="text-sm sm:text-base font-semibold text-white capitalize">{selectedMetric}</h3>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-hide">
          {/* Metric Toggle */}
          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1 flex-shrink-0">
            {(['engagements', 'views', 'likes', 'comments', 'shares'] as MetricType[]).map((metric) => {
              const Icon = getMetricIcon(metric);
              return (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    selectedMetric === metric
                      ? 'bg-white/[0.08] text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={metric}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
          {/* Range Toggle */}
          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1 flex-shrink-0">
            {(['7d', '30d', '90d'] as RangeType[]).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedRange === range
                    ? 'bg-white/[0.08] text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-64">
        {isMounted && (
          <ResponsiveContainer width="100%" height={256}>
            <LineChart data={filteredData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                tickLine={false}
                width={40}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return value.toString();
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke={getMetricColor(selectedMetric)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: getMetricColor(selectedMetric) }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 sm:mt-6 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">Total {selectedMetric}</div>
          <div className="text-lg sm:text-xl font-bold text-white break-words">
            {filteredData.reduce((sum, d) => sum + d[selectedMetric], 0).toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Average per day</div>
          <div className="text-lg sm:text-xl font-bold text-slate-300 break-words">
            {Math.round(filteredData.reduce((sum, d) => sum + d[selectedMetric], 0) / filteredData.length).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}