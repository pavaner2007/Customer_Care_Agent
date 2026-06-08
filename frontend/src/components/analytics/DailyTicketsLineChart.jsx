import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DailyTicketsLineChart = ({ data = [] }) => {
  if (data.length === 0) {
    return (
      <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col justify-center items-center min-h-[300px]">
        <h3 className="text-lg font-bold text-white mb-2">Daily Ticket Trend</h3>
        <p className="text-slate-400 text-sm">No trend data available yet</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col min-h-[300px] hover:border-white/15 transition-all">
      <h3 className="text-lg font-bold text-white mb-4">Daily Ticket Trend</h3>
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: 'rgba(7, 11, 22, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}
              itemStyle={{ color: 'white' }}
            />
            <Area type="monotone" dataKey="tickets" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorTickets)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DailyTicketsLineChart;
