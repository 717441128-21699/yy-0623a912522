import { Router, type Request, type Response } from 'express'
import { all, get, run, generateId } from '../db.js'

const router = Router()

function mapAppointment(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    cardId: String(r.card_id),
    customerId: String(r.customer_id),
    projectName: String(r.project_name || ''),
    appointmentDate: String(r.appointment_date || ''),
    timeSlot: String(r.time_slot || ''),
    operator: String(r.operator_staff || ''),
    room: String(r.room || ''),
    status: String(r.status || ''),
    createdAt: String(r.created_at || '')
  }
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const date = req.query.date as string
    let sql = `
      SELECT a.id, a.card_id, a.customer_id, a.project_name, a.appointment_date,
             a.time_slot, a.operator_staff, a.room, a.status, a.created_at,
             c.name AS customer_name
      FROM appointments a
      LEFT JOIN customers c ON c.id = a.customer_id
    `
    const params: unknown[] = []

    if (date) {
      sql += ` WHERE a.appointment_date = ?`
      params.push(date)
    }

    sql += ` ORDER BY a.appointment_date DESC, a.time_slot`

    const rows = all(sql, params)
    const appointments = rows.map(r => ({
      ...mapAppointment(r),
      customerName: String(r.customer_name || '')
    }))

    res.json({ success: true, data: { appointments } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取预约列表失败' })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { cardId, projectName, appointmentDate, timeSlot, operator, room } = req.body

    if (!cardId || !projectName || !appointmentDate || !timeSlot || !operator || !room) {
      res.status(400).json({ success: false, error: '缺少必要参数' })
      return
    }

    const card = get(`SELECT id, store_id, customer_id, project_name, total_sessions, used_sessions, frozen_sessions, start_date, expire_date, status, created_at FROM treatment_cards WHERE id = ?`, [cardId])
    if (!card) {
      res.status(404).json({ success: false, error: '疗程卡不存在' })
      return
    }

    const remaining = Number(card.total_sessions) - Number(card.used_sessions) - Number(card.frozen_sessions)
    if (remaining < 1) {
      res.status(400).json({ success: false, error: '疗程卡余次不足' })
      return
    }

    if (card.status !== 'active') {
      res.status(400).json({ success: false, error: '疗程卡状态不可预约' })
      return
    }

    const newFrozen = Number(card.frozen_sessions) + 1
    run(
      `UPDATE treatment_cards SET frozen_sessions = ? WHERE id = ?`,
      [newFrozen, cardId]
    )

    const id = generateId()
    run(
      `INSERT INTO appointments (id, store_id, card_id, customer_id, project_name, appointment_date, time_slot, operator_staff, room, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, card.store_id, cardId, card.customer_id, projectName, appointmentDate, timeSlot, operator, room, 'reserved']
    )

    run(
      `INSERT INTO operation_records (id, store_id, card_id, type, sessions_changed, operator_staff) VALUES (?, ?, ?, ?, ?, ?)`,
      [generateId(), card.store_id, cardId, 'appointment', 1, operator]
    )

    const appointment = get(`SELECT id, card_id, customer_id, project_name, appointment_date, time_slot, operator_staff, room, status, created_at FROM appointments WHERE id = ?`, [id])
    res.json({ success: true, data: { appointment: mapAppointment(appointment!) } })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建预约失败' })
  }
})

router.post('/:id/verify', (req: Request, res: Response): void => {
  try {
    const { consultant, operator, room, consumables, originalProject, actualProject, reason } = req.body
    const appointmentId = req.params.id

    if (!operator) {
      res.status(400).json({ success: false, error: '缺少操作人员' })
      return
    }

    const appointment = get(`SELECT id, store_id, card_id, customer_id, project_name, appointment_date, time_slot, operator_staff, room, status, created_at FROM appointments WHERE id = ?`, [appointmentId])
    if (!appointment) {
      res.status(404).json({ success: false, error: '预约不存在' })
      return
    }

    if (appointment.status !== 'reserved') {
      res.status(400).json({ success: false, error: '预约状态不可核销' })
      return
    }

    const card = get(`SELECT id, store_id, customer_id, project_name, total_sessions, used_sessions, frozen_sessions, start_date, expire_date, status, created_at FROM treatment_cards WHERE id = ?`, [appointment.card_id])
    if (!card) {
      res.status(404).json({ success: false, error: '疗程卡不存在' })
      return
    }

    const newUsed = Number(card.used_sessions) + 1
    const newFrozen = Math.max(0, Number(card.frozen_sessions) - 1)
    run(
      `UPDATE treatment_cards SET used_sessions = ?, frozen_sessions = ? WHERE id = ?`,
      [newUsed, newFrozen, card.id]
    )

    run(
      `UPDATE appointments SET status = 'verified' WHERE id = ?`,
      [appointmentId]
    )

    const origProj = originalProject || appointment.project_name
    const actualProj = actualProject || originalProject || appointment.project_name
    const projectChanged = String(origProj) !== String(actualProj)
    const finalReason = projectChanged ? (reason || '同类项目抵扣') : null

    run(
      `INSERT INTO operation_records (id, store_id, card_id, type, sessions_changed, operator_staff, consultant, room, consumables, original_project, actual_project, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), appointment.store_id, card.id, 'verify', 1, operator, consultant || null, room || null, consumables || null, String(origProj), String(actualProj), finalReason]
    )

    const updatedAppointment = get(`SELECT id, card_id, customer_id, project_name, appointment_date, time_slot, operator_staff, room, status, created_at FROM appointments WHERE id = ?`, [appointmentId])
    res.json({ success: true, data: { appointment: mapAppointment(updatedAppointment!) } })
  } catch (error) {
    res.status(500).json({ success: false, error: '核销失败' })
  }
})

