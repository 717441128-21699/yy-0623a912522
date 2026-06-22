import initSqlJs, { type Database } from 'sql.js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_DIR = resolve(__dirname, '..', 'data')
const DB_PATH = resolve(DB_DIR, 'treatment.db')

let db: Database

export function getDb(): Database {
  return db
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function saveToDisk(): void {
  try {
    if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true })
    const data = db.export()
    writeFileSync(DB_PATH, Buffer.from(data))
  } catch (err) {
    console.error('Failed to save DB:', err)
  }
}

export function run(sql: string, params: unknown[] = []): void {
  db.run(sql, params)
  saveToDisk()
}

export function all(sql: string, params: unknown[] = []): Record<string, unknown>[] {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const results: Record<string, unknown>[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

export function get(sql: string, params: unknown[] = []): Record<string, unknown> | undefined {
  const results = all(sql, params)
  return results.length > 0 ? results[0] : undefined
}

function createTables(SQL: initSqlJs.SqlJsStatic, buffer?: Buffer): Database {
  const database = buffer ? new SQL.Database(buffer) : new SQL.Database()

  database.run(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL
    )
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL REFERENCES stores(id),
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('receptionist', 'consultant', 'manager'))
    )
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL DEFAULT '' REFERENCES stores(id),
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      medical_record_no TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS treatment_cards (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL DEFAULT '' REFERENCES stores(id),
      customer_id TEXT NOT NULL REFERENCES customers(id),
      project_name TEXT NOT NULL,
      total_sessions INTEGER NOT NULL,
      used_sessions INTEGER NOT NULL DEFAULT 0,
      frozen_sessions INTEGER NOT NULL DEFAULT 0,
      start_date TEXT NOT NULL,
      expire_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'expired', 'frozen', 'refunded')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL DEFAULT '' REFERENCES stores(id),
      card_id TEXT NOT NULL REFERENCES treatment_cards(id),
      customer_id TEXT NOT NULL REFERENCES customers(id),
      project_name TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      operator_staff TEXT NOT NULL,
      room TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'reserved' CHECK(status IN ('reserved', 'verified', 'cancelled', 'expired')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS operation_records (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL DEFAULT '' REFERENCES stores(id),
      card_id TEXT NOT NULL REFERENCES treatment_cards(id),
      type TEXT NOT NULL CHECK(type IN ('verify', 'appointment', 'cancel_appointment', 'refund', 'gift', 'adjust', 'recover')),
      sessions_changed INTEGER NOT NULL,
      operator_staff TEXT NOT NULL,
      consultant TEXT,
      room TEXT,
      consumables TEXT,
      original_project TEXT,
      actual_project TEXT,
      reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  database.run(`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_customers_medical_record ON customers(medical_record_no)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_customers_store ON customers(store_id)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_treatment_cards_customer ON treatment_cards(customer_id)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_treatment_cards_status ON treatment_cards(status)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_treatment_cards_expire ON treatment_cards(expire_date)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_treatment_cards_store ON treatment_cards(store_id)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_appointments_card ON appointments(card_id)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_appointments_store ON appointments(store_id)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_operation_records_card ON operation_records(card_id)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_operation_records_store ON operation_records(store_id)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_staff_store ON staff(store_id)`)

  return database
}

export async function initDb(): Promise<void> {
  const SQL = await initSqlJs()

  let buffer: Buffer | undefined
  try {
    if (existsSync(DB_PATH)) {
      buffer = readFileSync(DB_PATH)
    }
  } catch (err) {
    console.log('No existing DB found, creating new one')
  }

  db = createTables(SQL, buffer)
  saveToDisk()
}

export function isDbSeeded(): boolean {
  const row = get(`SELECT COUNT(*) AS c FROM stores`)
  return Number(row?.c || 0) > 0
}
