import { neon } from "@neondatabase/serverless";

export type BookingRecord = {
  id: string;
  submittedAt: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  price: number;
  serviceLevel: string;
  slotLabel: string;
  slotStart: string;
  slotEnd: string;
};

type BookingInsert = Omit<BookingRecord, "id" | "submittedAt">;

let initPromise: Promise<void> | null = null;

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL ||
    ""
  );
}

function getSql() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      "Database is not configured. Add DATABASE_URL from your Neon project."
    );
  }

  return neon(databaseUrl);
}

async function ensureBookingsTable() {
  if (!initPromise) {
    const sql = getSql();

    initPromise = sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id text PRIMARY KEY,
        submitted_at timestamptz NOT NULL,
        name text NOT NULL,
        address text NOT NULL,
        phone text NOT NULL,
        email text NOT NULL,
        price numeric(10, 2) NOT NULL,
        service_level text NOT NULL DEFAULT '',
        slot_label text NOT NULL,
        slot_start timestamptz NOT NULL,
        slot_end timestamptz NOT NULL
      );
    `
      .then(() =>
        sql`
          ALTER TABLE bookings
          ADD COLUMN IF NOT EXISTS service_level text NOT NULL DEFAULT '';
        `
      )
      .then(() => undefined);
  }

  await initPromise;
}

export async function createBooking(input: BookingInsert): Promise<BookingRecord> {
  await ensureBookingsTable();

  const sql = getSql();
  const booking: BookingRecord = {
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
    ...input,
  };

  await sql`
    INSERT INTO bookings (
      id,
      submitted_at,
      name,
      address,
      phone,
      email,
      price,
      service_level,
      slot_label,
      slot_start,
      slot_end
    ) VALUES (
      ${booking.id},
      ${booking.submittedAt},
      ${booking.name},
      ${booking.address},
      ${booking.phone},
      ${booking.email},
      ${booking.price},
      ${booking.serviceLevel},
      ${booking.slotLabel},
      ${booking.slotStart},
      ${booking.slotEnd}
    );
  `;

  return booking;
}
