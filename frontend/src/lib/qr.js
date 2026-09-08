/**
 * QR Code Payload Formatter & Traceability Utility
 * Encodes key screening parameters into standard readable format.
 */

export function formatQRPayload(record) {
  if (!record) return "";
  const parts = [
    "PASHUAAHAR_TRACEABILITY",
    `ID:${record.id || "TEST"}`,
    `Date:${record.created_at ? record.created_at.split("T")[0] : new Date().toISOString().split("T")[0]}`,
    `Farmer:${record.farmer_name || "Screening"}`,
    `Type:${record.sample_type || "feed"}${record.feed_subtype ? `-${record.feed_subtype}` : ""}`,
    `Quality:${record.quality_status || "Unknown"}`,
    `Adulteration:${record.adulteration_detected || "None"}`,
    `Protein:${record.protein_pct !== null && record.protein_pct !== undefined ? `${record.protein_pct}%` : "N/A"}`,
    `Moisture:${record.moisture_pct !== null && record.moisture_pct !== undefined ? `${record.moisture_pct}%` : "N/A"}`,
    `Aflatoxin:${record.aflatoxin_ppb !== null && record.aflatoxin_ppb !== undefined ? `${record.aflatoxin_ppb}ppb` : "0ppb"}`,
    record.ph ? `pH:${record.ph}` : null
  ].filter(Boolean);

  return parts.join("|");
}

export function parseQRPayload(payloadStr) {
  if (!payloadStr) return {};
  const segments = payloadStr.split("|");
  const result = {};
  for (const seg of segments) {
    if (seg.includes(":")) {
      const [k, v] = seg.split(":");
      result[k.toLowerCase()] = v;
    }
  }
  return result;
}