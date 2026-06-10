import type { Bill } from "@/lib/store";

export function Receipt({ bill, settings }: { bill: Bill; settings: { restaurantName: string; address: string; phone: string; gstNumber: string; footer: string } }) {
  return (
    <div className="receipt hidden print:block">
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{settings.restaurantName}</div>
        <div style={{ fontSize: 11 }}>{settings.address}</div>
        <div style={{ fontSize: 11 }}>Ph: {settings.phone}</div>
        {settings.gstNumber && <div style={{ fontSize: 11 }}>GST: {settings.gstNumber}</div>}
      </div>
      <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", margin: "6px 0", padding: "4px 0", fontSize: 11 }}>
        <div>Bill No: #{bill.billNo}</div>
        <div>Date: {new Date(bill.date).toLocaleString("en-IN")}</div>
        {bill.customer && <div>Customer: {bill.customer}</div>}
        <div>Payment: {bill.paymentType}</div>
      </div>
      <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px dashed #000" }}>
            <th style={{ textAlign: "left" }}>Item</th>
            <th>Qty</th>
            <th style={{ textAlign: "right" }}>Rate</th>
            <th style={{ textAlign: "right" }}>Amt</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((i, idx) => (
            <tr key={idx}>
              <td>
                {i.nameMr} ({i.type === "half" ? "H" : "F"})
              </td>
              <td style={{ textAlign: "center" }}>{i.qty}</td>
              <td style={{ textAlign: "right" }}>{i.rate}</td>
              <td style={{ textAlign: "right" }}>{i.rate * i.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ borderTop: "1px dashed #000", marginTop: 6, paddingTop: 4, fontSize: 12 }}>
        <Row label="Subtotal" v={bill.subtotal} />
        {bill.gst > 0 && <Row label="GST" v={bill.gst} />}
        {bill.discount > 0 && <Row label="Discount" v={-bill.discount} />}
        <Row label="TOTAL" v={bill.total} bold />
      </div>
      <div style={{ textAlign: "center", marginTop: 8, fontSize: 11 }}>{settings.footer}</div>
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
