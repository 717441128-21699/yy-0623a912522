import { useState, useEffect } from 'react';
import { Bell, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/utils/api';
import { useAppStore } from '@/store';
import SessionProgress from '@/components/SessionProgress';

interface AlertItem {
  id: string;
  cardId: string;
  customerName: string;
  projectName: string;
  alertType: 'expiring' | 'low_sessions';
  daysLeft?: number;
  totalSessions: number;
  usedSessions: number;
  frozenSessions: number;
  remainingSessions: number;
  startDate: string;
  expireDate: string;
  status: string;
}

type FilterType = 'all' | 'expiring' | 'low_sessions';

export default function AlertCenter() {
  const navigate = useNavigate();
  const { fetchAlerts } = useAppStore();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    fetchAlerts();
    loadAlerts();
  }, []);

  async function loadAlerts(type?: FilterType) {
    setLoading(true);
    try {
      const queryType = type === 'all' ? undefined : type;
      const data = await api.getAlerts(queryType);
      setAlerts(Array.isArray(data) ? data : []);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(type: FilterType) {
    setFilter(type);
    loadAlerts(type);
  }

  const expiringCount = alerts.filter((a) => a.alertType === 'expiring').length;
  const lowSessionCount = alerts.filter((a) => a.alertType === 'low_sessions').length;

  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.alertType === 'expiring' && b.alertType === 'expiring') {
      return (a.daysLeft ?? 999) - (b.daysLeft ?? 999);
    }
    if (a.alertType === 'expiring') return -1;
    if (b.alertType === 'expiring') return 1;
    return a.remainingSessions - b.remainingSessions;
  });

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <Bell size={24} className="text-roseGold" />
        <h1 className="text-2xl font-serif font-semibold text-softPink">预警中心</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber/15 flex items-center justify-center">
            <Clock size={22} className="text-amber" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-amber">{expiringCount}</p>
            <p className="text-xs text-softPink/50 mt-0.5">到期预警</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-coral/15 flex items-center justify-center">
            <AlertTriangle size={22} className="text-coral" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-coral">{lowSessionCount}</p>
            <p className="text-xs text-softPink/50 mt-0.5">余次不足</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {([
          { key: 'all' as FilterType, label: '全部' },
          { key: 'expiring' as FilterType, label: '到期预警' },
          { key: 'low_sessions' as FilterType, label: '余次不足' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`px-5 py-2 rounded-xl text-sm transition-colors ${
              filter === tab.key
                ? 'bg-roseGold/20 text-roseGold border border-roseGold/40'
                : 'bg-white/5 text-softPink/60 border border-white/5 hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-8 text-center text-softPink/40">加载中...</div>
      ) : sortedAlerts.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-softPink/40">暂无预警信息</div>
      ) : (
        <div className="space-y-3">
          {sortedAlerts.map((alert) => (
            <div
              key={`${alert.id}-${alert.alertType}`}
              onClick={() => navigate(`/card/${alert.cardId}`)}
              className="glass rounded-2xl p-5 cursor-pointer hover:bg-white/[0.06] transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-softPink font-medium">{alert.customerName}</h3>
                  <p className="text-sm text-softPink/50 mt-0.5">{alert.projectName}</p>
                </div>
                <div className="flex items-center gap-2">
                  {alert.alertType === 'expiring' && (
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-amber/15 text-amber">
                      <Clock size={10} className="mr-1" />
                      剩余{alert.daysLeft}天
                    </span>
                  )}
                  {alert.alertType === 'low_sessions' && (
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-coral/15 text-coral">
                      <AlertTriangle size={10} className="mr-1" />
                      余次不足
                    </span>
                  )}
                  <ChevronRight size={16} className="text-softPink/20 group-hover:text-softPink/50 transition-colors" />
                </div>
              </div>
              <div className="mb-3">
                <SessionProgress
                  total={alert.totalSessions}
                  used={alert.usedSessions}
                  frozen={alert.frozenSessions}
                  remaining={alert.remainingSessions}
                />
              </div>
              <div className="flex items-center gap-4 text-xs text-softPink/40">
                <span>有效期：{alert.startDate} ~ {alert.expireDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
