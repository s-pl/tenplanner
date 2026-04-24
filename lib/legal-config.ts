export const legal = {
  companyName:
    process.env.NEXT_PUBLIC_LEGAL_COMPANY_NAME ?? "⚠ LEGAL_COMPANY_NAME no configurado",
  nif:
    process.env.NEXT_PUBLIC_LEGAL_NIF ?? "⚠ LEGAL_NIF no configurado",
  address:
    process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? "⚠ LEGAL_ADDRESS no configurado",
  privacyEmail:
    process.env.NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL ?? "privacidad@tenplanner.app",
  contactEmail:
    process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL ?? "hola@tenplanner.app",
  dpo:
    process.env.NEXT_PUBLIC_LEGAL_DPO ?? null,
  mercantileRegistry:
    process.env.NEXT_PUBLIC_LEGAL_MERCANTILE_REGISTRY ?? null,
};
