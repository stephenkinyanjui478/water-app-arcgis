import useSWR from "swr";
import Protected from "@/components/Protected";
import type { Support } from "@/lib/types";

function ContactRow({ icon, label, value, href }: { icon: string; label: string; value: string; href?: string }) {
  return (
    <calcite-list-item label={label} description={value}>
      <calcite-icon slot="content-start" icon={icon} />
      {href ? (
        <calcite-link slot="content-end" href={href}>
          Open
        </calcite-link>
      ) : null}
    </calcite-list-item>
  );
}

function SupportBody() {
  const { data } = useSWR<{ support: Support }>("/api/support");
  const s = data?.support;

  return (
    <calcite-panel heading="Contact support">
      <div style={{ padding: "0 0 1rem" }}>
        {!s ? (
          <div style={{ padding: "1rem" }}>
            <calcite-loader label="Loading" />
          </div>
        ) : (
          <calcite-list label="Support contacts">
            <ContactRow icon="phone" label="Call centre" value={s.callCentre} href={`tel:${s.callCentre}`} />
            <ContactRow icon="exclamation-mark-triangle" label="Emergency line" value={s.emergencyLine} href={`tel:${s.emergencyLine}`} />
            <ContactRow icon="speech-bubble" label="WhatsApp" value={s.whatsapp} href={`https://wa.me/${s.whatsapp.replace(/[^\d]/g, "")}`} />
            <ContactRow icon="envelope" label="Email" value={s.email} href={`mailto:${s.email}`} />
            <ContactRow icon="clock" label="Hours" value={s.hours} />
            <ContactRow icon="pin-tear" label="Office" value={s.address} />
            {s.payBill ? <ContactRow icon="credit-card" label="M-Pesa Pay Bill" value={s.payBill} /> : null}
          </calcite-list>
        )}
      </div>
    </calcite-panel>
  );
}

export default function SupportPage() {
  return (
    <Protected>
      <div className="page-head">
        <div>
          <h2>Get help</h2>
          <p>Reach our team by phone, WhatsApp or email — we&apos;re here when you need us.</p>
        </div>
      </div>
      <SupportBody />
    </Protected>
  );
}
