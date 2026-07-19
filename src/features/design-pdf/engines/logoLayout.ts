export type LogoDimensions = {
  width: number;
  height: number;
};

export type FittedLogo = LogoDimensions & {
  x: number;
  y: number;
  scale: number;
};

export const DEFAULT_LOGO_SLOT: LogoDimensions = {
  width: 140,
  height: 64,
};

export const COVER_06_LOGO_SLOT: LogoDimensions = {
  width: 140,
  height: 70,
};

export const LOGO_PRESERVE_ASPECT_RATIO = 'xMidYMid meet';

function assertPositiveDimensions(value: LogoDimensions, label: string) {
  if (
    !Number.isFinite(value.width)
    || !Number.isFinite(value.height)
    || value.width <= 0
    || value.height <= 0
  ) {
    throw new Error(`${label} must have positive finite dimensions.`);
  }
}

/**
 * Calculates the same "meet" behavior used by SVG images. The returned logo
 * always fits entirely inside the slot, keeps its original proportion and is
 * centered horizontally and vertically.
 */
export function fitLogoWithinSlot(
  slot: LogoDimensions,
  source: LogoDimensions,
): FittedLogo {
  assertPositiveDimensions(slot, 'Logo slot');
  assertPositiveDimensions(source, 'Logo source');

  const scale = Math.min(slot.width / source.width, slot.height / source.height);
  const width = source.width * scale;
  const height = source.height * scale;

  return {
    width,
    height,
    x: (slot.width - width) / 2,
    y: (slot.height - height) / 2,
    scale,
  };
}
