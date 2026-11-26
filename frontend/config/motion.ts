export const MOTION = {
  buttonTap: { scale: 0.97, transition: { duration: 0.12 } },
  small: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const },
  page: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  stage: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
  heroFloat: {
    y: [0, -6, 0],
    transition: { duration: 4.6, repeat: Infinity, ease: "easeInOut" as const },
  },
  springNav: { type: "spring" as const, stiffness: 420, damping: 32 },
};
