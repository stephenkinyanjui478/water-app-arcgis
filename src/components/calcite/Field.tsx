/**
 * Thin React wrappers around Calcite form controls. Calcite emits custom DOM
 * events (calciteInputInput, calciteSelectChange, …) that React 19 does not bind
 * automatically, and it owns its own `.value`. These wrappers bridge both: they
 * attach the event via a ref and push controlled values back onto the element,
 * so Formik can drive them like normal inputs.
 */
import { useEffect, useRef, useState } from "react";

type AnyEl = HTMLElement & { value?: string };

function useCalciteControl(
  value: string,
  onChange: (v: string) => void,
  inputEvent: string,
  onBlur?: () => void,
  blurEvent = "calciteInputChange"
) {
  // Typed loosely: the ref targets a Calcite custom element whose JSX typing is
  // permissive, so this avoids ref-variance friction at the call sites.
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleInput = (e: Event) => onChange(((e.target as AnyEl).value as string) ?? "");
    const handleBlur = () => onBlur?.();
    el.addEventListener(inputEvent, handleInput);
    if (onBlur) el.addEventListener(blurEvent, handleBlur);
    return () => {
      el.removeEventListener(inputEvent, handleInput);
      if (onBlur) el.removeEventListener(blurEvent, handleBlur);
    };
  }, [onChange, onBlur, inputEvent, blurEvent]);

  // Push the controlled value onto the element when it diverges.
  useEffect(() => {
    const el = ref.current;
    if (el && el.value !== value) el.value = value ?? "";
  }, [value]);

  return ref;
}

interface BaseProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  touched?: boolean;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  scale?: "s" | "m" | "l";
}

export function CText({
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  type = "text",
  placeholder,
  disabled,
  required,
  scale,
  autoComplete,
}: BaseProps & { type?: string; autoComplete?: string }) {
  const ref = useCalciteControl(value, onChange, "calciteInputInput", onBlur);
  const invalid = Boolean(touched && error);
  return (
    <calcite-label>
      {label}
      <calcite-input
        ref={ref}
        type={type}
        scale={scale}
        placeholder={placeholder}
        status={invalid ? "invalid" : "idle"}
        validation-message={invalid ? error : undefined}
        validation-icon={invalid ? "" : undefined}
        disabled={disabled ? "" : undefined}
        required={required ? "" : undefined}
        autocomplete={autoComplete}
      />
    </calcite-label>
  );
}

export function CPassword({
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  disabled,
  required,
  scale,
  autoComplete,
}: BaseProps & { autoComplete?: string }) {
  const [show, setShow] = useState(false);
  const ref = useCalciteControl(value, onChange, "calciteInputInput", onBlur);
  const invalid = Boolean(touched && error);
  return (
    <calcite-label>
      {label}
      <calcite-input
        ref={ref}
        type={show ? "text" : "password"}
        scale={scale}
        placeholder={placeholder}
        status={invalid ? "invalid" : "idle"}
        validation-message={invalid ? error : undefined}
        validation-icon={invalid ? "" : undefined}
        disabled={disabled ? "" : undefined}
        required={required ? "" : undefined}
        autocomplete={autoComplete}>
        <calcite-button
          slot="action"
          scale={scale}
          kind="neutral"
          appearance="transparent"
          icon-start={show ? "view-hide" : "view-visible"}
          label={show ? "Hide password" : "Show password"}
          title={show ? "Hide password" : "Show password"}
          onClick={() => setShow((s) => !s)}
        />
      </calcite-input>
    </calcite-label>
  );
}

export function CTextArea({ label, value, onChange, onBlur, error, touched, placeholder, disabled, required }: BaseProps) {
  const ref = useCalciteControl(value, onChange, "calciteTextAreaInput", onBlur, "calciteTextAreaChange");
  const invalid = Boolean(touched && error);
  return (
    <calcite-label>
      {label}
      <calcite-text-area
        ref={ref}
        placeholder={placeholder}
        status={invalid ? "invalid" : "idle"}
        validation-message={invalid ? error : undefined}
        disabled={disabled ? "" : undefined}
        required={required ? "" : undefined}
      />
    </calcite-label>
  );
}

interface SelectProps extends BaseProps {
  options: Array<{ label: string; value: string }>;
}

export function CSelect({ label, value, onChange, onBlur, error, touched, options, disabled, placeholder }: SelectProps) {
  const ref = useCalciteControl(value, onChange, "calciteSelectChange", onBlur, "calciteSelectChange");
  const invalid = Boolean(touched && error);
  return (
    <calcite-label>
      {label}
      <calcite-select ref={ref} status={invalid ? "invalid" : "idle"} disabled={disabled ? "" : undefined} label={label}>
        {placeholder ? <calcite-option value="">{placeholder}</calcite-option> : null}
        {options.map((o) => (
          <calcite-option key={o.value} value={o.value}>
            {o.label}
          </calcite-option>
        ))}
      </calcite-select>
      {invalid ? <span className="field-error">{error}</span> : null}
    </calcite-label>
  );
}
