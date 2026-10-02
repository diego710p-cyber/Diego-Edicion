import React from "react";
import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";

// Fonts are bundled in public/fonts so renders work offline.
const anton = "Anton";
const montserrat = "Montserrat";
loadFont({ family: anton, url: staticFile("fonts/Anton-400.woff2") });
loadFont({
  family: montserrat,
  url: staticFile("fonts/Montserrat-ExtraBold-Black.woff2"),
  weight: "800 900",
});

const EMOJI = '"Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji"';
const GOLD = "#FFC93C";

export const LEONES_FPS = 30;
export const LEONES_DURATION = 698; // 23.27 s, length of the source clip

// Virtual camera: zoom + framing over time. Origin is in % of the frame.
// The later keyframes zoom in enough to hide the safari vehicle's window
// pillar on the bottom-right of the source footage.
type CamKey = { f: number; s: number; x: number; y: number };
const CAMERA: CamKey[] = [
  { f: 0, s: 1.04, x: 50, y: 55 }, // wide establishing
  { f: 180, s: 1.14, x: 50, y: 58 }, // slow push-in on the greeting
  { f: 215, s: 1.15, x: 58, y: 58 }, // follow the male walking off
  { f: 260, s: 1.28, x: 12, y: 60 }, // reframe on the resting group
  { f: 420, s: 1.28, x: 12, y: 60 },
  { f: 440, s: 1.3, x: 14, y: 62 }, // punch-in: lioness walks past
  { f: 545, s: 1.3, x: 16, y: 62 },
  { f: LEONES_DURATION, s: 1.38, x: 22, y: 60 }, // slow push to the end
];

