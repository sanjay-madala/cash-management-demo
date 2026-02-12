import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/formatters.js';

export default function AmountDisplay({ amount, className = '' }) {
  const { i18n } = useTranslation();
  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {formatCurrency(amount, i18n.language)}
    </span>
  );
}
