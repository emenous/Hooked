const svgNamespace = "http://www.w3.org/2000/svg";
const storageKey = "hooked.character.rig.v1";

const stage = document.querySelector("#rig-stage");
const rigPartsGroup = document.querySelector("#rig-parts");
const stageZoomInput = document.querySelector("#stage-zoom");
const zoomOutButton = document.querySelector("#zoom-out");
const zoomInButton = document.querySelector("#zoom-in");
const zoomFitButton = document.querySelector("#zoom-fit");
const partSelect = document.querySelector("#part-select");
const layerList = document.querySelector("#layer-list");
const controlsEl = document.querySelector("#part-controls");
const outputEl = document.querySelector("#rig-output");
const selectionSummaryEl = document.querySelector("#selection-summary");
const rigDataStatusEl = document.querySelector("#rig-data-status");
const saveButton = document.querySelector("#save-rig");
const resetButton = document.querySelector("#reset-rig");
const exportButton = document.querySelector("#export-rig");
const downloadButton = document.querySelector("#download-rig");
const importButton = document.querySelector("#import-rig");
const copyRigButton = document.querySelector("#copy-rig");
const pasteRigButton = document.querySelector("#paste-rig");
const applyRigCodeButton = document.querySelector("#apply-rig-code");
const toggleMarkersButton = document.querySelector("#toggle-markers");
const sendBackButton = document.querySelector("#send-back");
const moveBackButton = document.querySelector("#move-back");
const moveForwardButton = document.querySelector("#move-forward");
const sendFrontButton = document.querySelector("#send-front");
const selectAllButton = document.querySelector("#select-all");
const clearSelectionButton = document.querySelector("#clear-selection");
const groupSelectionButton = document.querySelector("#group-selection");
const ungroupSelectionButton = document.querySelector("#ungroup-selection");
const groupsList = document.querySelector("#groups-list");
const clipSelect = document.querySelector("#clip-select");
const poseSelect = document.querySelector("#pose-select");
const prevFrameButton = document.querySelector("#prev-frame");
const nextFrameButton = document.querySelector("#next-frame");
const poseNameInput = document.querySelector("#pose-name");
const loadPoseButton = document.querySelector("#load-pose");
const savePoseButton = document.querySelector("#save-pose");
const duplicatePoseButton = document.querySelector("#duplicate-pose");
const deletePoseButton = document.querySelector("#delete-pose");
const playPreviewButton = document.querySelector("#play-preview");
const showOnionInput = document.querySelector("#show-onion");
const nudgeControls = document.querySelector("#nudge-controls");
const previewPartsGroup = document.querySelector("#preview-parts");
const onionPrevGroup = document.querySelector("#onion-prev");
const onionNextGroup = document.querySelector("#onion-next");
const frameScrubber = document.querySelector("#frame-scrubber");
const selectionBox = document.querySelector("#selection-box");
const selectionRect = document.querySelector("#selection-rect");
const marqueeBox = document.querySelector("#marquee-box");
const resizeHandles = Array.from(document.querySelectorAll(".resize-handle"));
const rotateHandle = document.querySelector("#rotate-handle");

const partDefinitions = [
  { key: "head", label: "Head", file: "head.svg", pivot: "joint-neck", x: 93, y: -57, scale: 0.18, rotation: -15 },
  { key: "rightUpperArm", label: "Right arm upper", file: "arm_upper.svg", pivot: "joint-shoulder", x: 60, y: -56, scale: 0.18, rotation: 12 },
  { key: "rightLowerArm", label: "Right arm lower", file: "arm_lower.svg", pivot: "joint-elbow", x: 49, y: -2, scale: 0.21, rotation: -91 },
  { key: "rightHand", label: "Right hand", file: "hand.svg", pivot: "joint-wrist", x: 105, y: -3, scale: 0.17, rotation: -97 },
  { key: "rightUpperLeg", label: "Right leg upper", file: "leg_upper.svg", pivot: "joint-groin", x: -4, y: -20, scale: 0.175, rotation: 110 },
  { key: "rightLowerLeg", label: "Right leg lower", file: "leg_lower.svg", pivot: "joint-knee", x: -81, y: -51, scale: 0.16, rotation: 132 },
  { key: "rightFoot", label: "Right foot", file: "foot.svg", pivot: "joint-foot", x: -142, y: -120, scale: 0.175, rotation: 180 },
  { key: "torsoUpper", label: "Torso upper", file: "torso_upper.svg", pivot: "joint-shoulder", x: 61, y: -58, scale: 0.16, rotation: 70 },
  { key: "torsoLower", label: "Torso lower", file: "torso_lower.svg", pivot: "joint-waist", x: 24, y: -22, scale: 0.165, rotation: 61 },
  { key: "leftUpperArm", label: "Left arm upper", file: "arm_upper.svg", pivot: "joint-shoulder", x: 58, y: -46, scale: 0.19, rotation: -128 },
  { key: "leftLowerArm", label: "Left arm lower grapple", file: "arm_lower_grapple.svg", pivot: "joint-elbow", x: 102, y: -78, scale: 0.24, rotation: -145 },
  { key: "leftHand", label: "Left hand", file: "hand.svg", pivot: "joint-wrist", x: 139, y: -131, scale: 0.16, rotation: -10 },
  { key: "leftUpperLeg", label: "Left leg upper", file: "leg_upper.svg", pivot: "joint-groin", x: -5, y: -23, scale: 0.16, rotation: 134 },
  { key: "leftLowerLeg", label: "Left leg lower", file: "leg_lower.svg", pivot: "joint-knee", x: -60, y: -82, scale: 0.165, rotation: 140 },
  { key: "leftFoot", label: "Left foot", file: "foot.svg", pivot: "joint-foot", x: -114, y: -157, scale: 0.16, rotation: -144 },
];

