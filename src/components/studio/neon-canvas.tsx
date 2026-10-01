'use client';

import Konva from 'konva';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text } from 'react-konva';
import type { StudioColor } from '@/lib/studio-types';

export interface CanvasLine {
  text: string;
  color: StudioColor;
}

export type Snapshot = () => string | null;

interface NeonCanvasProps {
  lines: CanvasLine[];
  fontFamily: string;
  /** Bumped once the web font has loaded so the lettering is measured again. */
  fontRevision: number;
  widthIn: number;
  heightIn: number;
  backboardCode: string;
  backgroundCode: string;
  wallPhotoUrl?: string | null;
  lightOn: boolean;
  onAspectChange: (aspect: number) => void;
  snapshotRef?: RefObject<Snapshot | null>;
}

// Lettering is laid out at a fixed size and the whole sign group is scaled to real inches.
const BASE_FONT_SIZE = 100;
const LINE_GAP = BASE_FONT_SIZE * 0.12;
const PADDING = BASE_FONT_SIZE * 0.35;
// The backdrop represents a wall roughly 90 inches across, so sizes read true against furniture.
const WALL_WIDTH_IN = 90;

type Layout = ReturnType<typeof layoutSign>;

function layoutSign(lines: CanvasLine[], fontFamily: string) {
  const metrics = lines.map((line) => {
    const probe = new Konva.Text({
      text: line.text || ' ',
      fontFamily,
      fontSize: BASE_FONT_SIZE,
      lineHeight: 1,
    });
    return { width: Math.max(probe.width(), BASE_FONT_SIZE * 0.3), height: probe.height() };
  });

  const blockWidth = Math.max(...metrics.map((m) => m.width));
  const blockHeight = metrics.reduce((sum, m) => sum + m.height, 0) + LINE_GAP * (metrics.length - 1);

  let y = PADDING;
  const positions = metrics.map((m) => {
    const position = { x: PADDING + (blockWidth - m.width) / 2, y };
    y += m.height + LINE_GAP;
    return position;
  });

  const width = blockWidth + PADDING * 2;
  const height = blockHeight + PADDING * 2;
  return { width, height, positions, aspect: height / width };
}

export default function NeonCanvas({
  lines,
  fontFamily,
  fontRevision,
  widthIn,
  heightIn,
  backboardCode,
  backgroundCode,
  wallPhotoUrl = null,
  lightOn,
  onAspectChange,
  snapshotRef,
}: NeonCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageWidth, setStageWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setStageWidth(Math.floor(entry!.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!snapshotRef) return;
    snapshotRef.current = () =>
      stageRef.current?.toDataURL({ mimeType: 'image/jpeg', quality: 0.82, pixelRatio: 0.5 }) ?? null;
  }, [snapshotRef]);

  const filled = lines.filter((line) => line.text.trim());
  const drawn = filled.length ? filled : [{ text: 'Your text', color: lines[0]!.color }];
  const textKey = drawn.map((line) => line.text).join('\n');

  // Measuring reads the font from the document, so it must re-run after the font finishes loading.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const layout = useMemo(() => layoutSign(drawn, fontFamily), [textKey, fontFamily, fontRevision]);

  useEffect(() => onAspectChange(layout.aspect), [layout.aspect, onAspectChange]);

  const stageHeight = Math.round(Math.min(Math.max(stageWidth * 0.62, 300), 620));
  const pxPerInch = stageWidth / WALL_WIDTH_IN;
  const signWidth = Math.min(widthIn * pxPerInch, stageWidth * 0.92);
  const scale = signWidth / layout.width;
  const signHeight = layout.height * scale;
  const signX = (stageWidth - signWidth) / 2;
  const signY = Math.max(18, stageHeight * 0.42 - signHeight / 2);
  const fontPx = BASE_FONT_SIZE * scale;

  const description = `Neon sign reading "${drawn.map((l) => l.text).join(' / ')}" in ${fontFamily}, ${[
    ...new Set(drawn.map((l) => l.color.name)),
  ].join(' and ')}, ${widthIn} by ${heightIn} inches, light ${lightOn ? 'on' : 'off'}`;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl"
      role="img"
      aria-label={description}
    >
      {stageWidth > 0 ? (
        <Stage ref={stageRef} width={stageWidth} height={stageHeight} listening={false}>
          <Layer>
            <Wall code={backgroundCode} photoUrl={wallPhotoUrl} width={stageWidth} height={stageHeight} />
            {lightOn && (
              <WallGlow
                color={drawn[0]!.color.glowHex}
                cx={stageWidth / 2}
                cy={signY + signHeight / 2}
                radius={Math.max(signWidth, 160) * 0.9}
                width={stageWidth}
                height={stageHeight}
              />
            )}
          </Layer>
          <Layer>
            <Group x={signX} y={signY} scaleX={scale} scaleY={scale}>
              <Backboard
                code={backboardCode}
                layout={layout}
                lines={drawn}
                fontFamily={fontFamily}
                scale={scale}
              />
              {drawn.map((line, i) => (
                <Tube
                  key={i}
                  line={line}
                  x={layout.positions[i]!.x}
                  y={layout.positions[i]!.y}
                  fontFamily={fontFamily}
                  fontPx={fontPx}
                  scale={scale}
                  lit={lightOn}
                />
              ))}
            </Group>
            <Dimensions
              x={signX}
              y={signY}
              width={signWidth}
              height={signHeight}
              widthIn={widthIn}
              heightIn={heightIn}
              stageHeight={stageHeight}
            />
          </Layer>
        </Stage>
      ) : (
        <div className="aspect-[1.6] w-full animate-pulse bg-night-800" />
      )}
    </div>
  );
}

