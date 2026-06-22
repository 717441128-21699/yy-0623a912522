import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, Bell, AlertTriangle, Search, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store';
import { api } from '@/utils/api';

interface AppointmentItem {
  id: string;
  status: string;
  [key: string]: unknown;
}

interface AlertItem {
  id: string;
  cardId: string;
  customerName: string;
  projectName: string;
  alertType: 'expiring' | 'low_sessions';
  daysLeft?: number;
  createdAt: string;
}

interface SearchResultItem {
  id: string;
  name: string;
  phone: string;
  medicalRecordNo: string;
  cardCount: number;
}

type SearchField = 'phone' | 'name' | 'medicalRecordNo';

const searchFieldLabels: Record<SearchField, string> = {
  phone: '手机号',
  name: '姓名',
  medicalRecordNo: '病历号',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { alerts, fetchAlerts, setSearchKeyword, setSearchField } = useAppStore();

  const [reservedCount, setReservedCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [exceptionCount, setExceptionCount] = useState(0);
  const [searchField, setLocalSearchField] = useState<SearchField>('phone');
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    api.getAppointments(today).then((data) => {
      const appts = Array.isArray(data) ? data : [];
      setReservedCount(appts.filter((a: AppointmentItem) => a.status === 'reserved').length);
    }).catch(() => {
      setReservedCount(0);
    });

    api.getAlerts().then((data) => {
      const alertsList = Array.isArray(data) ? data : [];
      setAlertCount(alertsList.length);
      setExceptionCount(alertsList.filter((a: AlertItem) => a.alertType === 'low_sessions').length);
    }).catch(() => {
      setAlertCount(0);
      setExceptionCount(0);
    });
  }, []);

  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) return;
    setSearching(true);
    setShowResults(true);
    try {
      const data = await api.searchCustomers(keyword.trim(), searchField);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [keyword, searchField]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  const handleFieldChange = useCallback((field: SearchField) => {
    setLocalSearchField(field);
    setShowResults(false);
    setSearchResults([]);
  }, []);

  const handleCustomerClick = useCallback((item: SearchResultItem) => {
    setSearchKeyword(item.name);
    setSearchField(searchField);
    navigate(`/search?keyword=${encodeURIComponent(item.name)}&field=${searchField}`);
  }, [navigate, searchField, setSearchKeyword, setSearchField]);

  const topAlerts = alerts.slice(0, 3);

  const alertTypeLabel: Record<string, string> = {
    expiring: '即将到期',
    low_sessions: '余次不足',
  };

  const statCards = [
    { label: '待核销预约', count: reservedCount, icon: CalendarCheck, color: 'emerald', path: '/appointment' },
    { label: '预警卡片', count: alertCount, icon: Bell, color: 'amber', path: '/alert' },
    { label: '异常待处理', count: exceptionCount, icon: AlertTriangle, color: 'coral', path: '/exception' },
  ];

  const iconColorMap: Record<string, string> = {
    emerald: 'text-emerald',
    amber: 'text-amber',
    coral: 'text-coral',
  };

  const borderColorMap: Record<string, string> = {
    emerald: '#2ECC71',
    amber: '#F39C12',
    coral: '#E74C3C',
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard size={24} className="text-roseGold" />
        <h1 className="text-2xl font-serif font-semibold text-softPink">工作台</h1>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              onClick={() => navigate(card.path)}
              className="glass rounded-2xl p-5 cursor-pointer hover:bg-white/[0.12] transition-all duration-200 relative overflow-hidden"
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px]"
                style={{ background: `linear-gradient(to bottom, #B76E79, ${borderColorMap[card.color]})` }}
              />
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-softPink/60">{card.label}</span>
                <Icon size={20} className={iconColorMap[card.color]} />
              </div>
              <div className="text-3xl font-bold text-softPink mb-1">{card.count}</div>
              <div className="text-xs text-softPink/40">点击查看详情</div>
            </div>
          );
        })}
      </div>

      <div className="glass rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Search size={18} className="text-roseGold" />
          <h2 className="text-lg font-serif font-semibold text-softPink">快捷检索</h2>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          {(Object.keys(searchFieldLabels) as SearchField[]).map((field) => (
            <button
              key={field}
              onClick={() => handleFieldChange(field)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                searchField === field
                  ? 'bg-roseGold text-white'
                  : 'bg-transparent text-softPink/60 border border-softPink/20 hover:border-roseGold/50'
              }`}
            >
              {searchFieldLabels[field]}
            </button>
          ))}
        </div>

        <div className="relative max-w-xl mx-auto">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-softPink/40" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`输入${searchFieldLabels[searchField]}搜索...`}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-softPink placeholder:text-softPink/30 focus:outline-none focus:border-roseGold/50 focus:ring-1 focus:ring-roseGold/30 transition-all"
          />
        </div>

        {showResults && (
          <div className="mt-4 max-w-xl mx-auto">
            {searching ? (
              <div className="text-center text-softPink/40 py-4">搜索中...</div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleCustomerClick(item)}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/[0.08] cursor-pointer transition-all duration-200"
                  >
                    <div>
                      <span className="text-softPink font-medium">{item.name}</span>
                      <span className="text-softPink/40 text-sm ml-3">{item.phone}</span>
                      <span className="text-softPink/40 text-sm ml-3">{item.medicalRecordNo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-roseGold/15 text-roseGold px-2 py-0.5 rounded-full">
                        {item.cardCount}张卡
                      </span>
                      <ChevronRight size={16} className="text-softPink/30" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-softPink/40 py-4">未找到匹配的顾客</div>
            )}
          </div>
        )}
      </div>

      {topAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-serif font-semibold text-softPink">预警提醒</h2>
            <button
              onClick={() => navigate('/alert')}
              className="text-sm text-roseGold/70 hover:text-roseGold transition-colors"
            >
              查看全部
            </button>
          </div>
          {topAlerts.map((alert, index) => (
            <div
              key={`${alert.id}-${alert.alertType}`}
              onClick={() => navigate('/alert')}
              className="glass rounded-xl p-4 border-l-[3px] border-amber cursor-pointer hover:bg-white/[0.12] transition-all duration-200 animate-slideInRight"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-softPink font-medium">{alert.customerName}</span>
                  <span className="text-softPink/40 text-sm">·</span>
                  <span className="text-softPink/60 text-sm">{alert.projectName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      alert.alertType === 'expiring'
                        ? 'bg-amber/15 text-amber'
                        : 'bg-coral/15 text-coral'
                    }`}
                  >
                    {alertTypeLabel[alert.alertType] || alert.alertType}
                  </span>
                  <span className="text-sm text-amber">
                    {alert.daysLeft > 0 ? `剩余${alert.daysLeft}天` : '已到期'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