const defaultLayerOrder = [
  "leftLowerLeg",
  "leftUpperArm",
  "torsoUpper",
  "torsoLower",
  "leftLowerArm",
  "leftHand",
  "leftUpperLeg",
  "leftFoot",
  "head",
  "rightUpperArm",
  "rightUpperLeg",
  "rightLowerLeg",
  "rightFoot",
  "rightLowerArm",
  "rightHand",
];
const allPartKeys = partDefinitions.map((part) => part.key);
const leftSidePartKeys = new Set(["leftUpperArm", "leftLowerArm", "leftHand", "leftUpperLeg", "leftLowerLeg", "leftFoot"]);
const markerFillValues = new Set(["#5eff00", "aqua", "#00ffff", "rgb(0,255,255)"]);
const rigParts = new Map();
const rigValues = Object.fromEntries(partDefinitions.map((part) => [part.key, {
  x: part.x,
  y: part.y,
  scale: part.scale,
  rotation: part.rotation,
}]));

let selectedPartKey = "head";
let selectedPartKeys = new Set([selectedPartKey]);
let markersVisible = true;
let dragState = null;
let boxState = null;
let marqueeState = null;
let layerOrder = [...defaultLayerOrder];
let groups = [
  { name: "Right leg", parts: ["rightUpperLeg", "rightLowerLeg", "rightFoot"], active: true },
  { name: "Left leg", parts: ["leftUpperLeg", "leftLowerLeg", "leftFoot"], active: true },
];
let animations = { m_mid_swing: cloneRigValues(rigValues) };
let clips = {};
let undoStack = [];
let previewPlaying = false;
let previewStart = performance.now();
let onionVisible = false;
let stageZoom = 1;
const baseStageViewBox = { x: -220, y: -260, width: 440, height: 560 };

function cloneRigValues(values = rigValues) {
  return JSON.parse(JSON.stringify(values));
}

function poseNames() {
  return Object.keys(animations);
}

function cleanPoseName(name) {
  return String(name || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 48);
}

function uniquePoseName(baseName) {
  const base = cleanPoseName(baseName) || "pose";
  if (!animations[base]) return base;
  let index = 2;
  while (animations[`${base}_${index}`]) index += 1;
  return `${base}_${index}`;
}

function setStageZoom(value) {
  stageZoom = THREEClamp(Number(value) || 1, 0.55, 2.5);
  if (stageZoomInput) stageZoomInput.value = String(stageZoom);
  const width = baseStageViewBox.width / stageZoom;
  const height = baseStageViewBox.height / stageZoom;
  const centerX = baseStageViewBox.x + baseStageViewBox.width * 0.5;
  const centerY = baseStageViewBox.y + baseStageViewBox.height * 0.5;
  stage.setAttribute("viewBox", `${centerX - width * 0.5} ${centerY - height * 0.5} ${width} ${height}`);
}

function THREEClamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function applyRigCode() {
  try {
    pushUndo();
    applyImportedData(JSON.parse(outputEl.value));
    saveRig();
    rigDataStatusEl.textContent = "Applied pasted rig code";
  } catch {
    outputEl.focus();
    rigDataStatusEl.textContent = "Could not parse rig JSON";
  }
}

async function copyRigCode() {
  updateOutput();
  outputEl.select();
  try {
    await navigator.clipboard.writeText(outputEl.value);
    rigDataStatusEl.textContent = "Copied rig JSON";
  } catch {
    document.execCommand("copy");
  }
}

async function pasteRigCode() {
  try {
    outputEl.value = await navigator.clipboard.readText();
    rigDataStatusEl.textContent = "Pasted rig JSON";
  } catch {
    outputEl.focus();
  }
}

