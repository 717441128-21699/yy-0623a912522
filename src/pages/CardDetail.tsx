import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Hash,
  Snowflake,
  TrendingUp,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import SessionProgress from '@/components/SessionProgress';
import Modal from '@/components/Modal';
import { api } from '@/utils/api';

interface HistoryItem {
  id: string;
  cardId: string;
  type: 'verify' | 'appointment' | 'cancel_appointment' | 'refund' | 'gift' | 'adjust' | 'recover';
  sessionsChanged: number;
  operator: string;
  consultant: string | null;
  room: string | null;
  consumables: string | null;
  originalProject: string | null;
  actualProject: string | null;
  reason: string | null;
  createdAt: string;
}

interface CardData {
  id: string;
  customerId: string;
  projectName: string;
  status: 'active' | 'expired' | 'frozen' | 'refunded';
  startDate: string;
  expireDate: string;
  totalSessions: number;
  usedSessions: number;
  frozenSessions: number;
  remainingSessions: number;
  createdAt: string;
}

const historyTypeConfig: Record<
  HistoryItem['type'],
  { label: string; color: string; detail: (h: HistoryItem) => string }
> = {
  verify: {
    label: '核销',
    color: 'bg-emerald',
    detail: (h) => {
      const parts: string[] = [];
      if (h.originalProject && h.actualProject && h.originalProject !== h.actualProject) {
        parts.push(`${h.originalProject} → ${h.actualProject}（${h.reason || '同类抵扣'}）`);
      }
      const meta = [h.consultant, h.room, h.consumables].filter(Boolean).join(' · ');
      if (meta) parts.push(meta);
      return parts.length > 0 ? parts.join(' · ') : '核销1次';
    },
  },
  appointment: { label: '预约占次', color: 'bg-sky-400', detail: () => '暂占1次' },
  cancel_appointment: { label: '取消预约', color: 'bg-gray-400', detail: (h) => h.reason || '释放1次' },
  refund: { label: '退卡', color: 'bg-coral', detail: (h) => h.reason || '整卡退款' },
  gift: { label: '赠送', color: 'bg-purple-400', detail: (h) => `赠送${Math.abs(h.sessionsChanged)}次` },
  adjust: { label: '补扣', color: 'bg-amber', detail: (h) => `补扣${h.sessionsChanged}次` },
  recover: { label: '误扣恢复', color: 'bg-sky-300', detail: (h) => `恢复${Math.abs(h.sessionsChanged)}次` },
};

const exceptionTypes = [
  { value: 'refund' as const, label: '退卡' },
  { value: 'gift' as const, label: '赠送' },
  { value: 'adjust' as const, label: '补扣' },
  { value: 'recover' as const, label: '误扣恢复' },
];

