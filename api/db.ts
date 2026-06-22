import initSqlJs, { type Database } from 'sql.js'

let db: Database

export function getDb(): Database {
  return db
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function run(sql: string, params: unknown[] = []): void {
  db.run(sql, params)
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

export async function initDb(): Promise<void> {
  const SQL = await initSqlJs()
  db = new SQL.Database()

  db.run(`
    CREATE TABLE stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE staff (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL REFERENCES stores(id),
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('receptionist', 'consultant', 'manager'))
    )
  `)

  db.run(`
    CREATE TABLE customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      medical_record_no TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE treatment_cards (
      id TEXT PRIMARY KEY,
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

  db.run(`
    CREATE TABLE appointments (
      id TEXT PRIMARY KEY,
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

  db.run(`
    CREATE TABLE operation_records (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL REFERENCES treatment_cards(id),
      type TEXT NOT NULL CHECK(type IN ('verify', 'appointment', 'cancel_appointment', 'refund', 'gift', 'adjust', 'recover')),
      sessions_changed INTEGER NOT NULL,
      operator_staff TEXT NOT NULL,
      consultant TEXT,
      room TEXT,
      consumables TEXT,
      reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.run(`CREATE INDEX idx_customers_phone ON customers(phone)`)
  db.run(`CREATE INDEX idx_customers_medical_record ON customers(medical_record_no)`)
  db.run(`CREATE INDEX idx_treatment_cards_customer ON treatment_cards(customer_id)`)
  db.run(`CREATE INDEX idx_treatment_cards_status ON treatment_cards(status)`)
  db.run(`CREATE INDEX idx_treatment_cards_expire ON treatment_cards(expire_date)`)
  db.run(`CREATE INDEX idx_appointments_card ON appointments(card_id)`)
  db.run(`CREATE INDEX idx_appointments_date ON appointments(appointment_date)`)
  db.run(`CREATE INDEX idx_appointments_status ON appointments(status)`)
  db.run(`CREATE INDEX idx_operation_records_card ON operation_records(card_id)`)
  db.run(`CREATE INDEX idx_staff_store ON staff(store_id)`)
}
