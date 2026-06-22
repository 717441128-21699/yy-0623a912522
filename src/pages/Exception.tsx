import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Search, X } from 'lucide-react';
import { api } from '@/utils/api';
import { useAppStore } from '@/store';
import Modal from '@/components/Modal';

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Card {
  id: string;
  projectName: string;
  totalSessions: number;
  usedSessions: number;
  frozenSessions: number;
  remainingSessions: number;
  status: string;
}

type ExceptionType = 'refund' | 'gift' | 'adjust' | 'recover';

interface ExceptionRecord {
  id: string;
  time: string;
  type: ExceptionType;
  projectName: string;
  sessionsChanged: number;
  operator: string;
  reason: string;
}

const typeLabels: Record<ExceptionType, string> = {
  refund: '退卡',
  gift: '赠送',
  adjust: '补扣',
  recover: '误扣恢复',
};

const typeDescriptions: Record<ExceptionType, string> = {
  refund: '标记整卡退款',
  gift: '增加总次数',
  adjust: '增加已使用次数',
  recover: '减少已使用次数',
};

export default function Exception() {
  const { currentStaff } = useAppStore();
  const [keyword, setKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [exceptionType, setExceptionType] = useState<ExceptionType>('refund');
  const [sessionsChanged, setSessionsChanged] = useState(1);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [records, setRecords] = useState<ExceptionRecord[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleSearch() {
    if (!keyword.trim()) return;
    setSearching(true);
    try {
      const data = await api.searchCustomers(keyword, 'name');
      setCustomers(Array.isArray(data) ? data : []);
      setShowDropdown(true);
    } catch {
      setCustomers([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleSelectCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    setShowDropdown(false);
    setKeyword('');
    setSelectedCard(null);
    try {
      const data = await api.getCustomerCards(customer.id);
      setCards(Array.isArray(data) ? data : []);
    } catch {
      setCards([]);
    }
  }

  function resetForm() {
    setSelectedCustomer(null);
    setSelectedCard(null);
    setCards([]);
    setExceptionType('refund');
    setSessionsChanged(1);
    setReason('');
  }

  function handleConfirmSubmit() {
    setConfirmModal(true);
  }

  async function handleSubmit() {
    if (!selectedCard || !reason.trim()) return;
    setSubmitting(true);
    try {
      await api.createException(selectedCard.id, {
        type: exceptionType,
        sessionsChanged: exceptionType === 'refund' ? 0 : sessionsChanged,
        reason,
        operator: currentStaff.name,
      });
      const newRecord: ExceptionRecord = {
        id: Date.now().toString(),
        time: new Date().toLocaleString('zh-CN'),
        type: exceptionType,
        projectName: selectedCard.projectName,
        sessionsChanged: exceptionType === 'refund' ? 0 : sessionsChanged,
        operator: currentStaff.name,
        reason,
      };
      setRecords((prev) => [newRecord, ...prev]);
      resetForm();
      setConfirmModal(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  const needsSessions = exceptionType !== 'refund';

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle size={24} className="text-roseGold" />
        <h1 className="text-2xl font-serif font-semibold text-softPink">异常处理</h1>
      </div>

      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-serif font-semibold text-softPink mb-5">异常操作</h2>

        <div className="space-y-4">
          <div ref={dropdownRef} className="relative">
            <label className="block text-sm text-softPink/60 mb-1.5">搜索顾客</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="输入顾客姓名搜索"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-softPink placeholder:text-softPink/30 focus:outline-none focus:border-roseGold/50"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-4 py-2.5 bg-roseGold/20 text-roseGold rounded-xl hover:bg-roseGold/30 transition-colors disabled:opacity-50"
              >
                <Search size={16} />
              </button>
            </div>
            {showDropdown && customers.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-darkBg border border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                {customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className="w-full px-4 py-2.5 text-left text-sm text-softPink hover:bg-white/5 transition-colors flex items-center justify-between"
                  >
                    <span>{c.name}</span>
                    <span className="text-softPink/40 text-xs">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedCustomer && (
            <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5">
              <div>
                <span className="text-sm text-softPink">{selectedCustomer.name}</span>
                <span className="text-xs text-softPink/40 ml-3">{selectedCustomer.phone}</span>
              </div>
              <button onClick={resetForm} className="text-softPink/40 hover:text-coral transition-colors">
                <X size={14} />
              </button>
            </div>
          )}

          {selectedCustomer && cards.length > 0 && (
            <div>
              <label className="block text-sm text-softPink/60 mb-1.5">选择疗程卡</label>
              <select
                value={selectedCard?.id || ''}
                onChange={(e) => {
                  const card = cards.find((c) => c.id === e.target.value);
                  setSelectedCard(card || null);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-softPink focus:outline-none focus:border-roseGold/50"
              >
                <option value="" className="bg-darkBg">请选择疗程卡</option>
                {cards.map((c) => (
                  <option key={c.id} value={c.id} className="bg-darkBg">
                    {c.projectName}（剩余{c.remainingSessions}次，状态：{c.status}）
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedCard && (
            <>
              <div>
                <label className="block text-sm text-softPink/60 mb-2">操作类型</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(typeLabels) as ExceptionType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setExceptionType(type)}
                      className={`px-4 py-3 rounded-xl text-sm transition-colors text-left ${
                        exceptionType === type
                          ? 'bg-roseGold/20 text-roseGold border border-roseGold/40'
                          : 'bg-white/5 text-softPink/60 border border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-medium">{typeLabels[type]}</div>
                      <div className="text-xs opacity-60 mt-0.5">{typeDescriptions[type]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {needsSessions && (
                <div>
                  <label className="block text-sm text-softPink/60 mb-1.5">
                    {exceptionType === 'gift' ? '赠送次数' : exceptionType === 'adjust' ? '补扣次数' : '恢复次数'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={sessionsChanged}
                    onChange={(e) => setSessionsChanged(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-softPink focus:outline-none focus:border-roseGold/50"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-softPink/60 mb-1.5">原因（必填）</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="请输入操作原因"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-softPink placeholder:text-softPink/30 focus:outline-none focus:border-roseGold/50 resize-none"
                />
              </div>

              <button
                onClick={handleConfirmSubmit}
                disabled={!reason.trim()}
                className="w-full py-3 bg-coral/20 text-coral rounded-xl font-medium hover:bg-coral/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                提交异常操作
              </button>
            </>
          )}
        </div>
      </div>

      {records.length > 0 && (
        <div>
          <h2 className="text-lg font-serif font-semibold text-softPink mb-4">异常记录</h2>
          <div className="space-y-3">
            {records.map((record) => (
              <div key={record.id} className="glass rounded-2xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      record.type === 'refund' ? 'bg-gray-400/15 text-gray-400' :
                      record.type === 'gift' ? 'bg-emerald/15 text-emerald' :
                      record.type === 'adjust' ? 'bg-amber/15 text-amber' :
                      'bg-sky-400/15 text-sky-400'
                    }`}>
                      {typeLabels[record.type]}
                    </span>
                    <span className="text-softPink font-medium text-sm">{record.projectName}</span>
                  </div>
                  <span className="text-xs text-softPink/30">{record.time}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-softPink/50 mt-2">
                  {record.sessionsChanged > 0 && (
                    <span>变更次数：{record.sessionsChanged}</span>
                  )}
                  <span>操作人：{record.operator}</span>
                </div>
                <p className="text-xs text-softPink/40 mt-2">原因：{record.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={confirmModal}
        onClose={() => setConfirmModal(false)}
        title="确认操作"
      >
        <div className="space-y-4">
          <div className="bg-white/5 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-softPink/60">操作类型</span>
              <span className="text-softPink">{typeLabels[exceptionType]}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-softPink/60">疗程卡</span>
              <span className="text-softPink">{selectedCard?.projectName}</span>
            </div>
            {needsSessions && (
              <div className="flex justify-between text-sm">
                <span className="text-softPink/60">变更次数</span>
                <span className="text-softPink">{sessionsChanged}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-softPink/60">操作人</span>
              <span className="text-softPink">{currentStaff.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-softPink/60">原因</span>
              <span className="text-softPink max-w-[60%] text-right">{reason}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmModal(false)}
              className="flex-1 py-2.5 bg-white/5 text-softPink/60 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 bg-coral/20 text-coral rounded-xl hover:bg-coral/30 transition-colors text-sm disabled:opacity-40"
            >
              {submitting ? '提交中...' : '确认提交'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
