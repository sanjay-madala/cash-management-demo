import { useTranslation } from 'react-i18next';
import { getStatusColor } from '../../utils/helpers.js';

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const colorClass = getStatusColor(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
      {t(`statuses.${status}`)}
    </span>
  );
}
