import { useRouter } from "next/router";
import useSWR from "swr";
import Protected from "@/components/Protected";
import ConsumptionChart from "@/components/ConsumptionChart";
import { kes, num, fmtDate } from "@/lib/format";
import Chip, { type ChipKind } from "@/components/Chip";
import EmptyState from "@/components/EmptyState";
import type { Meter, Invoice, Payment, ConsumptionResponse } from "@/lib/types";

function statusChipKind(s: string): ChipKind {
	if (s === "Paid") return "success";
	if (s === "Partial") return "warning";
	if (s === "Unpaid") return "danger";
	return "neutral";
}

function connStatusKind(s: string | null | undefined): ChipKind {
	if (s === "Connected") return "success";
	if (s === "Suspended") return "warning";
	if (s === "Disconnected") return "danger";
	return "neutral";
}

function MeterDetail({ meterNo }: { meterNo: string }) {
	const router = useRouter();

	const metersKey = "/api/meters";
	const invKey = `/api/meters/${encodeURIComponent(meterNo)}/invoices`;
	const payKey = `/api/meters/${encodeURIComponent(meterNo)}/payments`;
	const consKey = `/api/meters/${encodeURIComponent(meterNo)}/consumption`;

	const { data: metersData } = useSWR<{ meters: Meter[] }>(metersKey);
	const { data: invData, isLoading: invLoading } = useSWR<{
		invoices: Invoice[];
	}>(invKey);
	const { data: payData, isLoading: payLoading } = useSWR<{
		payments: Payment[];
	}>(payKey);
	const { data: consData, isLoading: consLoading } =
		useSWR<ConsumptionResponse>(consKey);

	const meter = metersData?.meters.find((m) => m.meterNo === meterNo);
	const invoices = invData?.invoices ?? [];
	const unpaid = invoices.filter((i) => i.status !== "Paid" && i.balance > 0);
	const payments = payData?.payments ?? [];

	return (
		<>
			<div className="page-head">
				<div>
					<calcite-link
						onClick={() => history.back()}
						style={{ cursor: "pointer" }}
						icon-start="chevron-left">
						Back to meters
					</calcite-link>
					<div
						style={{
							marginTop: "0.4rem",
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center"
						}}>
						<h2>Meter {meterNo}</h2>
						<Chip kind={connStatusKind(meter?.connStatus)} rounded>
							{meter?.connStatus || "—"}
						</Chip>
					</div>
					<div style={{ marginTop: "0.5rem" }}>
						Tariff:{" "}
						<Chip kind="neutral" outline rounded>
							{meter?.tariff || "—"}
						</Chip>
					</div>
				</div>
			</div>

			<div className="stat-hero">
				<div className="stat-hero-label">Outstanding balance</div>
				<div
					className="stat-hero-value"
					style={{
						fontSize: "1.9rem",
						color: (meter?.outstandingBill || 0) > 0 ? "#b3261e" : "#176b2c"
					}}>
					{kes(meter?.outstandingBill)}
				</div>
			</div>

			<calcite-button
				class="pay-cta"
				width="full"
				scale="l"
				icon-start="credit-card"
				disabled={unpaid.length ? undefined : ""}
				onClick={() => router.push(`/pay/${encodeURIComponent(meterNo)}`)}>
				Pay utility bill
			</calcite-button>

			<calcite-tabs>
				<calcite-tab-nav slot="title-group">
					<calcite-tab-title selected="">Invoices</calcite-tab-title>
					<calcite-tab-title>Payments</calcite-tab-title>
					<calcite-tab-title>Consumption</calcite-tab-title>
				</calcite-tab-nav>

				{/* Invoices */}
				<calcite-tab selected="">
					{invLoading ? (
						<calcite-loader label="Loading invoices" />
					) : invoices.length ? (
						<div className="table-scroll">
							<calcite-table caption="Invoices" striped="">
								<calcite-table-row slot="table-header">
									<calcite-table-header heading="Invoice" />
									<calcite-table-header heading="Cycle" />
									<calcite-table-header heading="Consumption" alignment="end" />
									<calcite-table-header heading="Billed" alignment="end" />
									<calcite-table-header heading="Balance" alignment="end" />
									<calcite-table-header heading="Status" />
									<calcite-table-header heading="Date" />
								</calcite-table-row>
								{invoices.map((inv) => (
									<calcite-table-row key={inv.objectId}>
										<calcite-table-cell>{inv.invoiceNo}</calcite-table-cell>
										<calcite-table-cell>{inv.billingCycle}</calcite-table-cell>
										<calcite-table-cell alignment="end">
											{num(inv.consumption)} m³
										</calcite-table-cell>
										<calcite-table-cell alignment="end">
											{kes(inv.billed)}
										</calcite-table-cell>
										<calcite-table-cell alignment="end">
											{kes(inv.balance)}
										</calcite-table-cell>
										<calcite-table-cell>
											<Chip kind={statusChipKind(inv.status)}>
												{inv.status}
											</Chip>
										</calcite-table-cell>
										<calcite-table-cell>
											{fmtDate(inv.invDate)}
										</calcite-table-cell>
									</calcite-table-row>
								))}
							</calcite-table>
						</div>
					) : (
						<EmptyState
							title="No invoices yet"
							message="Invoices for this meter will appear here once a billing cycle has been run."
						/>
					)}
				</calcite-tab>

				{/* Payments */}
				<calcite-tab>
					{payLoading ? (
						<calcite-loader label="Loading payments" />
					) : payments.length ? (
						<div className="table-scroll">
							<calcite-table caption="Payments" striped="">
								<calcite-table-row slot="table-header">
									<calcite-table-header heading="Receipt" />
									<calcite-table-header heading="Date" />
									<calcite-table-header heading="Type" />
									<calcite-table-header heading="Method" />
									<calcite-table-header heading="Cycle" />
									<calcite-table-header heading="Amount" alignment="end" />
								</calcite-table-row>
								{payments.map((p) => (
									<calcite-table-row key={p.objectId}>
										<calcite-table-cell>{p.receiptNo}</calcite-table-cell>
										<calcite-table-cell>
											{fmtDate(p.payDate)}
										</calcite-table-cell>
										<calcite-table-cell>{p.payType}</calcite-table-cell>
										<calcite-table-cell>{p.method}</calcite-table-cell>
										<calcite-table-cell>{p.billingCycle}</calcite-table-cell>
										<calcite-table-cell alignment="end">
											{kes(p.amount)}
										</calcite-table-cell>
									</calcite-table-row>
								))}
							</calcite-table>
						</div>
					) : (
						<EmptyState
							title="No payments yet"
							message="Payments you make against this meter will be listed here."
						/>
					)}
				</calcite-tab>

				{/* Consumption */}
				<calcite-tab>
					{consLoading ? (
						<calcite-loader label="Loading consumption" />
					) : (
						<div className="stack">
							<div className="stat-row">
								<div className="stat">
									<div className="label">Average / cycle</div>
									<div className="value">
										{num(consData?.summary.average ?? 0)} m³
									</div>
								</div>
								<div className="stat">
									<div className="label">Latest</div>
									<div className="value">
										{num(consData?.summary.latest ?? 0)} m³
									</div>
								</div>
								<div className="stat">
									<div className="label">Peak</div>
									<div className="value">
										{num(consData?.summary.peak ?? 0)} m³
									</div>
								</div>
							</div>
							<calcite-block
								open=""
								heading="Consumption — last 6 billing cycles (m³)">
								<ConsumptionChart points={(consData?.points ?? []).slice(-6)} />
							</calcite-block>
						</div>
					)}
				</calcite-tab>
			</calcite-tabs>

		</>
	);
}

export default function MeterPage() {
	const router = useRouter();
	const meterNo =
		typeof router.query.meterNo === "string" ? router.query.meterNo : "";
	return (
		<Protected>
			{meterNo ? (
				<MeterDetail meterNo={meterNo} />
			) : (
				<calcite-loader label="Loading" />
			)}
		</Protected>
	);
}
