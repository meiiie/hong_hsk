import { prefersReducedMotion } from "./motion-preferences";
import { motionDurations, motionEases } from "./motion-tokens";

type AnimeModule = typeof import("animejs");

let animeModulePromise: Promise<AnimeModule> | undefined;

export interface SidebarMotionState {
  activeView: string;
  sidebarCollapsed: boolean;
  mobileMoreOpen: boolean;
  learned: number;
  totalItems: number;
  learnedPercent: number;
  dueToday: number;
}

export function hydrateSidebarMotion(
  root: ParentNode,
  current: SidebarMotionState,
  previous: SidebarMotionState | undefined,
): void {
  if (prefersReducedMotion()) {
    return;
  }

  const isInitialRender = !previous;
  const activeViewChanged = previous?.activeView !== current.activeView;
  const mobileMoreOpened = current.mobileMoreOpen && previous?.mobileMoreOpen !== true;
  const progressChanged =
    previous?.learned !== current.learned ||
    previous?.totalItems !== current.totalItems ||
    previous?.learnedPercent !== current.learnedPercent ||
    previous?.dueToday !== current.dueToday;

  if (isInitialRender) {
    void animateSidebarEntrance(root);
  }
  if (isInitialRender || activeViewChanged) {
    void animateActiveNavItem(root);
  }
  if (isInitialRender || progressChanged) {
    void animateSidebarProgress(root);
  }
  if (mobileMoreOpened) {
    void animateMobileMoreSheet(root);
  }
}

export function animateSidebarToggleMotion(root: ParentNode, collapsed: boolean): void {
  if (prefersReducedMotion()) {
    return;
  }

  void runWithAnime(async ({ animate }) => {
    const brandMark = root.querySelector<HTMLElement>('[data-motion="sidebar-brand"] .brand-mark');
    if (brandMark) {
      animate(brandMark, {
        scale: collapsed ? [0.99, 1] : [0.995, 1],
        duration: motionDurations.fast,
        ease: motionEases.standard,
      });
    }

    const footer = root.querySelector<HTMLElement>('[data-motion="sidebar-footer"]');
    if (!footer || collapsed) {
      return;
    }

    animate(footer, {
      opacity: [0.9, 1],
      translateY: [5, 0],
      duration: motionDurations.medium,
      ease: motionEases.emphasized,
    });
  });
}

async function animateSidebarEntrance(root: ParentNode): Promise<void> {
  await runWithAnime(async ({ animate, stagger }) => {
    const items = [...root.querySelectorAll<HTMLElement>('[data-motion="sidebar-nav-item"]')];
    if (items.length > 0) {
      animate(items, {
        opacity: [0, 1],
        translateY: [4, 0],
        duration: motionDurations.medium,
        delay: stagger(16),
        ease: motionEases.standard,
      });
    }

    const footer = root.querySelector<HTMLElement>('[data-motion="sidebar-footer"]');
    if (footer) {
      animate(footer, {
        opacity: [0, 1],
        translateY: [8, 0],
        duration: motionDurations.slow,
        delay: 80,
        ease: motionEases.emphasized,
      });
    }
  });
}

async function animateActiveNavItem(root: ParentNode): Promise<void> {
  await runWithAnime(async ({ animate }) => {
    const active = root.querySelector<HTMLElement>('[data-motion="sidebar-nav-item"][data-motion-active="true"]');
    if (!active) {
      return;
    }

    animate(active, {
      scale: [0.985, 1],
      duration: motionDurations.medium,
      ease: motionEases.emphasized,
    });

    const icon = active.querySelector<HTMLElement>(".icon");
    if (icon) {
      animate(icon, {
        translateY: [1, 0],
        duration: motionDurations.fast,
        ease: motionEases.standard,
      });
    }
  });
}

async function animateSidebarProgress(root: ParentNode): Promise<void> {
  await runWithAnime(async ({ animate }) => {
    const progress = root.querySelector<HTMLElement>('[data-motion="sidebar-progress"] span');
    if (!progress) {
      return;
    }

    animate(progress, {
      scaleX: [0.96, 1],
      transformOrigin: "0 50%",
      duration: motionDurations.medium,
      ease: motionEases.standard,
    });
  });
}

async function animateMobileMoreSheet(root: ParentNode): Promise<void> {
  await runWithAnime(async ({ animate }) => {
    const sheet = root.querySelector<HTMLElement>('[data-motion="mobile-more-sheet"]');
    if (!sheet) {
      return;
    }

    animate(sheet, {
      opacity: [0, 1],
      translateY: [18, 0],
      duration: motionDurations.slow,
      ease: motionEases.emphasized,
    });

    const scrim = root.querySelector<HTMLElement>(".mobile-more-scrim");
    if (scrim) {
      animate(scrim, {
        opacity: [0, 1],
        duration: motionDurations.fast,
        ease: motionEases.standard,
      });
    }
  });
}

async function runWithAnime(callback: (anime: AnimeModule) => void | Promise<void>): Promise<void> {
  const anime = await loadAnime();
  await callback(anime);
}

function loadAnime(): Promise<AnimeModule> {
  animeModulePromise ??= import("animejs");
  return animeModulePromise;
}
