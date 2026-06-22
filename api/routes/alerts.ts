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
    customerName: String(r.customer_name || ''),
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

router.get('/', (req: Request, res: Response): void => {
  try {
    const type = req.query.type as string || 'all'

    const cards = all(`
      SELECT tc.id, tc.customer_id, tc.project_name, tc.total_sessions,
             tc.used_sessions, tc.frozen_sessions, tc.start_date,
             tc.expire_date, tc.status, tc.created_at,
             c.name AS customer_name
      FROM treatment_cards tc
      LEFT JOIN customers c ON c.id = tc.customer_id
      WHERE tc.status IN ('active', 'frozen')
    `)

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const alerts: Record<string, unknown>[] = []

    for (const r of cards) {
      const remaining = Number(r.total_sessions) - Number(r.used_sessions) - Number(r.frozen_sessions)
      const expireDate = new Date(r.expire_date as string)
      expireDate.setHours(0, 0, 0, 0)
      const daysLeft = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      const isExpiring = daysLeft >= 0 && daysLeft <= 7
      const isLowSessions = remaining === 1

      if (type === 'expiring' && isExpiring) {
        alerts.push({
          ...mapCard(r),
          alertType: 'expiring',
          daysLeft
        })
      } else if (type === 'low_sessions' && isLowSessions) {
        alerts.push({
          ...mapCard(r),
          alertType: 'low_sessions'
        })
      } else if (type === 'all') {
        if (isExpiring) {
          alerts.push({
            ...mapCard(r),
            alertType: 'expiring',
            daysLeft
          })
        }
        if (isLowSessions) {
          alerts.push({
            ...mapCard(r),
            alertType: 'low_sessions'
          })
        }
      }
    }

    res.json({ success: true, data: { alerts } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取预警列表失败' })
  }
})

export default router
