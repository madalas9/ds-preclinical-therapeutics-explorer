"use client";

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  payload?: Record<string, unknown>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

export function PieChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0];

  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-md"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
        color: "var(--text-primary)",
      }}
    >
      <p className="font-medium" style={{ color: "var(--text-primary)" }}>
        {data.name}
      </p>
      <p style={{ color: "var(--text-secondary)" }}>
        {data.value} experiments
      </p>
    </div>
  );
}

export function BarChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0];
  const item = data.payload as {
    canonical_name?: string;
    treatment_short?: string;
    displayName?: string;
  } | undefined;
  const shortName = item?.treatment_short || item?.displayName || data.name;
  const fullName = item?.canonical_name;
  const showFullName = fullName && fullName !== shortName;

  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-md max-w-xs"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
        color: "var(--text-primary)",
      }}
    >
      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
        {shortName}
      </p>
      {showFullName && (
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
          {fullName}
        </p>
      )}
      <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
        <span className="font-medium" style={{ color: "var(--text-primary)" }}>{data.value}</span> studies
      </p>
    </div>
  );
}
