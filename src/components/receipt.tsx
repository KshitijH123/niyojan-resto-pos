import type { Bill } from "@/lib/store";

export function Receipt({ bill, settings }: { bill: Bill; settings: { restaurantName: string; address: string; phone: string; gstNumber: string; footer: string } }) {
  const date = new Date(bill.date);
  const formattedDate = date.toLocaleDateString("en-IN");
  const formattedTime = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <div className="receipt-container" style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      padding: "40px 20px", 
      background: "#fdf8f1",
      minHeight: "100vh"
    }}>
      <style>{`
        @media print {
          .receipt-container {
            padding: 0 !important;
            background: none !important;
            min-height: 0 !important;
          }
          .receipt-actions {
            display: none !important;
          }
        }
      `}</style>
      <div className="receipt" style={{
        width: "100%",
        maxWidth: "320px",
        background: "#fffefc",
        padding: "24px",
        borderRadius: "24px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
        color: "#1a1a1a",
        fontFamily: "'Inter', sans-serif"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <img 
            src="/bill-logo.png" 
            alt="Niyojan Resto Logo" 
            className="receipt-logo"
            style={{ 
              maxWidth: "240px", 
              height: "auto", 
              margin: "0 auto 4px",
              display: "block",
              filter: "grayscale(1) contrast(1.5)"
            }} 
          />
          <div className="receipt-header-info" style={{ fontSize: 11, color: "#888" }}>
            {settings.address} · {settings.phone}
          </div>
        </div>

        <div style={{ borderTop: "1px dashed #ddd", margin: "16px 0" }} />

        {/* Bill Info */}
        <div className="receipt-bill-info" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Bill: <strong>ORD-{bill.billNo}</strong></span>
            <span>{formattedDate}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Table: <strong>#01</strong></span>
            <span>{formattedTime}</span>
          </div>
          <div style={{ marginTop: 4, color: "#444" }}>
            Customer: <span style={{ fontWeight: 500 }}>{bill.customer || "Walking Guest"}</span>
          </div>
        </div>

        <div style={{ borderTop: "1px dashed #ddd", margin: "16px 0" }} />

        {/* Items */}
        <table className="receipt-items-table" style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ fontSize: 11, color: "#999", textAlign: "left" }}>
              <th style={{ paddingBottom: 8, fontWeight: 500 }}>ITEM</th>
              <th style={{ paddingBottom: 8, fontWeight: 500, textAlign: "center" }}>QTY</th>
              <th style={{ paddingBottom: 8, fontWeight: 500, textAlign: "right" }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((i, idx) => (
              <tr key={idx}>
                <td style={{ padding: "8px 0" }}>
                  <div className="receipt-item-name" style={{ fontWeight: 600 }}>{i.nameMr}</div>
                  {i.nameEn && <div className="receipt-item-subname" style={{ fontSize: 10, color: "#888" }}>{i.nameEn}</div>}
                </td>
                <td style={{ textAlign: "center", verticalAlign: "top", paddingTop: 8 }}>{i.qty}</td>
                <td style={{ textAlign: "right", verticalAlign: "top", paddingTop: 8, fontWeight: 600 }}>
                  ₹{(i.rate * i.qty).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: "1px dashed #ddd", margin: "16px 0" }} />

        {/* Totals */}
        <div className="receipt-totals" style={{ fontSize: 13, lineHeight: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#666" }}>Subtotal</span>
            <span>₹{bill.subtotal.toFixed(2)}</span>
          </div>
          {bill.gst > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#666" }}>GST (5%)</span>
              <span>₹{bill.gst.toFixed(2)}</span>
            </div>
          )}
          {bill.discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#666" }}>Discount</span>
              <span style={{ color: "#e11d48" }}>-₹{bill.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="receipt-total-row" style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            fontSize: 18, 
            fontWeight: 800, 
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1.5px solid #1a1a1a"
          }}>
            <span>TOTAL</span>
            <span>₹{bill.total.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ borderTop: "1px dashed #ddd", margin: "20px 0" }} />

        {/* Footer */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            Thank you · Visit Again
          </div>
          <div style={{ fontSize: 9, color: "#aaa", letterSpacing: "0.5px" }}>
            POWERED BY NIYOJAN RESTO POS
          </div>
        </div>

        {/* UI Action Buttons (Preview Only) */}
        <div className="receipt-actions" style={{ display: "flex", gap: "10px", marginTop: "32px" }}>
          <button 
            onClick={() => window.print()}
            style={{
              flex: 1,
              background: "#1a1612",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <span style={{ fontSize: "16px" }}>⎙</span> Print
          </button>
          <button 
            style={{
              flex: 1,
              background: "white",
              color: "#1a1612",
              border: "1.5px solid #eee",
              padding: "12px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <span style={{ fontSize: "16px" }}>↓</span> Download
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, v, bold }: { label: string; v: number; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: bold ? 700 : 400 }}>
      <span>{label}</span>
      <span>₹{v.toFixed(2)}</span>
    </div>
  );
}
