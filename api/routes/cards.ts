import { Router, type Request, type Response } from 'express'
import { all, get, run, generateId } from '../db.js'

const router = Router()

function mapCard(r: Record<string, unknown>) {
  const total = Number(r.total_sessions)
  const used = Number(r.used_sessions)
  const frozen = Number(r.frozen_sessions)
  return {
    id: String(r.id),
    customerId: String(r.customer_id),
    projectName: String(r.project_name || ''),
    totalSessions: total,
    usedSessions: used,
    frozenSessions: frozen,
    remainingSessions: total - used - frozen,
    startDate: String(r.start_date || ''),
    expireDate: String(r.expire_date || ''),
    status: String(r.status || ''),
    createdAt: String(r.created_at || '')
  }
}

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const row = get(`SELECT id, customer_id, project_name, total_sessions, used_sessions, frozen_sessions, start_date, expire_date, status, created_at FROM treatment_cards WHERE id = ?`, [req.params.id])
    if (!row) {
      res.status(404).json({ success: false, error: '疗程卡不存在' })
      return
    }

    const historyRows = all(
      `SELECT id, card_id, type, sessions_changed, operator_staff, consultant, room, consumables, reason, created_at FROM operation_records WHERE card_id = ? ORDER BY created_at DESC`,
      [req.params.id]
    )
    const history = historyRows.map(r => ({
      id: String(r.id),
      cardId: String(r.card_id),
      type: String(r.type),
      sessionsChanged: Number(r.sessions_changed),
      operator: String(r.operator_staff || ''),
      consultant: r.consultant ? String(r.consultant) : null,
      room: r.room ? String(r.room) : null,
      consumables: r.consumables ? String(r.consumables) : null,
      reason: r.reason ? String(r.reason) : null,
      createdAt: String(r.created_at || '')
    }))

    res.json({ success: true, data: { card: mapCard(row), history } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取卡详情失败' })
  }
})

router.post('/:id/exception', (req: Request, res: Response): void => {
  try {
    const { type, sessionsChanged, reason, operator } = req.body
    const cardId = req.params.id

    if (!type || !reason || !operator) {
      res.status(400).json({ success: false, error: '缺少必要参数' })
      return
    }

    const validTypes = ['refund', 'gift', 'adjust', 'recover']
    if (!validTypes.includes(type)) {
      res.status(400).json({ success: false, error: '无效的异常类型' })
      return
    }

    const card = get(`SELECT id, customer_id, project_name, total_sessions, used_sessions, frozen_sessions, start_date, expire_date, status, created_at FROM treatment_cards WHERE id = ?`, [cardId])
    if (!card) {
      res.status(404).json({ success: false, error: '疗程卡不存在' })
      return
    }

    const changed = Number(sessionsChanged) || 0
    const currentUsed = Number(card.used_sessions)
    const currentFrozen = Number(card.frozen_sessions)
    const currentTotal = Number(card.total_sessions)

    if (type === 'refund') {
      run(
        `UPDATE treatment_cards SET status = 'refunded' WHERE id = ?`,
        [cardId]
      )
    } else if (type === 'gift') {
      const newTotal = currentTotal + changed
      run(
        `UPDATE treatment_cards SET total_sessions = ? WHERE id = ?`,
        [newTotal, cardId]
      )
    } else if (type === 'adjust') {
      const newUsed = Math.max(0, currentUsed + changed)
      run(
        `UPDATE treatment_cards SET used_sessions = ? WHERE id = ?`,
        [newUsed, cardId]
      )
    } else if (type === 'recover') {
      const newUsed = Math.max(0, currentUsed - changed)
      run(
        `UPDATE treatment_cards SET used_sessions = ? WHERE id = ?`,
        [newUsed, cardId]
      )
    }

    run(
      `INSERT INTO operation_records (id, card_id, type, sessions_changed, operator_staff, reason) VALUES (?, ?, ?, ?, ?, ?)`,
      [generateId(), cardId, type, changed, operator, reason]
    )

    const updatedCard = get(`SELECT id, customer_id, project_name, total_sessions, used_sessions, frozen_sessions, start_date, expire_date, status, created_at FROM treatment_cards WHERE id = ?`, [cardId])
    res.json({ success: true, data: { card: mapCard(updatedCard!) } })
  } catch (error) {
    res.status(500).json({ success: false, error: '异常处理失败' })
  }
})

export default router
