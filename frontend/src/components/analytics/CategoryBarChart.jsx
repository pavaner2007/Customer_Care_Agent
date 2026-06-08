import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CategoryBarChart = ({ data = [] }) => {
  const chartData = data.filter(item => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col justify-center items-center min-h-[300px]">
        <h3 className="text-lg font-bold text-white mb-2">Complaint Categories</h3>
        <p className="text-slate-400 text-sm">No data available yet</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col min-h-[300px] hover:border-white/15 transition-all">
      <h3 className="text-lg font-bold text-white mb-4">Complaint Categories</h3>
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
            <Bar dataKey="value" fill="#818cf8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CategoryBarChart;
