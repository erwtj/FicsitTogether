import type {MovablePoint} from "../types.ts";

export type CustomEdgeCurves = {
    middlePoints: { x: number; y: number }[];
    path: string;
}

type Vec2 = { x: number; y: number };

function add(p1: Vec2, p2: Vec2): Vec2 { return { x: p1.x + p2.x, y: p1.y + p2.y }; }
function sub(p1: Vec2, p2: Vec2): Vec2 { return { x: p1.x - p2.x, y: p1.y - p2.y }; }
function mul(p: Vec2, factor: number): Vec2 { return { x: p.x * factor, y: p.y * factor }; }

function evalCubicBezier(b0: Vec2, b1: Vec2, b2: Vec2, b3: Vec2, t: number): Vec2 {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    return {
        x: uuu * b0.x + 3 * uu * t * b1.x + 3 * u * tt * b2.x + ttt * b3.x,
        y: uuu * b0.y + 3 * uu * t * b1.y + 3 * u * tt * b2.y + ttt * b3.y,
    };
}

export function getCustomBezierCurve(points: MovablePoint[], alpha: number = 0.5, precision = 3): CustomEdgeCurves {
    if (points.length < 3) return { middlePoints: [], path: "" };

    const N = points.length;
    const k = alpha / 3;

    const get = (i: number): MovablePoint => {
        if (i < 0) return points[0];
        if (i >= N) return points[N - 1];
        return points[i];
    };

    const fmt = (v: number) => Number(v.toFixed(precision)).toString();

    // Start the path at the first point
    let d = `M ${fmt(points[0].x)} ${fmt(points[0].y)}`;
    const middlePoints: Vec2[] = [];

    for (let i = 0; i < N - 1; i++) {
        const A = get(i - 1);
        const B = get(i);
        const C = get(i + 1);
        const Dp = get(i + 2);

        const b0 = B;
        const b1 = add(B, mul(sub(C, A), k));
        const b2 = sub(C, mul(sub(Dp, B), k));
        const b3 = C;

        d += ` C ${fmt(b1.x)} ${fmt(b1.y)}, ${fmt(b2.x)} ${fmt(b2.y)}, ${fmt(b3.x)} ${fmt(b3.y)}`;
        middlePoints.push(evalCubicBezier(b0, b1, b2, b3, 0.5));
    }

    return { middlePoints, path: d };
}

export function pointOnPath(pathD: string, t: number): { x: number; y: number } {
    // Clamp t
    t = Math.max(0, Math.min(1, t));

    // Create (or reuse) an SVG path element
    const svgNS = "http://www.w3.org/2000/svg";
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", pathD);

    const length = path.getTotalLength();
    const pt = path.getPointAtLength(t * length);

    return { x: pt.x, y: pt.y };
}