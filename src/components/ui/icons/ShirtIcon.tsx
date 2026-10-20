import type { SVGProps } from 'react';

export default function ShirtIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8 3.5-4.5 2L2 10l3.5 1.5V21h13v-9.5L22 10l-1.5-4.5-4.5-2a4.1 4.1 0 0 1-8 0Z" />
    </svg>
  );
}
