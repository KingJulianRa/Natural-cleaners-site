import { getSql } from "@/lib/database";

export type StoredGoogleTokens = {
  accessToken: string;
  refreshToken: string;
};

let initPromise: Promise<void> | null = null;

async function ensureGoogleTokensTable() {
  if (!initPromise) {
    const sql = getSql();

    initPromise = sql`
      CREATE TABLE IF NOT EXISTS google_oauth_tokens (
        id text PRIMARY KEY,
        access_token text NOT NULL DEFAULT '',
        refresh_token text NOT NULL DEFAULT '',
        updated_at timestamptz NOT NULL
      );
    `.then(() => undefined);
  }

  await initPromise;
}

export async function saveGoogleTokens(tokens: {
  accessToken?: string | null;
  refreshToken?: string | null;
}) {
  await ensureGoogleTokensTable();

  const sql = getSql();
  const accessToken = tokens.accessToken?.trim() || "";
  const refreshToken = tokens.refreshToken?.trim() || "";

  await sql`
    INSERT INTO google_oauth_tokens (
      id,
      access_token,
      refresh_token,
      updated_at
    ) VALUES (
      'primary',
      ${accessToken},
      ${refreshToken},
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      access_token = CASE
        WHEN ${accessToken} <> '' THEN ${accessToken}
        ELSE google_oauth_tokens.access_token
      END,
      refresh_token = CASE
        WHEN ${refreshToken} <> '' THEN ${refreshToken}
        ELSE google_oauth_tokens.refresh_token
      END,
      updated_at = NOW();
  `;
}

export async function getStoredGoogleTokens(): Promise<StoredGoogleTokens | null> {
  await ensureGoogleTokensTable();

  const sql = getSql();
  const rows = (await sql`
    SELECT access_token, refresh_token
    FROM google_oauth_tokens
    WHERE id = 'primary'
    LIMIT 1;
  `) as Array<{
    access_token: string;
    refresh_token: string;
  }>;

  const row = rows[0];

  if (!row) {
    return null;
  }

  const accessToken = row.access_token?.trim() || "";
  const refreshToken = row.refresh_token?.trim() || "";

  if (!accessToken && !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
  };
}
