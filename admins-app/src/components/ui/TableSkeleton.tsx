import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="w-full animate-pulse divide-y divide-slate-800">
      {/* Header Skeleton */}
      <div className="bg-slate-950/60 p-4 flex gap-4 border-b border-slate-800">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-800 rounded flex-1" />
        ))}
      </div>

      {/* Row Skeletons */}
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="p-4 flex items-center gap-4">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <div
              key={cIdx}
              className={`h-4 bg-slate-800/60 rounded ${
                cIdx === 0 ? 'w-1/3' : cIdx === columns - 1 ? 'w-16 ml-auto' : 'flex-1'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
