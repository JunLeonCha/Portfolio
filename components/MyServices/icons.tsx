import type { SVGProps } from "react";

/** Icônes au trait, 24 × 24, couleur héritée du texte (currentColor). */
function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4.5"
      {...props}
    />
  );
}

export function MonitorIcon() {
  return (
    <Icon>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </Icon>
  );
}

export function DatabaseIcon() {
  return (
    <Icon>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14a9 3 0 0 0 18 0V5" />
      <path d="M3 12a9 3 0 0 0 18 0" />
    </Icon>
  );
}

export function LayersIcon() {
  return (
    <Icon>
      <path d="m12 2 10 5-10 5L2 7Z" />
      <path d="m2 12 10 5 10-5" />
      <path d="m2 17 10 5 10-5" />
    </Icon>
  );
}

export function GaugeIcon() {
  return (
    <Icon>
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
      <path d="m12 14 4-4" />
    </Icon>
  );
}

export function WaveIcon() {
  return (
    <Icon>
      <path d="M2 12c2.5-5 5-5 7.5 0s5 5 7.5 0 3.5-3 5-1.5" />
    </Icon>
  );
}

export function AgentIcon() {
  return (
    <Icon>
      <rect x="8" y="2" width="8" height="6" rx="2" />
      <rect x="2" y="16" width="7" height="6" rx="2" />
      <rect x="15" y="16" width="7" height="6" rx="2" />
      <path d="M12 8v4M5.5 16v-4h13v4" />
    </Icon>
  );
}
