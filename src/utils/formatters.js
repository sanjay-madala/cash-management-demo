export function formatCurrency(amount, locale = 'en') {
  const num = Number(amount) || 0;
  if (locale === 'th') {
    return `\u0E3F${num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `THB ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date, locale = 'en') {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  if (locale === 'th') {
    const day = d.getDate();
    const month = d.getMonth();
    const year = d.getFullYear() + 543;
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
    ];
    return `${day} ${thaiMonths[month]} ${year}`;
  }

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date, locale = 'en') {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const datePart = formatDate(date, locale);
  const timePart = d.toLocaleTimeString(locale === 'th' ? 'th-TH' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${datePart}, ${timePart}`;
}

export function formatDocNumber(prefix, number) {
  const num = Number(number) || 0;
  return `${prefix}-${String(num).padStart(4, '0')}`;
}

export function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}
