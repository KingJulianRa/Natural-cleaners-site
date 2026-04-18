export function getGoogleRedirectUri() {
  return (
    process.env.GOOGLE_REDIRECT_URI ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") + "/api/auth/callback" ||
    "http://localhost:3000/api/auth/callback"
  );
}
