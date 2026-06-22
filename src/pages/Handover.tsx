import { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { api } from '@/utils/api';

type TabType = 'unverified' | 'verified' | 'exception';

interface UnverifiedAppointment {
  id: string;
  customerName: string;
  projectName: string;
  appointmentDate: string;
  timeSlot: string;
  operator: string;
  room: string;
}

interface VerifiedDetail {
  id: string;
  customerName: string;
  projectName: string;
  operator: string;
  consultant: string;
  room: string;
  consumables: string;
  createdAt: string;
}

interface ExceptionCard {
  id: string;
  customerName: string;
  projectName: string;
  exceptionType: string;
  status: string;
  remainingSessions: number;
  expireDate: string;
}

const exceptionTypeLabels: Record<string, string> = {
  refund: '退卡',
  gift: '赠送',
  adjust: '补扣',
  recover: '误扣恢复',
};

const storeOptions = [
  { value: 'store-001', label: '朝阳区旗舰店' },
  { value: 'store-002', label: '海淀区精品店' },
];

export default function Handover() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [store, setStore] = useState('');
  const [tab, setTab] = useState<TabType>('unverified');
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState<UnverifiedAppointment[]>([]);
  const [verified, setVerified] = useState<VerifiedDetail[]>([]);
  const [exceptionCards, setExceptionCards] = useState<ExceptionCard[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function handleQuery() {
    if (!date) return;
    setLoading(true);
    try {
      const data = await api.getHandover(date, store || undefined) as {
        unverifiedAppointments: UnverifiedAppointment[];
        verifiedDetails: VerifiedDetail[];
        exceptionCards: ExceptionCard[];
      };
      setUnverified(data.unverifiedAppointments || []);
      setVerified(data.verifiedDetails || []);
      setExceptionCards(data.exceptionCards || []);
      setLoaded(true);
    } catch {
      setUnverified([]);
      setVerified([]);
      setExceptionCards([]);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    let headers: string[];
    let rows: string[][];

    if (tab === 'unverified') {
      headers = ['顾客名', '项目', '预约时段', '操作师', '房间'];
      rows = unverified.map((a) => [a.customerName, a.projectName, `${a.appointmentDate} ${a.timeSlot}`, a.operator, a.room]);
    } else if (tab === 'verified') {
      headers = ['顾客名', '项目', '操作师', '咨询师', '房间', '耗材', '核销时间'];
      rows = verified.map((v) => [v.customerName, v.projectName, v.operator, v.consultant || '-', v.room || '-', v.consumables || '-', v.createdAt]);
    } else {
      headers = ['顾客名', '项目', '异常类型', '状态', '剩余次数', '有效期'];
      rows = exceptionCards.map((e) => [e.customerName, e.projectName, exceptionTypeLabels[e.exceptionType] || e.exceptionType, e.status, String(e.remainingSessions), e.expireDate]);
    }

    const bom = '\uFEFF';
    const csvContent = bom + [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const storeLabel = storeOptions.find((s) => s.value === store)?.label || '全部门店';
    link.href = url;
    link.download = `交接记录_${storeLabel}_${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'unverified', label: '未核销预约' },
    { key: 'verified', label: '当日核销明细' },
    { key: 'exception', label: '异常卡片' },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <FileText size={24} className="text-roseGold" />
        <h1 className="text-2xl font-serif font-semibold text-softPink">交接记录</h1>
      </div>

      <div className="glass rounded-2xl p-5 mb-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm text-softPink/60 mb-1.5">日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-softPink focus:outline-none focus:border-roseGold/50"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-softPink/60 mb-1.5">门店</label>
            <select
              value={store}
              onChange={(e) => setStore(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-softPink focus:outline-none focus:border-roseGold/50"
            >
              <option value="" className="bg-darkBg">全部门店</option>
              {storeOptions.map((s) => (
                <option key={s.value} value={s.value} className="bg-darkBg">{s.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleQuery}
            disabled={loading}
            className="px-6 py-2.5 bg-roseGold/20 text-roseGold rounded-xl hover:bg-roseGold/30 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {loading ? '查询中...' : '查询'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-xl text-sm transition-colors ${
                tab === t.key
                  ? 'bg-roseGold/20 text-roseGold border border-roseGold/40'
                  : 'bg-white/5 text-softPink/60 border border-white/5 hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {loaded && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/5 text-softPink/60 rounded-xl hover:bg-white/10 transition-colors text-sm"
          >
            <Download size={14} />
            导出
          </button>
        )}
      </div>

      {!loaded ? (
        <div className="glass rounded-2xl p-8 text-center text-softPink/40">
          请选择日期后点击查询
        </div>
      ) : tab === 'unverified' ? (
        unverified.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-softPink/40">暂无未核销预约</div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-softPink/40 uppercase">顾客名</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-softPink/40 uppercase">项目</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-softPink/40 uppercase">预约时段</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-softPink/40 uppercase">操作师</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-softPink/40 uppercase">房间</th>
                </tr>
              </thead>
              <tbody>
                {unverified.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 table-row-hover">
                    <td className="px-5 py-3.5 text-sm text-softPink">{item.customerName}</td>
                    <td className="px-5 py-3.5 text-sm text-softPink/70">{item.projectName}</td>
                    <td className="px-5 py-3.5 text-sm text-softPink/70">{item.appointmentDate} {item.timeSlot}</td>
                    <td className="px-5 py-3.5 text-sm text-softPink/70">{item.operator}</td>
                    <td className="px-5 py-3.5 text-sm text-softPink/70">{item.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : tab === 'verified' ? (
        verified.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-softPink/40">暂无核销明细</div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-softPink/40 uppercase">顾客名</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-softPink/40 uppercase">项目</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-softPink/40 uppercase">操作师</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-softPink/40 uppercase">咨询师</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-softPink/40 uppercase">房间</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-softPink/40 uppercase">耗材</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-softPink/40 uppercase">核销时间</th>
                </tr>
              </thead>
              <tbody>
                {verified.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 table-row-hover">
                    <td className="px-5 py-3.5 text-sm text-softPink">{item.customerName}</td>
                    <td className="px-5 py-3.5 text-sm text-softPink/70">{item.projectName}</td>
                    <td className="px-5 py-3.5 text-sm text-softPink/70">{item.operator}</td>
                    <td className="px-5 py-3.5 text-sm text-softPink/70">{item.consultant || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-softPink/70">{item.room || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-softPink/70">{item.consumables || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-softPink/70">{item.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : exceptionCards.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-softPink/40">暂无异常卡片</div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-3.5 text-left text-xs font-medium text-softPink/40 uppercase">顾客名</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-softPink/40 uppercase">项目</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-softPink/40 uppercase">异常类型</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-softPink/40 uppercase">状态</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-softPink/40 uppercase">剩余次数</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-softPink/40 uppercase">有效期</th>
              </tr>
            </thead>
            <tbody>
              {exceptionCards.map((item) => (
                <tr key={item.id} className="border-b border-white/5 table-row-hover">
                  <td className="px-5 py-3.5 text-sm text-softPink">{item.customerName}</td>
                  <td className="px-5 py-3.5 text-sm text-softPink/70">{item.projectName}</td>
                  <td className="px-5 py-3.5 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.exceptionType === 'refund' ? 'bg-gray-400/15 text-gray-400' :
                      item.exceptionType === 'gift' ? 'bg-emerald/15 text-emerald' :
                      item.exceptionType === 'adjust' ? 'bg-amber/15 text-amber' :
                      'bg-sky-400/15 text-sky-400'
                    }`}>
                      {exceptionTypeLabels[item.exceptionType] || item.exceptionType}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-softPink/70">{item.status}</td>
                  <td className="px-5 py-3.5 text-sm text-softPink/70">{item.remainingSessions}</td>
                  <td className="px-5 py-3.5 text-sm text-softPink/70">{item.expireDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
