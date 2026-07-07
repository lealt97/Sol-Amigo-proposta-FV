import { PdfTheme, TransformConfig } from '../../../types/pdfModels';

type CoverValues = {
  clientName?: string;
  powerKwp?: string;
  cityState?: string;
  date?: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  coverImageTransform?: TransformConfig;
  logoTransform?: TransformConfig;
};

type CoverTheme = {
  current: PdfTheme;
  original?: PdfTheme;
};

type ShapeBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

const COLOR_ALIASES: Record<string, keyof PdfTheme> = {
  '#0A2249': 'primary',
  '#051225': 'primary',
  '#0051F0': 'primary',
  '#0051EF': 'primary',
  '#0151EF': 'primary',
  '#39B66A': 'primary',
  '#15AE51': 'primary',
  '#16AF52': 'primary',
  '#C49133': 'secondary',
  '#AFB77D': 'secondary',
  '#FFCC00': 'secondary',
  '#DEC488': 'secondary',
  '#FACB5C': 'accent',
  '#FFD600': 'accent',
  '#64B0F3': 'accent',
  '#1F2A2A': 'neutral',
  '#1E1E1E': 'neutral',
  '#3A3A3C': 'neutral',
  '#183956': 'neutral',
  '#D9D9D9': 'neutral',
};

function normalizeHex(value: string | null) {
  if (!value) return '';
  const color = value.trim();
  if (!color.startsWith('#')) return color;

  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toUpperCase();
  }

  return color.toUpperCase();
}

function shouldSkipPaint(value: string | null) {
  if (!value) return true;
  const paint = value.trim();
  return paint === 'none' || paint === 'transparent' || paint.startsWith('url(') || normalizeHex(paint) === '#FFFFFF';
}

function mapPaint(value: string | null, theme: CoverTheme) {
  if (shouldSkipPaint(value)) return null;

  const normalized = normalizeHex(value);
  if (theme.original) {
    for (const key of Object.keys(theme.original) as Array<keyof PdfTheme>) {
      if (normalizeHex(theme.original[key]) === normalized) return theme.current[key];
    }
  }

  const alias = COLOR_ALIASES[normalized];
  return alias ? theme.current[alias] : null;
}

function applyPaintToElement(element: Element, theme: CoverTheme) {
  const fill = mapPaint(element.getAttribute('fill'), theme);
  if (fill) element.setAttribute('fill', fill);

  const stroke = mapPaint(element.getAttribute('stroke'), theme);
  if (stroke) element.setAttribute('stroke', stroke);
}

function forceGroupPaint(doc: Document, selector: string, color: string) {
  doc.querySelectorAll(selector).forEach((group) => {
    group.querySelectorAll('[fill], [stroke]').forEach((element) => {
      const fill = element.getAttribute('fill');
      const stroke = element.getAttribute('stroke');
      if (fill && !shouldSkipPaint(fill)) element.setAttribute('fill', color);
      if (stroke && !shouldSkipPaint(stroke)) element.setAttribute('stroke', color);
    });
  });
}

function applyTheme(doc: Document, theme: CoverTheme) {
  doc.querySelectorAll('[fill], [stroke]').forEach((element) => applyPaintToElement(element, theme));
  forceGroupPaint(doc, '[id*="cor_primaria"], [id*="Cor_primaria"], [id*="primary"]', theme.current.primary);
  forceGroupPaint(doc, '[id*="cor_secund"], [id*="Cor_secund"], [id*="secondary"]', theme.current.secondary);
}

function setHref(element: Element | null, href: string) {
  if (!element || !href) return;
  element.setAttribute('href', href);
  element.setAttributeNS(XLINK_NS, 'xlink:href', href);
}

