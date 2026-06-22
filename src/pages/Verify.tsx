import { useState, useEffect } from 'react';
import {
  CheckCircle,
  Calendar,
  User,
  Scissors,
  DoorOpen,
  ClipboardList,
} from 'lucide-react';
import Modal from '@/components/Modal';
import { api } from '@/utils/api';

interface Appointment {
  id: string;
  customerName: string;
  projectName: string;
  timeSlot: string;
  operator: string;
  room: string;
  status: 'reserved' | 'verified' | 'cancelled';
}

const consultants = ['李美丽', '刘雅琴'];
const operators = ['李美丽', '刘雅琴'];
const rooms = ['A101', 'A102', 'B201', 'B202'];

export default function Verify() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyModal, setVerifyModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [consultant, setConsultant] = useState('');
  const [operator, setOperator] = useState('');
  const [room, setRoom] = useState('');
  const [consumables, setConsumables] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  async function loadAppointments() {
    try {
      setLoading(true);
      const data = await api.getAppointments(selectedDate);
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  function openVerifyModal(appt: Appointment) {
    setSelectedAppt(appt);
    setConsultant('');
    setOperator('');
    setRoom('');
    setConsumables('');
    setVerifyModal(true);
  }

  function openCancelModal(appt: Appointment) {
    setSelectedAppt(appt);
    setCancelReason('');
    setCancelModal(true);
  }

  async function handleVerify() {
    if (!selectedAppt || !consultant || !operator || !room) return;
    try {
      setSubmitting(true);
      await api.verifyAppointment(selectedAppt.id, {
        consultant,
        operator,
        room,
        consumables,
      });
      setVerifyModal(false);
      setSuccessMsg('核销成功');
      await loadAppointments();
    } catch {
      // error handled silently
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!selectedAppt || !cancelReason.trim()) return;
    try {
      setSubmitting(true);
      await api.cancelAppointment(selectedAppt.id, {
        reason: cancelReason.trim(),
      });
      setCancelModal(false);
      await loadAppointments();
    } catch {
      // error handled silently
    } finally {
      setSubmitting(false);
    }
  }

  const verifiedCount = appointments.filter(
    (a) => a.status === 'verified'
  ).length;
  const totalCount = appointments.length;

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle size={24} className="text-roseGold" />
        <h1 className="text-2xl font-serif font-semibold text-softPink">
          到店核销
        </h1>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-emerald/15 text-emerald text-sm animate-slideUp">
          {successMsg}
        </div>
      )}

      <div className="flex items-center gap-4 mb-5">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-roseGold/60" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-softPink focus:outline-none focus:border-roseGold/50"
          />
        </div>
        <div className="ml-auto text-sm text-softPink/60">
          今日已核销{' '}
          <span className="text-emerald font-semibold">{verifiedCount}</span> /
          总预约{' '}
          <span className="text-softPink font-semibold">{totalCount}</span>
        </div>
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-8 text-center text-softPink/40">
          加载中...
        </div>
      ) : appointments.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-softPink/40">
          暂无预约记录
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-xs text-softPink/40 font-medium">
                    顾客姓名
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-softPink/40 font-medium">
                    项目
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-softPink/40 font-medium">
                    预约时段
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-softPink/40 font-medium">
                    操作师
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-softPink/40 font-medium">
                    房间
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-softPink/40 font-medium">
                    状态
                  </th>
                  <th className="text-right px-4 py-3 text-xs text-softPink/40 font-medium">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr
                    key={appt.id}
                    className="border-b border-white/5 table-row-hover"
                  >
                    <td className="px-4 py-3 text-sm text-softPink">
                      {appt.customerName}
                    </td>
                    <td className="px-4 py-3 text-sm text-softPink/80">
                      {appt.projectName}
                    </td>
                    <td className="px-4 py-3 text-sm text-softPink/80">
                      {appt.timeSlot}
                    </td>
                    <td className="px-4 py-3 text-sm text-softPink/80">
                      {appt.operator}
                    </td>
                    <td className="px-4 py-3 text-sm text-softPink/80">
                      {appt.room}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {appt.status === 'reserved' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber/15 text-amber">
                          待核销
                        </span>
                      )}
                      {appt.status === 'verified' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald/15 text-emerald">
                          已核销
                        </span>
                      )}
                      {appt.status === 'cancelled' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-400/15 text-gray-400">
                          已取消
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {appt.status === 'verified' ? (
                        <span className="text-xs text-emerald/60">已核销</span>
                      ) : appt.status === 'reserved' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openVerifyModal(appt)}
                            className="px-3 py-1 rounded-full bg-roseGold text-white text-xs hover:bg-roseGold/90 transition-colors"
                          >
                            核销
                          </button>
                          <button
                            onClick={() => openCancelModal(appt)}
                            className="px-3 py-1 rounded-full border border-white/10 text-softPink/50 text-xs hover:border-coral/50 hover:text-coral transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={verifyModal}
        onClose={() => setVerifyModal(false)}
        title="核销确认"
      >
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm text-softPink/60 mb-2">
              <User size={14} /> 咨询师
            </label>
            <select
              value={consultant}
              onChange={(e) => setConsultant(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-softPink focus:outline-none focus:border-roseGold/50"
            >
              <option value="" className="bg-darkBg">
                请选择
              </option>
              {consultants.map((c) => (
                <option key={c} value={c} className="bg-darkBg">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm text-softPink/60 mb-2">
              <Scissors size={14} /> 操作师
            </label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-softPink focus:outline-none focus:border-roseGold/50"
            >
              <option value="" className="bg-darkBg">
                请选择
              </option>
              {operators.map((o) => (
                <option key={o} value={o} className="bg-darkBg">
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm text-softPink/60 mb-2">
              <DoorOpen size={14} /> 房间
            </label>
            <select
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-softPink focus:outline-none focus:border-roseGold/50"
            >
              <option value="" className="bg-darkBg">
                请选择
              </option>
              {rooms.map((r) => (
                <option key={r} value={r} className="bg-darkBg">
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm text-softPink/60 mb-2">
              <ClipboardList size={14} /> 耗材
            </label>
            <input
              type="text"
              value={consumables}
              onChange={(e) => setConsumables(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-softPink focus:outline-none focus:border-roseGold/50"
              placeholder="请输入耗材信息"
            />
          </div>
          <button
            onClick={handleVerify}
            disabled={!consultant || !operator || !room || submitting}
            className="w-full py-2.5 rounded-full bg-roseGold text-white text-sm font-medium hover:bg-roseGold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '核销中...' : '确认核销'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={cancelModal}
        onClose={() => setCancelModal(false)}
        title="取消预约"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-softPink/60 mb-2">
              取消原因 <span className="text-coral">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-softPink resize-none focus:outline-none focus:border-roseGold/50"
              placeholder="请输入取消原因"
            />
          </div>
          <button
            onClick={handleCancel}
            disabled={!cancelReason.trim() || submitting}
            className="w-full py-2.5 rounded-full bg-coral text-white text-sm font-medium hover:bg-coral/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '处理中...' : '确认取消'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
