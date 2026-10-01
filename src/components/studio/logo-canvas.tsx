'use client';

import type Konva from 'konva';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Group, Image as KonvaImage, Layer, Rect, Stage } from 'react-konva';
import { tint } from '@/lib/logo-trace';
import type { StudioColor } from '@/lib/studio-types';
import { Dimensions, Wall, WallGlow, type Snapshot } from './neon-canvas';

// Same scale as the text studio, so a 24-inch logo looks as big as a 24-inch word.
const WALL_WIDTH_IN = 90;

interface LogoCanvasProps {
  outline: HTMLCanvasElement | null;
  color: StudioColor;
  widthIn: number;
  heightIn: number;
  backboardCode: string;
  backgroundCode: string;
  wallPhotoUrl: string | null;
  lightOn: boolean;
  snapshotRef?: RefObject<Snapshot | null>;
}

export default function LogoCanvas(props: LogoCanvasProps) {
  const { outline, color, widthIn, heightIn, lightOn } = props;
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
    if (!props.snapshotRef) return;
    props.snapshotRef.current = () =>
      stageRef.current?.toDataURL({ mimeType: 'image/jpeg', quality: 0.82, pixelRatio: 0.5 }) ?? null;
  }, [props.snapshotRef]);

  const tube = useMemo(
    () => (outline ? tint(outline, lightOn ? color.tubeHex : '#d9d9e3') : null),
    [outline, color, lightOn],
  );
  const glow = useMemo(
    () => (outline && lightOn ? tint(outline, color.glowHex) : null),
    [outline, color, lightOn],
  );

  const stageHeight = Math.round(Math.min(Math.max(stageWidth * 0.62, 300), 620));
  const pxPerInch = stageWidth / WALL_WIDTH_IN;
  const signWidth = Math.min(widthIn * pxPerInch, stageWidth * 0.92);
  const signHeight = outline ? signWidth * (outline.height / outline.width) : 0;
  const signX = (stageWidth - signWidth) / 2;
  const signY = Math.max(18, stageHeight * 0.42 - signHeight / 2);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl"
      role="img"
      aria-label={`Logo neon sign in ${color.name}, ${widthIn} by ${heightIn} inches`}
    >
      {stageWidth > 0 ? (
        <Stage ref={stageRef} width={stageWidth} height={stageHeight} listening={false}>
          <Layer>
            <Wall
              code={props.backgroundCode}
              photoUrl={props.wallPhotoUrl}
              width={stageWidth}
              height={stageHeight}
            />
            {lightOn && outline && (
              <WallGlow
                color={color.glowHex}
                cx={stageWidth / 2}
                cy={signY + signHeight / 2}
                radius={Math.max(signWidth, 160) * 0.9}
                width={stageWidth}
                height={stageHeight}
              />
            )}
          </Layer>
          {outline && tube && (
            <Layer>
              <Group x={signX} y={signY}>
                {props.backboardCode !== 'CLR_CUT' && (
                  <Rect
                    width={signWidth}
                    height={signHeight}
                    cornerRadius={6}
                    fill={props.backboardCode === 'BLK_ACR' ? '#07070b' : 'rgba(255,255,255,0.05)'}
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth={1}
                  />
                )}
                {glow && (
                  <KonvaImage
                    image={glow}
                    width={signWidth}
                    height={signHeight}
                    opacity={0.8}
                    shadowColor={color.glowHex}
                    shadowBlur={signWidth * 0.05}
                    shadowOpacity={1}
                  />
                )}
                <KonvaImage
                  image={tube}
                  width={signWidth}
                  height={signHeight}
                  opacity={lightOn ? 1 : 0.45}
                  shadowColor={lightOn ? color.glowHex : undefined}
                  shadowBlur={lightOn ? signWidth * 0.012 : 0}
                  shadowOpacity={1}
                />
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
          )}
        </Stage>
      ) : (
        <div className="aspect-[1.6] w-full animate-pulse bg-night-800" />
      )}
    </div>
  );
}