router.post('/:id/cancel', (req: Request, res: Response): void => {
  try {
    const { reason } = req.body
    const appointmentId = req.params.id

    if (!reason) {
      res.status(400).json({ success: false, error: '缺少取消原因' })
      return
    }

    const appointment = get(`SELECT id, store_id, card_id, customer_id, project_name, appointment_date, time_slot, operator_staff, room, status, created_at FROM appointments WHERE id = ?`, [appointmentId])
    if (!appointment) {
      res.status(404).json({ success: false, error: '预约不存在' })
      return
    }

    if (appointment.status !== 'reserved') {
      res.status(400).json({ success: false, error: '预约状态不可取消' })
      return
    }

    const card = get(`SELECT id, store_id, customer_id, project_name, total_sessions, used_sessions, frozen_sessions, start_date, expire_date, status, created_at FROM treatment_cards WHERE id = ?`, [appointment.card_id])
    if (!card) {
      res.status(404).json({ success: false, error: '疗程卡不存在' })
      return
    }

    const newFrozen = Math.max(0, Number(card.frozen_sessions) - 1)
    run(
      `UPDATE treatment_cards SET frozen_sessions = ? WHERE id = ?`,
      [newFrozen, card.id]
    )

    run(
      `UPDATE appointments SET status = 'cancelled' WHERE id = ?`,
      [appointmentId]
    )

    run(
      `INSERT INTO operation_records (id, store_id, card_id, type, sessions_changed, operator_staff, reason) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), appointment.store_id, card.id, 'cancel_appointment', -1, appointment.operator_staff, reason]
    )

    const updatedAppointment = get(`SELECT id, card_id, customer_id, project_name, appointment_date, time_slot, operator_staff, room, status, created_at FROM appointments WHERE id = ?`, [appointmentId])
    res.json({ success: true, data: { appointment: mapAppointment(updatedAppointment!) } })
  } catch (error) {
    res.status(500).json({ success: false, error: '取消预约失败' })
  }
})

export default router
