"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useGameStore = create(
  persist(
    (set, get) => ({
      // ---- persisted progress ----
      unlockedKeys: [],          // contentKeys opened at least once
      bestTime: null,
      musicOn: true,
      sfxOn: true,
      graphicsTier: "auto",      // "auto" | "high" | "medium" | "low"

      // ---- transient session (not persisted) ----
      score: 0,
      coins: 0,
      activeContentKey: null,    // key currently mid-reveal
      revealStage: "idle",       // idle | impact | crate | card
      revealAnchor: null,        // {x, y, accent} screen coords, or null (3D-sourced)
      revealSourceType: "2d",    // "2d" | "3d"
      minigame: null,            // { category, contentKey, sourceType }

      unlock: (key) => set((s) =>
        s.unlockedKeys.includes(key) ? s : { unlockedKeys: [...s.unlockedKeys, key] }),
      addScore: (n) => set((s) => ({ score: s.score + n })),
      addCoins: (n) => set((s) => ({ coins: s.coins + n })),

      startReveal: (key, anchor, sourceType = "2d") =>
        set({ activeContentKey: key, revealAnchor: anchor, revealSourceType: sourceType, revealStage: "impact" }),
      setRevealStage: (stage) => set({ revealStage: stage }),
      endReveal: () => set({ activeContentKey: null, revealStage: "idle", revealAnchor: null }),

      startMinigame: (category, contentKey, sourceType) =>
        set({ minigame: { category, contentKey, sourceType } }),
      endMinigame: () => set({ minigame: null }),
    }),
    {
      name: "portfolio-progress",
      partialize: (s) => ({
        unlockedKeys: s.unlockedKeys, bestTime: s.bestTime,
        musicOn: s.musicOn, sfxOn: s.sfxOn, graphicsTier: s.graphicsTier,
      }),
    }
  )
);
