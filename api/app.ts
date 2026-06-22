import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDb, isDbSeeded } from './db.js'
import { initSeed, getStores } from './seed.js'
import customerRoutes from './routes/customers.js'
import cardRoutes from './routes/cards.js'
import appointmentRoutes from './routes/appointments.js'
import alertRoutes from './routes/alerts.js'
import handoverRoutes from './routes/handover.js'

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/customers', customerRoutes)
app.use('/api/cards', cardRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/handover', handoverRoutes)

app.get('/api/stores', (req: Request, res: Response) => {
  res.json({ success: true, data: { stores: getStores() } })
})

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export async function bootstrap() {
  await initDb()
  if (!isDbSeeded()) {
    initSeed()
    console.log('Database initialized with seed data')
  } else {
    console.log('Database loaded from disk')
  }
}

export default app
