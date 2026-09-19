import { z } from "zod";

/** Espelha src/lib/imageSettings.ts (ImageSettings) — validação do formato salvo no banco. */
export const imageSettingsSchema = z.object({
  positionX: z.number().min(0).max(100),
  positionY: z.number().min(0).max(100),
  zoom: z.number().min(1).max(3),
  rotation: z.number().min(-45).max(45),
});

export const imageSettingsPatchSchema = z.object({
  desktopSettings: imageSettingsSchema.nullable().optional(),
  mobileSettings: imageSettingsSchema.nullable().optional(),
});
