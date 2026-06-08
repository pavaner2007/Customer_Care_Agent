import React from 'react';

const StatCard = ({ title, value, icon: Icon, colorClass = 'text-sky-400', bgClass = 'bg-sky-500/10' }) => {
  return (
    <div className="glass rounded-2xl p-5 border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-black text-white group-hover:scale-105 transition-transform origin-left duration-300">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${bgClass} border border-white/5 transition-transform duration-300 group-hover:rotate-6`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/5 group-hover:bg-gradient-to-r from-transparent via-white/15 to-transparent transition-all duration-500"></div>
    </div>
  );
};

export default StatCard;
