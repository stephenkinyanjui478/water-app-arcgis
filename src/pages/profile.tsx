import { useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useFormik } from "formik";
import * as Yup from "yup";
import Protected from "@/components/Protected";
import { CText } from "@/components/calcite/Field";
import { useAuth } from "@/lib/auth";
import { api, ApiError, type SessionUser } from "@/lib/api";

const AVATAR_KEY = "/api/profile/avatar";
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the selected file"));
    reader.readAsDataURL(file);
  });
}

function AvatarCard({ user }: { user: SessionUser | null }) {
  const { mutate } = useSWRConfig();
  const { data } = useSWR<{ dataUrl: string | null }>(AVATAR_KEY);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarUrl = data?.dataUrl || null;
  const displayName = user?.name || user?.email || "Customer";

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Choose a JPEG, PNG, WebP or GIF image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Image must be 2 MB or smaller.");
      return;
    }

    setBusy(true);
    try {
      const image = await readAsDataUrl(file);
      await api.post(`${AVATAR_KEY}`, { image });
      await mutate(AVATAR_KEY);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <calcite-panel heading="Profile photo">
      <div style={{ padding: "0 1rem 1rem" }} className="stack">
        <div className="avatar-stack" style={{ marginTop: "0.75rem" }}>
          {avatarUrl ? (
            <img className="avatar-img-lg" src={avatarUrl} alt="Your profile photo" />
          ) : (
            <calcite-avatar className="avatar-lg" scale="l" full-name={displayName} />
          )}
          <div className="stack" style={{ gap: "0.4rem", alignItems: "center", textAlign: "center" }}>
            <calcite-button
              appearance="outline"
              icon-start="upload"
              loading={busy ? "" : undefined}
              disabled={busy ? "" : undefined}
              onClick={() => fileRef.current?.click()}>
              {avatarUrl ? "Change photo" : "Add a photo"}
            </calcite-button>
            <span className="muted" style={{ fontSize: "0.8rem" }}>
              JPEG, PNG, WebP or GIF · up to 2 MB
            </span>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          style={{ display: "none" }}
          onChange={onPick}
        />
        {error ? (
          <calcite-notice open="" kind="danger" icon="exclamation-mark-triangle" scale="s">
            <div slot="message">{error}</div>
          </calcite-notice>
        ) : null}
      </div>
    </calcite-panel>
  );
}

const detailsSchema = Yup.object({
  full_name: Yup.string().trim().max(150, "That name is too long").required("Enter your name"),
  phone: Yup.string()
    .trim()
    .matches(/^[+\d][\d\s-]{6,19}$/, "Enter a valid phone number")
    .required("Enter your phone number"),
});

function DetailsCard() {
  const { user, updateUser } = useAuth();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { full_name: user?.name || "", phone: user?.phone || "" },
    validationSchema: detailsSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setSaved(false);
      setError(null);
      try {
        const res = await api.patch<{ user: SessionUser }>("/api/profile", {
          full_name: values.full_name.trim(),
          phone: values.phone.trim(),
        });
        updateUser({ name: res.user.name, phone: res.user.phone });
        setSaved(true);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not save your details.");
      } finally {
        setSubmitting(false);
      }
    },
  });
  const f = formik;

  return (
    <calcite-panel heading="Account details">
      <form onSubmit={f.handleSubmit} className="form-grid" style={{ padding: "0 1rem 1rem", marginTop: "0.75rem" }}>
        <calcite-label>
          Email
          <calcite-input value={user?.email || ""} read-only="" disabled="" />
        </calcite-label>
        <CText
          label="Full name"
          value={f.values.full_name}
          onChange={(v) => {
            f.setFieldValue("full_name", v);
            setSaved(false);
          }}
          onBlur={() => f.setFieldTouched("full_name", true)}
          error={f.errors.full_name}
          touched={f.touched.full_name}
          autoComplete="name"
        />
        <CText
          label="Phone"
          type="tel"
          value={f.values.phone}
          onChange={(v) => {
            f.setFieldValue("phone", v);
            setSaved(false);
          }}
          onBlur={() => f.setFieldTouched("phone", true)}
          error={f.errors.phone}
          touched={f.touched.phone}
          placeholder="07XX XXX XXX"
          autoComplete="tel"
        />
        {error ? (
          <calcite-notice open="" kind="danger" icon="exclamation-mark-triangle" scale="s">
            <div slot="message">{error}</div>
          </calcite-notice>
        ) : null}
        {saved ? (
          <calcite-notice open="" kind="success" icon="check-circle" scale="s">
            <div slot="message">Your details were saved.</div>
          </calcite-notice>
        ) : null}
        <calcite-button
          type="submit"
          icon-start="save"
          loading={f.isSubmitting ? "" : undefined}
          disabled={f.isSubmitting || !f.dirty ? "" : undefined}>
          Save changes
        </calcite-button>
      </form>
    </calcite-panel>
  );
}

