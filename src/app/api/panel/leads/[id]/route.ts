import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { citas, citaSolicitudes } from "@/db/schema";
import { ensureSchema } from "@/db/ensure-schema";
import { isPanelAuthed } from "@/lib/panel/auth";
import { composeMensaje, detectWhatsApp } from "@/lib/panel/config";

export const runtime = "nodejs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isPanelAuthed())) {
    return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) {
    return NextResponse.json({ ok: false, error: "id inválido" }, { status: 400 });
  }
  const body = (await req.json().catch(() => ({}))) as { accion?: unknown };
  const accion = body.accion;
  if (accion !== "aceptar" && accion !== "declinar") {
    return NextResponse.json(
      { ok: false, error: "acción inválida" },
      { status: 400 }
    );
  }

  await ensureSchema();
  try {
    /* Leemos el estado previo: la cita en agenda solo se crea en la
       transición nuevo → aceptado (no al "contactar" de nuevo). */
    const [prev] = await db
      .select({ estado: citaSolicitudes.estado })
      .from(citaSolicitudes)
      .where(eq(citaSolicitudes.id, idNum));

    if (!prev) {
      return NextResponse.json(
        { ok: false, error: "no existe esa solicitud" },
        { status: 404 }
      );
    }

    const wasNuevo = prev.estado === "nuevo";

    const [row] = await db
      .update(citaSolicitudes)
      .set({
        estado: accion === "aceptar" ? "aceptado" : "declinado",
        respondidoEn: new Date(),
      })
      .where(eq(citaSolicitudes.id, idNum))
      .returning({
        nombre: citaSolicitudes.nombre,
        contacto: citaSolicitudes.contacto,
        zona: citaSolicitudes.zona,
        concepto: citaSolicitudes.concepto,
        fechaPreferida: citaSolicitudes.fechaPreferida,
        simulacion: citaSolicitudes.simulacion,
        estado: citaSolicitudes.estado,
      });

    /* Cita automática en la agenda si aceptamos y hay fecha válida */
    let citaCreada = false;
    if (
      accion === "aceptar" &&
      wasNuevo &&
      row?.fechaPreferida &&
      DATE_RE.test(row.fechaPreferida)
    ) {
      await db.insert(citas).values({
        fecha: row.fechaPreferida,
        titulo: `Cita con ${row.nombre}`.slice(0, 200),
        detalle: [row.zona, row.concepto].filter(Boolean).join(" · ").slice(0, 500) || null,
      });
      citaCreada = true;
    }

    /* Al aceptar: el sistema redacta el mensaje para el cliente.
       El artista solo da el clic final (WhatsApp o copiar). */
    const mensaje = composeMensaje(row);
    const wa = detectWhatsApp(row.contacto);
    const whatsapp = wa
      ? `https://wa.me/${wa}?text=${encodeURIComponent(mensaje)}`
      : null;

    return NextResponse.json({
      ok: true,
      estado: row.estado,
      mensaje,
      whatsapp,
      citaCreada,
    });
  } catch (err) {
    console.error("[panel] error al actualizar lead:", err);
    return NextResponse.json(
      { ok: false, error: "No pudimos actualizar la solicitud." },
      { status: 500 }
    );
  }
}
