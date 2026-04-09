import { Resend } from "resend";

let connectionSettings: { settings: { api_key: string; from_email: string } } | null = null;

async function getCredentials(): Promise<{ apiKey: string; fromEmail: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (!hostname || !xReplitToken) {
    throw new Error("Resend: missing Replit connector credentials");
  }

  const data = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=resend`,
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    }
  ).then((r) => r.json());

  connectionSettings = data.items?.[0] ?? null;
  if (!connectionSettings?.settings?.api_key) {
    throw new Error("Resend not connected");
  }
  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: connectionSettings.settings.from_email || "noreply@gymlink.app",
  };
}

export async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return { client: new Resend(apiKey), fromEmail };
}
