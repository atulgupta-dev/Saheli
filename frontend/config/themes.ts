import type { LifeStage } from "@/types/saheli";

export interface StageThemeTokens {
  id: LifeStage;
  primary: string;
  primaryDark: string;
  secondary: string;
  mutedAccent: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
  badgeBg: string;
  badgeText: string;
  chartPalette: [string, string, string];
  cssVars: Record<string, string>;
}

export const STAGE_THEMES: Record<LifeStage, StageThemeTokens> = {
  menstrual: {
    id: "menstrual",
    primary: "#A63D62",
    primaryDark: "#872B4B",
    secondary: "#E7A0B3",
    mutedAccent: "#F5D9D3",
    background: "#FFF6F2",
    surface: "#FFFCFA",
    surfaceMuted: "#FDF0EC",
    text: "#38252E",
    textMuted: "#826A73",
    border: "#F2DFDA",
    badgeBg: "#FBE8EF",
    badgeText: "#872B4B",
    chartPalette: ["#A63D62", "#E7A0B3", "#F5D9D3"],
    cssVars: {
      "--stage-primary": "#A63D62",
      "--stage-primary-dark": "#872B4B",
      "--stage-secondary": "#E7A0B3",
      "--stage-muted-accent": "#F5D9D3",
      "--stage-bg": "#FFF6F2",
      "--stage-surface": "#FFFCFA",
      "--stage-surface-muted": "#FDF0EC",
      "--stage-text": "#38252E",
      "--stage-text-muted": "#826A73",
      "--stage-border": "#F2DFDA",
      "--stage-badge-bg": "#FBE8EF",
      "--stage-badge-text": "#872B4B",
    },
  },
  pregnancy: {
    id: "pregnancy",
    primary: "#7952B3",
    primaryDark: "#5E3A96",
    secondary: "#B69AE5",
    mutedAccent: "#E4D8F7",
    background: "#F8F5FC",
    surface: "#FFFFFF",
    surfaceMuted: "#F2ECFA",
    text: "#292336",
    textMuted: "#776C87",
    border: "#EAE2F5",
    badgeBg: "#EDE5FA",
    badgeText: "#5E3A96",
    chartPalette: ["#7952B3", "#B69AE5", "#E4D8F7"],
    cssVars: {
      "--stage-primary": "#7952B3",
      "--stage-primary-dark": "#5E3A96",
      "--stage-secondary": "#B69AE5",
      "--stage-muted-accent": "#E4D8F7",
      "--stage-bg": "#F8F5FC",
      "--stage-surface": "#FFFFFF",
      "--stage-surface-muted": "#F2ECFA",
      "--stage-text": "#292336",
      "--stage-text-muted": "#776C87",
      "--stage-border": "#EAE2F5",
      "--stage-badge-bg": "#EDE5FA",
      "--stage-badge-text": "#5E3A96",
    },
  },
  postpartum: {
    id: "postpartum",
    primary: "#386B57",
    primaryDark: "#275140",
    secondary: "#8CB29D",
    mutedAccent: "#DCE9DB",
    background: "#F7F7EE",
    surface: "#FFFFFF",
    surfaceMuted: "#EDF3EB",
    text: "#24372E",
    textMuted: "#697B70",
    border: "#DEE7DC",
    badgeBg: "#E3EFE4",
    badgeText: "#275140",
    chartPalette: ["#386B57", "#8CB29D", "#DCE9DB"],
    cssVars: {
      "--stage-primary": "#386B57",
      "--stage-primary-dark": "#275140",
      "--stage-secondary": "#8CB29D",
      "--stage-muted-accent": "#DCE9DB",
      "--stage-bg": "#F7F7EE",
      "--stage-surface": "#FFFFFF",
      "--stage-surface-muted": "#EDF3EB",
      "--stage-text": "#24372E",
      "--stage-text-muted": "#697B70",
      "--stage-border": "#DEE7DC",
      "--stage-badge-bg": "#E3EFE4",
      "--stage-badge-text": "#275140",
    },
  },
};
