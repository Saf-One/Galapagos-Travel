import {NextRequest} from "next/server";
import {getCurrentUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

// === CONFIGURABLE VALUES ===
// Admin-guarded CSV export of all bookings. Streams text/csv with a BOM so
// Excel renders UTF-8 correctly. Columns: reference, package, guest email,
// start date, guests, total (currency), status.
export const dynamic = "force-dynamic";

function csvCell(value: string): string {
  // Escape double quotes and wrap in quotes if needed.
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return new Response("Unauthorized", {status: 401});
  }

  let bookings: Array<{
    reference: string;
    status: string;
    startDate: Date;
    guests: number;
    totalCents: number;
    currency: string;
    package: {title: string};
    user: {email: string} | null;
  }> = [];

  try {
    bookings = await prisma.booking.findMany({
      orderBy: {createdAt: "desc"},
      include: {
        package: {select: {title: true}},
        user: {select: {email: true}},
      },
    });
  } catch {
    bookings = [];
  }

  const header = [
    "reference",
    "package",
    "guest_email",
    "start_date",
    "guests",
    "total_amount",
    "currency",
    "status",
  ];

  const lines = [header.map(csvCell).join(",")];

  for (const b of bookings) {
    const row = [
      b.reference,
      b.package.title,
      b.user?.email ?? "guest",
      new Date(b.startDate).toISOString().slice(0, 10),
      String(b.guests),
      (b.totalCents / 100).toFixed(2),
      b.currency,
      b.status,
    ];
    lines.push(row.map(csvCell).join(","));
  }

  const csv = "﻿" + lines.join("\r\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings-export.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
