import { useEffect, useRef } from 'react';
import { ProfessionalSizingCalculator as ProfessionalSizingCalculatorView } from './ProfessionalSizingCalculatorView';

const CONNECTION_AVAILABILITY_LABELS = {
  monophase: 'Monofásica — 30 kWh',
  biphase: 'Bifásica — 50 kWh',
  triphase: 'Trifásica — 100 kWh',
} as const;

type ConnectionType = keyof typeof CONNECTION_AVAILABILITY_LABELS;

const isConnectionType = (value: string): value is ConnectionType => (
  value in CONNECTION_AVAILABILITY_LABELS
);

function synchronizeAvailabilityLabel(root: HTMLElement) {
  const connectionSelect = Array.from(root.querySelectorAll('select')).find((select) => (
    Array.from(select.options).some((option) => option.value === 'monophase')
    && Array.from(select.options).some((option) => option.value === 'biphase')
    && Array.from(select.options).some((option) => option.value === 'triphase')
  ));

  if (!connectionSelect || !isConnectionType(connectionSelect.value)) return;

  const availabilityTerm = Array.from(root.querySelectorAll('dt')).find(
    (term) => term.textContent?.trim() === 'Disponibilidade',
  );
  const availabilityValue = availabilityTerm?.nextElementSibling;

  if (!(availabilityValue instanceof HTMLElement)) return;

  const expectedLabel = CONNECTION_AVAILABILITY_LABELS[connectionSelect.value];
  if (availabilityValue.textContent?.trim() !== expectedLabel) {
    availabilityValue.textContent = expectedLabel;
  }
}

export function ProfessionalSizingCalculator() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const synchronize = () => synchronizeAvailabilityLabel(root);
    synchronize();

    const observer = new MutationObserver(synchronize);
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    root.addEventListener('change', synchronize);

    return () => {
      observer.disconnect();
      root.removeEventListener('change', synchronize);
    };
  }, []);

  return (
    <div ref={rootRef}>
      <ProfessionalSizingCalculatorView />
    </div>
  );
}
