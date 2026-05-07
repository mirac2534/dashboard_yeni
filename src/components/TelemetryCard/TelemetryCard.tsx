import type { ReactNode } from 'react';

interface TelemetryCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone?: 'cyan' | 'orange' | 'green';
}

export function TelemetryCard({ icon, label, value, detail, tone = 'cyan' }: TelemetryCardProps) {
  return (
    <article className={`telemetry-card telemetry-card--${tone}`}>
      <div className="telemetry-card__icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}
