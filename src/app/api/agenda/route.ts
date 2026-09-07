import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { citaSolicitudes } from "@/db/schema";

export const runtime = "nodejs";

/**
 * POST /api/agenda
 * Recibe una solicitud de cita y la guarda en PostgreSQL.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    nombre?: unknown;
    contacto?: unknown;
    zona?: unknown;
    concepto?: unknown;
    fechaPreferida?: unknown;
  };

  const nombre =
    typeof body.nombre === "string" ? body.nombre.trim().slice(0, 120) : "";
  const contacto =
    typeof body.contacto === "string" ? body.contacto.trim().slice(0, 200) : "";

  if (!nombre || !contacto) {
    return NextResponse.json(
      { ok: false, error: "Nombre y contacto son obligatorios." },
      { status: 400 }
    );
  }

  try {
    const [row] = await db
      .insert(citaSolicitudes)
      .values({
        nombre,
        contacto,
        zona:
          typeof body.zona === "string" ? body.zona.slice(0, 120) : null,
        concepto:
          typeof body.concepto === "string" ? body.concepto.slice(0, 1000) : null,
        fechaPreferida:
          typeof body.fechaPreferida === "string"
            ? body.fechaPreferida.slice(0, 60)
            : null,
      })
      .returning({ id: citaSolicitudes.id });

    return NextResponse.json({ ok: true, id: row.id });
  } catch (err) {
    console.error("[agenda] error al guardar solicitud:", err);
    return NextResponse.json(
      { ok: false, error: "No pudimos guardar tu solicitud. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