function getPatternIdFromFill(fill: string | null) {
  const match = fill?.match(/url\(#([^\)]+)\)/);
  return match?.[1] || null;
}

function isPhotoId(element: Element) {
  const id = element.getAttribute('id')?.toLowerCase() || '';
  return id.includes('foto_aqui') || id.includes('foto aqui') || id.includes('cover-photo');
}

function isSvgShape(element: Element | null) {
  if (!element) return false;
  return ['path', 'rect', 'polygon', 'polyline', 'circle', 'ellipse'].includes(element.tagName.toLowerCase());
}

function findPhotoShape(doc: Document) {
  const byId = Array.from(doc.querySelectorAll('[id]')).find(isPhotoId) || null;

  if (byId && isSvgShape(byId) && getPatternIdFromFill(byId.getAttribute('fill'))) {
    return byId;
  }

  const childShape = byId?.querySelector('[fill^="url(#pattern"], [fill^="url(#"]') || null;
  if (childShape) return childShape;

  return doc.querySelector('[fill^="url(#pattern"], [fill^="url(#"]');
}

function getPatternElement(doc: Document, patternId: string | null) {
  if (!patternId) return null;
  return doc.getElementById(patternId);
}

function removePatternChildren(pattern: Element) {
  while (pattern.firstChild) {
    pattern.removeChild(pattern.firstChild);
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseNumbers(value: string | null) {
  if (!value) return [];
  return (value.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || []).map(Number).filter(Number.isFinite);
}

function boundsFromPoints(points: Array<[number, number]>): ShapeBounds | null {
  if (!points.length) return null;
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) return null;
  if (maxX <= minX || maxY <= minY) return null;

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function getSvgBounds(doc: Document): ShapeBounds {
  const svg = doc.querySelector('svg');
  const viewBox = parseNumbers(svg?.getAttribute('viewBox') || null);
  if (viewBox.length >= 4) {
    return { x: viewBox[0], y: viewBox[1], width: viewBox[2], height: viewBox[3] };
  }

  return {
    x: 0,
    y: 0,
    width: parseFloat(svg?.getAttribute('width') || '595'),
    height: parseFloat(svg?.getAttribute('height') || '842'),
  };
}

function getShapeBounds(shape: Element, doc: Document): ShapeBounds {
  const tagName = shape.tagName.toLowerCase();

  if (tagName === 'rect' || tagName === 'image') {
    const x = parseFloat(shape.getAttribute('x') || '0');
    const y = parseFloat(shape.getAttribute('y') || '0');
    const width = parseFloat(shape.getAttribute('width') || '0');
    const height = parseFloat(shape.getAttribute('height') || '0');
    if (width > 0 && height > 0) return { x, y, width, height };
  }

  if (tagName === 'circle') {
    const cx = parseFloat(shape.getAttribute('cx') || '0');
    const cy = parseFloat(shape.getAttribute('cy') || '0');
    const r = parseFloat(shape.getAttribute('r') || '0');
    if (r > 0) return { x: cx - r, y: cy - r, width: r * 2, height: r * 2 };
  }

  if (tagName === 'ellipse') {
    const cx = parseFloat(shape.getAttribute('cx') || '0');
    const cy = parseFloat(shape.getAttribute('cy') || '0');
    const rx = parseFloat(shape.getAttribute('rx') || '0');
    const ry = parseFloat(shape.getAttribute('ry') || '0');
    if (rx > 0 && ry > 0) return { x: cx - rx, y: cy - ry, width: rx * 2, height: ry * 2 };
  }

  const rawNumbers = parseNumbers(shape.getAttribute(tagName === 'path' ? 'd' : 'points'));
  const points: Array<[number, number]> = [];
  for (let index = 0; index < rawNumbers.length - 1; index += 2) {
    points.push([rawNumbers[index], rawNumbers[index + 1]]);
  }

  return boundsFromPoints(points) || getSvgBounds(doc);
}

function normalizePatternAsFigmaCrop(pattern: Element, bounds: ShapeBounds) {
  pattern.setAttribute('patternUnits', 'userSpaceOnUse');
  pattern.setAttribute('patternContentUnits', 'userSpaceOnUse');
  pattern.setAttribute('x', String(bounds.x));
  pattern.setAttribute('y', String(bounds.y));
  pattern.setAttribute('width', String(bounds.width));
  pattern.setAttribute('height', String(bounds.height));
  pattern.setAttribute('data-pdf-image-mode', 'crop');
  pattern.setAttribute('overflow', 'hidden');
  pattern.removeAttribute('patternTransform');
}

function getImageCropTransform(bounds: ShapeBounds, transform?: TransformConfig) {
  const zoom = Math.max(1, Number(transform?.zoom ?? 1));
  const rotate = Number(transform?.rotate ?? 0);
  const width = bounds.width * zoom;
  const height = bounds.height * zoom;

  let x = bounds.x + (bounds.width - width) / 2;
  let y = bounds.y + (bounds.height - height) / 2;

  if (zoom > 1) {
    x += (Number(transform?.x ?? 0) / 595) * bounds.width;
    y += (Number(transform?.y ?? 0) / 842) * bounds.height;
    x = clamp(x, bounds.x + bounds.width - width, bounds.x);
    y = clamp(y, bounds.y + bounds.height - height, bounds.y);
  }

  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  return {
    x,
    y,
    width,
    height,
    transform: rotate ? `rotate(${rotate} ${centerX} ${centerY})` : '',
  };
}

function applyPhotoAsFigmaCrop(doc: Document, imageUrl?: string | null, transform?: TransformConfig) {
  if (!imageUrl) return;

  const shape = findPhotoShape(doc);
  const patternId = getPatternIdFromFill(shape?.getAttribute('fill') || null);
  const pattern = getPatternElement(doc, patternId);

  if (!shape || !pattern) return;

  const bounds = getShapeBounds(shape, doc);
  normalizePatternAsFigmaCrop(pattern, bounds);
  removePatternChildren(pattern);

  const crop = getImageCropTransform(bounds, transform);
  const image = doc.createElementNS(SVG_NS, 'image');
  image.setAttribute('id', 'cover-photo-image');
  image.setAttribute('data-pdf-role', 'cover-photo-image');
  image.setAttribute('data-pdf-image-mode', 'crop');
  image.setAttribute('x', String(crop.x));
  image.setAttribute('y', String(crop.y));
  image.setAttribute('width', String(crop.width));
  image.setAttribute('height', String(crop.height));
  image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  if (crop.transform) image.setAttribute('transform', crop.transform);
  setHref(image, imageUrl);

  pattern.appendChild(image);
  shape.setAttribute('id', 'cover-photo-shape');
  shape.setAttribute('data-pdf-role', 'cover-photo-shape');
  shape.setAttribute('data-pdf-image-mode', 'crop');
  hidePhotoIcon(doc);
}

function hidePhotoIcon(doc: Document) {
  doc.querySelectorAll('[id*="foto_aqui_icon"], [id*="foto aqui_icon"], [id*="Foto_aqui_icon"], [id*="photo_icon"], [id*="image_icon"]').forEach((element) => {
    element.setAttribute('display', 'none');
  });
}

function replaceLogo(doc: Document, logoUrl?: string | null, transform?: TransformConfig) {
  if (!logoUrl) return;

  const logoText = Array.from(doc.querySelectorAll('[id]')).find((element) => {
    const id = element.getAttribute('id')?.toLowerCase() || '';
    return id.includes('logo');
  });

  if (!logoText) return;

  const image = doc.createElementNS(SVG_NS, 'image');
  image.setAttribute('id', 'company-logo');
  setHref(image, logoUrl);
  image.setAttribute('x', '32');
  image.setAttribute('y', '32');
  image.setAttribute('width', '140');
  image.setAttribute('height', '64');
  image.setAttribute('preserveAspectRatio', 'xMinYMin meet');
  if (transform) image.setAttribute('transform', `translate(${transform.x}, ${transform.y}) scale(${transform.zoom}) rotate(${transform.rotate})`);

  logoText.setAttribute('display', 'none');
  logoText.parentNode?.appendChild(image);
}

function replaceTextContent(text: string, values: CoverValues) {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  if (!clean) return text;
  if (/nome\s+(sobrenome|do cliente)|nome do cliente|nome sobrenome/i.test(clean)) return values.clientName || clean;
  if (/0[,.]00\s*kwp|4\.95\s*kwp/i.test(clean)) return values.powerKwp || clean;
  if (/cidade\s*-?\s*estado|cidade-estado|cidade estado/i.test(clean)) return values.cityState || clean;
  if (/dd\s*\/\s*mm\s*\/\s*aa/i.test(clean)) return values.date || clean;
  if (lower === 'cliente' || lower === 'data') return clean;

  return text;
}

function applyTexts(doc: Document, values: CoverValues) {
  doc.querySelectorAll('text, tspan').forEach((element) => {
    const current = element.textContent || '';
    const next = replaceTextContent(current, values);
    if (next !== current) element.textContent = next;
  });
}

export function buildCoverSvg(svgSource: string, theme: CoverTheme, values: CoverValues = {}) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgSource, 'image/svg+xml');

  applyTheme(doc, theme);
  applyTexts(doc, values);
  applyPhotoAsFigmaCrop(doc, values.coverImageUrl, values.coverImageTransform);
  replaceLogo(doc, values.logoUrl, values.logoTransform);

  return new XMLSerializer().serializeToString(doc);
}
