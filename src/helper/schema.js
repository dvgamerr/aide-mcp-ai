 
import { jsonb, pgTable, varchar } from 'drizzle-orm/pg-core'

export const reminder = pgTable('reminder', {
  name: varchar('name', { length: 20 }).primaryKey(),
  note: jsonb('note').default('{}').notNull(),
})
