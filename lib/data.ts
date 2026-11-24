import "server-only";
import fs from "node:fs";
import path from "node:path";
import { db, hasDatabase } from "./supabase/admin";
import { defaults, defaultPhotos } from "./defaults";
import type { Availability, Collection, Photo, SiteData } from "./types";

const bySort = <T extends { sort: number }>(a: T, b: T) => a.sort - b.sort;

// Everything the public pages need in one round trip.
// Falls back to the built-in content when no database is connected yet.
// A clip saved as public/video/hero.mp4 plays on the homepage until one is set in the dashboard.
function localHeroVideo() {
  try {
    return fs.existsSync(path.join(process.cwd(), "public", "video", "hero.mp4")) ? "/video/hero.mp4" : null;
  } catch {
    return null;
  }
}

export async function getSiteData(): Promise<SiteData> {
  const data = await loadSiteData();
  if (!data.settings.hero_video_url) data.settings = { ...data.settings, hero_video_url: localHeroVideo() };
  return data;
}

async function loadSiteData(): Promise<SiteData> {
  if (!hasDatabase()) return defaults;
  try {
    const s = db();
    const [settings, types, packages, logistics, extras, fields, collections, home, testimonials] = await Promise.all([
      s.from("settings").select("*").eq("id", 1).maybeSingle(),
      s.from("session_types").select("*").eq("active", true).order("sort"),
      s.from("packages").select("*").eq("active", true).order("sort"),
      s.from("logistics_fees").select("*").order("sort"),
      s.from("extras").select("*").order("sort"),
      s.from("form_fields").select("*").order("sort"),
      s.from("collections").select("*").eq("visible", true).order("sort"),
      s.from("home_items").select("*").order("position"),
      s.from("testimonials").select("*").eq("visible", true).order("sort"),
    ]);
    const firstError = [settings, types, packages, logistics, extras, fields, collections, home, testimonials].find((r) => r.error);
    if (firstError?.error) throw firstError.error;
    return {
      live: true,
      settings: { ...defaults.settings, ...(settings.data ?? {}) },
      sessionTypes: (types.data ?? []).sort(bySort),
      packages: packages.data ?? [],
      logistics: logistics.data ?? [],
      extras: extras.data ?? [],
      fields: fields.data ?? [],
      collections: collections.data ?? [],
      home: home.data ?? [],
      testimonials: testimonials.data ?? [],
    };
  } catch (err) {
    console.error("getSiteData failed, using built-in content", err);
    return defaults;
  }
}

export async function getCollectionPhotos(collection: Collection): Promise<Photo[]> {
  if (!hasDatabase()) {
    return (defaultPhotos[collection.slug] ?? []).map((p, i) => ({
      id: `${collection.slug}-${i}`,
      collection_id: collection.id,
      url: p.url,
      alt: p.alt,
      width: 784,
      height: 1000,
      sort: i,
    }));
  }
  const { data, error } = await db().from("photos").select("*").eq("collection_id", collection.id).order("sort");
  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

export async function getPhotoCounts(): Promise<Record<string, number>> {
  if (!hasDatabase()) {
    return Object.fromEntries(Object.entries(defaultPhotos).map(([k, v]) => [`c-${k}`, v.length]));
  }
  const { data } = await db().from("photos").select("collection_id");
  const counts: Record<string, number> = {};
  for (const row of data ?? []) counts[row.collection_id] = (counts[row.collection_id] ?? 0) + 1;
  return counts;
}

// Days and time slots that can't be booked.
export async function getAvailability(): Promise<Availability> {
  if (!hasDatabase()) return { blockedDays: [], takenSlots: [] };
  const today = new Date().toISOString().slice(0, 10);
  const s = db();
  const [blocked, booked] = await Promise.all([
    s.from("blocked_dates").select("day").gte("day", today),
    s
      .from("bookings")
      .select("shoot_date, shoot_time, session_types(full_day)")
      .in("status", ["confirmed", "shot"])
      .gte("shoot_date", today),
  ]);
  const blockedDays = new Set<string>((blocked.data ?? []).map((r) => r.day));
  const takenSlots: Availability["takenSlots"] = [];
  for (const b of (booked.data ?? []) as unknown as { shoot_date: string; shoot_time: string; session_types: { full_day: boolean } | null }[]) {
    if (!b.shoot_date) continue;
    if (b.session_types?.full_day) blockedDays.add(b.shoot_date);
    else if (b.shoot_time) takenSlots.push({ day: b.shoot_date, time: b.shoot_time });
  }
  return { blockedDays: [...blockedDays], takenSlots };
}
