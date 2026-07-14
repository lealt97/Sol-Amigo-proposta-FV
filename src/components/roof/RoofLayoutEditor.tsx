import { KeyboardEvent, MouseEvent, PointerEvent, useMemo, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import {
  DEFAULT_ROOF_LAYOUT_STRINGS,
  EMPTY_ROOF_LAYOUT,
  RoofLayoutData,
  RoofLayoutModule,
  RoofLayoutPerspective,
  RoofLayoutString,
} from '../../types/roofLayout';

interface RoofLayoutEditorProps {
  value?: RoofLayoutData | null;
  onChange: (value: RoofLayoutData) => void;
  roofImageUrl?: string | null;
  moduleWidthM?: number;
  moduleHeightM?: number;
}

type DragState = {
  id: string;
  offsetX: number;
  offsetY: number;
  selectedIds: string[];
  initialModules: Array<Pick<RoofLayoutModule, 'id' | 'x' | 'y' | 'width' | 'height'>>;
  createdModules?: RoofLayoutModule[];
};

type ContextMenuState = {
  x: number;
  y: number;
  moduleIds: string[];
};

type PerspectivePoint = { x: number; y: number };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const round = (value: number) => Number(value.toFixed(2));
const STRING_COLORS = ['#9333EA', '#EA580C', '#0891B2', '#4D7C0F', '#2563EB', '#DC2626', '#16A34A'];
const DEFAULT_PERSPECTIVE: RoofLayoutPerspective = {
  topLeftX: 0,
  topLeftY: 0,
  topRightX: 0,
  topRightY: 0,
  bottomRightX: 0,
  bottomRightY: 0,
  bottomLeftX: 0,
  bottomLeftY: 0,
};
const PERSPECTIVE_LIMIT = 45;

function normalizePerspective(value?: Partial<RoofLayoutPerspective> | null): RoofLayoutPerspective {
  return {
    ...DEFAULT_PERSPECTIVE,
    ...value,
  };
}

function normalizeLayout(value?: RoofLayoutData | null): RoofLayoutData {
  const strings = value?.strings?.length ? value.strings : DEFAULT_ROOF_LAYOUT_STRINGS;

  return {
    ...EMPTY_ROOF_LAYOUT,
    ...value,
    version: value?.version || 1,
    strings,
    modules: (value?.modules || []).map((module) => ({
      ...module,
      width: module.width || 6,
      height: module.height || 13,
      rotation: module.rotation || 0,
      skewX: module.skewX || 0,
      skewY: module.skewY || 0,
      stringId: module.stringId || strings[0]?.id || 'string-1',
      perspective: normalizePerspective(module.perspective),
    })),
  };
}

function countModulesByString(modules: RoofLayoutModule[], stringId: string) {
  return modules.filter((module) => module.stringId === stringId).length;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest('input, textarea, select, [contenteditable="true"]');
}

function getPerspectivePoints(perspective?: RoofLayoutPerspective): PerspectivePoint[] {
  const value = normalizePerspective(perspective);

  return [
    { x: clamp(value.topLeftX, -PERSPECTIVE_LIMIT, PERSPECTIVE_LIMIT), y: clamp(value.topLeftY, -PERSPECTIVE_LIMIT, PERSPECTIVE_LIMIT) },
    { x: clamp(100 + value.topRightX, 100 - PERSPECTIVE_LIMIT, 100 + PERSPECTIVE_LIMIT), y: clamp(value.topRightY, -PERSPECTIVE_LIMIT, PERSPECTIVE_LIMIT) },
    { x: clamp(100 + value.bottomRightX, 100 - PERSPECTIVE_LIMIT, 100 + PERSPECTIVE_LIMIT), y: clamp(100 + value.bottomRightY, 100 - PERSPECTIVE_LIMIT, 100 + PERSPECTIVE_LIMIT) },
    { x: clamp(value.bottomLeftX, -PERSPECTIVE_LIMIT, PERSPECTIVE_LIMIT), y: clamp(100 + value.bottomLeftY, 100 - PERSPECTIVE_LIMIT, 100 + PERSPECTIVE_LIMIT) },
  ];
}

function pointsToString(points: PerspectivePoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

function getInsetPoints(points: PerspectivePoint[], inset = 0.16) {
  const center = points.reduce(
    (acc, point) => ({ x: acc.x + point.x / points.length, y: acc.y + point.y / points.length }),
    { x: 0, y: 0 }
  );

  return points.map((point) => ({
    x: round(point.x + (center.x - point.x) * inset),
    y: round(point.y + (center.y - point.y) * inset),
  }));
}

function PerspectiveModuleSvg({ color, label, perspective }: { color: string; label: string; perspective?: RoofLayoutPerspective }) {
  const outerPoints = getPerspectivePoints(perspective);
  const innerPoints = getInsetPoints(outerPoints);
  const center = outerPoints.reduce(
    (acc, point) => ({ x: acc.x + point.x / outerPoints.length, y: acc.y + point.y / outerPoints.length }),
    { x: 0, y: 0 }
  );

  return (
    <svg className="h-full w-full drop-shadow-sm" viewBox="-45 -45 190 190" preserveAspectRatio="none" aria-hidden="true">
      <polygon points={pointsToString(outerPoints)} fill="#000000" />
      <polygon points={pointsToString(innerPoints)} fill={color} />
      <polyline points={`${innerPoints[0].x},${innerPoints[0].y} ${center.x},${center.y} ${innerPoints[1].x},${innerPoints[1].y}`} fill="none" stroke="#000000" strokeWidth="1.8" opacity="0.28" />
      <polyline points={`${innerPoints[3].x},${innerPoints[3].y} ${center.x},${center.y} ${innerPoints[2].x},${innerPoints[2].y}`} fill="none" stroke="#000000" strokeWidth="1.8" opacity="0.28" />
      <text x={center.x} y={center.y + 9} textAnchor="middle" fontSize="16" fontFamily="Arial, sans-serif" fill="#000000">
        {label}
      </text>
    </svg>
  );
}

function SelectionBorderSvg({ perspective }: { perspective?: RoofLayoutPerspective }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="-45 -45 190 190" preserveAspectRatio="none" aria-hidden="true">
      <polygon points={pointsToString(getPerspectivePoints(perspective))} fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke" className="text-brand-blue" />
    </svg>
  );
}

export function RoofLayoutEditor({
  value,
  onChange,
  roofImageUrl,
  moduleWidthM = 1.13,
  moduleHeightM = 2.28,
}: RoofLayoutEditorProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const layout = normalizeLayout(value);

  const [selectedStringId, setSelectedStringId] = useState(layout.strings[0]?.id || 'string-1');
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>(layout.modules[0]?.id ? [layout.modules[0].id] : []);
  const [moduleClipboard, setModuleClipboard] = useState<RoofLayoutModule[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const validSelectedModuleIds = useMemo(
    () => selectedModuleIds.filter((id) => layout.modules.some((module) => module.id === id)),
    [layout.modules, selectedModuleIds]
  );

  const selectedModules = useMemo(
    () => layout.modules.filter((module) => validSelectedModuleIds.includes(module.id)),
    [layout.modules, validSelectedModuleIds]
  );

  const selectedModule = selectedModules[0] || null;
  const selectedCount = selectedModules.length;
  const selectedPerspective = normalizePerspective(selectedModule?.perspective);
  const moduleArea = moduleWidthM * moduleHeightM;
  const occupiedArea = layout.modules.length * moduleArea;

  const commitLayout = (nextLayout: RoofLayoutData) => {
    onChange({
      ...nextLayout,
      version: nextLayout.version || 1,
    });
  };

  const updateModules = (modules: RoofLayoutModule[]) => {
    commitLayout({ ...layout, modules });
  };

  const updateStrings = (strings: RoofLayoutString[]) => {
    commitLayout({ ...layout, strings });
  };

  const createModule = (index: number, x: number, y: number): RoofLayoutModule => ({
    id: `mod-${Date.now()}-${index}`,
    x: clamp(x, 0, 94),
    y: clamp(y, 0, 87),
    width: 6,
    height: 13,
    rotation: 0,
    skewX: 0,
    skewY: 0,
    perspective: DEFAULT_PERSPECTIVE,
    stringId: selectedStringId,
  });

  const createString = (): RoofLayoutString => {
    const index = layout.strings.length + 1;
    return {
      id: `string-${Date.now()}`,
      name: `String ${index}`,
      color: STRING_COLORS[(index - 1) % STRING_COLORS.length],
    };
  };

  const addModule = () => {
    const index = layout.modules.length;
    const nextModule = createModule(index, 5 + (index % 8) * 8, 8 + Math.floor(index / 8) * 15);
    updateModules([...layout.modules, nextModule]);
    setSelectedModuleIds([nextModule.id]);
  };

  const addModuleRow = () => {
    const startIndex = layout.modules.length;
    const row = Array.from({ length: 6 }).map((_, index) =>
      createModule(startIndex + index, 5 + index * 8, 8 + Math.floor(startIndex / 8) * 15)
    );
    updateModules([...layout.modules, ...row]);
    setSelectedModuleIds(row.map((module) => module.id));
  };

  const removeSelectedModules = () => {
    if (validSelectedModuleIds.length === 0) return;
    updateModules(layout.modules.filter((module) => !validSelectedModuleIds.includes(module.id)));
    setSelectedModuleIds([]);
    setContextMenu(null);
  };

  const duplicateSelectedModules = () => {
    if (selectedModules.length === 0) return;

    const timestamp = Date.now();
    const duplicates = selectedModules.map((module, index) => ({
      ...module,
      perspective: normalizePerspective(module.perspective),
      id: `mod-${timestamp}-${index}`,
      x: clamp(module.x + 2, 0, 100 - module.width),
      y: clamp(module.y + 2, 0, 100 - module.height),
    }));

    updateModules([...layout.modules, ...duplicates]);
    setSelectedModuleIds(duplicates.map((module) => module.id));
    setContextMenu(null);
  };

  const copySelectedModules = () => {
    if (selectedModules.length === 0) return;
    setModuleClipboard(selectedModules.map((module) => ({ ...module, perspective: normalizePerspective(module.perspective) })));
  };

  const pasteModules = () => {
    if (moduleClipboard.length === 0) return;

    const timestamp = Date.now();
    const pastedModules = moduleClipboard.map((module, index) => ({
      ...module,
      perspective: normalizePerspective(module.perspective),
      id: `mod-${timestamp}-${index}`,
      x: clamp(module.x + 3, 0, 100 - module.width),
      y: clamp(module.y + 3, 0, 100 - module.height),
    }));

    updateModules([...layout.modules, ...pastedModules]);
    setSelectedModuleIds(pastedModules.map((module) => module.id));
    setContextMenu(null);
  };

  const clearModules = () => {
    updateModules([]);
    setSelectedModuleIds([]);
    setContextMenu(null);
  };

  const addString = () => {
    const nextString = createString();
    updateStrings([...layout.strings, nextString]);
    setSelectedStringId(nextString.id);
  };

  const removeString = (stringId: string) => {
    if (layout.strings.length <= 1) return;

    const nextStrings = layout.strings.filter((string) => string.id !== stringId);
    const fallbackStringId = nextStrings[0]?.id || 'string-1';

    commitLayout({
      ...layout,
      strings: nextStrings,
      modules: layout.modules.map((module) =>
        module.stringId === stringId ? { ...module, stringId: fallbackStringId } : module
      ),
    });

    if (selectedStringId === stringId) {
      setSelectedStringId(fallbackStringId);
    }
  };

  const updatePrimaryModule = (patch: Partial<RoofLayoutModule>) => {
    if (!selectedModule) return;
    updateModules(
      layout.modules.map((module) =>
        module.id === selectedModule.id
          ? {
              ...module,
              ...patch,
            }
          : module
      )
    );
  };

  const updateSelectedModules = (patch: Partial<RoofLayoutModule>) => {
    if (validSelectedModuleIds.length === 0) return;
    updateModules(
      layout.modules.map((module) =>
        validSelectedModuleIds.includes(module.id)
          ? {
              ...module,
              ...patch,
            }
          : module
      )
    );
  };

  const updateSelectedPerspective = (patch: Partial<RoofLayoutPerspective>) => {
    if (validSelectedModuleIds.length === 0) return;
    updateModules(
      layout.modules.map((module) =>
        validSelectedModuleIds.includes(module.id)
          ? {
              ...module,
              perspective: {
                ...normalizePerspective(module.perspective),
                ...patch,
              },
            }
          : module
      )
    );
  };

  const assignStringToModules = (stringId: string, moduleIds = validSelectedModuleIds) => {
    if (moduleIds.length === 0) return;

    commitLayout({
      ...layout,
      modules: layout.modules.map((module) =>
        moduleIds.includes(module.id) ? { ...module, stringId } : module
      ),
    });

    setSelectedStringId(stringId);
    setSelectedModuleIds(moduleIds);
    setContextMenu(null);
  };

  const createStringAndAssignToModules = (moduleIds = validSelectedModuleIds) => {
    if (moduleIds.length === 0) return;

    const nextString = createString();

    commitLayout({
      ...layout,
      strings: [...layout.strings, nextString],
      modules: layout.modules.map((module) =>
        moduleIds.includes(module.id) ? { ...module, stringId: nextString.id } : module
      ),
    });

    setSelectedStringId(nextString.id);
    setSelectedModuleIds(moduleIds);
    setContextMenu(null);
  };

  const resizeSelectedModules = (factor: number) => {
    if (validSelectedModuleIds.length === 0) return;
    updateModules(
      layout.modules.map((module) =>
        validSelectedModuleIds.includes(module.id)
          ? {
              ...module,
              width: clamp(round(module.width * factor), 2, 30),
              height: clamp(round(module.height * factor), 4, 45),
            }
          : module
      )
    );
  };

  const moveSelectedModules = (deltaX: number, deltaY: number) => {
    if (validSelectedModuleIds.length === 0) return;
    updateModules(
      layout.modules.map((module) =>
        validSelectedModuleIds.includes(module.id)
          ? {
              ...module,
              x: clamp(round(module.x + deltaX), 0, 100 - module.width),
              y: clamp(round(module.y + deltaY), 0, 100 - module.height),
            }
          : module
      )
    );
  };

  const resetSelectedPerspective = () => {
    updateSelectedModules({ rotation: 0, skewX: 0, skewY: 0, perspective: DEFAULT_PERSPECTIVE });
  };

  const toggleModuleSelection = (moduleId: string) => {
    setSelectedModuleIds((current) =>
      current.includes(moduleId)
        ? current.filter((id) => id !== moduleId)
        : [...current, moduleId]
    );
  };

  const buildCopyDragModules = (sourceModules: RoofLayoutModule[]) => {
    const timestamp = Date.now();
    return sourceModules.map((sourceModule, index) => ({
      sourceId: sourceModule.id,
      module: {
        ...sourceModule,
        perspective: normalizePerspective(sourceModule.perspective),
        id: `mod-${timestamp}-${index}`,
      },
    }));
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>, module: RoofLayoutModule) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isCopyDrag = event.ctrlKey && event.altKey;

    if (!isCopyDrag && (event.shiftKey || event.metaKey || event.ctrlKey)) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const moduleLeft = rect.left + (module.x / 100) * rect.width;
    const moduleTop = rect.top + (module.y / 100) * rect.height;

    let dragModule = module;
    let nextSelectedIds = validSelectedModuleIds.includes(module.id) && validSelectedModuleIds.length > 1
      ? validSelectedModuleIds
      : [module.id];
    let dragModulesForInitialState = layout.modules.filter((item) => nextSelectedIds.includes(item.id));
    let createdModules: RoofLayoutModule[] | undefined;

    if (isCopyDrag) {
      const sourceModules = validSelectedModuleIds.includes(module.id) && selectedModules.length > 1
        ? selectedModules
        : [module];
      const copyPairs = buildCopyDragModules(sourceModules);
      createdModules = copyPairs.map((copyPair) => copyPair.module);
      dragModule = copyPairs.find((copyPair) => copyPair.sourceId === module.id)?.module || createdModules[0];
      nextSelectedIds = createdModules.map((createdModule) => createdModule.id);
      dragModulesForInitialState = createdModules;

      updateModules([...layout.modules, ...createdModules]);
      setSelectedModuleIds(nextSelectedIds);
    } else {
      setSelectedModuleIds(nextSelectedIds);
    }

    setContextMenu(null);

    dragRef.current = {
      id: dragModule.id,
      offsetX: event.clientX - moduleLeft,
      offsetY: event.clientY - moduleTop,
      selectedIds: nextSelectedIds,
      initialModules: dragModulesForInitialState.map((item) => ({
        id: item.id,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
      })),
      createdModules,
    };

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleModuleClick = (event: MouseEvent<HTMLButtonElement>, moduleId: string) => {
    if (event.ctrlKey && event.altKey) return;

    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      toggleModuleSelection(moduleId);
      return;
    }

    setSelectedModuleIds([moduleId]);
  };

  const handleModuleContextMenu = (event: MouseEvent<HTMLButtonElement>, moduleId: string) => {
    event.preventDefault();
    event.stopPropagation();

    const moduleIds = validSelectedModuleIds.includes(moduleId)
      ? validSelectedModuleIds
      : [moduleId];

    setSelectedModuleIds(moduleIds);
    setContextMenu({
      x: clamp(event.clientX, 8, window.innerWidth - 240),
      y: clamp(event.clientY, 8, window.innerHeight - 260),
      moduleIds,
    });
  };

  const handleModuleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    if (validSelectedModuleIds.length === 0) return;

    event.preventDefault();
    event.stopPropagation();
    removeSelectedModules();
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isEditableTarget(event.target)) return;

    const key = event.key.toLowerCase();
    const isModifierPressed = event.ctrlKey || event.metaKey;

    if ((event.key === 'Delete' || event.key === 'Backspace') && validSelectedModuleIds.length > 0) {
      event.preventDefault();
      removeSelectedModules();
      return;
    }

    const arrowMove = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    }[event.key] as [number, number] | undefined;

    if (arrowMove && selectedModules.length > 0 && !isModifierPressed) {
      const step = event.shiftKey ? 2 : 0.5;
      event.preventDefault();
      moveSelectedModules(arrowMove[0] * step, arrowMove[1] * step);
      return;
    }

    if (!isModifierPressed) return;

    if (key === 'c' && selectedModules.length > 0) {
      event.preventDefault();
      copySelectedModules();
      return;
    }

    if (key === 'v' && moduleClipboard.length > 0) {
      event.preventDefault();
      pasteModules();
      return;
    }

    if (key === 'd' && selectedModules.length > 0) {
      event.preventDefault();
      duplicateSelectedModules();
      return;
    }

    if ((key === '+' || key === '=' || event.code === 'Equal' || event.code === 'NumpadAdd') && selectedModules.length > 0) {
      event.preventDefault();
      resizeSelectedModules(1.1);
      return;
    }

    if ((key === '-' || key === '_' || event.code === 'Minus' || event.code === 'NumpadSubtract') && selectedModules.length > 0) {
      event.preventDefault();
      resizeSelectedModules(0.9);
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;

    const hasCreatedModules = !!drag.createdModules?.length;
    const createdModulesAreMissing = hasCreatedModules && !layout.modules.some((item) => item.id === drag.createdModules?.[0]?.id);
    const baseModules = createdModulesAreMissing
      ? [...layout.modules, ...(drag.createdModules || [])]
      : layout.modules;

    const rect = canvas.getBoundingClientRect();
    const draggedInitialModule = drag.initialModules.find((item) => item.id === drag.id);
    if (!draggedInitialModule) return;

    const nextX = ((event.clientX - rect.left - drag.offsetX) / rect.width) * 100;
    const nextY = ((event.clientY - rect.top - drag.offsetY) / rect.height) * 100;
    const deltaX = round(nextX) - draggedInitialModule.x;
    const deltaY = round(nextY) - draggedInitialModule.y;

    updateModules(
      baseModules.map((item) => {
        const initial = drag.initialModules.find((initialModule) => initialModule.id === item.id);
        if (!initial) return item;

        return {
          ...item,
          x: clamp(round(initial.x + deltaX), 0, 100 - item.width),
          y: clamp(round(initial.y + deltaY), 0, 100 - item.height),
        };
      })
    );
  };

  const stopDragging = () => {
    dragRef.current = null;
  };

  const stringColor = (stringId: string) => layout.strings.find((string) => string.id === stringId)?.color || '#2563EB';
  const nextStringName = `String ${layout.strings.length + 1}`;

  return (
    <div
      className="space-y-4 outline-none"
      tabIndex={0}
      onKeyDown={handleEditorKeyDown}
      onClick={() => setContextMenu(null)}
    >
      <div className="rounded-xl border border-brand-border bg-white p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1 lg:w-64">
            <label className="text-xs font-medium text-slate-500">String ativa</label>
            <Select value={selectedStringId} onChange={(event) => setSelectedStringId(event.target.value)}>
              {layout.strings.map((string) => (
                <option key={string.id} value={string.id}>
                  {string.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={addModule}>Adicionar módulo</Button>
            <Button type="button" variant="outline" onClick={addModuleRow}>Adicionar linha com 6</Button>
            <Button type="button" variant="outline" onClick={addString}>Nova string</Button>
            <Button type="button" variant="ghost" onClick={clearModules}>Limpar layout</Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Dica: Ctrl/Shift + clique seleciona vários. Setas movem, Shift+setas move rápido. Ctrl+C copia, Ctrl+V cola, Ctrl+D duplica, Ctrl+ / Ctrl- redimensiona. Use os 4 pontos para encaixar na perspectiva real do telhado.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerLeave={stopDragging}
          className="relative min-h-[520px] overflow-hidden rounded-xl border border-brand-border bg-slate-100 lg:sticky lg:top-24"
          style={{
            backgroundImage: roofImageUrl ? `url(${roofImageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!roofImageUrl && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-500">
              Envie a foto do telhado ou informe uma URL para posicionar os módulos sobre a imagem.
            </div>
          )}

          <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {layout.strings.map((string) => {
              const modules = layout.modules.filter((module) => module.stringId === string.id);
              return modules.slice(1).map((module, index) => {
                const previous = modules[index];
                const x1 = previous.x + previous.width / 2;
                const y1 = previous.y + previous.height / 2;
                const x2 = module.x + module.width / 2;
                const y2 = module.y + module.height / 2;

                return (
                  <line
                    key={`${string.id}-${module.id}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={string.color}
                    strokeWidth="0.45"
                    strokeDasharray="1 0.8"
                  />
                );
              });
            })}
          </svg>

          {layout.modules.map((module, index) => {
            const color = stringColor(module.stringId);
            const isSelected = validSelectedModuleIds.includes(module.id);

            return (
              <button
                key={module.id}
                type="button"
                onPointerDown={(event) => handlePointerDown(event, module)}
                onClick={(event) => handleModuleClick(event, module.id)}
                onContextMenu={(event) => handleModuleContextMenu(event, module.id)}
                onKeyDown={handleModuleKeyDown}
                className={`absolute cursor-move bg-transparent p-0 transition-shadow focus:outline-none ${isSelected ? 'shadow-lg' : ''}`}
                style={{
                  left: `${module.x}%`,
                  top: `${module.y}%`,
                  width: `${module.width}%`,
                  height: `${module.height}%`,
                  transform: `rotate(${module.rotation || 0}deg) skewX(${module.skewX || 0}deg) skewY(${module.skewY || 0}deg)`,
                  transformOrigin: 'center',
                }}
                title={`Módulo ${index + 1}`}
              >
                <PerspectiveModuleSvg color={color} label={`${index + 1}`} perspective={module.perspective} />
                {isSelected && <SelectionBorderSvg perspective={module.perspective} />}
              </button>
            );
          })}
        </div>

        <aside className="space-y-4 rounded-xl border border-brand-border bg-white p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <div>
            <h3 className="text-sm font-semibold text-brand-dark">Resumo da planimetria</h3>
            <p className="mt-1 text-xs text-slate-500">
              {layout.modules.length} módulos posicionados • {occupiedArea.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m² ocupados
            </p>
            {selectedCount > 1 && (
              <p className="mt-1 text-xs font-medium text-brand-blue">{selectedCount} módulos selecionados para edição em lote</p>
            )}
            {moduleClipboard.length > 0 && (
              <p className="mt-1 text-xs text-slate-500">{moduleClipboard.length} módulos copiados</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">Strings</p>
            {layout.strings.map((string) => (
              <div key={string.id} className="flex items-center gap-2 text-xs">
                <input
                  type="color"
                  value={string.color}
                  onChange={(event) =>
                    updateStrings(
                      layout.strings.map((item) =>
                        item.id === string.id ? { ...item, color: event.target.value } : item
                      )
                    )
                  }
                  className="h-8 w-10 rounded border border-brand-border bg-white"
                  aria-label={`Cor da ${string.name}`}
                />
                <input
                  value={string.name}
                  onChange={(event) =>
                    updateStrings(
                      layout.strings.map((item) =>
                        item.id === string.id ? { ...item, name: event.target.value } : item
                      )
                    )
                  }
                  className="min-w-0 flex-1 rounded border border-brand-border bg-gray-50 px-2 py-1 text-xs text-brand-dark"
                />
                <span className="w-5 text-right text-slate-500">{countModulesByString(layout.modules, string.id)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={layout.strings.length <= 1}
                  onClick={() => removeString(string.id)}
                >
                  Excluir
                </Button>
              </div>
            ))}
          </div>

          {selectedModule ? (
            <div className="space-y-3 border-t border-brand-border pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-brand-dark">
                    {selectedCount > 1 ? 'Módulos selecionados' : 'Módulo selecionado'}
                  </h4>
                  {selectedCount > 1 && (
                    <p className="text-xs text-slate-500">Largura, altura, rotação, skew, perspectiva e string serão aplicados em todos.</p>
                  )}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={resetSelectedPerspective}>
                  Resetar
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-slate-500">
                  X %
                  <input
                    type="number"
                    value={selectedModule.x}
                    onChange={(event) => updatePrimaryModule({ x: clamp(Number(event.target.value), 0, 100 - selectedModule.width) })}
                    className="mt-1 w-full rounded border border-brand-border bg-gray-50 px-2 py-1 text-xs"
                  />
                </label>
                <label className="text-xs text-slate-500">
                  Y %
                  <input
                    type="number"
                    value={selectedModule.y}
                    onChange={(event) => updatePrimaryModule({ y: clamp(Number(event.target.value), 0, 100 - selectedModule.height) })}
                    className="mt-1 w-full rounded border border-brand-border bg-gray-50 px-2 py-1 text-xs"
                  />
                </label>
                <label className="text-xs text-slate-500">
                  Largura %
                  <input
                    type="number"
                    min="2"
                    max="30"
                    step="0.5"
                    value={selectedModule.width}
                    onChange={(event) => updateSelectedModules({ width: clamp(Number(event.target.value), 2, 30) })}
                    className="mt-1 w-full rounded border border-brand-border bg-gray-50 px-2 py-1 text-xs"
                  />
                </label>
                <label className="text-xs text-slate-500">
                  Altura %
                  <input
                    type="number"
                    min="4"
                    max="45"
                    step="0.5"
                    value={selectedModule.height}
                    onChange={(event) => updateSelectedModules({ height: clamp(Number(event.target.value), 4, 45) })}
                    className="mt-1 w-full rounded border border-brand-border bg-gray-50 px-2 py-1 text-xs"
                  />
                </label>
                <label className="text-xs text-slate-500">
                  Rotação °
                  <input
                    type="number"
                    min="-180"
                    max="180"
                    value={selectedModule.rotation}
                    onChange={(event) => updateSelectedModules({ rotation: clamp(Number(event.target.value) || 0, -180, 180) })}
                    className="mt-1 w-full rounded border border-brand-border bg-gray-50 px-2 py-1 text-xs"
                  />
                </label>
                <label className="text-xs text-slate-500">
                  Skew X °
                  <input
                    type="number"
                    min="-45"
                    max="45"
                    value={selectedModule.skewX || 0}
                    onChange={(event) => updateSelectedModules({ skewX: clamp(Number(event.target.value) || 0, -45, 45) })}
                    className="mt-1 w-full rounded border border-brand-border bg-gray-50 px-2 py-1 text-xs"
                  />
                </label>
                <label className="text-xs text-slate-500">
                  Skew Y °
                  <input
                    type="number"
                    min="-45"
                    max="45"
                    value={selectedModule.skewY || 0}
                    onChange={(event) => updateSelectedModules({ skewY: clamp(Number(event.target.value) || 0, -45, 45) })}
                    className="mt-1 w-full rounded border border-brand-border bg-gray-50 px-2 py-1 text-xs"
                  />
                </label>
                <label className="text-xs text-slate-500">
                  String
                  <Select
                    value={selectedModule.stringId}
                    onChange={(event) => updateSelectedModules({ stringId: event.target.value })}
                    className="mt-1 h-8 text-xs"
                  >
                    {layout.strings.map((string) => (
                      <option key={string.id} value={string.id}>{string.name}</option>
                    ))}
                  </Select>
                </label>
              </div>

              <div className="space-y-2 rounded-lg border border-brand-border bg-slate-50 p-3">
                <p className="text-xs font-semibold text-brand-dark">Perspectiva 4 pontos</p>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Ajuste cada canto do módulo para encaixar em telhados vistos em perspectiva. Valores negativos puxam o canto para esquerda/cima; positivos puxam para direita/baixo.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[11px] text-slate-500">
                    Sup. Esq. X
                    <input type="number" min="-45" max="45" step="1" value={selectedPerspective.topLeftX} onChange={(event) => updateSelectedPerspective({ topLeftX: clamp(Number(event.target.value) || 0, -45, 45) })} className="mt-1 w-full rounded border border-brand-border bg-white px-2 py-1 text-xs" />
                  </label>
                  <label className="text-[11px] text-slate-500">
                    Sup. Esq. Y
                    <input type="number" min="-45" max="45" step="1" value={selectedPerspective.topLeftY} onChange={(event) => updateSelectedPerspective({ topLeftY: clamp(Number(event.target.value) || 0, -45, 45) })} className="mt-1 w-full rounded border border-brand-border bg-white px-2 py-1 text-xs" />
                  </label>
                  <label className="text-[11px] text-slate-500">
                    Sup. Dir. X
                    <input type="number" min="-45" max="45" step="1" value={selectedPerspective.topRightX} onChange={(event) => updateSelectedPerspective({ topRightX: clamp(Number(event.target.value) || 0, -45, 45) })} className="mt-1 w-full rounded border border-brand-border bg-white px-2 py-1 text-xs" />
                  </label>
                  <label className="text-[11px] text-slate-500">
                    Sup. Dir. Y
                    <input type="number" min="-45" max="45" step="1" value={selectedPerspective.topRightY} onChange={(event) => updateSelectedPerspective({ topRightY: clamp(Number(event.target.value) || 0, -45, 45) })} className="mt-1 w-full rounded border border-brand-border bg-white px-2 py-1 text-xs" />
                  </label>
                  <label className="text-[11px] text-slate-500">
                    Inf. Dir. X
                    <input type="number" min="-45" max="45" step="1" value={selectedPerspective.bottomRightX} onChange={(event) => updateSelectedPerspective({ bottomRightX: clamp(Number(event.target.value) || 0, -45, 45) })} className="mt-1 w-full rounded border border-brand-border bg-white px-2 py-1 text-xs" />
                  </label>
                  <label className="text-[11px] text-slate-500">
                    Inf. Dir. Y
                    <input type="number" min="-45" max="45" step="1" value={selectedPerspective.bottomRightY} onChange={(event) => updateSelectedPerspective({ bottomRightY: clamp(Number(event.target.value) || 0, -45, 45) })} className="mt-1 w-full rounded border border-brand-border bg-white px-2 py-1 text-xs" />
                  </label>
                  <label className="text-[11px] text-slate-500">
                    Inf. Esq. X
                    <input type="number" min="-45" max="45" step="1" value={selectedPerspective.bottomLeftX} onChange={(event) => updateSelectedPerspective({ bottomLeftX: clamp(Number(event.target.value) || 0, -45, 45) })} className="mt-1 w-full rounded border border-brand-border bg-white px-2 py-1 text-xs" />
                  </label>
                  <label className="text-[11px] text-slate-500">
                    Inf. Esq. Y
                    <input type="number" min="-45" max="45" step="1" value={selectedPerspective.bottomLeftY} onChange={(event) => updateSelectedPerspective({ bottomLeftY: clamp(Number(event.target.value) || 0, -45, 45) })} className="mt-1 w-full rounded border border-brand-border bg-white px-2 py-1 text-xs" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => resizeSelectedModules(0.9)}>
                  Diminuir
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => resizeSelectedModules(1.1)}>
                  Aumentar
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={duplicateSelectedModules}>
                  Duplicar
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={removeSelectedModules}>
                  Excluir módulo
                </Button>
              </div>

              <p className="text-[11px] leading-relaxed text-slate-500">
                Use largura/altura para proporção, rotação para direção e Perspectiva 4 pontos para deformar o módulo até acompanhar o plano real do telhado.
              </p>
            </div>
          ) : (
            <p className="border-t border-brand-border pt-4 text-xs text-slate-500">
              Selecione um módulo para ajustar posição, tamanho, rotação, perspectiva e string.
            </p>
          )}
        </aside>
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 w-60 overflow-hidden rounded-xl border border-brand-border bg-white shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
        >
          <div className="border-b border-brand-border px-3 py-2">
            <p className="text-xs font-semibold text-brand-dark">Adicionar à string</p>
            <p className="text-[11px] text-slate-500">
              {contextMenu.moduleIds.length} módulo{contextMenu.moduleIds.length > 1 ? 's' : ''} selecionado{contextMenu.moduleIds.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="py-1">
            {layout.strings.map((string) => (
              <button
                key={string.id}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-brand-dark hover:bg-slate-50"
                onClick={() => assignStringToModules(string.id, contextMenu.moduleIds)}
              >
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: string.color }} />
                <span className="min-w-0 flex-1 truncate">{string.name}</span>
                <span className="text-slate-400">{countModulesByString(layout.modules, string.id)}</span>
              </button>
            ))}

            <button
              type="button"
              className="mt-1 flex w-full items-center gap-2 border-t border-brand-border px-3 py-2 text-left text-xs font-medium text-brand-blue hover:bg-slate-50"
              onClick={() => createStringAndAssignToModules(contextMenu.moduleIds)}
            >
              Criar {nextStringName} e adicionar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