function Tube(props: {
  line: CanvasLine;
  x: number;
  y: number;
  fontFamily: string;
  fontPx: number;
  scale: number;
  lit: boolean;
}) {
  const { line, fontPx, scale, lit } = props;
  const text = {
    x: props.x,
    y: props.y,
    text: line.text,
    fontFamily: props.fontFamily,
    fontSize: BASE_FONT_SIZE,
    lineHeight: 1,
  };
  const { glowHex, tubeHex } = line.color;

  if (!lit) {
    return (
      <Text {...text} fill="#d9d9e3" opacity={0.4} stroke="rgba(255,255,255,0.5)" strokeWidth={0.6 / scale} />
    );
  }

  // Shadow blur is applied in screen pixels, so it is sized from the rendered font size.
  return (
    <Group>
      <Text
        {...text}
        fill={glowHex}
        opacity={0.55}
        shadowColor={glowHex}
        shadowBlur={fontPx * 0.55}
        shadowOpacity={1}
      />
      <Text
        {...text}
        fill={glowHex}
        opacity={0.9}
        shadowColor={glowHex}
        shadowBlur={fontPx * 0.2}
        shadowOpacity={1}
      />
      <Text
        {...text}
        fill={tubeHex}
        stroke={glowHex}
        strokeWidth={BASE_FONT_SIZE * 0.012}
        shadowColor={glowHex}
        shadowBlur={fontPx * 0.06}
        shadowOpacity={1}
      />
    </Group>
  );
}

function Backboard(props: {
  code: string;
  layout: Layout;
  lines: CanvasLine[];
  fontFamily: string;
  scale: number;
}) {
  const { code, layout, lines, fontFamily, scale } = props;

  if (code === 'CLR_CUT') {
    // Cut-to-shape acrylic follows the lettering, which a wide rounded stroke approximates well.
    return lines.map((line, i) => (
      <Text
        key={i}
        x={layout.positions[i]!.x}
        y={layout.positions[i]!.y}
        text={line.text}
        fontFamily={fontFamily}
        fontSize={BASE_FONT_SIZE}
        lineHeight={1}
        fill="rgba(255,255,255,0.07)"
        stroke="rgba(255,255,255,0.13)"
        strokeWidth={BASE_FONT_SIZE * 0.3}
        lineJoin="round"
      />
    ));
  }

  const inset = BASE_FONT_SIZE * 0.1;
  const standoffs = [
    [inset, inset],
    [layout.width - inset, inset],
    [inset, layout.height - inset],
    [layout.width - inset, layout.height - inset],
  ];
  const surface =
    code === 'BLK_ACR'
      ? { fill: '#07070b', stroke: '#2e2e3c' }
      : code === 'PRINTED'
        ? {
            fillLinearGradientStartPoint: { x: 0, y: 0 },
            fillLinearGradientEndPoint: { x: layout.width, y: layout.height },
            fillLinearGradientColorStops: [0, '#2a0f3d', 1, '#3d0f2a'],
            stroke: 'rgba(255,255,255,0.2)',
          }
        : { fill: 'rgba(255,255,255,0.05)', stroke: 'rgba(255,255,255,0.3)' };

  return (
    <>
      <Rect
        width={layout.width}
        height={layout.height}
        cornerRadius={BASE_FONT_SIZE * 0.08}
        strokeWidth={1.2 / scale}
        {...surface}
      />
      {standoffs.map(([x, y], i) => (
        <Circle key={i} x={x} y={y} radius={BASE_FONT_SIZE * 0.035} fill="rgba(220,220,230,0.55)" />
      ))}
    </>
  );
}