function svgEl(name, attributes = {}) {
  const element = document.createElementNS(svgNamespace, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

function parseViewBox(svgDocument) {
  const viewBox = (svgDocument.documentElement.getAttribute("viewBox") || "0 0 1 1").trim().split(/\s+/).map(Number);
  return { x: viewBox[0] || 0, y: viewBox[1] || 0, width: viewBox[2] || 1, height: viewBox[3] || 1 };
}

function getMarkerClasses(svgDocument) {
  const styleText = svgDocument.querySelector("style")?.textContent || "";
  return new Set(
    Array.from(styleText.matchAll(/\.([a-zA-Z0-9_-]+)\s*\{[^}]*fill:\s*(#5eff00|aqua|#00ffff|rgb\(0,\s*255,\s*255\))/gi))
      .map((match) => match[1]),
  );
}

function isMarkerElement(element, markerClasses) {
  const fill = (element.getAttribute("fill") || "").toLowerCase().replace(/\s+/g, "");
  const className = element.getAttribute("class") || "";
  return markerFillValues.has(fill) || markerClasses.has(className);
}

function collectMarkers(svgDocument, markerClasses) {
  return Array.from(svgDocument.querySelectorAll("circle"))
    .filter((circle) => isMarkerElement(circle, markerClasses))
    .map((circle, index) => {
      const fill = (circle.getAttribute("fill") || "").toLowerCase().replace(/\s+/g, "");
      const className = circle.getAttribute("class") || "";
      const styleFill = markerClasses.has(className) ? className : fill;
      return {
        id: circle.id || `marker-${index + 1}`,
        x: Number(circle.getAttribute("cx") || 0),
        y: Number(circle.getAttribute("cy") || 0),
        type: fill === "aqua" || fill === "#00ffff" || styleFill.includes("3") ? "ribbon" : "joint",
      };
    });
}

function stripMarkers(svgDocument, markerClasses) {
  for (const circle of Array.from(svgDocument.querySelectorAll("circle"))) {
    if (isMarkerElement(circle, markerClasses)) circle.remove();
  }
  return new XMLSerializer().serializeToString(svgDocument.documentElement);
}

function markerById(part, id) {
  return part.markers.find((marker) => marker.id === id) || part.markers[0] || {
    x: part.viewBox.width * 0.5,
    y: part.viewBox.height * 0.5,
  };
}

function transformString(key, values = rigValues[key]) {
  const part = rigParts.get(key);
  if (!part || !values) return "";
  const pivot = markerById(part, part.definition.pivot);
  return `translate(${values.x} ${values.y}) rotate(${values.rotation}) scale(${values.scale}) translate(${-pivot.x} ${-pivot.y})`;
}

function applyPartTransform(key) {
  const part = rigParts.get(key);
  if (!part) return;
  part.group.setAttribute("transform", transformString(key));
}

function applyPreviewTransform(key, values = rigValues) {
  const part = rigParts.get(key);
  const nextValues = values[key];
  if (!part?.previewGroup || !nextValues) return;
  part.previewGroup.setAttribute("transform", transformString(key, nextValues));
}

function applyOnionTransform(key, values, target = "prev") {
  const part = rigParts.get(key);
  const nextValues = values?.[key];
  const group = target === "next" ? part?.onionNextGroup : part?.onionPrevGroup;
  if (!group || !nextValues) return;
  group.setAttribute("transform", transformString(key, nextValues));
}

function applyAllTransforms() {
  for (const key of allPartKeys) {
    applyPartTransform(key);
    applyPreviewTransform(key);
  }
  updateSelectionBox();
  updatePreview();
  updateOnionSkin();
}

function pushUndo() {
  undoStack.push({
    layerOrder: [...layerOrder],
    groups: structuredClone(groups),
    parts: cloneRigValues(),
    animations: structuredClone(animations),
    clips: structuredClone(clips),
  });
  if (undoStack.length > 10) undoStack.shift();
}

function undo() {
  const snapshot = undoStack.pop();
  if (!snapshot) return;
  layerOrder = [...snapshot.layerOrder];
  groups = structuredClone(snapshot.groups || []);
  animations = structuredClone(snapshot.animations || animations);
  clips = structuredClone(snapshot.clips || clips);
  for (const key of allPartKeys) {
    if (snapshot.parts[key]) Object.assign(rigValues[key], snapshot.parts[key]);
  }
  applyLayerOrder();
  applyAllTransforms();
  renderLayerList();
  renderGroupsList();
  renderPoseSelect();
  renderClipSelect();
  renderPartControls();
  updateSelectionUi();
  updateOutput();
}

function stagePoint(event) {
  const point = stage.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(stage.getScreenCTM().inverse());
}

function getActiveGroupForPart(key) {
  return groups.find((group) => group.active && group.parts.includes(key));
}

function updateSelectionUi() {
  for (const [partKey, part] of rigParts.entries()) {
    part.group.classList.toggle("selected", partKey === selectedPartKey);
    part.group.classList.toggle("multi-selected", selectedPartKeys.has(partKey));
  }
  const isolatedGroup = selectedPartKeys.size === 1 ? getActiveGroupForPart(selectedPartKey) : null;
  selectionSummaryEl.textContent = isolatedGroup
    ? `1 selected - isolated from ${isolatedGroup.name}`
    : `${selectedPartKeys.size} selected`;
  updateSelectionBox();
}

function selectPart(key, mode = "single") {
  const grouped = getActiveGroupForPart(key);
  selectedPartKey = key;
  partSelect.value = key;
  if (mode === "isolate") {
    selectedPartKeys = new Set([key]);
  } else if (grouped && mode === "single") {
    selectedPartKeys = new Set(grouped.parts);
  } else if (mode === "toggle") {
    if (selectedPartKeys.has(key) && selectedPartKeys.size > 1) selectedPartKeys.delete(key);
    else selectedPartKeys.add(key);
    selectedPartKey = [...selectedPartKeys][selectedPartKeys.size - 1] || key;
    partSelect.value = selectedPartKey;
  } else if (mode === "add") {
    selectedPartKeys.add(key);
  } else {
    selectedPartKeys = new Set([key]);
  }
  updateSelectionUi();
  renderPartControls();
  renderLayerList();
}

function selectKeys(keys) {
  const filtered = keys.filter((key) => allPartKeys.includes(key));
  if (!filtered.length) return;
  selectedPartKeys = new Set(filtered);
  selectedPartKey = filtered[filtered.length - 1];
  partSelect.value = selectedPartKey;
  updateSelectionUi();
  renderPartControls();
  renderLayerList();
}

function getSelectionCenter(keys = [...selectedPartKeys]) {
  const points = keys.map((key) => rigValues[key]).filter(Boolean);
  if (!points.length) return { x: 0, y: 0 };
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

function transformSelection({ dx = 0, dy = 0, rotationDelta = 0, scaleFactor = 1, originals = null, center = null } = {}) {
  const origin = center || getSelectionCenter();
  const radians = rotationDelta * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  for (const key of selectedPartKeys) {
    const base = originals?.[key] || rigValues[key];
    const values = rigValues[key];
    const relX = base.x - origin.x;
    const relY = base.y - origin.y;
    values.x = Math.round(origin.x + (relX * cos - relY * sin) * scaleFactor + dx);
    values.y = Math.round(origin.y + (relX * sin + relY * cos) * scaleFactor + dy);
    values.scale = Number((base.scale * scaleFactor).toFixed(4));
    values.rotation = Number((base.rotation + rotationDelta).toFixed(2));
    applyPartTransform(key);
  }
  renderPartControls();
  updateSelectionBox();
  updatePreview();
  updateOutput();
}

function nudgeSelection(dx = 0, dy = 0, rotationDelta = 0) {
  if (!selectedPartKeys.size) return;
  pushUndo();
  transformSelection({
    dx,
    dy,
    rotationDelta,
    originals: Object.fromEntries([...selectedPartKeys].map((key) => [key, { ...rigValues[key] }])),
    center: getSelectionCenter(),
  });
}

function applyLayerOrder() {
  for (const key of layerOrder) {
    const part = rigParts.get(key);
    if (part) rigPartsGroup.append(part.group);
  }
  for (const key of layerOrder) {
    const part = rigParts.get(key);
    if (part?.previewGroup) previewPartsGroup.append(part.previewGroup);
  }
  for (const key of layerOrder) {
    const part = rigParts.get(key);
    if (part?.onionPrevGroup) onionPrevGroup.append(part.onionPrevGroup);
    if (part?.onionNextGroup) onionNextGroup.append(part.onionNextGroup);
  }
}

function moveSelectedLayer(mode) {
  pushUndo();
  const selected = new Set(selectedPartKeys);
  if (!selected.size) return;
  if (mode === "front" || mode === "back") {
    const moving = layerOrder.filter((key) => selected.has(key));
    const remaining = layerOrder.filter((key) => !selected.has(key));
    layerOrder = mode === "front" ? [...remaining, ...moving] : [...moving, ...remaining];
  } else {
    const step = mode === "forward" ? 1 : -1;
    const indexes = layerOrder.map((key, index) => selected.has(key) ? index : -1).filter((index) => index >= 0);
    for (const index of step > 0 ? indexes.reverse() : indexes) {
      const target = index + step;
      if (target < 0 || target >= layerOrder.length || selected.has(layerOrder[target])) continue;
      [layerOrder[index], layerOrder[target]] = [layerOrder[target], layerOrder[index]];
    }
  }
  applyLayerOrder();
  renderLayerList();
  updateOutput();
}

function renderLayerList() {
  layerList.replaceChildren();
  for (const key of [...layerOrder].reverse()) {
    const definition = partDefinitions.find((part) => part.key === key);
    const item = document.createElement("li");
    item.className = key === selectedPartKey ? "selected" : selectedPartKeys.has(key) ? "multi-selected" : "";
    const label = document.createElement("button");
    label.type = "button";
    label.className = "layer-name";
    label.textContent = definition?.label || key;
    label.addEventListener("click", (event) => selectPart(key, event.shiftKey || event.metaKey || event.ctrlKey ? "toggle" : "single"));
    label.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectPart(key, "isolate");
    });
    const down = document.createElement("button");
    down.type = "button";
    down.className = "layer-mini";
    down.textContent = "Down";
    down.addEventListener("click", (event) => {
      event.stopPropagation();
      selectPart(key, "isolate");
      moveSelectedLayer("backward");
    });
    const button = document.createElement("button");
    button.type = "button";
    button.className = "layer-mini";
    button.textContent = "Up";
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      selectPart(key, "isolate");
      moveSelectedLayer("forward");
    });
    item.append(label, down, button);
    layerList.append(item);
  }
}

function renderGroupsList() {
  groupsList.replaceChildren();
  if (!groups.length) {
    const empty = document.createElement("div");
    empty.className = "empty-group";
    empty.textContent = "No groups";
    groupsList.append(empty);
    return;
  }
  for (const [index, group] of groups.entries()) {
    const row = document.createElement("label");
    row.className = "group-row";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = group.active !== false;
    checkbox.addEventListener("change", () => {
      group.active = checkbox.checked;
      updateOutput();
    });
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${group.name || `Group ${index + 1}`} (${group.parts.length})`;
    button.addEventListener("click", () => selectKeys(group.parts));
    row.append(checkbox, button);
    groupsList.append(row);
  }
}

function beginDrag(event, key) {
  event.preventDefault();
  pushUndo();
  selectPart(key, event.shiftKey || event.metaKey || event.ctrlKey ? "toggle" : selectedPartKeys.has(key) ? "add" : "single");
  const point = stagePoint(event);
  dragState = {
    keys: [...selectedPartKeys],
    startX: point.x,
    startY: point.y,
    originals: Object.fromEntries([...selectedPartKeys].map((partKey) => [partKey, { ...rigValues[partKey] }])),
  };
  stage.setPointerCapture(event.pointerId);
}

function updateDrag(event) {
  if (!dragState) return;
  const point = stagePoint(event);
  transformSelection({
    dx: point.x - dragState.startX,
    dy: point.y - dragState.startY,
    originals: dragState.originals,
    center: getSelectionCenter(dragState.keys),
  });
}

function endDrag(event) {
  if (!dragState) return;
  try {
    stage.releasePointerCapture(event.pointerId);
  } catch {}
  dragState = null;
}

function selectionBounds() {
  const keys = [...selectedPartKeys];
  if (!keys.length) return null;
  const points = keys.map((key) => rigValues[key]).filter(Boolean);
  if (!points.length) return null;
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const pad = selectedPartKeys.size > 1 ? 42 : 28;
  return {
    x: Math.min(...xs) - pad,
    y: Math.min(...ys) - pad,
    width: Math.max(...xs) - Math.min(...xs) + pad * 2,
    height: Math.max(...ys) - Math.min(...ys) + pad * 2,
  };
}

function updateSelectionBox() {
  const bounds = selectionBounds();
  if (!bounds) {
    selectionBox.style.display = "none";
    return;
  }
  selectionBox.style.display = "";
  selectionRect.setAttribute("x", String(bounds.x));
  selectionRect.setAttribute("y", String(bounds.y));
  selectionRect.setAttribute("width", String(bounds.width));
  selectionRect.setAttribute("height", String(bounds.height));
  const handlePoints = {
    nw: [bounds.x, bounds.y],
    ne: [bounds.x + bounds.width, bounds.y],
    se: [bounds.x + bounds.width, bounds.y + bounds.height],
    sw: [bounds.x, bounds.y + bounds.height],
  };
  for (const handle of resizeHandles) {
    const [x, y] = handlePoints[handle.dataset.handle];
    handle.setAttribute("cx", String(x));
    handle.setAttribute("cy", String(y));
  }
  rotateHandle.setAttribute("cx", String(bounds.x + bounds.width * 0.5));
  rotateHandle.setAttribute("cy", String(bounds.y - 26));
}

function beginBoxTransform(event, type) {
  event.preventDefault();
  event.stopPropagation();
  pushUndo();
  const point = stagePoint(event);
  const center = getSelectionCenter();
  boxState = {
    type,
    startPoint: point,
    center,
    startDistance: Math.max(1, Math.hypot(point.x - center.x, point.y - center.y)),
    startAngle: Math.atan2(point.y - center.y, point.x - center.x) * 180 / Math.PI,
    originals: Object.fromEntries([...selectedPartKeys].map((key) => [key, { ...rigValues[key] }])),
  };
  stage.setPointerCapture(event.pointerId);
}

function updateBoxTransform(event) {
  if (!boxState) return;
  const point = stagePoint(event);
  if (boxState.type === "scale") {
    const distance = Math.max(1, Math.hypot(point.x - boxState.center.x, point.y - boxState.center.y));
    transformSelection({
      scaleFactor: distance / boxState.startDistance,
      originals: boxState.originals,
      center: boxState.center,
    });
  } else {
    const angle = Math.atan2(point.y - boxState.center.y, point.x - boxState.center.x) * 180 / Math.PI;
    transformSelection({
      rotationDelta: angle - boxState.startAngle,
      originals: boxState.originals,
      center: boxState.center,
    });
  }
}

function endBoxTransform(event) {
  if (!boxState) return;
  try {
    stage.releasePointerCapture(event.pointerId);
  } catch {}
  boxState = null;
}

function beginMarquee(event) {
  if (event.target !== stage && event.target.tagName !== "rect") return;
  if (event.target.closest?.("#selection-box")) return;
  event.preventDefault();
  const point = stagePoint(event);
  marqueeState = { start: point, current: point };
  marqueeBox.style.display = "";
  stage.setPointerCapture(event.pointerId);
}

function updateMarquee(event) {
  if (!marqueeState) return;
  marqueeState.current = stagePoint(event);
  const x = Math.min(marqueeState.start.x, marqueeState.current.x);
  const y = Math.min(marqueeState.start.y, marqueeState.current.y);
  const width = Math.abs(marqueeState.current.x - marqueeState.start.x);
  const height = Math.abs(marqueeState.current.y - marqueeState.start.y);
  marqueeBox.setAttribute("x", String(x));
  marqueeBox.setAttribute("y", String(y));
  marqueeBox.setAttribute("width", String(width));
  marqueeBox.setAttribute("height", String(height));
}

function endMarquee(event) {
  if (!marqueeState) return;
  const x = Math.min(marqueeState.start.x, marqueeState.current.x);
  const y = Math.min(marqueeState.start.y, marqueeState.current.y);
  const width = Math.abs(marqueeState.current.x - marqueeState.start.x);
  const height = Math.abs(marqueeState.current.y - marqueeState.start.y);
  const keys = allPartKeys.filter((key) => {
    const values = rigValues[key];
    return values.x >= x && values.x <= x + width && values.y >= y && values.y <= y + height;
  });
  if (keys.length) selectKeys(keys);
  marqueeBox.style.display = "none";
  try {
    stage.releasePointerCapture(event.pointerId);
  } catch {}
  marqueeState = null;
}

function renderPartControls() {
  const definition = partDefinitions.find((part) => part.key === selectedPartKey);
  const values = rigValues[selectedPartKey];
  controlsEl.replaceChildren();
  const rows = [
    ["x", "X", -220, 220, 1],
    ["y", "Y", -260, 300, 1],
    ["rotation", "Rotate", -180, 180, 1],
    ["scale", "Scale", 0.04, 0.5, 0.005],
  ];

  for (const [key, label, min, max, step] of rows) {
    const row = document.createElement("label");
    row.className = "control-row";
    const name = document.createElement("span");
    name.textContent = label;
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(values[key]);
    const output = document.createElement("output");
    output.textContent = Number(values[key]).toFixed(key === "scale" ? 3 : 0);
    let changing = false;
    input.addEventListener("pointerdown", () => {
      if (!changing) pushUndo();
      changing = true;
    });
    input.addEventListener("change", () => {
      changing = false;
    });
    input.addEventListener("input", () => {
      values[key] = Number(input.value);
      output.textContent = Number(values[key]).toFixed(key === "scale" ? 3 : 0);
      applyPartTransform(selectedPartKey);
      updateSelectionBox();
      updatePreview();
      updateOutput();
    });
    row.append(name, input, output);
    controlsEl.append(row);
  }

  const markerSummary = document.createElement("textarea");
  markerSummary.readOnly = true;
  markerSummary.value = `${definition.label}\n${rigParts.get(selectedPartKey)?.markers.map((marker) => `${marker.id}: ${marker.x}, ${marker.y}`).join("\n") || "Loading markers..."}`;
  markerSummary.rows = 5;
  markerSummary.className = "marker-summary";
  controlsEl.append(markerSummary);
}

function exportData() {
  return {
    character: "m",
    baselinePose: "m_mid_swing",
    layerOrder,
    groups,
    parts: rigValues,
    animations,
    clips,
  };
}

function updateOutput() {
  outputEl.value = JSON.stringify(exportData(), null, 2);
}

function saveRig() {
  localStorage.setItem(storageKey, JSON.stringify(exportData()));
  rigDataStatusEl.textContent = "Saved browser draft";
}

function downloadRigData() {
  updateOutput();
  const blob = new Blob([`${outputEl.value}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "m-rig.json";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function applyImportedData(data) {
  if (!data || typeof data !== "object") return false;
  const savedParts = data.parts || data;
  const validKeys = new Set(allPartKeys);
  if (Array.isArray(data.layerOrder)) {
    const orderedKeys = data.layerOrder.filter((key) => validKeys.has(key));
    layerOrder = [...orderedKeys, ...allPartKeys.filter((key) => !orderedKeys.includes(key))];
  }
  if (Array.isArray(data.groups)) {
    groups = data.groups
      .filter((group) => group && Array.isArray(group.parts))
      .map((group, index) => ({
        name: group.name || `Group ${index + 1}`,
        parts: group.parts.filter((key) => validKeys.has(key)),
        active: group.active !== false,
      }))
      .filter((group) => group.parts.length > 1);
  }
  if (data.animations && typeof data.animations === "object") {
    animations = structuredClone(data.animations);
  }
  if (data.clips && typeof data.clips === "object") {
    clips = structuredClone(data.clips);
  }
  for (const [key, values] of Object.entries(savedParts)) {
    if (!rigValues[key]) continue;
    for (const property of ["x", "y", "scale", "rotation"]) {
      if (Number.isFinite(values[property])) rigValues[key][property] = values[property];
    }
  }
  if (!animations.m_mid_swing) animations.m_mid_swing = cloneRigValues();
  applyLayerOrder();
  applyAllTransforms();
  renderLayerList();
  renderGroupsList();
  renderPoseSelect();
  renderClipSelect();
  renderPartControls();
  updateSelectionUi();
  updateOutput();
  return true;
}

async function loadFileRig() {
  try {
    const response = await fetch("./data/m-rig.json", { cache: "no-store" });
    if (!response.ok) return false;
    return applyImportedData(await response.json());
  } catch {
    return false;
  }
}

function loadDraftRig() {
  try {
    return applyImportedData(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    localStorage.removeItem(storageKey);
    return false;
  }
}

function resetRig() {
  pushUndo();
  for (const definition of partDefinitions) {
    Object.assign(rigValues[definition.key], {
      x: definition.x,
      y: definition.y,
      scale: definition.scale,
      rotation: definition.rotation,
    });
  }
  layerOrder = [...defaultLayerOrder];
  groups = [
    { name: "Right leg", parts: ["rightUpperLeg", "rightLowerLeg", "rightFoot"], active: true },
    { name: "Left leg", parts: ["leftUpperLeg", "leftLowerLeg", "leftFoot"], active: true },
  ];
  animations = { m_mid_swing: cloneRigValues() };
  clips = {};
  selectedPartKey = "head";
  selectedPartKeys = new Set([selectedPartKey]);
  applyLayerOrder();
  applyAllTransforms();
  localStorage.removeItem(storageKey);
  renderPartControls();
  renderLayerList();
  renderGroupsList();
  renderPoseSelect();
  renderClipSelect();
  updateSelectionUi();
  updateOutput();
}

function renderPoseSelect() {
  const current = poseSelect.value;
  const clipFrames = clipFrameNames();
  const names = clipSelect?.value && clipFrames.length ? clipFrames : poseNames();
  poseSelect.replaceChildren();
  for (const name of names) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    poseSelect.append(option);
  }
  poseSelect.value = names.includes(current) ? current : names[0] || "";
  if (poseNameInput) poseNameInput.value = poseSelect.value;
  updateOnionSkin();
  renderFrameScrubber();
}

function clipFrameNames() {
  const clip = clips[clipSelect?.value];
  const names = Array.isArray(clip?.frames)
    ? clip.frames.filter((name) => animations[name])
    : [];
  return names.length ? names : poseNames();
}

function renderClipSelect() {
  if (!clipSelect) return;
  const current = clipSelect.value;
  clipSelect.replaceChildren();
  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "All poses";
  clipSelect.append(allOption);
  for (const [name, clip] of Object.entries(clips)) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = clip.label || name;
    clipSelect.append(option);
  }
  clipSelect.value = clips[current] ? current : clips.start_swinging ? "start_swinging" : "";
  renderPoseSelect();
}

function stepClipFrame(direction) {
  const names = clipFrameNames();
  if (!names.length) return;
  const currentIndex = Math.max(0, names.indexOf(poseSelect.value));
  const nextIndex = (currentIndex + direction + names.length) % names.length;
  poseSelect.value = names[nextIndex];
  if (poseNameInput) poseNameInput.value = poseSelect.value;
  loadPose(poseSelect.value);
}

function createFrameThumbnail(name) {
  const pose = animations[name];
  const button = document.createElement("button");
  button.type = "button";
  button.className = name === poseSelect.value ? "frame-thumb selected" : "frame-thumb";
  button.title = name;
  const svg = svgEl("svg", { viewBox: "-220 -260 440 560", "aria-hidden": "true" });
  const label = svgEl("text", { x: "-205", y: "238", class: "thumb-label" });
  label.textContent = name.replace(/^.*?_(\d+)$/, "$1");
  for (const key of layerOrder) {
    const part = rigParts.get(key);
    const values = pose?.[key];
    if (!part?.imageHref || !values) continue;
    const image = svgEl("image", {
      href: part.imageHref,
      x: String(part.viewBox.x),
      y: String(part.viewBox.y),
      width: String(part.viewBox.width),
      height: String(part.viewBox.height),
      transform: transformString(key, values),
    });
    svg.append(image);
  }
  svg.append(label);
  button.append(svg);
  button.addEventListener("click", () => {
    poseSelect.value = name;
    if (poseNameInput) poseNameInput.value = name;
    loadPose(name);
    renderFrameScrubber();
  });
  return button;
}

function renderFrameScrubber() {
  if (!frameScrubber || !rigParts.size) return;
  frameScrubber.replaceChildren();
  const names = clipFrameNames();
  for (const name of names) frameScrubber.append(createFrameThumbnail(name));
}

function savePose() {
  const name = cleanPoseName(poseNameInput?.value || poseSelect.value || "m_mid_swing");
  if (!name) {
    poseNameInput?.focus();
    return;
  }
  pushUndo();
  animations[name] = cloneRigValues();
  renderPoseSelect();
  poseSelect.value = name;
  if (poseNameInput) poseNameInput.value = name;
  updateOutput();
  updateOnionSkin();
}

function loadPose(name) {
  if (!animations[name]) return;
  pushUndo();
  for (const key of allPartKeys) {
    if (animations[name][key]) Object.assign(rigValues[key], animations[name][key]);
  }
  applyAllTransforms();
  renderPartControls();
  updateOutput();
  updateOnionSkin();
}

function duplicatePose() {
  const sourceName = poseSelect.value || "m_mid_swing";
  if (!animations[sourceName]) return;
  const nextName = uniquePoseName(`${sourceName}_copy`);
  pushUndo();
  animations[nextName] = cloneRigValues(animations[sourceName]);
  renderPoseSelect();
  poseSelect.value = nextName;
  if (poseNameInput) poseNameInput.value = nextName;
  updateOutput();
  updateOnionSkin();
}

function deletePose() {
  const name = poseSelect.value;
  if (!name || name === "m_mid_swing" || poseNames().length <= 1) return;
  pushUndo();
  delete animations[name];
  renderPoseSelect();
  updateOutput();
  updateOnionSkin();
}

function updateOnionSkin() {
  if (!onionPrevGroup || !onionNextGroup) return;
  const names = poseNames();
  const currentName = poseSelect.value;
  const currentIndex = names.indexOf(currentName);
  const shouldShow = onionVisible && names.length > 1 && currentIndex >= 0;
  onionPrevGroup.style.display = shouldShow ? "block" : "none";
  onionNextGroup.style.display = shouldShow ? "block" : "none";
  if (!shouldShow) return;
  const prevPose = animations[names[(currentIndex - 1 + names.length) % names.length]];
  const nextPose = animations[names[(currentIndex + 1) % names.length]];
  for (const key of allPartKeys) {
    applyOnionTransform(key, prevPose, "prev");
    applyOnionTransform(key, nextPose, "next");
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function interpolatePose(from, to, t) {
  const next = {};
  for (const key of allPartKeys) {
    const a = from[key] || rigValues[key];
    const b = to[key] || a;
    next[key] = {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      scale: lerp(a.scale, b.scale, t),
      rotation: lerp(a.rotation, b.rotation, t),
    };
  }
  return next;
}

function updatePreview(values = rigValues) {
  for (const key of allPartKeys) applyPreviewTransform(key, values);
}

function updatePreviewLoop(now) {
  if (previewPlaying) {
    const names = clipFrameNames();
    if (names.length) {
      const selectedClip = clips[clipSelect?.value];
      const duration = 1000 / Math.max(1, selectedClip?.fps || 1.18);
      const phase = ((now - previewStart) / duration) % names.length;
      const index = Math.floor(phase);
      const nextIndex = (index + 1) % names.length;
      updatePreview(interpolatePose(animations[names[index]], animations[names[nextIndex]], phase - index));
    }
  }
  requestAnimationFrame(updatePreviewLoop);
}

async function loadPart(definition) {
  const text = await fetch(`./svg/${definition.file}`).then((response) => response.text());
  const svgDocument = new DOMParser().parseFromString(text, "image/svg+xml");
  const viewBox = parseViewBox(svgDocument);
  const markerClasses = getMarkerClasses(svgDocument);
  const markers = collectMarkers(svgDocument, markerClasses);
  const strippedSvg = stripMarkers(svgDocument, markerClasses);
  const href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(strippedSvg)}`;
  const group = svgEl("g", { "data-part": definition.key });
  const previewGroup = svgEl("g", { "data-preview-part": definition.key });
  const onionPrevPartGroup = svgEl("g", { "data-onion-prev-part": definition.key });
  const onionNextPartGroup = svgEl("g", { "data-onion-next-part": definition.key });
  group.classList.add("rig-part");
  if (leftSidePartKeys.has(definition.key)) {
    group.classList.add("left-side-part");
    previewGroup.classList.add("left-side-part");
    onionPrevPartGroup.classList.add("left-side-part");
    onionNextPartGroup.classList.add("left-side-part");
  }
  group.addEventListener("pointerdown", (event) => beginDrag(event, definition.key));
  group.addEventListener("dblclick", (event) => {
    event.preventDefault();
    event.stopPropagation();
    selectPart(definition.key, "isolate");
  });
  const hitbox = svgEl("rect", {
    x: String(viewBox.x),
    y: String(viewBox.y),
    width: String(viewBox.width),
    height: String(viewBox.height),
    class: "part-hitbox",
  });
  const image = svgEl("image", {
    href,
    x: String(viewBox.x),
    y: String(viewBox.y),
    width: String(viewBox.width),
    height: String(viewBox.height),
    class: "part-image",
  });
  const previewImage = svgEl("image", {
    href,
    x: String(viewBox.x),
    y: String(viewBox.y),
    width: String(viewBox.width),
    height: String(viewBox.height),
    class: "part-image",
  });
  const onionPrevImage = svgEl("image", {
    href,
    x: String(viewBox.x),
    y: String(viewBox.y),
    width: String(viewBox.width),
    height: String(viewBox.height),
    class: "part-image onion-image",
  });
  const onionNextImage = svgEl("image", {
    href,
    x: String(viewBox.x),
    y: String(viewBox.y),
    width: String(viewBox.width),
    height: String(viewBox.height),
    class: "part-image onion-image",
  });
  const outline = svgEl("rect", {
    x: String(viewBox.x),
    y: String(viewBox.y),
    width: String(viewBox.width),
    height: String(viewBox.height),
    class: "part-outline",
  });
  group.append(hitbox, image, outline);
  previewGroup.append(previewImage);
  onionPrevPartGroup.append(onionPrevImage);
  onionNextPartGroup.append(onionNextImage);

  for (const marker of markers) {
    const circle = svgEl("circle", {
      cx: String(marker.x),
      cy: String(marker.y),
      r: marker.type === "ribbon" ? "8" : "6",
      class: marker.type === "ribbon" ? "ribbon-marker" : "joint-marker",
    });
    group.append(circle);
  }

  rigPartsGroup.append(group);
  previewPartsGroup.append(previewGroup);
  onionPrevGroup.append(onionPrevPartGroup);
  onionNextGroup.append(onionNextPartGroup);
  rigParts.set(definition.key, {
    definition,
    group,
    previewGroup,
    onionPrevGroup: onionPrevPartGroup,
    onionNextGroup: onionNextPartGroup,
    imageHref: href,
    viewBox,
    markers,
  });
  applyPartTransform(definition.key);
  applyPreviewTransform(definition.key);
  applyLayerOrder();
}

async function init() {
  for (const definition of partDefinitions) {
    const option = document.createElement("option");
    option.value = definition.key;
    option.textContent = definition.label;
    partSelect.append(option);
    await loadPart(definition);
  }
  const loadedFileRig = await loadFileRig();
  const loadedDraftRig = loadedFileRig ? false : loadDraftRig();
  rigDataStatusEl.textContent = loadedDraftRig
    ? "Loaded browser draft"
    : loadedFileRig
      ? "Loaded data/m-rig.json"
      : "Using built-in defaults";
  animations.m_mid_swing = animations.m_mid_swing || cloneRigValues();
  partSelect.value = selectedPartKey;
  partSelect.addEventListener("change", () => selectPart(partSelect.value));
  saveButton.addEventListener("click", saveRig);
  resetButton.addEventListener("click", resetRig);
  sendBackButton.addEventListener("click", () => moveSelectedLayer("back"));
  moveBackButton.addEventListener("click", () => moveSelectedLayer("backward"));
  moveForwardButton.addEventListener("click", () => moveSelectedLayer("forward"));
  sendFrontButton.addEventListener("click", () => moveSelectedLayer("front"));
  selectAllButton.addEventListener("click", () => selectKeys(allPartKeys));
  clearSelectionButton.addEventListener("click", () => selectKeys([selectedPartKey]));
  groupSelectionButton.addEventListener("click", () => {
    if (selectedPartKeys.size < 2) return;
    pushUndo();
    groups.push({ name: `Group ${groups.length + 1}`, parts: [...selectedPartKeys], active: true });
    renderGroupsList();
    updateOutput();
  });
  ungroupSelectionButton.addEventListener("click", () => {
    pushUndo();
    groups = groups.filter((group) => !group.parts.some((key) => selectedPartKeys.has(key)));
    renderGroupsList();
    updateOutput();
  });
  exportButton.addEventListener("click", () => {
    updateOutput();
    outputEl.select();
  });
  downloadButton.addEventListener("click", downloadRigData);
  importButton.addEventListener("click", applyRigCode);
  copyRigButton.addEventListener("click", copyRigCode);
  pasteRigButton.addEventListener("click", pasteRigCode);
  applyRigCodeButton.addEventListener("click", applyRigCode);
  toggleMarkersButton.addEventListener("click", () => {
    markersVisible = !markersVisible;
    toggleMarkersButton.textContent = markersVisible ? "Hide joints" : "Show joints";
    for (const marker of stage.querySelectorAll(".joint-marker, .ribbon-marker")) {
      marker.style.display = markersVisible ? "" : "none";
    }
  });
  poseSelect.addEventListener("change", () => {
    if (poseNameInput) poseNameInput.value = poseSelect.value;
    updateOnionSkin();
  });
  clipSelect.addEventListener("change", () => {
    previewStart = performance.now();
    renderPoseSelect();
    const names = clipFrameNames();
    if (names[0]) {
      poseSelect.value = names[0];
      if (poseNameInput) poseNameInput.value = names[0];
      loadPose(names[0]);
      updateOnionSkin();
    }
  });
  prevFrameButton.addEventListener("click", () => stepClipFrame(-1));
  nextFrameButton.addEventListener("click", () => stepClipFrame(1));
  loadPoseButton.addEventListener("click", () => loadPose(poseSelect.value));
  savePoseButton.addEventListener("click", savePose);
  duplicatePoseButton.addEventListener("click", duplicatePose);
  deletePoseButton.addEventListener("click", deletePose);
  showOnionInput.addEventListener("change", () => {
    onionVisible = showOnionInput.checked;
    updateOnionSkin();
  });
  nudgeControls.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const amount = event.shiftKey ? 10 : 1;
    const direction = button.dataset.nudge;
    const rotation = Number(button.dataset.rotate || 0);
    if (direction === "up") nudgeSelection(0, -amount);
    if (direction === "down") nudgeSelection(0, amount);
    if (direction === "left") nudgeSelection(-amount, 0);
    if (direction === "right") nudgeSelection(amount, 0);
    if (rotation) nudgeSelection(0, 0, rotation * amount);
  });
  playPreviewButton.addEventListener("click", () => {
    previewPlaying = !previewPlaying;
    previewStart = performance.now();
    playPreviewButton.textContent = previewPlaying ? "Pause" : "Play";
    if (!previewPlaying) updatePreview();
  });
  for (const handle of resizeHandles) handle.addEventListener("pointerdown", (event) => beginBoxTransform(event, "scale"));
  rotateHandle.addEventListener("pointerdown", (event) => beginBoxTransform(event, "rotate"));
  stage.addEventListener("pointerdown", beginMarquee);
  stage.addEventListener("pointermove", (event) => {
    updateDrag(event);
    updateBoxTransform(event);
    updateMarquee(event);
  });
  stage.addEventListener("pointerup", (event) => {
    endDrag(event);
    endBoxTransform(event);
    endMarquee(event);
  });
  stage.addEventListener("pointercancel", (event) => {
    endDrag(event);
    endBoxTransform(event);
    endMarquee(event);
  });
  window.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      undo();
      return;
    }
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    const amount = event.shiftKey ? 10 : 1;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      nudgeSelection(0, -amount);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      nudgeSelection(0, amount);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      nudgeSelection(-amount, 0);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      nudgeSelection(amount, 0);
    } else if (event.key === "," || event.key === "<") {
      event.preventDefault();
      nudgeSelection(0, 0, -amount);
    } else if (event.key === "." || event.key === ">") {
      event.preventDefault();
      nudgeSelection(0, 0, amount);
    }
  });
  applyLayerOrder();
  renderPartControls();
  renderGroupsList();
  renderPoseSelect();
  renderClipSelect();
  selectPart(selectedPartKey);
  updateOutput();
  requestAnimationFrame(updatePreviewLoop);
}

init();
