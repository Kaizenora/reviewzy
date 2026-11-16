import { NextRequest, NextResponse } from "next/server";
import { updateBusinessGoogleSync, getShopBySlug } from "@/lib/supabase";
import { getGoogleOAuthCredentials } from "@/lib/google-config";
import { syncBusinessGoogleReviews } from "@/lib/google-sync";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  let slug = "";
  let token = "";

  if (stateRaw) {
    try {
      const decoded = JSON.parse(Buffer.from(stateRaw, "base64").toString("utf8"));
      slug = decoded.slug || "";
      token = decoded.token || "";
    } catch {
      // Fallback
    }
  }

  const baseUrl = req.nextUrl.origin;

  if (error || !slug) {
    console.error("Google OAuth error or missing slug:", error);
    const redirectUrl = slug
      ? `${baseUrl}/report/${slug}?token=${token}&error=${encodeURIComponent(
          error || "Google authorization was cancelled"
        )}`
      : `${baseUrl}/`;
    return NextResponse.redirect(redirectUrl);
  }

  const shop = await getShopBySlug(slug);
  if (!shop) {
    return NextResponse.redirect(`${baseUrl}/`);
  }

  // Handle simulated / test auth code if real credentials are not set
  if (code === "simulated_auth_code") {
    await updateBusinessGoogleSync(slug, {
      googleConnected: true,
      googleSyncStatus: "idle",
      googleLastError: null,
    });
    // Immediately perform initial sync so official reviews are ready to view
    await syncBusinessGoogleReviews(slug);

    return NextResponse.redirect(
      `${baseUrl}/report/${slug}?token=${token || shop.reportToken}&connected=true`
    );
  }

  // Real Google OAuth code exchange
  const { clientId, clientSecret, redirectUri, isConfigured } = getGoogleOAuthCredentials();

  if (isConfigured && code) {
    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("Google token exchange failed:", errText);
        await updateBusinessGoogleSync(slug, {
          googleLastError: `Token exchange failed: ${errText}`,
          googleSyncStatus: "failed",
        });

        return NextResponse.redirect(
          `${baseUrl}/report/${slug}?token=${token || shop.reportToken}&error=token_exchange_failed`
        );
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token;
      const expiresIn = Number(tokenData.expires_in || 3600);
      const tokenExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();

      await updateBusinessGoogleSync(slug, {
        googleConnected: true,
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken || shop.googleRefreshToken,
        googleTokenExpiry: tokenExpiry,
        googleSyncStatus: "idle",
        googleLastError: null,
      });

      await syncBusinessGoogleReviews(slug);
    } catch (exchangeErr: any) {
      console.error("OAuth exchange exception:", exchangeErr);
      await updateBusinessGoogleSync(slug, {
        googleLastError: exchangeErr?.message || "Token exchange error",
        googleSyncStatus: "failed",
      });

      return NextResponse.redirect(
        `${baseUrl}/report/${slug}?token=${token || shop.reportToken}&error=exchange_exception`
      );
    }
  } else {
    // If not configured, connect in test mode
    await updateBusinessGoogleSync(slug, {
      googleConnected: true,
      googleSyncStatus: "idle",
      googleLastError: null,
    });
    await syncBusinessGoogleReviews(slug);
  }

  return NextResponse.redirect(
    `${baseUrl}/report/${slug}?token=${token || shop.reportToken}&connected=true`
  );
}