export default function CardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<CardData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showException, setShowException] = useState(false);
  const [exceptionType, setExceptionType] = useState<'refund' | 'gift' | 'adjust' | 'recover'>('gift');
  const [exceptionCount, setExceptionCount] = useState(1);
  const [exceptionReason, setExceptionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadCard();
  }, [id]);

  async function loadCard() {
    try {
      setLoading(true);
      const data = await api.getCardDetail(id!);
      setCard(data.card as CardData);
      setHistory(data.history as HistoryItem[]);
    } catch {
      setCard(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleExceptionSubmit() {
    if (!exceptionReason.trim() || !id) return;
    try {
      setSubmitting(true);
      await api.createException(id, {
        type: exceptionType,
        sessionsChanged: exceptionType === 'refund' ? 0 : exceptionCount,
        reason: exceptionReason.trim(),
        operator: '王店长',
      });
      setShowException(false);
      setExceptionReason('');
      setExceptionCount(1);
      await loadCard();
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  function getDaysUntilExpiry(expireDate: string): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expiry = new Date(expireDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  if (loading) {
    return (
      <div className="animate-fadeIn flex items-center justify-center min-h-[400px]">
        <div className="text-softPink/40">加载中...</div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="animate-fadeIn flex items-center justify-center min-h-[400px]">
        <div className="text-softPink/40">未找到疗程卡信息</div>
      </div>
    );
  }

  const daysLeft = getDaysUntilExpiry(card.expireDate);

  return (
    <div className="animate-fadeIn">
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-serif font-semibold text-softPink">
            {card.projectName}
          </h1>
          <StatusBadge status={card.status} />
        </div>

        <div className="mb-5">
          <SessionProgress
            total={card.totalSessions}
            used={card.usedSessions}
            frozen={card.frozenSessions}
            remaining={card.remainingSessions}
          />
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5">
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={14} className="text-roseGold/60 shrink-0" />
            <span className="text-softPink/50">购卡日期</span>
            <span className="text-softPink ml-auto">{card.startDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock size={14} className="text-roseGold/60 shrink-0" />
            <span className="text-softPink/50">有效期</span>
            <span className="text-softPink ml-auto">{card.expireDate}</span>
            {daysLeft >= 0 && daysLeft <= 7 && (
              <span className="flex items-center gap-1 text-amber text-xs shrink-0">
                <AlertTriangle size={12} />
                {daysLeft}天
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Hash size={14} className="text-roseGold/60 shrink-0" />
            <span className="text-softPink/50">总次数</span>
            <span className="text-softPink ml-auto">{card.totalSessions}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle size={14} className="text-coral/60 shrink-0" />
            <span className="text-softPink/50">已用次数</span>
            <span className="text-softPink ml-auto">{card.usedSessions}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Snowflake size={14} className="text-sky-400/60 shrink-0" />
            <span className="text-softPink/50">冻结次数</span>
            <span className="text-softPink ml-auto">{card.frozenSessions}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp size={14} className="text-emerald/60 shrink-0" />
            <span className="text-softPink/50">剩余次数</span>
            <span className="text-softPink ml-auto">{card.remainingSessions}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/appointment')}
            className="flex-1 px-4 py-2.5 rounded-full bg-roseGold text-white text-sm font-medium hover:bg-roseGold/90 transition-colors"
          >
            预约占次
          </button>
          <button
            onClick={() => navigate('/verify')}
            className="flex-1 px-4 py-2.5 rounded-full bg-roseGold text-white text-sm font-medium hover:bg-roseGold/90 transition-colors"
          >
            核销
          </button>
          <button
            onClick={() => setShowException(true)}
            className="flex-1 px-4 py-2.5 rounded-full border border-roseGold/50 text-roseGold text-sm font-medium hover:bg-roseGold/10 transition-colors"
          >
            异常处理
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-serif font-semibold text-softPink mb-5">
          操作历史
        </h2>
        {history.length === 0 ? (
          <div className="text-center text-softPink/40 py-8">暂无操作记录</div>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10" />
            {history.map((item) => {
              const config = historyTypeConfig[item.type];
              return (
                <div key={item.id} className="relative pb-6 last:pb-0">
                  <div
                    className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full ${config.color} ring-4 ring-darkBg`}
                  />
                  <div className="ml-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-softPink">
                        {config.label}
                      </span>
                      <span className="text-xs text-softPink/40">
                        {item.operator}
                      </span>
                    </div>
                    <p className="text-sm text-softPink/60">{config.detail(item)}</p>
                    <p className="text-xs text-softPink/30 mt-1">
                      {item.createdAt}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={showException}
        onClose={() => setShowException(false)}
        title="异常处理"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-softPink/60 mb-2">操作类型</label>
            <div className="grid grid-cols-2 gap-2">
              {exceptionTypes.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setExceptionType(opt.value)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    exceptionType === opt.value
                      ? 'bg-roseGold text-white'
                      : 'bg-white/5 text-softPink/60 hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {(exceptionType === 'gift' || exceptionType === 'adjust' || exceptionType === 'recover') && (
            <div>
              <label className="block text-sm text-softPink/60 mb-2">变更次数</label>
              <input
                type="number"
                min={1}
                value={exceptionCount}
                onChange={(e) => setExceptionCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-softPink focus:outline-none focus:border-roseGold/50"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-softPink/60 mb-2">
              原因 <span className="text-coral">*</span>
            </label>
            <textarea
              value={exceptionReason}
              onChange={(e) => setExceptionReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-softPink resize-none focus:outline-none focus:border-roseGold/50"
              placeholder="请输入原因"
            />
          </div>

          <button
            onClick={handleExceptionSubmit}
            disabled={!exceptionReason.trim() || submitting}
            className="w-full py-2.5 rounded-full bg-roseGold text-white text-sm font-medium hover:bg-roseGold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '提交中...' : '提交'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
