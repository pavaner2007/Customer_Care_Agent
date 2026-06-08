import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';

const COLORS = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#10b981'
};

const ChurnRiskChart = ({ data = [] }) => {
  const chartData = data.filter(item => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col justify-center items-center min-h-[300px]">
        <h3 className="text-lg font-bold text-white mb-2">Churn Risk Distribution</h3>
        <p className="text-slate-400 text-sm">No data available yet</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col min-h-[300px] hover:border-white/15 transition-all">
      <h3 className="text-lg font-bold text-white mb-4">Churn Risk Distribution</h3>
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: 'rgba(7, 11, 22, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}
              itemStyle={{ color: 'white' }}
              cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#38bdf8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChurnRiskChart;
