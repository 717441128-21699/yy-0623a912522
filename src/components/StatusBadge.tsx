interface StatusBadgeProps {
  status: 'active' | 'expired' | 'frozen' | 'refunded';
}

const statusConfig: Record<StatusBadgeProps['status'], { label: string; className: string }> = {
  active: { label: '正常', className: 'bg-emerald/15 text-emerald' },
  expired: { label: '已过期', className: 'bg-coral/15 text-coral' },
  frozen: { label: '已冻结', className: 'bg-sky-400/15 text-sky-400' },
  refunded: { label: '已退款', className: 'bg-gray-400/15 text-gray-400' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
