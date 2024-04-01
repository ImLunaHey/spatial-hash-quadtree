'use client';
import { SpatialHashQuadtree } from '@/qt/spacial-hash-quad-tree';
import { useEffect, useMemo, useRef, useState } from 'react';

const randomNumberBetween = (min: number, max: number) => Math.random() * (max - min) + min;

const drawStroked = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number) => {
  ctx.save();
  ctx.font = '30px Sans-serif';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 8;
  ctx.textAlign = 'center';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = 'white';
  ctx.fillText(text, x, y);
  ctx.restore();
};

export default function Page() {
  const ref = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const spatialHashQuadtree = useMemo(() => new SpatialHashQuadtree<number>(100), []);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [count, setCount] = useState(50);
  const [width, setWidth] = useState(10);
  const [height, setHeight] = useState(10);
  const [points, setPoints] = useState<{ bounds: { x: number; y: number; width: number; height: number }; data: number }[]>(
    [],
  );
  const [isPinned, setIsPinned] = useState(false);

  const animate = useMemo(
    () => (_time: DOMHighResTimeStamp) => {
      const ctx = ref.current!.getContext('2d')!;

      // Clear the canvas
      ctx.clearRect(0, 0, 500, 500);

      // Draw the spatialHashQuadtree
      spatialHashQuadtree.visualise(ctx);

      const x = Math.floor(mouseRef.current.x / 100) * 100;
      const y = Math.floor(mouseRef.current.y / 100) * 100;

      // Get all the points in the cell that the mouse is in
      const query = spatialHashQuadtree.query({
        x,
        y,
        width: 100,
        height: 100,
      });

      // Save the points to state
      setPoints(query);

      // Draw the cell that the mouse is in
      ctx.strokeStyle = 'blue';
      ctx.strokeRect(x, y, 100, 100);

      // Draw the points
      ctx.fillStyle = 'blue';
      for (const { bounds } of points) {
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      }

      // Top right show count of points in the cell
      drawStroked(ctx, points.length.toString(), x + 50, y + 60);

      requestRef.current = requestAnimationFrame(animate);
    },
    [spatialHashQuadtree, points, mouseRef],
  );

  useEffect(() => {
    // Get the mouse position on the canvas
    const getCanvasPos = (event: MouseEvent) => {
      const rect = ref.current!.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return { x, y };
    };

    // Check if the mouse is inside the canvas
    const insideCanvas = (event: MouseEvent) => {
      const { x, y } = getCanvasPos(event);
      return x > 0 && y > 0 && x < 500 && y < 500;
    };

    // Save the mouse position
    const saveMousePosition = (event: MouseEvent) => {
      const { x, y } = getCanvasPos(event);

      mouseRef.current = {
        x,
        y,
      };
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!insideCanvas(event) || isPinned) return;

      // Save the mouse position
      saveMousePosition(event);
    };

    // Add the mousemove event listener
    window.addEventListener('mousemove', onMouseMove);

    const onMouseUp = (event: MouseEvent) => {
      console.info('mouse up', {
        isPinned,
      });
      if (!insideCanvas(event)) return;

      // Pin the mouse
      setIsPinned(!isPinned);
    };

    // Add mouseup event listener
    window.addEventListener('mouseup', onMouseUp);

    // Start the animation
    requestRef.current = requestAnimationFrame(animate);

    // On resize re-render the canvas
    const onResize = () => {
      ref.current!.width = 500;
      ref.current!.height = 500;
    };

    window.addEventListener('resize', onResize);

    // Cleanup
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
    };
  }, [animate, isPinned, spatialHashQuadtree]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] min-w-[100dvw] gap-2 text-center">
      <div className="w-[500px]">
        <h1 className="text-4xl font-bold">Spatial Hash Quadtree</h1>
        <p className="text-lg">Move your mouse around the canvas to see the points in the cell that the mouse is in.</p>
      </div>
      <button
        className="bg-white text-black px-4 py-2 rounded-md shadow-md"
        onClick={() => {
          // Insert random points
          for (let i = 0; i < count; i++) {
            spatialHashQuadtree.insert(
              {
                x: randomNumberBetween(0, 500),
                y: randomNumberBetween(0, 500),
                width: randomNumberBetween(0, width),
                height: randomNumberBetween(0, height),
              },
              i,
            );
          }
        }}
      >
        Insert Random Points
      </button>
      <div className="flex flex-row gap-2">
        <label htmlFor="count">Count ({count})</label>
        <input
          type="range"
          min={1}
          max={100}
          value={count}
          onChange={(event) => {
            setCount(Number(event.target.value));
          }}
        />
      </div>
      <div className="flex flex-row gap-2">
        <label htmlFor="width">Width ({width})</label>
        <input
          type="range"
          min={1}
          max={100}
          value={width}
          onChange={(event) => {
            setWidth(Number(event.target.value));
          }}
        />
      </div>
      <div className="flex flex-row gap-2">
        <label htmlFor="height">Height ({height})</label>
        <input
          type="range"
          min={1}
          max={100}
          value={height}
          onChange={(event) => {
            setHeight(Number(event.target.value));
          }}
        />
      </div>
      <div className="flex flex-row gap-2">
        <canvas className="w-[500px] h-[500px] border bg-white dark:bg-black" height={500} width={500} ref={ref} />
        <div className="flex flex-col gap-2 w-[500px] h-[500px] text-left overflow-y-scroll">
          <div>
            Mouse Position: {mouseRef.current.x}, {mouseRef.current.y}
          </div>
          <div>Pinned: {isPinned ? 'true' : 'false'}</div>
          <div>
            Cell: {Math.floor(mouseRef.current.x / 100)}, {Math.floor(mouseRef.current.y / 100)}
          </div>
          <div>
            Cell Bounds: {Math.floor(mouseRef.current.x / 100) * 100}, {Math.floor(mouseRef.current.y / 100) * 100}
          </div>
          <pre>{JSON.stringify(points, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
