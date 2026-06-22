import { Router, type Request, type Response } from 'express'
import { all } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const date = req.query.date as string
    const store = req.query.store as string

    if (!date) {
      res.status(400).json({ success: false, error: '缺少日期参数' })
      return
    }

    const storeFilter = store ? `AND a.store_id = ?` : ''
    const storeFilterOp = store ? `AND o.store_id = ?` : ''
    const storeFilterTc = store ? `AND tc.store_id = ?` : ''
    const params = store ? [date, store] : [date]

    const unverifiedAppointments = all(`
      SELECT a.id, a.card_id, a.customer_id, a.project_name, a.appointment_date,
             a.time_slot, a.operator_staff, a.room, a.status, a.created_at,
             c.name AS customer_name
      FROM appointments a
      LEFT JOIN customers c ON c.id = a.customer_id
      WHERE a.appointment_date = ? AND a.status = 'reserved' ${storeFilter}
      ORDER BY a.time_slot
    `, params)

    const verifiedParams = [date]
    if (store) verifiedParams.push(store)
    const verifiedDetails = all(`
      SELECT o.id, o.card_id, o.type, o.sessions_changed, o.operator_staff,
             o.consultant, o.room, o.consumables, o.reason, o.original_project,
             o.actual_project, o.created_at,
             c.name AS customer_name, tc.project_name
      FROM operation_records o
      LEFT JOIN customers c ON c.id = (
        SELECT tc2.customer_id FROM treatment_cards tc2 WHERE tc2.id = o.card_id
      )
      LEFT JOIN treatment_cards tc ON tc.id = o.card_id
      WHERE o.type = 'verify' AND DATE(o.created_at) = ? ${storeFilterOp}
      ORDER BY o.created_at DESC
    `, verifiedParams)

    const exceptionParams = [date]
    if (store) exceptionParams.push(store)
    const exceptionCards = all(`
      SELECT tc.id, tc.customer_id, tc.project_name, tc.total_sessions,
             tc.used_sessions, tc.frozen_sessions, tc.start_date,
             tc.expire_date, tc.status, tc.created_at,
             c.name AS customer_name, o.type AS exception_type, o.reason
      FROM operation_records o
      LEFT JOIN treatment_cards tc ON tc.id = o.card_id
      LEFT JOIN customers c ON c.id = tc.customer_id
      WHERE o.type IN ('refund', 'gift', 'adjust', 'recover') AND DATE(o.created_at) = ? ${storeFilterTc}
      ORDER BY o.created_at DESC
    `, exceptionParams)

    res.json({
      success: true,
      data: {
        unverifiedAppointments: unverifiedAppointments.map(a => ({
          id: a.id,
          cardId: a.card_id,
          customerId: a.customer_id,
          customerName: a.customer_name,
          projectName: a.project_name,
          appointmentDate: a.appointment_date,
          timeSlot: a.time_slot,
          operator: a.operator_staff,
          room: a.room,
          status: a.status,
          createdAt: a.created_at
        })),
        verifiedDetails: verifiedDetails.map(v => ({
          id: v.id,
          cardId: v.card_id,
          type: v.type,
          sessionsChanged: Number(v.sessions_changed),
          operator: v.operator_staff,
          consultant: v.consultant,
          room: v.room,
          consumables: v.consumables,
          reason: v.reason,
          originalProject: v.original_project,
          actualProject: v.actual_project,
          createdAt: v.created_at,
          customerName: v.customer_name,
          projectName: v.project_name
        })),
        exceptionCards: exceptionCards.map(e => ({
          id: e.id,
          customerId: e.customer_id,
          customerName: e.customer_name,
          projectName: e.project_name,
          totalSessions: Number(e.total_sessions),
          usedSessions: Number(e.used_sessions),
          frozenSessions: Number(e.frozen_sessions),
          remainingSessions: Number(e.total_sessions) - Number(e.used_sessions) - Number(e.frozen_sessions),
          startDate: e.start_date,
          expireDate: e.expire_date,
          status: e.status,
          createdAt: e.created_at,
          exceptionType: e.exception_type,
          reason: e.reason
        }))
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取交接记录失败' })
  }
})

export default router
