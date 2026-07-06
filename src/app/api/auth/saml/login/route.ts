import { getSaml } from "@/lib/saml";

// Kicks off SP-initiated SSO: builds the AuthnRequest and redirects to the IdP.
export async function GET() {
  const saml = getSaml();
  if (!saml) {
    return new Response("SAML is not configured on this deployment.", { status: 501 });
  }
  const url = await saml.getAuthorizeUrlAsync("", undefined, {});
  return Response.redirect(url, 302);
}