const camAt = (frame: number) => {
  const i = Math.max(
    0,
    CAMERA.findIndex(
      (k, idx) => frame >= k.f && frame < (CAMERA[idx + 1]?.f ?? Infinity),
    ),
  );
  const a = CAMERA[i];
  const b = CAMERA[i + 1] ?? a;
  const t =
    b.f === a.f
      ? 0
      : interpolate(frame, [a.f, b.f], [0, 1], {
          easing: Easing.inOut(Easing.cubic),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  return {
    s: a.s + (b.s - a.s) * t,
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
};

const Footage: React.FC = () => {
  const frame = useCurrentFrame();
  const { s, x, y } = camAt(frame);
  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile("leones/leones-hd.mp4")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${s})`,
          transformOrigin: `${x}% ${y}%`,
          // Warm, punchy safari grade
          filter: "contrast(1.08) saturate(1.22) brightness(1.03) sepia(0.06)",
        }}
      />
      {/* Vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)",
        }}
      />
      {/* Top shade so the text always reads */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 22%, rgba(0,0,0,0) 38%)",
        }}
      />
    </AbsoluteFill>
  );
};

// Fade/scale envelope for an element living between `from` and `to`.
const usePop = (from: number, to: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - from,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.6 },
  });
  const exit = interpolate(frame, [to - 8, to], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const visible = frame >= from && frame < to;
  return { visible, enter, exit, frame };
};

const textShadow =
  "0 4px 0 rgba(0,0,0,0.9), 0 0 18px rgba(0,0,0,0.65), 0 8px 24px rgba(0,0,0,0.5)";

const Hook: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const { visible, enter, exit, frame } = usePop(from, to);
  if (!visible) return null;
  const subIn = interpolate(frame - from, [10, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        paddingTop: 250,
        opacity: exit,
      }}
    >
      <div
        style={{
          fontFamily: `${montserrat}, ${EMOJI}`,
          fontWeight: 900,
          fontSize: 34,
          letterSpacing: 6,
          color: "black",
          background: GOLD,
          padding: "10px 26px",
          borderRadius: 999,
          transform: `scale(${enter})`,
        }}
      >
        🦁 SAFARI
      </div>
      <div
        style={{
          marginTop: 22,
          fontFamily: anton,
          fontSize: 150,
          lineHeight: 1,
          color: "white",
          textAlign: "center",
          textShadow,
          transform: `scale(${0.6 + 0.4 * enter}) rotate(${(1 - enter) * -6}deg)`,
        }}
      >
        LEONES <span style={{ color: GOLD }}>E HIJOS</span>
      </div>
      <div
        style={{
          marginTop: 26,
          maxWidth: 900,
          fontFamily: `${montserrat}, ${EMOJI}`,
          fontWeight: 800,
          fontSize: 50,
          lineHeight: 1.2,
          color: "white",
          textAlign: "center",
          textShadow,
          opacity: subIn,
          transform: `translateY(${(1 - subIn) * 30}px)`,
        }}
      >
        Una familia de leones a metros de nosotros 😳
      </div>
    </AbsoluteFill>
  );
};

// TikTok-style caption: white bold text, one highlighted phrase on a gold box.
const Caption: React.FC<{
  from: number;
  to: number;
  before?: string;
  highlight: string;
  after?: string;
  top?: number;
}> = ({ from, to, before, highlight, after, top = 300 }) => {
  const { visible, enter, exit } = usePop(from, to);
  if (!visible) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: top }}>
      <div
        style={{
          maxWidth: 920,
          textAlign: "center",
          fontFamily: `${montserrat}, ${EMOJI}`,
          fontWeight: 900,
          fontSize: 66,
          lineHeight: 1.25,
          color: "white",
          textShadow,
          opacity: exit,
          transform: `scale(${0.7 + 0.3 * enter}) translateY(${(1 - enter) * 40}px)`,
        }}
      >
        {before ? <span>{before} </span> : null}
        <span
          style={{
            background: GOLD,
            color: "black",
            textShadow: "none",
            padding: "0 16px",
            borderRadius: 14,
            boxDecorationBreak: "clone",
            WebkitBoxDecorationBreak: "clone",
          }}
        >
          {highlight}
        </span>
        {after ? <span> {after}</span> : null}
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const { visible, enter, frame } = usePop(from, to + 8);
  const { fps } = useVideoConfig();
  if (!visible) return null;
  const followIn = spring({
    frame: frame - from - 35,
    fps,
    config: { damping: 10, stiffness: 160, mass: 0.6 },
  });
  const pulse = 1 + 0.04 * Math.sin(((frame - from) / fps) * Math.PI * 2.2);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 280 }}>
      <div
        style={{
          maxWidth: 920,
          textAlign: "center",
          fontFamily: `${montserrat}, ${EMOJI}`,
          fontWeight: 900,
          fontSize: 70,
          lineHeight: 1.2,
          color: "white",
          textShadow,
          transform: `scale(${0.7 + 0.3 * enter})`,
          opacity: enter,
        }}
      >
        ¿Te atreverías a estar <span style={{ color: GOLD }}>tan cerca</span>?
        👇
      </div>
      <div
        style={{
          marginTop: 40,
          fontFamily: `${montserrat}, ${EMOJI}`,
          fontWeight: 900,
          fontSize: 46,
          color: "black",
          background: GOLD,
          padding: "16px 40px",
          borderRadius: 999,
          boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
          opacity: followIn > 0.01 ? 1 : 0,
          transform: `scale(${followIn * pulse})`,
        }}
      >
        Sígueme para más 🦁
      </div>
    </AbsoluteFill>
  );
};

export const LeonesTikTok: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Footage />
      <Hook from={0} to={100} />
      <Caption
        from={105}
        to={190}
        before="El macho"
        highlight="saluda a su familia"
        after="❤️"
      />
      <Caption
        from={195}
        to={260}
        before="…y se va como"
        highlight="todo un rey"
        after="👑"
      />
      <Caption
        from={275}
        to={415}
        before="Hora de"
        highlight="descansar a la sombra"
        after="😴"
      />
      <Caption
        from={425}
        to={545}
        before="Una leona pasa"
        highlight="justo a nuestro lado"
        after="😱"
      />
      <EndCard from={555} to={LEONES_DURATION} />
    </AbsoluteFill>
  );
};
