import { loadFont } from "@remotion/fonts";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Fonts are bundled in public/fonts so rendering works offline.
const anton = "Anton";
const montserrat = "Montserrat";
const fontsHandle = delayRender("Loading fonts");
Promise.all([
  loadFont({ family: anton, url: staticFile("fonts/anton-latin-400-normal.woff2") }),
  loadFont({
    family: montserrat,
    url: staticFile("fonts/montserrat-latin-600-normal.woff2"),
    weight: "600",
  }),
  loadFont({
    family: montserrat,
    url: staticFile("fonts/montserrat-latin-800-normal.woff2"),
    weight: "800",
  }),
]).then(() => continueRender(fontsHandle));

const ACCENT = "#FFB703";

// Shot boundaries (in frames @30fps) detected from the source clip.
export const SHOTS = [
  { from: 0, title: "GUEPARDO", fact: "Alcanza 110 km/h en segundos" },
  { from: 132, title: "LEONA Y SU CACHORRO", fact: "Las leonas crían en grupo" },
  { from: 283, title: "CEBRA", fact: "No hay dos rayas iguales" },
  { from: 419, title: "CACHORRO DE LEÓN", fact: "Nace con manchas que pierde al crecer" },
  { from: 513, title: "GUEPARDO", fact: "El felino más rápido del planeta" },
];

export const SAFARI_DURATION = 779;
const OUTRO_START = 690;

const shotIndexAt = (frame: number) => {
  let idx = 0;
  SHOTS.forEach((s, i) => {
    if (frame >= s.from) idx = i;
  });
  return idx;
};

const Footage: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = shotIndexAt(frame);
  const shotStart = SHOTS[idx].from;
  const shotEnd = SHOTS[idx + 1]?.from ?? SAFARI_DURATION;
  const local = frame - shotStart;

  // Slow push-in through each shot + quick punch-in right at the cut.
  const drift = interpolate(frame, [shotStart, shotEnd], [1, 1.08]);
  const punch =
    idx === 0
      ? 1
      : interpolate(local, [0, 8], [1.12, 1], {
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });

  return (
    <AbsoluteFill style={{ transform: `scale(${drift * punch})` }}>
      <OffthreadVideo
        src={staticFile("safari.mp4")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </AbsoluteFill>
  );
};

const CutFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 1, 6], [0, 0.55, 0], {
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ backgroundColor: "white", opacity }} />;
};

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12, mass: 0.6 } });
  const sub = spring({ frame: frame - 10, fps, config: { damping: 200 } });
  const out = interpolate(frame, [100, 120], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", opacity: out, top: 330 }}
    >
      <div
        style={{
          fontFamily: anton,
          fontSize: 150,
          lineHeight: 0.95,
          color: "white",
          textAlign: "center",
          textShadow: "0 8px 30px rgba(0,0,0,0.6)",
          transform: `scale(${interpolate(pop, [0, 1], [1.6, 1])})`,
          opacity: pop,
        }}
      >
        ASÍ ES LA
        <br />
        <span style={{ color: ACCENT }}>SABANA</span>
      </div>
      <div
        style={{
          marginTop: 24,
          fontFamily: montserrat,
          fontWeight: 800,
          fontSize: 46,
          color: "white",
          letterSpacing: 6,
          background: "rgba(0,0,0,0.55)",
          padding: "10px 28px",
          borderRadius: 12,
          opacity: sub,
          transform: `translateY(${interpolate(sub, [0, 1], [30, 0])}px)`,
        }}
      >
        ÁFRICA SALVAJE
      </div>
    </AbsoluteFill>
  );
};

const ShotLabel: React.FC<{ title: string; fact: string; delay: number }> = ({
  title,
  fact,
  delay,
}) => {
  const frame = useCurrentFrame() - delay;
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16 } });
  const factIn = spring({ frame: frame - 6, fps, config: { damping: 18 } });
  const exit = interpolate(
    frame,
    [durationInFrames - delay - 10, durationInFrames - delay],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ padding: "230px 70px", opacity: exit }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          transform: `translateX(${interpolate(enter, [0, 1], [-700, 0])}px)`,
        }}
      >
        <div style={{ width: 12, height: 86, background: ACCENT, borderRadius: 6 }} />
        <div
          style={{
            fontFamily: anton,
            fontSize: 86,
            color: "white",
            lineHeight: 1,
            textShadow: "0 6px 24px rgba(0,0,0,0.6)",
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          marginTop: 18,
          alignSelf: "flex-start",
          fontFamily: montserrat,
          fontWeight: 600,
          fontSize: 40,
          color: "#111",
          background: "rgba(255,255,255,0.92)",
          padding: "10px 22px",
          borderRadius: 10,
          opacity: factIn,
          transform: `translateY(${interpolate(factIn, [0, 1], [20, 0])}px)`,
        }}
      >
        {fact}
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const q = spring({ frame, fps, config: { damping: 14 } });
  const cta = spring({ frame: frame - 18, fps, config: { damping: 10, mass: 0.7 } });
  const pulse = 1 + Math.sin(Math.max(0, frame - 30) / 5) * 0.03;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", top: -120 }}>
      <div
        style={{
          fontFamily: anton,
          fontSize: 104,
          color: "white",
          textAlign: "center",
          lineHeight: 1.05,
          opacity: q,
          transform: `translateY(${interpolate(q, [0, 1], [40, 0])}px)`,
          textShadow: "0 8px 30px rgba(0,0,0,0.7)",
        }}
      >
        ¿CUÁL ES TU
        <br />
        <span style={{ color: ACCENT }}>FAVORITO?</span>
      </div>
      <div
        style={{
          marginTop: 30,
          fontFamily: montserrat,
          fontWeight: 600,
          fontSize: 38,
          color: "white",
          opacity: q,
        }}
      >
        Déjalo en los comentarios
      </div>
      <div
        style={{
          marginTop: 60,
          fontFamily: montserrat,
          fontWeight: 800,
          fontSize: 48,
          color: "#111",
          background: ACCENT,
          padding: "20px 46px",
          borderRadius: 999,
          letterSpacing: 2,
          opacity: cta,
          transform: `scale(${interpolate(cta, [0, 1], [0.4, 1]) * pulse})`,
          boxShadow: "0 10px 40px rgba(255,183,3,0.45)",
        }}
      >
        SÍGUEME PARA MÁS
      </div>
    </AbsoluteFill>
  );
};

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        height: 8,
        width: `${(frame / (durationInFrames - 1)) * 100}%`,
        background: ACCENT,
      }}
    />
  );
};

export const Safari: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      <Footage />

      {SHOTS.slice(1).map((s) => (
        <Sequence key={s.from} from={s.from} durationInFrames={8} layout="none">
          <CutFlash />
        </Sequence>
      ))}

      <Sequence durationInFrames={120}>
        <Hook />
      </Sequence>

      {/* The first shot is covered by the hook, so labels start from shot 2. */}
      {SHOTS.slice(1).map((s, i) => {
        const end = Math.min(SHOTS[i + 2]?.from ?? OUTRO_START, OUTRO_START);
        return (
          <Sequence key={s.from} from={s.from} durationInFrames={end - s.from}>
            <ShotLabel title={s.title} fact={s.fact} delay={6} />
          </Sequence>
        );
      })}

      <Sequence from={OUTRO_START}>
        <Outro />
      </Sequence>

      <ProgressBar />
    </AbsoluteFill>
  );
};
