/**
 * Configuration and helpers for Google Business Profile API & OAuth
 */

export function isGoogleSyncEnabled(): boolean {
  // If app's Google Business Profile API access is not approved yet,
  // the sync stays disabled behind this config flag.
  return process.env.GOOGLE_BUSINESS_API_ENABLED === "true";
}

export function getGoogleOAuthCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/api/google/callback`
      : "https://reviewzy.vercel.app/api/google/callback");

  return {
    clientId,
    clientSecret,
    redirectUri,
    isConfigured: Boolean(clientId && clientSecret),
  };
}

export function buildGoogleAuthUrl(slug: string, token: string): string {
  const { clientId, redirectUri, isConfigured } = getGoogleOAuthCredentials();

  const statePayload = Buffer.from(
    JSON.stringify({ slug, token, ts: Date.now() })
  ).toString("base64");

  if (!isConfigured) {
    // If real Google OAuth credentials are not provided in environment,
    // route to our callback with simulated approval mode so owners can test the flow.
    return `/api/google/callback?state=${encodeURIComponent(statePayload)}&code=simulated_auth_code`;
  }

  const scope = "https://www.googleapis.com/auth/business.manage";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scope,
    access_type: "offline",
    prompt: "consent",
    state: statePayload,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
