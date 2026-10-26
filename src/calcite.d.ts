/**
 * Minimal JSX typings for the Calcite web components used in this app. They are
 * custom elements loaded from the CDN, so we declare them as permissive intrinsic
 * elements (attributes passed through as-is). React 19 resolves intrinsic elements
 * against `React.JSX`, so the augmentation targets the "react" module namespace.
 * Our wrapper components (src/components/calcite/*) bridge the custom events.
 */
import type React from "react";

type CalciteEl = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
  [attr: string]: unknown;
};

type CalciteElements = {
  "calcite-shell": CalciteEl;
  "calcite-shell-panel": CalciteEl;
  "calcite-sheet": CalciteEl;
  "calcite-action": CalciteEl;
  "calcite-action-bar": CalciteEl;
  "calcite-navigation": CalciteEl;
  "calcite-navigation-logo": CalciteEl;
  "calcite-navigation-user": CalciteEl;
  "calcite-menu": CalciteEl;
  "calcite-menu-item": CalciteEl;
  "calcite-panel": CalciteEl;
  "calcite-block": CalciteEl;
  "calcite-block-section": CalciteEl;
  "calcite-card": CalciteEl;
  "calcite-card-group": CalciteEl;
  "calcite-button": CalciteEl;
  "calcite-link": CalciteEl;
  "calcite-icon": CalciteEl;
  "calcite-chip": CalciteEl;
  "calcite-chip-group": CalciteEl;
  "calcite-label": CalciteEl;
  "calcite-input": CalciteEl;
  "calcite-input-text": CalciteEl;
  "calcite-input-number": CalciteEl;
  "calcite-text-area": CalciteEl;
  "calcite-select": CalciteEl;
  "calcite-option": CalciteEl;
  "calcite-combobox": CalciteEl;
  "calcite-combobox-item": CalciteEl;
  "calcite-notice": CalciteEl;
  "calcite-alert": CalciteEl;
  "calcite-loader": CalciteEl;
  "calcite-scrim": CalciteEl;
  "calcite-tabs": CalciteEl;
  "calcite-tab-nav": CalciteEl;
  "calcite-tab-title": CalciteEl;
  "calcite-tab": CalciteEl;
  "calcite-table": CalciteEl;
  "calcite-table-header": CalciteEl;
  "calcite-table-row": CalciteEl;
  "calcite-table-cell": CalciteEl;
  "calcite-checkbox": CalciteEl;
  "calcite-dialog": CalciteEl;
  "calcite-list": CalciteEl;
  "calcite-list-item": CalciteEl;
  "calcite-avatar": CalciteEl;
  "calcite-segmented-control": CalciteEl;
  "calcite-segmented-control-item": CalciteEl;
  "calcite-progress": CalciteEl;
};

// React 19: intrinsic elements live under the React.JSX namespace.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends CalciteElements {}
  }
}

// Fallback for the classic global JSX namespace (older tooling paths).
declare global {
  namespace JSX {
    interface IntrinsicElements extends CalciteElements {}
  }
}

export {};
