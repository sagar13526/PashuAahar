import React from "react";
import { QRCodeSVG } from "qrcode.react";

export function QRBadge({ payload, size = 150 }) {
  return (
    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm inline-block">
      <QRCodeSVG
        value={payload || "PASHUAAHAR"}
        size={size}
        level="M"
        includeMargin={false}
        className="w-full h-auto"
      />
    </div>
  );
}

export default QRBadge;