const passwordSchema = Yup.object({
  currentPassword: Yup.string().required("Enter your current password"),
  newPassword: Yup.string()
    .min(8, "At least 8 characters")
    .notOneOf([Yup.ref("currentPassword")], "Choose a password different from the current one")
    .required("Enter a new password"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords do not match")
    .required("Re-enter the new password"),
});

function PasswordCard() {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    validationSchema: passwordSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setSaved(false);
      setError(null);
      try {
        await api.post("/api/profile/password", {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        resetForm();
        setSaved(true);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not change your password.");
      } finally {
        setSubmitting(false);
      }
    },
  });
  const f = formik;

  return (
    <calcite-panel heading="Change password">
      <form onSubmit={f.handleSubmit} className="form-grid" style={{ padding: "0 1rem 1rem", marginTop: "0.75rem" }}>
        <CText
          label="Current password"
          type="password"
          value={f.values.currentPassword}
          onChange={(v) => f.setFieldValue("currentPassword", v)}
          onBlur={() => f.setFieldTouched("currentPassword", true)}
          error={f.errors.currentPassword}
          touched={f.touched.currentPassword}
          autoComplete="current-password"
        />
        <CText
          label="New password"
          type="password"
          value={f.values.newPassword}
          onChange={(v) => f.setFieldValue("newPassword", v)}
          onBlur={() => f.setFieldTouched("newPassword", true)}
          error={f.errors.newPassword}
          touched={f.touched.newPassword}
          autoComplete="new-password"
        />
        <CText
          label="Confirm new password"
          type="password"
          value={f.values.confirmPassword}
          onChange={(v) => f.setFieldValue("confirmPassword", v)}
          onBlur={() => f.setFieldTouched("confirmPassword", true)}
          error={f.errors.confirmPassword}
          touched={f.touched.confirmPassword}
          autoComplete="new-password"
        />
        {error ? (
          <calcite-notice open="" kind="danger" icon="exclamation-mark-triangle" scale="s">
            <div slot="message">{error}</div>
          </calcite-notice>
        ) : null}
        {saved ? (
          <calcite-notice open="" kind="success" icon="check-circle" scale="s">
            <div slot="message">Your password was changed.</div>
          </calcite-notice>
        ) : null}
        <calcite-button
          type="submit"
          icon-start="lock"
          loading={f.isSubmitting ? "" : undefined}
          disabled={f.isSubmitting ? "" : undefined}>
          Update password
        </calcite-button>
      </form>
    </calcite-panel>
  );
}

function ProfileBody() {
  const { user, logout } = useAuth();
  return (
    <div className="stack">
      <AvatarCard user={user} />
      <DetailsCard />
      <PasswordCard />
      <calcite-button appearance="outline" kind="neutral" width="full" icon-start="sign-out" onClick={logout}>
        Sign out
      </calcite-button>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Protected>
      <div className="page-head">
        <div>
          <h2>Profile</h2>
          <p>Your account details and sign-in.</p>
        </div>
      </div>
      <ProfileBody />
    </Protected>
  );
}
