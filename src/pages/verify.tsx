import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Protected from "@/components/Protected";
import { CText } from "@/components/calcite/Field";
import { api, ApiError } from "@/lib/api";
import type { WorkerVerify } from "@/lib/types";

const schema = Yup.object({
  code: Yup.string()
    .matches(/^FW-?\d+$/i, "Codes look like FW-0007")
    .required("Enter the worker's code"),
});

function VerifyBody() {
  const [result, setResult] = useState<WorkerVerify | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { code: "" },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      setResult(null);
      setNotFound(null);
      try {
        const res = await api.get<WorkerVerify>(`/api/workers/verify?code=${encodeURIComponent(values.code.trim())}`);
        setResult(res);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) setNotFound("No field worker matches this code.");
        else setNotFound(err instanceof ApiError ? err.message : "Verification failed. Try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });
  const f = formik;

  return (
    <calcite-panel heading="Verify a field worker">
      <div style={{ padding: "0 1rem 1rem" }} className="stack">
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          A genuine field worker carries an ID with a code like <strong>FW-0007</strong>. Enter it to confirm their
          identity before granting access.
        </p>
        <form onSubmit={f.handleSubmit} className="form-grid">
          <CText
            label="Worker code"
            value={f.values.code}
            onChange={(v) => f.setFieldValue("code", v)}
            onBlur={() => f.setFieldTouched("code", true)}
            error={f.errors.code}
            touched={f.touched.code}
            placeholder="FW-0007"
          />
          <calcite-button type="submit" icon-start="search" loading={f.isSubmitting ? "" : undefined} disabled={f.isSubmitting ? "" : undefined}>
            Verify
          </calcite-button>
        </form>

        {notFound ? (
          <calcite-notice open="" kind="warning" icon="exclamation-mark-triangle">
            <div slot="title">Not found</div>
            <div slot="message">{notFound} Do not grant access — call support to confirm.</div>
          </calcite-notice>
        ) : null}

        {result ? (
          <calcite-card>
            <div className="verify-status">
              <div
                className={`verify-badge ${result.verified ? "ok" : "bad"}`}
                aria-hidden="true">
                {result.verified ? "✓" : "✕"}
              </div>
              <strong className="verify-status-label">
                {result.verified ? "Verified field worker" : "Not active — do not admit"}
              </strong>
            </div>
            {result.worker ? (
              <div className="stack" style={{ gap: "0.4rem" }}>
                <div className="row-between">
                  <span className="muted">Name</span>
                  <strong>{result.worker.name}</strong>
                </div>
                <div className="row-between">
                  <span className="muted">Code</span>
                  <span>{result.worker.code}</span>
                </div>
                <div className="row-between">
                  <span className="muted">Role</span>
                  <span>{result.worker.role || "—"}</span>
                </div>
                <div className="row-between">
                  <span className="muted">Area (DMA)</span>
                  <span>{result.worker.dma || "—"}</span>
                </div>
                <div className="row-between">
                  <span className="muted">Capabilities</span>
                  <span>{result.worker.capabilities.join(", ") || "—"}</span>
                </div>
              </div>
            ) : null}
            <div slot="footer-start" className="muted" style={{ fontSize: "0.85rem" }}>
              {result.message}
            </div>
          </calcite-card>
        ) : null}
      </div>
    </calcite-panel>
  );
}

export default function VerifyPage() {
  return (
    <Protected>
      <VerifyBody />
    </Protected>
  );
}
