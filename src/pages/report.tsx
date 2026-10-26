import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useFormik } from "formik";
import * as Yup from "yup";
import Protected from "@/components/Protected";
import { CSelect, CText, CTextArea } from "@/components/calcite/Field";
import { api, ApiError } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import Chip, { type ChipKind } from "@/components/Chip";
import EmptyState from "@/components/EmptyState";
import IncidentLocationMap, { type LatLng } from "@/components/IncidentLocationMap";
import type { IncidenceType, Incidence } from "@/lib/types";

const schema = Yup.object({
	type: Yup.string().required("Choose the type of incident"),
	description: Yup.string()
		.min(5, "Please give a little more detail")
		.required("A description is required"),
	phone: Yup.string().matches(
		/^$|^(\+?254|0)[17]\d{8}$/,
		"Enter a valid Kenyan phone number"
	),
	latitude: Yup.number().required(),
	longitude: Yup.number().required()
});

function statusKind(s: string): ChipKind {
	if (s === "Completed") return "success";
	if (s === "In Progress" || s === "Assigned") return "warning";
	return "neutral";
}

function ReportBody() {
	const { mutate } = useSWRConfig();
	const [ok, setOk] = useState<string | null>(null);
	const [serverError, setServerError] = useState<string | null>(null);

	const { data: typesData } = useSWR<{ types: IncidenceType[] }>(
		"/api/incidence-types"
	);
	const { data: mine, isLoading } = useSWR<{ incidences: Incidence[] }>(
		"/api/incidences"
	);

	const typeOptions = (typesData?.types ?? []).map((t) => ({
		label: t.name,
		value: t.name
	}));

	const formik = useFormik({
		initialValues: {
			type: "",
			description: "",
			phone: "",
			latitude: null as number | null,
			longitude: null as number | null
		},
		validationSchema: schema,
		onSubmit: async (values, { setSubmitting, resetForm }) => {
			setOk(null);
			setServerError(null);
			try {
				const res = await api.post<{ incidentNo: string }>("/api/incidences", {
					type: values.type,
					description: values.description,
					phone: values.phone || undefined,
					latitude: values.latitude,
					longitude: values.longitude
				});
				setOk(res.incidentNo);
				resetForm();
				mutate("/api/incidences");
			} catch (err) {
				setServerError(
					err instanceof ApiError
						? err.message
						: "Could not submit your report."
				);
			} finally {
				setSubmitting(false);
			}
		}
	});

	const f = formik;
	const incidences = mine?.incidences ?? [];

	return (
		<div className="two-col">
			{ok ? (
				<calcite-alert
					key={ok}
					open=""
					kind="success"
					icon="check-circle"
					label="Report submitted"
					auto-close=""
					auto-close-duration="slow"
					placement="top">
					<div slot="title">Report submitted</div>
					<div slot="message">
						Your reference is {ok}. Our team will follow up.
					</div>
				</calcite-alert>
			) : null}

			<calcite-panel heading="Report an incident">
				<form
					onSubmit={f.handleSubmit}
					className="form-grid"
					style={{ padding: "0 1rem 1rem" }}>
					{serverError ? (
						<calcite-notice
							open=""
							kind="danger"
							icon="exclamation-mark-triangle"
							scale="s">
							<div slot="message">{serverError}</div>
						</calcite-notice>
					) : null}

					<br />

					<CSelect
						label="Type of incident"
						value={f.values.type}
						onChange={(v) => f.setFieldValue("type", v)}
						onBlur={() => f.setFieldTouched("type", true)}
						error={f.errors.type}
						touched={f.touched.type}
						options={typeOptions}
						placeholder="Select a type…"
					/>
					<calcite-label>
						Incident location
						<IncidentLocationMap
							onChange={(loc: LatLng) => {
								f.setFieldValue("latitude", loc.latitude);
								f.setFieldValue("longitude", loc.longitude);
							}}
						/>
						<span className="muted" style={{ fontSize: "0.8rem" }}>
							Drag the map so the pin sits on the incident. Starts at your
							current location.
						</span>
					</calcite-label>
					<CTextArea
						label="Describe the issue"
						value={f.values.description}
						onChange={(v) => f.setFieldValue("description", v)}
						onBlur={() => f.setFieldTouched("description", true)}
						error={f.errors.description}
						touched={f.touched.description}
						placeholder="e.g. Burst pipe on Mimosa Lane flooding the road since this morning."
					/>
					<CText
						label="Callback phone (optional)"
						type="tel"
						value={f.values.phone}
						onChange={(v) => f.setFieldValue("phone", v)}
						onBlur={() => f.setFieldTouched("phone", true)}
						error={f.errors.phone}
						touched={f.touched.phone}
						placeholder="07XX XXX XXX"
					/>
					<calcite-button
						type="submit"
						icon-start="plus"
						loading={f.isSubmitting ? "" : undefined}
						disabled={f.isSubmitting ? "" : undefined}>
						Submit report
					</calcite-button>
				</form>
			</calcite-panel>

			<calcite-panel heading="My reported incidents">
				<div style={{ padding: "0 1rem 1rem" }}>
					{isLoading ? (
						<calcite-loader label="Loading" />
					) : incidences.length ? (
						<calcite-list label="My incidents">
							{incidences.map((it) => (
								<calcite-list-item
									key={it.objectId}
									label={it.type}
									description={`Reported ${fmtDate(it.reportedDate)}`}>
									<span slot="content-end">
										<Chip kind={statusKind(it.status)} rounded>
											{it.status}
										</Chip>
									</span>
								</calcite-list-item>
							))}
						</calcite-list>
					) : (
						<EmptyState
							title="No incidents reported yet"
							message="Incidents you report will be tracked here so you can follow their status."
						/>
					)}
				</div>
			</calcite-panel>
		</div>
	);
}

export default function ReportPage() {
	return (
		<Protected>
			<ReportBody />
		</Protected>
	);
}
