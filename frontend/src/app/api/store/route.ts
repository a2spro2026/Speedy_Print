import { NextResponse } from "next/server";
import { readAllStore, writeStorePatch } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await readAllStore();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/store GET]", err);
    return NextResponse.json(
      { error: "Impossible de lire les données." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
    }
    await writeStorePatch(body as Record<string, unknown>);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/store PUT]", err);
    return NextResponse.json(
      { error: "Impossible d'enregistrer les données." },
      { status: 500 }
    );
  }
}
