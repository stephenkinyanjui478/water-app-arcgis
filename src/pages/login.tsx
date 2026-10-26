import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { CText, CPassword } from "@/components/calcite/Field";

const loginSchema = Yup.object({
	email: Yup.string()
		.email("Enter a valid email")
		.required("Email is required"),
	password: Yup.string().required("Password is required")
});

export default function LoginPage() {
	const router = useRouter();
	const { user, ready, login } = useAuth();
	const [serverError, setServerError] = useState<string | null>(null);

	useEffect(() => {
		if (ready && user) router.replace("/");
	}, [ready, user, router]);

	const f = useFormik({
		initialValues: { email: "", password: "" },
		validationSchema: loginSchema,
		onSubmit: async (values, { setSubmitting }) => {
			setServerError(null);
			try {
				await login(values.email.trim(), values.password);
				router.replace("/");
			} catch (err) {
				setServerError(
					err instanceof ApiError
						? err.message
						: "Something went wrong. Please try again."
				);
			} finally {
				setSubmitting(false);
			}
		}
	});

	return (
		<div className="auth-wrap">
			<div className="auth-card">
				<calcite-card>
					<div className="auth-header">
						<div className="auth-logo">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src="/logo.png" alt="Logo" />
						</div>
						<h2 className="auth-title">Sign In</h2>
					</div>

					<form
						onSubmit={f.handleSubmit}
						className="form-grid"
						style={{ marginTop: "0.75rem" }}>
						{serverError ? (
							<calcite-notice
								open=""
								kind="danger"
								icon="exclamation-mark-triangle"
								scale="s">
								<div slot="message">{serverError}</div>
							</calcite-notice>
						) : null}

						<CText
							label="Email"
							type="email"
							scale="l"
							autoComplete="email"
							value={f.values.email}
							onChange={(v) => f.setFieldValue("email", v)}
							onBlur={() => f.setFieldTouched("email", true)}
							error={f.errors.email}
							touched={f.touched.email}
							placeholder="you@example.com"
						/>

						<CPassword
							label="Password"
							scale="l"
							autoComplete="current-password"
							value={f.values.password}
							onChange={(v) => f.setFieldValue("password", v)}
							onBlur={() => f.setFieldTouched("password", true)}
							error={f.errors.password}
							touched={f.touched.password}
						/>

						<calcite-link href="/support" className="auth-forgot">
							Forgot password?
						</calcite-link>

						<calcite-button
							width="full"
							scale="l"
							type="submit"
							loading={f.isSubmitting ? "" : undefined}
							disabled={f.isSubmitting ? "" : undefined}>
							Sign in
						</calcite-button>
					</form>
				</calcite-card>
			</div>
		</div>
	);
}
