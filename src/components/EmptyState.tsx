/**
 * Reusable empty-state placeholder, styled after the ArcGIS "no items found"
 * panel: a thin outlined folder-with-magnifier mark, a primary message, and an
 * optional secondary hint. Use anywhere a list/table has nothing to show.
 */
import type { ReactNode } from "react";

export default function EmptyState({
	title,
	message,
	children,
}: {
	title: ReactNode;
	message?: ReactNode;
	children?: ReactNode;
}) {
	return (
		<div className="empty-state">
			<svg
				className="empty-state-art"
				width="88"
				height="88"
				viewBox="0 0 96 96"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true">
				<path d="M14 30h20l6 8h30a4 4 0 0 1 4 4v30a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V30z" />
				<circle cx="44" cy="52" r="11" />
				<line x1="52" y1="60" x2="63" y2="71" />
			</svg>
			<div className="empty-state-title">{title}</div>
			{message ? <div className="empty-state-message">{message}</div> : null}
			{children ? <div className="empty-state-action">{children}</div> : null}
		</div>
	);
}
