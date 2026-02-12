export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'brand' }) {
  const colorMap = {
    brand: 'bg-brand/10 text-brand',
    positive: 'bg-positive/10 text-positive',
    negative: 'bg-negative/10 text-negative',
    critical: 'bg-critical/10 text-critical',
    neutral: 'bg-neutral/10 text-neutral',
  };

  return (
    <div className="bg-bg-secondary rounded-lg border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">{title}</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-text-secondary">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color] || colorMap.brand}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
