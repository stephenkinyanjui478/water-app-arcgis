/**
 * Full-page M-Pesa STK Push payment flow. Reached by navigating to
 * /pay/<meterNo> from the dashboard or a meter's page (replacing the old modal).
 * The customer picks which unpaid invoices to settle, confirms a Safaricom
 * number, and we initiate an STK push. We then subscribe to a Server-Sent Events
 * stream (the push lands on the phone; Daraja confirms via callback, with a
 * direct status query as fallback) and update live until it resolves.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import useSWR, { useSWRConfig } from "swr";
import { useFormik } from "formik";
import * as Yup from "yup";
import Protected from "@/components/Protected";
import EmptyState from "@/components/EmptyState";
import { CText } from "@/components/calcite/Field";
import { useAuth } from "@/lib/auth";
import { api, ApiError, API_BASE, getToken } from "@/lib/api";
import { kes } from "@/lib/format";
import type { Invoice } from "@/lib/types";

type Stage = "select" | "waiting" | "success" | "failed";

interface StkResponse {
  checkoutRequestId: string;
  customerMessage: string;
  amount: number;
}
interface StatusResponse {
  status: string;
  resultDesc: string | null;
  mpesaReceipt: string | null;
  amount: number | null;
}

const schema = Yup.object({
  phone: Yup.string()
    .matches(/^(\+?254|0)[17]\d{8}$/, "Enter a valid Safaricom number")
    .required("Phone number is required"),
});

const TERMINAL = ["Success", "Failed", "Cancelled", "ReconcileFailed"];

function PayFlow({ meterNo }: { meterNo: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { mutate } = useSWRConfig();

  const invKey = `/api/meters/${encodeURIComponent(meterNo)}/invoices?status=Unpaid,Partial`;
  const { data, error, isLoading } = useSWR<{ invoices: Invoice[] }>(invKey);
  const unpaid = (data?.invoices ?? []).filter((i) => i.balance > 0);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const seeded = useRef(false);
  useEffect(() => {
    // Seed the selection with every unpaid invoice once they load.
    if (!seeded.current && unpaid.length) {
      seeded.current = true;
      setSelected(new Set(unpaid.map((i) => i.invoiceNo)));
    }
  }, [unpaid]);

  const [stage, setStage] = useState<Stage>("select");
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<StatusResponse | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const closeStream = () => {
    esRef.current?.close();
    esRef.current = null;
  };
  useEffect(() => () => closeStream(), []);

  const selectedInvoices = unpaid.filter((i) => selected.has(i.invoiceNo));
  const total = selectedInvoices.reduce((s, i) => s + i.balance, 0);

  const toggle = (invoiceNo: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(invoiceNo)) next.delete(invoiceNo);
      else next.add(invoiceNo);
      return next;
    });
  };

  // Return to wherever we were launched from (dashboard or this meter's page).
  const from =
    typeof router.query.from === "string" && router.query.from.startsWith("/")
      ? router.query.from
      : `/meters/${encodeURIComponent(meterNo)}`;
  const goBack = () => router.push(from);

  const refreshCaches = () => {
    mutate("/api/meters");
    mutate(invKey);
    mutate(`/api/meters/${encodeURIComponent(meterNo)}/invoices`);
    mutate(`/api/meters/${encodeURIComponent(meterNo)}/payments`);
    mutate(`/api/meters/${encodeURIComponent(meterNo)}/consumption`);
  };

  const settle = (s: StatusResponse) => {
    closeStream();
    setResult(s);
    if (s.status === "Success" || s.status === "ReconcileFailed") {
      setStage("success");
      refreshCaches();
    } else {
      setStage("failed");
      setServerError(s.resultDesc || "The payment was not completed.");
    }
  };

  /** Subscribe to the backend SSE stream and react to each pushed status. */
  const beginStream = (checkoutRequestId: string) => {
    closeStream();
    const url =
      `${API_BASE}/api/payments/stream` +
      `?checkoutRequestId=${encodeURIComponent(checkoutRequestId)}` +
      `&token=${encodeURIComponent(getToken() || "")}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("status", (ev) => {
      const s = JSON.parse((ev as MessageEvent).data) as StatusResponse;
      if (TERMINAL.includes(s.status)) settle(s);
    });
    es.addEventListener("timeout", () => {
      closeStream();
      setStage("failed");
      setServerError("Timed out waiting for confirmation. If you were charged, it will reflect shortly.");
    });
    // On a dropped connection EventSource auto-reconnects and the server replays
    // the latest status, so transient errors need no handling here.
  };

  const formik = useFormik({
    initialValues: { phone: user?.phone || "" },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError(null);
      if (!selected.size) {
        setServerError("Select at least one invoice to pay.");
        setSubmitting(false);
        return;
      }
      try {
        const res = await api.post<StkResponse>("/api/payments/stk", {
          meterNo,
          invoiceNos: [...selected],
          phone: values.phone.trim(),
        });
        setStage("waiting");
        beginStream(res.checkoutRequestId);
      } catch (err) {
        setServerError(err instanceof ApiError ? err.message : "Could not start the payment.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <>
      <div className="page-head">
        <div>
          <calcite-link onClick={goBack} style={{ cursor: "pointer" }} icon-start="chevron-left">
            Back to meter
          </calcite-link>
          <h2 style={{ marginTop: "0.4rem" }}>Pay with M-Pesa</h2>
          <div className="muted">Meter {meterNo}</div>
        </div>
      </div>

      <div className="pay-screen">
        {isLoading ? (
          <div className="center-pad">
            <calcite-loader label="Loading invoices" />
          </div>
        ) : error ? (
          <calcite-notice open="" kind="danger" icon="exclamation-mark-triangle">
            <div slot="title">Could not load invoices</div>
            <div slot="message">{String(error.message || error)}</div>
          </calcite-notice>
        ) : stage === "select" && !unpaid.length ? (
          <EmptyState
            title="Nothing to pay here"
            message="This meter has no unpaid invoices to settle online right now."
          />
        ) : null}

        {!isLoading && !error && stage === "select" && unpaid.length ? (
          <div className="stack">
            {serverError ? (
              <calcite-notice open="" kind="danger" icon="exclamation-mark-triangle" scale="s">
                <div slot="message">{serverError}</div>
              </calcite-notice>
            ) : null}

            <calcite-list label="Unpaid invoices" selection-mode="none">
              {unpaid.map((inv) => (
                <calcite-list-item
                  key={inv.invoiceNo}
                  label={`${inv.invoiceNo} · ${inv.billingCycle}`}
                  description={`${inv.status} · ${kes(inv.balance)} outstanding`}
                  onClick={() => toggle(inv.invoiceNo)}
                >
                  <calcite-checkbox slot="content-start" checked={selected.has(inv.invoiceNo) ? "" : undefined} />
                </calcite-list-item>
              ))}
            </calcite-list>

            <div className="row-between">
              <span className="muted">Total to pay</span>
              <strong style={{ fontSize: "1.2rem" }}>{kes(total)}</strong>
            </div>

            <form onSubmit={formik.handleSubmit} className="form-grid">
              <CText
                label="M-Pesa phone number"
                type="tel"
                value={formik.values.phone}
                onChange={(v) => formik.setFieldValue("phone", v)}
                onBlur={() => formik.setFieldTouched("phone", true)}
                error={formik.errors.phone}
                touched={formik.touched.phone}
                placeholder="07XX XXX XXX"
              />
              <div className="row-between" style={{ gap: "0.75rem" }}>
                <calcite-button appearance="outline" kind="neutral" onClick={goBack}>
                  Cancel
                </calcite-button>
                <calcite-button
                  type="submit"
                  icon-start="mobile"
                  loading={formik.isSubmitting ? "" : undefined}
                  disabled={formik.isSubmitting || total < 1 ? "" : undefined}
                >
                  Pay {kes(total)}
                </calcite-button>
              </div>
            </form>
          </div>
        ) : null}

        {stage === "waiting" ? (
          <div className="center-pad stack" style={{ alignItems: "center" }}>
            <calcite-loader label="Waiting for M-Pesa" />
            <h3 style={{ margin: 0 }}>Check your phone</h3>
            <p className="muted" style={{ maxWidth: 360 }}>
              We&apos;ve sent an M-Pesa request to <strong>{formik.values.phone}</strong>. Enter your PIN to pay{" "}
              <strong>{kes(total)}</strong>. This page will update automatically.
            </p>
          </div>
        ) : null}

        {stage === "success" ? (
          <div className="center-pad stack" style={{ alignItems: "center" }}>
            <calcite-icon icon="check-circle-f" scale="l" style={{ color: "#35ac46" }} />
            <h3 style={{ margin: 0 }}>Payment received</h3>
            <p className="muted" style={{ maxWidth: 360 }}>
              Your invoices have been updated.
            </p>
            <div className="receipt">
              <div className="row-between">
                <span className="muted">Amount paid</span>
                <strong>{kes(result?.amount ?? total)}</strong>
              </div>
              <div className="row-between">
                <span className="muted">Meter</span>
                <span>{meterNo}</span>
              </div>
              {result?.mpesaReceipt ? (
                <div className="row-between">
                  <span className="muted">M-Pesa receipt</span>
                  <strong>{result.mpesaReceipt}</strong>
                </div>
              ) : null}
            </div>
            <calcite-button onClick={goBack} icon-start="check">
              Done
            </calcite-button>
          </div>
        ) : null}

        {stage === "failed" ? (
          <div className="center-pad stack" style={{ alignItems: "center" }}>
            <calcite-icon icon="exclamation-mark-triangle-f" scale="l" style={{ color: "#d83020" }} />
            <h3 style={{ margin: 0 }}>Payment not completed</h3>
            <p className="muted" style={{ maxWidth: 360 }}>
              {serverError || "The request was cancelled or timed out."}
            </p>
            <div className="row-between" style={{ gap: "0.75rem" }}>
              <calcite-button appearance="outline" kind="neutral" onClick={goBack}>
                Back to meter
              </calcite-button>
              <calcite-button
                onClick={() => {
                  setStage("select");
                  setServerError(null);
                }}
                icon-start="refresh"
              >
                Try again
              </calcite-button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

export default function PayPage() {
  const router = useRouter();
  const meterNo = typeof router.query.meterNo === "string" ? router.query.meterNo : "";
  return (
    <Protected>{meterNo ? <PayFlow meterNo={meterNo} /> : <calcite-loader label="Loading" />}</Protected>
  );
}
