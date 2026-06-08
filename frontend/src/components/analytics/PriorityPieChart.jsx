import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#10b981'
};

const PriorityPieChart = ({ data = [] }) => {
  const chartData = data.filter(item => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col justify-center items-center min-h-[300px]">
        <h3 className="text-lg font-bold text-white mb-2">Priority Distribution</h3>
        <p className="text-slate-400 text-sm">No data available yet</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col min-h-[300px] hover:border-white/15 transition-all">
      <h3 className="text-lg font-bold text-white mb-4">Priority Distribution</h3>
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#38bdf8'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'rgba(7, 11, 22, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}
              itemStyle={{ color: 'white' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriorityPieChart;
