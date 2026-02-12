import { useTranslation } from 'react-i18next';
import { Check, X, CornerDownRight, Send, Banknote, CheckCircle } from 'lucide-react';
import { USERS } from '../../data/users.js';
import { formatDateTime } from '../../utils/formatters.js';

const actionIcons = {
  submitted: Send,
  approved: Check,
  rejected: X,
  returned: CornerDownRight,
  disbursed: Banknote,
  cleared: CheckCircle,
};

const actionColors = {
  submitted: 'bg-brand text-white',
  approved: 'bg-positive text-white',
  rejected: 'bg-negative text-white',
  returned: 'bg-critical text-white',
  disbursed: 'bg-brand text-white',
  cleared: 'bg-positive text-white',
};

export default function ApprovalTimeline({ approvals = [] }) {
  const { t, i18n } = useTranslation();

  if (approvals.length === 0) {
    return (
      <p className="text-sm text-text-secondary italic">{t('common.noData')}</p>
    );
  }

  return (
    <div className="space-y-0">
      {approvals.map((approval, index) => {
        const user = USERS.find((u) => u.id === approval.userId);
        const Icon = actionIcons[approval.action] || Send;
        const colorClass = actionColors[approval.action] || 'bg-neutral text-white';
        const isLast = index === approvals.length - 1;
        const userName = i18n.language === 'th' && user
          ? `${user.firstName} ${user.lastName}`
          : user
            ? `${user.firstNameEn} ${user.lastNameEn}`
            : 'Unknown';

        return (
          <div key={index} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${colorClass}`}>
                <Icon size={14} />
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-border min-h-6" />}
            </div>
            <div className={`pb-4 ${isLast ? '' : ''}`}>
              <p className="text-sm font-medium text-text-primary">
                {t(`approval.${approval.action}By`, { defaultValue: approval.action })} {userName}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {formatDateTime(approval.date, i18n.language)}
              </p>
              {approval.comment && (
                <p className="text-sm text-text-secondary mt-1 bg-bg-primary rounded px-3 py-1.5">
                  {approval.comment}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
