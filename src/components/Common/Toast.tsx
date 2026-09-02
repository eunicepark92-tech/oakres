import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const iconMap = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-amber-400 shrink-0" />,
  };

  const bgMap = {
    success: 'bg-emerald-950/90 border-emerald-700/60 text-emerald-100',
    error: 'bg-rose-950/90 border-rose-700/60 text-rose-100',
    info: 'bg-slate-900/90 border-slate-700 text-slate-100',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-fade-in shadow-xl">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md ${bgMap[toast.type]}`}>
        {iconMap[toast.type]}
        <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
      </div>
    </div>
  );
};
