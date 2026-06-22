import { Router, type Request, type Response } from 'express'
import { all } from '../db.js'

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

router.get('/search', (req: Request, res: Response): void => {
  try {
    const keyword = req.query.keyword as string || ''
    const field = req.query.field as string || 'name'

    if (!keyword.trim()) {
      res.json({ success: true, data: { customers: [] } })
      return
    }

    let sql: string
    let params: unknown[]

    if (field === 'phone') {
      sql = `
        SELECT c.id, c.name, c.phone, c.medical_record_no, c.created_at, COUNT(tc.id) AS card_count
        FROM customers c
        LEFT JOIN treatment_cards tc ON tc.customer_id = c.id
        WHERE c.phone LIKE ?
        GROUP BY c.id
      `
      params = [`%${keyword}%`]
    } else if (field === 'medicalRecordNo') {
      sql = `
        SELECT c.id, c.name, c.phone, c.medical_record_no, c.created_at, COUNT(tc.id) AS card_count
        FROM customers c
        LEFT JOIN treatment_cards tc ON tc.customer_id = c.id
        WHERE c.medical_record_no LIKE ?
        GROUP BY c.id
      `
      params = [`%${keyword}%`]
    } else {
      sql = `
        SELECT c.id, c.name, c.phone, c.medical_record_no, c.created_at, COUNT(tc.id) AS card_count
        FROM customers c
        LEFT JOIN treatment_cards tc ON tc.customer_id = c.id
        WHERE c.name LIKE ?
        GROUP BY c.id
      `
      params = [`%${keyword}%`]
    }

    const rows = all(sql, params)
    const customers = rows.map(r => ({
      id: String(r.id),
      name: String(r.name || ''),
      phone: String(r.phone || ''),
      medicalRecordNo: String(r.medical_record_no || ''),
      createdAt: String(r.created_at || ''),
      cardCount: Number(r.card_count) || 0
    }))

    res.json({ success: true, data: { customers } })
  } catch (error) {
    res.status(500).json({ success: false, error: '查询顾客失败' })
  }
})

router.get('/:id/cards', (req: Request, res: Response): void => {
  try {
    const rows = all(
      `SELECT id, customer_id, project_name, total_sessions, used_sessions, frozen_sessions, start_date, expire_date, status, created_at FROM treatment_cards WHERE customer_id = ? ORDER BY created_at DESC`,
      [req.params.id]
    )
    const cards = rows.map(mapCard)
    res.json({ success: true, data: { cards } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取疗程卡失败' })
  }
})

export default router
