import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import "../styles/ghost.css";

const ghostPhotoModules = import.meta.glob(
  "/public/assets/ghost/*.{png,jpg,jpeg,webp,avif,gif}",
  { eager: true, import: "default", query: "?url" },
);
const ghostPhotoSources = Object.values(ghostPhotoModules) as string[];

const preloadedPhotos = new Map<string, HTMLImageElement>();

function preloadPhoto(src: string) {
  if (!src || preloadedPhotos.has(src)) return;
  const img = new Image();
  img.src = src;
  preloadedPhotos.set(src, img);
}

ghostPhotoSources.forEach(preloadPhoto);

const FACE_DEFAULT_TRANSFORM = "translateX(calc(-50% - 10px))";
const EYE_DEFAULT_TRANSFORM = "translateX(-12px)";

export interface GhostHandle {
  trigger: () => void;
}

export const Ghost = forwardRef<GhostHandle>(function Ghost(_props, ref) {
    const [currentGhostPhoto, setCurrentGhostPhoto] = useState(
      ghostPhotoSources[0] ?? "",
    );
    const ghostPhotoRef = useRef<HTMLImageElement>(null);
    const faceRef = useRef<HTMLDivElement>(null);
    const photoFaceRef = useRef<HTMLDivElement>(null);
    const eyeContainerRef = useRef<HTMLDivElement>(null);
    const eyeLRef = useRef<HTMLDivElement>(null);
    const eyeRRef = useRef<HTMLDivElement>(null);
    const isBusyRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const trigger = useCallback(() => {
      if (isBusyRef.current) return;

      const face = faceRef.current;
      const photoFace = photoFaceRef.current;
      const eyeContainer = eyeContainerRef.current;
      const eyeL = eyeLRef.current;
      const eyeR = eyeRRef.current;

      if (!face || !photoFace || !eyeContainer || !eyeL || !eyeR) return;

      isBusyRef.current = true;

      const eyes = [eyeL, eyeR];
      const canShowPhoto = ghostPhotoSources.length > 0;
      let showPhoto = canShowPhoto && Math.random() > 0.5;

      let nextPhoto = "";
      if (showPhoto) {
        nextPhoto =
          ghostPhotoSources[
            Math.floor(Math.random() * ghostPhotoSources.length)
          ];
        const preloaded = preloadedPhotos.get(nextPhoto);
        if (!preloaded || !preloaded.complete) {
          showPhoto = false;
        }
      }

      const isHappy = showPhoto || Math.random() > 0.5;

      if (isHappy) {
        if (showPhoto) {
          setCurrentGhostPhoto(nextPhoto);
          if (ghostPhotoRef.current) {
            ghostPhotoRef.current.src = nextPhoto;
          }
        }

        face.style.setProperty("--face-start-pos", FACE_DEFAULT_TRANSFORM);
        eyeContainer.style.setProperty(
          "--eye-start-pos",
          EYE_DEFAULT_TRANSFORM,
        );
        face.classList.add("face-happy-active");
        eyeContainer.classList.add("eye-happy-active");
        if (showPhoto) {
          photoFace.classList.add("photo-happy-active");
        }

        eyes.forEach((eye) => eye.classList.add("happy"));

        window.setTimeout(() => {
          eyes.forEach((eye) => eye.classList.remove("happy"));
          face.classList.remove("face-happy-active");
          eyeContainer.classList.remove("eye-happy-active");
          photoFace.classList.remove("photo-happy-active");
          isBusyRef.current = false;
        }, 6000);

        return;
      }

      // Angry reaction — fast jittery movement, then restore
      eyes.forEach((eye) => eye.classList.add("angry"));
      document.documentElement.style.setProperty("--move-duration", "0.6s");

      window.setTimeout(() => {
        eyes.forEach((eye) => eye.classList.remove("angry"));
        document.documentElement.style.setProperty("--move-duration", "5s");
        isBusyRef.current = false;
      }, 2600);
    }, []);

    useImperativeHandle(ref, () => ({ trigger }), [trigger]);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          el.classList.toggle("ghost-paused", !entry.isIntersecting);
        },
        { threshold: 0 },
      );

      observer.observe(el);

      return () => observer.disconnect();
    }, []);

    return (
      <div className="hero-ghost" aria-hidden="true" ref={containerRef}>
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <clipPath id="gc" clipPathUnits="objectBoundingBox">
              <path d="M0,0 L1,0 L1,0.846 A0.1,0.077 0 0,1 0.8,0.846 A0.1,0.077 0 0,0 0.6,0.846 A0.1,0.077 0 0,1 0.4,0.846 A0.1,0.077 0 0,0 0.2,0.846 A0.1,0.077 0 0,1 0,0.846 Z" />
            </clipPath>
          </defs>
        </svg>

        <div className="scene">
          <div
            className="sym sx"
            style={{ left: "18px", top: "148px" }}
          ></div>
          <div
            className="sym sc"
            style={{
              left: "10px",
              top: "192px",
              width: "18px",
              height: "18px",
            }}
          ></div>
          <div
            className="sym sp"
            style={{ left: "44px", bottom: "168px" }}
          ></div>
          <div
            className="sym sx"
            style={{ right: "20px", top: "140px" }}
          ></div>
          <div
            className="sym sc"
            style={{
              right: "10px",
              top: "186px",
              width: "14px",
              height: "14px",
            }}
          ></div>
          <div
            className="sym sp"
            style={{ right: "44px", bottom: "168px" }}
          ></div>

          <div className="ghost">
            <div className="ghost-face" ref={faceRef}>
              <div className="ghost-eyes" ref={eyeContainerRef}>
                <div className="eye eye-l" ref={eyeLRef}></div>
                <div className="eye eye-r" ref={eyeRRef}></div>
              </div>
            </div>
            <div className="ghost-photo-face" ref={photoFaceRef}>
              {currentGhostPhoto ? (
                <img
                  ref={ghostPhotoRef}
                  className="ghost-photo-face__image"
                  src={currentGhostPhoto}
                  alt=""
                  aria-hidden="true"
                  decoding="async"
                />
              ) : null}
            </div>
            <div className="ghost-feet">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
          <div className="ghost-shadow"></div>
        </div>
      </div>
    );
  },
);
