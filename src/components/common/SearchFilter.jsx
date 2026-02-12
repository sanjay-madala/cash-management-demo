import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';

export default function SearchFilter({ searchTerm, onSearchChange, statusFilter, onStatusChange, statuses }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('common.search')}
          className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-bg-secondary focus:outline-none focus:border-brand transition-colors"
        />
      </div>
      {statuses && (
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-bg-secondary focus:outline-none focus:border-brand transition-colors"
        >
          <option value="all">{t('common.filter')} - All</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{t(`statuses.${s}`)}</option>
          ))}
        </select>
      )}
    </div>
  );
}
