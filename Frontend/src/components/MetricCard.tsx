import React from 'react';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit: string;
  trend: number; // positive or negative percentage
  trendLabel?: string;
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, trend, trendLabel = '%', icon }) => {
  const isPositive = trend >= 0;
  // If it's a risk metric, a positive trend might be bad, but we'll stick to basic coloring for now:
  // Green for positive trend, Red for negative trend. (Or invert if 'Risk' is in title)
  const isRisk = title.toLowerCase().includes('risk');
  const colorClass = isRisk
    ? (isPositive ? 'text-red-400' : 'text-green-400')
    : (isPositive ? 'text-green-400' : 'text-red-400');

  const bgGlow = isRisk 
    ? (isPositive ? 'shadow-[0_0_15px_rgba(248,113,113,0.15)]' : 'shadow-[0_0_15px_rgba(74,222,128,0.15)]')
    : (isPositive ? 'shadow-[0_0_15px_rgba(74,222,128,0.15)]' : 'shadow-[0_0_15px_rgba(248,113,113,0.15)]');

  return (
    <div className={`
      relative p-4 rounded-xl 
      bg-white/5 border border-white/10 backdrop-blur-md
      hover:bg-white/10 transition-all duration-300 ease-out transform hover:-translate-y-1
      ${bgGlow}
    `}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-gray-400 text-sm font-medium tracking-wider">{title}</h3>
        {icon && <div className="text-gray-500">{icon}</div>}
      </div>
      
      <div className="flex items-baseline space-x-1 mb-1">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        <span className="text-gray-500 text-sm">{unit}</span>
      </div>

      <div className="flex items-center space-x-2">
        <div className={`flex items-center text-xs font-semibold ${colorClass} bg-black/20 px-2 py-1 rounded-md`}>
          {isPositive ? '↑' : '↓'} {Math.abs(trend)}{trendLabel}
        </div>
        <span className="text-gray-600 text-xs">vs last week</span>
      </div>
    </div>
  );
};