export function WallGlow(props: {
  color: string;
  cx: number;
  cy: number;
  radius: number;
  width: number;
  height: number;
}) {
  return (
    <Rect
      width={props.width}
      height={props.height}
      fillRadialGradientStartPoint={{ x: props.cx, y: props.cy }}
      fillRadialGradientEndPoint={{ x: props.cx, y: props.cy }}
      fillRadialGradientStartRadius={0}
      fillRadialGradientEndRadius={props.radius}
      fillRadialGradientColorStops={[0, withAlpha(props.color, 0.28), 1, withAlpha(props.color, 0)]}
    />
  );
}

export function Wall({
  code,
  photoUrl = null,
  width,
  height,
}: {
  code: string;
  photoUrl?: string | null;
  width: number;
  height: number;
}) {
  switch (code) {
    case 'PHOTO':
      if (photoUrl) return <PhotoWall url={photoUrl} width={width} height={height} />;
      return <BrickWall width={width} height={height} />;
    case 'BRICK':
      return <BrickWall width={width} height={height} />;
    case 'BEDROOM':
      return (
        <>
          <Rect
            width={width}
            height={height}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 0, y: height }}
            fillLinearGradientColorStops={[0, '#2c2540', 1, '#171320']}
          />
          <Rect
            x={width * 0.2}
            y={height * 0.74}
            width={width * 0.6}
            height={height * 0.2}
            cornerRadius={14}
            fill="#3b3152"
          />
          <Rect
            x={width * 0.14}
            y={height * 0.86}
            width={width * 0.72}
            height={height * 0.2}
            cornerRadius={10}
            fill="#4a4063"
          />
          <Rect
            x={width * 0.27}
            y={height * 0.8}
            width={width * 0.18}
            height={height * 0.07}
            cornerRadius={10}
            fill="#6d6490"
          />
          <Rect
            x={width * 0.55}
            y={height * 0.8}
            width={width * 0.18}
            height={height * 0.07}
            cornerRadius={10}
            fill="#6d6490"
          />
          <Vignette width={width} height={height} darkness={0.55} />
        </>
      );
    case 'CAFE':
      return (
        <>
          <Rect width={width} height={height} fill="#2a2019" />
          {Array.from({ length: Math.ceil(width / 22) }, (_, i) => (
            <Line
              key={i}
              points={[i * 22, 0, i * 22, height * 0.7]}
              stroke="rgba(0,0,0,0.25)"
              strokeWidth={2}
            />
          ))}
          <Rect y={height * 0.7} width={width} height={10} fill="#5b4330" />
          <Rect y={height * 0.7 + 10} width={width} height={height * 0.3} fill="#1b1410" />
          <Circle x={width * 0.1} y={height * 0.62} radius={height * 0.08} fill="#1f3b24" />
          <Circle x={width * 0.9} y={height * 0.63} radius={height * 0.07} fill="#1f3b24" />
          <Vignette width={width} height={height} darkness={0.6} />
        </>
      );
    default:
      return (
        <>
          <Rect width={width} height={height} fill="#07070b" />
          <Rect
            width={width}
            height={height}
            fillRadialGradientStartPoint={{ x: width / 2, y: height * 0.45 }}
            fillRadialGradientEndPoint={{ x: width / 2, y: height * 0.45 }}
            fillRadialGradientStartRadius={0}
            fillRadialGradientEndRadius={Math.max(width, height) * 0.75}
            fillRadialGradientColorStops={[0, '#1c1c2a', 1, 'rgba(7,7,11,0)']}
          />
        </>
      );
  }
}

