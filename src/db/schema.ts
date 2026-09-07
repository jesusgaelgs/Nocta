import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Solicitudes de cita desde /agenda.
 * No toca nada de la experiencia /archivo ni de la portada.
 */
export const citaSolicitudes = pgTable("cita_solicitudes", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 120 }).notNull(),
  contacto: varchar("contacto", { length: 200 }).notNull(),
  zona: varchar("zona", { length: 120 }),
  concepto: text("concepto"),
  fechaPreferida: varchar("fecha_preferida", { length: 60 }),
  creadoEn: timestamp("creado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
