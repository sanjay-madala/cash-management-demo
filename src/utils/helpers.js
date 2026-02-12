export function getStatusColor(status) {
  const colors = {
    draft: 'bg-neutral/10 text-neutral',
    pendingApproval: 'bg-critical/10 text-critical',
    approved: 'bg-positive/10 text-positive',
    rejected: 'bg-negative/10 text-negative',
    returned: 'bg-critical/10 text-critical',
    disbursed: 'bg-brand/10 text-brand',
    cleared: 'bg-positive/10 text-positive',
    closed: 'bg-neutral/10 text-neutral',
    posted: 'bg-brand/10 text-brand',
  };
  return colors[status] || 'bg-neutral/10 text-neutral';
}

export function getInitials(firstName, lastName) {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${first}${last}`;
}

export function filterByStatus(items, status) {
  if (!status || status === 'all') return items;
  return items.filter((item) => item.status === status);
}

export function filterBySearch(items, searchTerm, fields) {
  if (!searchTerm || !searchTerm.trim()) return items;
  const term = searchTerm.toLowerCase().trim();
  return items.filter((item) =>
    fields.some((field) => {
      const value = item[field];
      if (value == null) return false;
      return String(value).toLowerCase().includes(term);
    })
  );
}

export function sortByDate(items, field = 'createdDate', ascending = false) {
  return [...items].sort((a, b) => {
    const dateA = new Date(a[field] || 0);
    const dateB = new Date(b[field] || 0);
    return ascending ? dateA - dateB : dateB - dateA;
  });
}
