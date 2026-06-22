import { run, generateId, all } from './db.js'

const today = new Date()
const fmt = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

export function initSeed(): void {
  const store1 = generateId()
  const store2 = generateId()

  run(`INSERT INTO stores (id, name, address) VALUES (?, ?, ?)`, [store1, '朝阳区旗舰店', '北京市朝阳区建国路88号'])
  run(`INSERT INTO stores (id, name, address) VALUES (?, ?, ?)`, [store2, '海淀区精品店', '北京市海淀区中关村大街66号'])

  const staff1 = generateId()
  const staff2 = generateId()
  const staff3 = generateId()
  const staff4 = generateId()
  const staff5 = generateId()
  const staff6 = generateId()

  run(`INSERT INTO staff (id, store_id, name, role) VALUES (?, ?, ?, ?)`, [staff1, store1, '王小红', 'receptionist'])
  run(`INSERT INTO staff (id, store_id, name, role) VALUES (?, ?, ?, ?)`, [staff2, store1, '李美丽', 'consultant'])
  run(`INSERT INTO staff (id, store_id, name, role) VALUES (?, ?, ?, ?)`, [staff3, store1, '张店长', 'manager'])
  run(`INSERT INTO staff (id, store_id, name, role) VALUES (?, ?, ?, ?)`, [staff4, store2, '赵小燕', 'receptionist'])
  run(`INSERT INTO staff (id, store_id, name, role) VALUES (?, ?, ?, ?)`, [staff5, store2, '刘雅琴', 'consultant'])
  run(`INSERT INTO staff (id, store_id, name, role) VALUES (?, ?, ?, ?)`, [staff6, store2, '陈店长', 'manager'])

  const c1 = generateId()
  const c2 = generateId()
  const c3 = generateId()
  const c4 = generateId()
  const c5 = generateId()
  const c6 = generateId()
  const c7 = generateId()
  const c8 = generateId()

  run(`INSERT INTO customers (id, store_id, name, phone, medical_record_no) VALUES (?, ?, ?, ?, ?)`, [c1, store1, '林小芳', '13800138001', 'MR20240001'])
  run(`INSERT INTO customers (id, store_id, name, phone, medical_record_no) VALUES (?, ?, ?, ?, ?)`, [c2, store1, '张婷婷', '13800138002', 'MR20240002'])
  run(`INSERT INTO customers (id, store_id, name, phone, medical_record_no) VALUES (?, ?, ?, ?, ?)`, [c3, store1, '王丽华', '13800138003', 'MR20240003'])
  run(`INSERT INTO customers (id, store_id, name, phone, medical_record_no) VALUES (?, ?, ?, ?, ?)`, [c4, store1, '李雪梅', '13800138004', 'MR20240004'])
  run(`INSERT INTO customers (id, store_id, name, phone, medical_record_no) VALUES (?, ?, ?, ?, ?)`, [c5, store2, '陈思琪', '13800138005', 'MR20240005'])
  run(`INSERT INTO customers (id, store_id, name, phone, medical_record_no) VALUES (?, ?, ?, ?, ?)`, [c6, store2, '杨晓琳', '13800138006', 'MR20240006'])
  run(`INSERT INTO customers (id, store_id, name, phone, medical_record_no) VALUES (?, ?, ?, ?, ?)`, [c7, store2, '周美玲', '13800138007', 'MR20240007'])
  run(`INSERT INTO customers (id, store_id, name, phone, medical_record_no) VALUES (?, ?, ?, ?, ?)`, [c8, store2, '吴佳慧', '13800138008', 'MR20240008'])

  const card1 = generateId()
  const card2 = generateId()
  const card3 = generateId()
  const card4 = generateId()
  const card5 = generateId()
  const card6 = generateId()
  const card7 = generateId()
  const card8 = generateId()
  const card9 = generateId()
  const card10 = generateId()
  const card11 = generateId()
  const card12 = generateId()

  run(`INSERT INTO treatment_cards (id, store_id, customer_id, project_name, total_sessions, used_sessions, frozen_sessions, start_date, expire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [card1, store1, c1, '光子嫩肤6次卡', 6, 2, 1, '2025-01-15', fmt(addDays(today, 30)), 'active'])
  run(`INSERT INTO treatment_cards (id, store_id, customer_id, project_name, total_sessions, used_sessions, frozen_sessions, start_date, expire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [card2, store1, c1, '热玛吉3次卡', 3, 2, 0, '2025-03-01', fmt(addDays(today, 5)), 'active'])
  run(`INSERT INTO treatment_cards (id, store_id, customer_id, project_name, total_sessions, used_sessions, frozen_sessions, start_date, expire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [card3, store1, c2, '水光针10次卡', 10, 5, 1, '2025-02-01', fmt(addDays(today, 60)), 'active'])
  run(`INSERT INTO treatment_cards (id, store_id, customer_id, project_name, total_sessions, used_sessions, frozen_sessions, start_date, expire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [card4, store1, c2, '皮秒激光3次卡', 3, 3, 0, '2024-12-01', '2025-06-01', 'expired'])
  run(`INSERT INTO treatment_cards (id, store_id, customer_id, project_name, total_sessions, used_sessions, frozen_sessions, start_date, expire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [card5, store1, c3, '光子嫩肤6次卡', 6, 5, 0, '2025-01-01', fmt(addDays(today, 3)), 'active'])
  run(`INSERT INTO treatment_cards (id, store_id, customer_id, project_name, total_sessions, used_sessions, frozen_sessions, start_date, expire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [card6, store1, c3, '超声刀2次卡', 2, 1, 0, '2025-04-01', fmt(addDays(today, 90)), 'active'])
  run(`INSERT INTO treatment_cards (id, store_id, customer_id, project_name, total_sessions, used_sessions, frozen_sessions, start_date, expire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [card7, store1, c4, '热玛吉3次卡', 3, 2, 1, '2025-02-15', fmt(addDays(today, 45)), 'active'])
  run(`INSERT INTO treatment_cards (id, store_id, customer_id, project_name, total_sessions, used_sessions, frozen_sessions, start_date, expire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [card8, store2, c5, '水光针10次卡', 10, 9, 0, '2025-01-01', fmt(addDays(today, 2)), 'active'])
  run(`INSERT INTO treatment_cards (id, store_id, customer_id, project_name, total_sessions, used_sessions, frozen_sessions, start_date, expire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [card9, store2, c5, '胶原蛋白4次卡', 4, 2, 0, '2025-05-01', fmt(addDays(today, 120)), 'active'])
  run(`INSERT INTO treatment_cards (id, store_id, customer_id, project_name, total_sessions, used_sessions, frozen_sessions, start_date, expire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [card10, store2, c6, '光子嫩肤6次卡', 6, 6, 0, '2024-06-01', '2025-06-01', 'expired'])
  run(`INSERT INTO treatment_cards (id, store_id, customer_id, project_name, total_sessions, used_sessions, frozen_sessions, start_date, expire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [card11, store2, c7, '皮秒激光3次卡', 3, 0, 1, '2025-06-01', fmt(addDays(today, 180)), 'frozen'])
  run(`INSERT INTO treatment_cards (id, store_id, customer_id, project_name, total_sessions, used_sessions, frozen_sessions, start_date, expire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [card12, store2, c8, '超声刀2次卡', 2, 1, 0, '2025-05-01', fmt(addDays(today, 7)), 'active'])

  const appt1 = generateId()
  const appt2 = generateId()
  const appt3 = generateId()
  const appt4 = generateId()
  const appt5 = generateId()
  const appt6 = generateId()

  run(`INSERT INTO appointments (id, store_id, card_id, customer_id, project_name, appointment_date, time_slot, operator_staff, room, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [appt1, store1, card1, c1, '光子嫩肤', fmt(today), '10:00-11:00', '李美丽', 'A101', 'reserved'])
  run(`INSERT INTO appointments (id, store_id, card_id, customer_id, project_name, appointment_date, time_slot, operator_staff, room, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [appt2, store2, card3, c2, '水光针', fmt(today), '14:00-15:00', '刘雅琴', 'B201', 'reserved'])
  run(`INSERT INTO appointments (id, store_id, card_id, customer_id, project_name, appointment_date, time_slot, operator_staff, room, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [appt3, store1, card5, c3, '光子嫩肤', fmt(addDays(today, 1)), '09:00-10:00', '李美丽', 'A102', 'reserved'])
  run(`INSERT INTO appointments (id, store_id, card_id, customer_id, project_name, appointment_date, time_slot, operator_staff, room, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [appt4, store1, card7, c4, '热玛吉', fmt(today), '11:00-12:00', '李美丽', 'A202', 'verified'])
  run(`INSERT INTO appointments (id, store_id, card_id, customer_id, project_name, appointment_date, time_slot, operator_staff, room, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [appt5, store2, card8, c5, '水光针', fmt(today), '15:00-16:00', '刘雅琴', 'B201', 'verified'])
  run(`INSERT INTO appointments (id, store_id, card_id, customer_id, project_name, appointment_date, time_slot, operator_staff, room, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [appt6, store2, card12, c8, '超声刀', fmt(addDays(today, 1)), '10:00-11:00', '刘雅琴', 'B201', 'reserved'])

  run(`INSERT INTO operation_records (id, store_id, card_id, type, sessions_changed, operator_staff, consultant, room, consumables, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), store1, card1, 'verify', 1, '王小红', '李美丽', 'A101', '光子嫩肤探头', null])
  run(`INSERT INTO operation_records (id, store_id, card_id, type, sessions_changed, operator_staff, consultant, room, consumables, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), store1, card1, 'verify', 1, '王小红', '李美丽', 'A102', '光子嫩肤探头', null])
  run(`INSERT INTO operation_records (id, store_id, card_id, type, sessions_changed, operator_staff, consultant, room, consumables, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), store1, card1, 'appointment', 1, '王小红', null, null, null, null])
  run(`INSERT INTO operation_records (id, store_id, card_id, type, sessions_changed, operator_staff, consultant, room, consumables, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), store1, card2, 'verify', 1, '王小红', '李美丽', 'A101', '热玛吉探头', null])
  run(`INSERT INTO operation_records (id, store_id, card_id, type, sessions_changed, operator_staff, consultant, room, consumables, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), store2, card2, 'verify', 1, '赵小燕', '刘雅琴', 'B201', '热玛吉探头', null])
  run(`INSERT INTO operation_records (id, store_id, card_id, type, sessions_changed, operator_staff, consultant, room, consumables, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), store1, card3, 'verify', 1, '王小红', '李美丽', 'A101', '水光针药剂', null])
  run(`INSERT INTO operation_records (id, store_id, card_id, type, sessions_changed, operator_staff, consultant, room, consumables, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), store1, card3, 'appointment', 1, '赵小燕', null, null, null, null])
  run(`INSERT INTO operation_records (id, store_id, card_id, type, sessions_changed, operator_staff, consultant, room, consumables, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), store1, card4, 'verify', 1, '王小红', '李美丽', 'A102', '皮秒探头', null])
  run(`INSERT INTO operation_records (id, store_id, card_id, type, sessions_changed, operator_staff, consultant, room, consumables, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), store1, card7, 'appointment', 1, '赵小燕', null, null, null, null])
  run(`INSERT INTO operation_records (id, store_id, card_id, type, sessions_changed, operator_staff, consultant, room, consumables, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), store2, card10, 'refund', -6, '陈店长', null, null, null, '顾客搬迁至外地申请退卡'])
  run(`INSERT INTO operation_records (id, store_id, card_id, type, sessions_changed, operator_staff, consultant, room, consumables, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), store2, card11, 'adjust', 0, '陈店长', null, null, null, '卡片冻结待进一步核实'])
}

export interface Store {
  id: string
  name: string
  address: string
}

export function getStores(): Store[] {
  return all(`SELECT id, name, address FROM stores ORDER BY name`).map(r => ({
    id: String(r.id),
    name: String(r.name || ''),
    address: String(r.address || ''),
  }))
}
