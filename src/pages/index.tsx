import { useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import Protected from "@/components/Protected";
import { useAuth } from "@/lib/auth";
import { kes, num } from "@/lib/format";
import Chip, { type ChipKind } from "@/components/Chip";
import EmptyState from "@/components/EmptyState";
import type { Meter } from "@/lib/types";

function firstNameOf(
	name: string | null | undefined,
	email: string | null | undefined
): string {
	const n = (name || "").trim();
	if (n) return n.split(/\s+/)[0];
	const e = (email || "").trim();
	return e ? e.split("@")[0] : "there";
}

/** Big "Pay utility bill" CTA. Navigates to the full payment page for a meter;
 *  if several meters owe, a small chooser appears first to pick which one. */
function PayBillButton({ meters }: { meters: Meter[] }) {
	const router = useRouter();
	const [picking, setPicking] = useState(false);

	const payable = meters.filter((m) => m.outstandingBill > 0);
	const goPay = (meterNo: string) =>
		router.push(`/pay/${encodeURIComponent(meterNo)}`);

	const onClick = () => {
		if (payable.length === 1) goPay(payable[0].meterNo);
		else setPicking(true);
	};

	return (
		<>
			<calcite-button
				class="pay-cta"
				width="full"
				scale="l"
				icon-start="credit-card"
				disabled={payable.length ? undefined : ""}
				onClick={onClick}>
				Pay total bill
			</calcite-button>

			{picking ? (
				<calcite-dialog
					open=""
					modal=""
					heading="Choose a meter to pay"
					width-scale="s"
					ref={(el: HTMLElement | null) => {
						if (el)
							el.addEventListener(
								"calciteDialogClose",
								() => setPicking(false),
								{ once: true }
							);
					}}>
					<calcite-list label="Meters with a balance" selection-mode="none">
						{payable.map((m) => (
							<calcite-list-item
								key={m.meterNo}
								label={`Meter ${m.meterNo}`}
								description={`${m.dma || "—"} · ${kes(m.outstandingBill)} outstanding`}
								onClick={() => goPay(m.meterNo)}>
								<calcite-icon slot="content-end" icon="chevron-right" />
							</calcite-list-item>
						))}
					</calcite-list>
					<calcite-button
						slot="footer-end"
						appearance="outline"
						kind="neutral"
						onClick={() => setPicking(false)}>
						Cancel
					</calcite-button>
				</calcite-dialog>
			) : null}
		</>
	);
}

function statusChip(status: string | null) {
	const kind: ChipKind =
		status === "Connected"
			? "success"
			: status === "Suspended"
				? "warning"
				: status === "Disconnected"
					? "danger"
					: "neutral";
	return (
		<Chip slot="footer-start" kind={kind} rounded>
			{status || "Unknown"}
		</Chip>
	);
}

function Dashboard() {
	const router = useRouter();
	const { user } = useAuth();
	const { data, error, isLoading } = useSWR<{ meters: Meter[] }>("/api/meters");

	const firstName = firstNameOf(user?.name, user?.email);
	const meters = data?.meters ?? [];
	const totalOutstanding = meters.reduce(
		(s, m) => s + (m.outstandingBill || 0),
		0
	);

	return (
		<>
			<h1 className="hello">
				<span className="hello-greeting">Hello </span>
				{firstName}
			</h1>

			{isLoading ? (
				<div className="center-pad">
					<calcite-loader label="Loading your account" />
				</div>
			) : error ? (
				<calcite-notice open="" kind="danger" icon="exclamation-mark-triangle">
					<div slot="title">Could not load your account</div>
					<div slot="message">{String(error.message || error)}</div>
				</calcite-notice>
			) : (
				<>
					<div className="stat-hero">
						<div className="stat-hero-label">Total outstanding</div>
						<div
							className="stat-hero-value"
							style={{ color: totalOutstanding > 0 ? "#b3261e" : "#176b2c" }}>
							{kes(totalOutstanding)}
						</div>
					</div>

					<PayBillButton meters={meters} />

					<h2 className="section-title">My meters</h2>

					{meters.length ? (
						<div className="meters">
							{meters.map((m) => (
								<calcite-card
									key={m.meterNo}
									style={{ cursor: "pointer" }}
									onClick={() =>
										router.push(`/meters/${encodeURIComponent(m.meterNo)}`)
									}>
									<div slot="heading">Meter {m.meterNo}</div>
									<div className="stack" style={{ gap: "0.45rem" }}>
										<div className="row-between">
											<span className="muted">Outstanding</span>
											<strong
												style={{
													color: m.outstandingBill > 0 ? "#b3261e" : "#176b2c"
												}}>
												{kes(m.outstandingBill)}
											</strong>
										</div>
										<div className="row-between">
											<span className="muted">Latest reading</span>
											<span>
												{m.latestReading != null
													? `${num(m.latestReading)} m³`
													: "—"}
											</span>
										</div>
										<div className="row-between">
											<span className="muted">Tariff</span>
											<span>{m.tariff || "—"}</span>
										</div>
									</div>
									{statusChip(m.connStatus)}
									<calcite-button
										slot="footer-end"
										scale="s"
										appearance="transparent"
										icon-end="chevron-right">
										Open
									</calcite-button>
								</calcite-card>
							))}
						</div>
					) : (
						<EmptyState
							title="No meters linked to your account yet"
							message="Contact support so your meter can be linked to your email."
						/>
					)}
				</>
			)}
		</>
	);
}

export default function DashboardPage() {
	return (
		<Protected>
			<Dashboard />
		</Protected>
	);
}