/** The customer's own photo, cropped to fill the stage and dimmed so the neon reads as it would at night. */
function PhotoWall({ url, width, height }: { url: string; width: number; height: number }) {
  const image = useHtmlImage(url);
  if (!image) return <Rect width={width} height={height} fill="#07070b" />;

  const scale = Math.max(width / image.width, height / image.height);
  const drawnWidth = image.width * scale;
  const drawnHeight = image.height * scale;
  return (
    <>
      <KonvaImage
        image={image}
        x={(width - drawnWidth) / 2}
        y={(height - drawnHeight) / 2}
        width={drawnWidth}
        height={drawnHeight}
      />
      <Rect width={width} height={height} fill="rgba(4,4,10,0.55)" />
      <Vignette width={width} height={height} darkness={0.5} />
    </>
  );
}

export function useHtmlImage(url: string | null): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) return setImage(null);
    const element = new window.Image();
    element.onload = () => setImage(element);
    element.src = url;
    return () => {
      element.onload = null;
    };
  }, [url]);
  return image;
}

function BrickWall({ width, height }: { width: number; height: number }) {
  const brickW = 68;
  const brickH = 26;
  const bricks = [];
  for (let row = 0; row * brickH < height; row++) {
    for (let x = row % 2 ? -brickW / 2 : 0; x < width; x += brickW) {
      const shade = ((row * 7 + Math.round(x)) % 5) * 4;
      bricks.push(
        <Rect
          key={`${row}:${x}`}
          x={x + 2}
          y={row * brickH + 2}
          width={brickW - 4}
          height={brickH - 4}
          cornerRadius={2}
          fill={`rgb(${74 + shade},${40 + shade / 2},34)`}
        />,
      );
    }
  }
  return (
    <>
      <Rect width={width} height={height} fill="#26130f" />
      {bricks}
      <Vignette width={width} height={height} darkness={0.72} />
    </>
  );
}

function Vignette({ width, height, darkness }: { width: number; height: number; darkness: number }) {
  return (
    <Rect
      width={width}
      height={height}
      fillRadialGradientStartPoint={{ x: width / 2, y: height * 0.45 }}
      fillRadialGradientEndPoint={{ x: width / 2, y: height * 0.45 }}
      fillRadialGradientStartRadius={0}
      fillRadialGradientEndRadius={Math.max(width, height) * 0.75}
      fillRadialGradientColorStops={[0, 'rgba(0,0,0,0.15)', 1, `rgba(0,0,0,${darkness})`]}
    />
  );
}

export function Dimensions(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  widthIn: number;
  heightIn: number;
  stageHeight: number;
}) {
  const color = 'rgba(210,210,225,0.85)';
  const baseline = Math.min(props.y + props.height + 16, props.stageHeight - 22);
  const side = props.x + props.width + 14;
  const cm = (inches: number) => Math.round(inches * 2.54);
  const label = { fontSize: 12, fill: color, fontFamily: 'Inter, sans-serif' };

  return (
    <>
      <Line
        points={[props.x, baseline, props.x + props.width, baseline]}
        stroke={color}
        strokeWidth={1}
        dash={[4, 3]}
      />
      <Line points={[props.x, baseline - 5, props.x, baseline + 5]} stroke={color} strokeWidth={1} />
      <Line
        points={[props.x + props.width, baseline - 5, props.x + props.width, baseline + 5]}
        stroke={color}
        strokeWidth={1}
      />
      <Text
        x={props.x}
        y={baseline + 6}
        width={props.width}
        align="center"
        text={`${props.widthIn}″  (${cm(props.widthIn)} cm)`}
        {...label}
      />
      <Line
        points={[side, props.y, side, props.y + props.height]}
        stroke={color}
        strokeWidth={1}
        dash={[4, 3]}
      />
      <Text x={side + 5} y={props.y + props.height / 2 - 7} text={`${props.heightIn}″`} {...label} />
    </>
  );
}

export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
