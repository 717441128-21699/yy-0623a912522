import { useState, useEffect, useRef } from 'react';
import { CalendarPlus, Search, X, Clock, User, MapPin } from 'lucide-react';
import { api } from '@/utils/api';
import { useAppStore } from '@/store';
import Modal from '@/components/Modal';

interface Customer {
  id: string;
  name: string;
  phone: string;
  medicalRecordNo: string;
}

interface Card {
  id: string;
  projectName: string;
  totalSessions: number;
  usedSessions: number;
  frozenSessions: number;
  remainingSessions: number;
  status: string;
  expireDate: string;
}

interface Appointment {
  id: string;
  cardId: string;
  customerId: string;
  customerName: string;
  projectName: string;
  appointmentDate: string;
  timeSlot: string;
  operator: string;
  room: string;
  status: string;
}

const timeSlots = [
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00',
];

const operators = ['李美丽', '刘雅琴'];
const rooms = ['A101', 'A102', 'B201', 'B202'];

export default function Appointment() {
  const { currentStaff } = useAppStore();
  const [keyword, setKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [operator, setOperator] = useState('');
  const [room, setRoom] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cancelModal, setCancelModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [cancelReason, setCancelReason] = useState('');
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

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    try {
      const data = await api.getAppointments();
      const list = Array.isArray(data) ? data : [];
      setAppointments(list.filter((a: Appointment) => a.status === 'reserved'));
    } catch {
      setAppointments([]);
    }
  }

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

  function handleSelectCard(card: Card) {
    setSelectedCard(card);
  }

  async function handleSubmit() {
    if (!selectedCard || !appointmentDate || !timeSlot || !operator || !room) return;
    setSubmitting(true);
    try {
      await api.createAppointment({
        cardId: selectedCard.id,
        projectName: selectedCard.projectName,
        appointmentDate,
        timeSlot,
        operator,
        room,
      });
      resetForm();
      await loadAppointments();
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSelectedCustomer(null);
    setSelectedCard(null);
    setCards([]);
    setAppointmentDate('');
    setTimeSlot('');
    setOperator('');
    setRoom('');
  }

  async function handleCancel() {
    if (!cancelReason.trim()) return;
    try {
      await api.cancelAppointment(cancelModal.id, { reason: cancelReason });
      setCancelModal({ open: false, id: '' });
      setCancelReason('');
      await loadAppointments();
    } catch {
    }
  }

  const activeCards = cards.filter((c) => c.status === 'active' && c.remainingSessions > 0);

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <CalendarPlus size={24} className="text-roseGold" />
        <h1 className="text-2xl font-serif font-semibold text-softPink">预约占次</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-serif font-semibold text-softPink mb-5">新建预约</h2>

          <div className="space-y-4">
            <div ref={dropdownRef} className="relative">
              <label className="block text-sm text-softPink/60 mb-1.5">顾客搜索</label>
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

            {selectedCustomer && activeCards.length > 0 && (
              <div>
                <label className="block text-sm text-softPink/60 mb-1.5">选择疗程卡</label>
                <select
                  value={selectedCard?.id || ''}
                  onChange={(e) => {
                    const card = activeCards.find((c) => c.id === e.target.value);
                    handleSelectCard(card || null);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-softPink focus:outline-none focus:border-roseGold/50"
                >
                  <option value="" className="bg-darkBg">请选择疗程卡</option>
                  {activeCards.map((c) => (
                    <option key={c.id} value={c.id} className="bg-darkBg">
                      {c.projectName}（剩余{c.remainingSessions}次）
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedCustomer && activeCards.length === 0 && cards.length > 0 && (
              <div className="text-sm text-coral/80 bg-coral/5 rounded-xl px-4 py-3">
                该顾客没有可用的疗程卡（需为active状态且余次{'>'}0）
              </div>
            )}

            {selectedCard && (
              <div className="bg-white/5 rounded-xl px-4 py-2.5">
                <span className="text-sm text-softPink/60">项目名称：</span>
                <span className="text-sm text-softPink">{selectedCard.projectName}</span>
              </div>
            )}

            <div>
              <label className="block text-sm text-softPink/60 mb-1.5">预约日期</label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-softPink focus:outline-none focus:border-roseGold/50"
              />
            </div>

            <div>
              <label className="block text-sm text-softPink/60 mb-1.5">时段选择</label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setTimeSlot(slot)}
                    className={`px-3 py-2 rounded-xl text-xs transition-colors ${
                      timeSlot === slot
                        ? 'bg-roseGold/20 text-roseGold border border-roseGold/40'
                        : 'bg-white/5 text-softPink/60 border border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Clock size={12} className="inline mr-1" />
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-softPink/60 mb-1.5">操作师</label>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-softPink focus:outline-none focus:border-roseGold/50"
                >
                  <option value="" className="bg-darkBg">请选择</option>
                  {operators.map((o) => (
                    <option key={o} value={o} className="bg-darkBg">{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-softPink/60 mb-1.5">房间</label>
                <select
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-softPink focus:outline-none focus:border-roseGold/50"
                >
                  <option value="" className="bg-darkBg">请选择</option>
                  {rooms.map((r) => (
                    <option key={r} value={r} className="bg-darkBg">{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedCard || !appointmentDate || !timeSlot || !operator || !room}
              className="w-full py-3 bg-roseGold/20 text-roseGold rounded-xl font-medium hover:bg-roseGold/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '确认预约'}
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-serif font-semibold text-softPink mb-4">已占次列表</h2>
          {appointments.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-softPink/40">
              暂无预约记录
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className={`glass rounded-2xl p-5 transition-colors ${
                    apt.status === 'frozen' ? 'border-sky-400/30 bg-sky-400/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-softPink font-medium">{apt.customerName}</h3>
                      <p className="text-sm text-softPink/60 mt-0.5">{apt.projectName}</p>
                    </div>
                    {apt.status === 'frozen' && (
                      <span className="text-xs bg-sky-400/15 text-sky-400 px-2 py-0.5 rounded-full">冻结</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-softPink/50">
                    <span className="flex items-center gap-1">
                      <CalendarPlus size={12} />
                      {apt.appointmentDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {apt.timeSlot}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {apt.operator}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {apt.room}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <button
                      onClick={() => setCancelModal({ open: true, id: apt.id })}
                      className="text-xs text-coral/70 hover:text-coral transition-colors"
                    >
                      取消预约
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={cancelModal.open}
        onClose={() => { setCancelModal({ open: false, id: '' }); setCancelReason(''); }}
        title="取消预约"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-softPink/60 mb-1.5">取消原因</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="请输入取消原因"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-softPink placeholder:text-softPink/30 focus:outline-none focus:border-roseGold/50 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setCancelModal({ open: false, id: '' }); setCancelReason(''); }}
              className="flex-1 py-2.5 bg-white/5 text-softPink/60 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              返回
            </button>
            <button
              onClick={handleCancel}
              disabled={!cancelReason.trim()}
              className="flex-1 py-2.5 bg-coral/20 text-coral rounded-xl hover:bg-coral/30 transition-colors text-sm disabled:opacity-40"
            >
              确认取消
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
