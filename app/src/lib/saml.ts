import { SAML, type SamlConfig } from "@node-saml/node-saml";

/**
 * SAML 2.0 Service Provider. Configured from env against the Ministry IdP.
 * Returns null when SAML isn't configured so the endpoints can 501 cleanly.
 */
export function getSaml(): SAML | null {
  const {
    SAML_IDP_ENTRY_POINT,
    SAML_IDP_ISSUER,
    SAML_IDP_CERT,
    SAML_SP_ENTITY_ID,
    SAML_SP_CALLBACK_URL,
  } = process.env;

  if (!SAML_IDP_ENTRY_POINT || !SAML_IDP_CERT || !SAML_SP_ENTITY_ID || !SAML_SP_CALLBACK_URL) {
    return null;
  }

  const config: SamlConfig = {
    entryPoint: SAML_IDP_ENTRY_POINT,
    issuer: SAML_SP_ENTITY_ID,
    callbackUrl: SAML_SP_CALLBACK_URL,
    idpCert: SAML_IDP_CERT.replace(/\\n/g, "\n"),
    audience: SAML_IDP_ISSUER ?? false,
    wantAssertionsSigned: true,
    signatureAlgorithm: "sha256",
    identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
  };
  return new SAML(config);
}

/** Extracts group/role claims from a SAML assertion profile. */
export function extractSamlGroups(profile: Record<string, unknown>): string[] {
  const raw =
    profile["groups"] ??
    profile["http://schemas.xmlsoap.org/claims/Group"] ??
    profile["Role"] ??
    profile["role"];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") return [raw];
  return [];
}
