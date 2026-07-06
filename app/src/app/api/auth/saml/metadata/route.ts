import { getSaml } from "@/lib/saml";

// SP metadata document — hand this to the IdP administrator to register the SP.
export async function GET() {
  const saml = getSaml();
  if (!saml) {
    return new Response("SAML is not configured on this deployment.", { status: 501 });
  }
  const metadata = saml.generateServiceProviderMetadata(null, null);
  return new Response(metadata, {
    headers: { "Content-Type": "application/xml" },
  });
}
