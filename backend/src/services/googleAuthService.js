const { OAuth2Client } = require("google-auth-library");

const googleClientId = String(process.env.GOOGLE_CLIENT_ID || "").trim();
const client = googleClientId ? new OAuth2Client(googleClientId) : null;

/**
 * Returns true if Google OAuth is configured in .env
 */
function isGoogleAuthConfigured() {
  return Boolean(googleClientId && googleClientId !== "your_google_client_id.apps.googleusercontent.com");
}

/**
 * Verifies a Google ID Token credential received from frontend
 * @param {string} idToken - The JWT credential from Google Identity Services
 * @returns {Promise<{email: string, name: string, picture: string, googleId: string, emailVerified: boolean}>}
 */
async function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== "string") {
    throw new Error("Google credential token is required");
  }

  // If a real client ID is configured, verify cryptographically with Google
  if (isGoogleAuthConfigured() && client) {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientId
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error("Unable to retrieve email from Google token");
    }
    return {
      email: payload.email.toLowerCase(),
      name: payload.name || payload.email.split("@")[0],
      picture: payload.picture || "",
      googleId: payload.sub,
      emailVerified: Boolean(payload.email_verified)
    };
  }

  // Fallback / Dev token decoder (decodes JWT payload for development/testing if no client ID set)
  try {
    const parts = idToken.split(".");
    if (parts.length === 3) {
      const payloadJson = Buffer.from(parts[1], "base64").toString("utf8");
      const payload = JSON.parse(payloadJson);
      if (payload && payload.email) {
        return {
          email: payload.email.toLowerCase(),
          name: payload.name || payload.email.split("@")[0],
          picture: payload.picture || "",
          googleId: payload.sub || "google-dev-sub",
          emailVerified: true
        };
      }
    }
  } catch (err) {
    // ignore
  }

  throw new Error("Invalid Google credential token or GOOGLE_CLIENT_ID not configured in .env");
}

module.exports = {
  verifyGoogleIdToken,
  isGoogleAuthConfigured,
  googleClientId
};
