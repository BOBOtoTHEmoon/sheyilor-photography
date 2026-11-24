export type Settings = {
  business_name: string;
  phone: string;
  whatsapp: string;
  whatsapp_message: string;
  email: string;
  instagram: string;
  tiktok: string;
  x_handle: string;
  location: string;
  headline: string;
  about_title: string;
  about_body: string;
  deposit_percent: number;
  express_fee: number;
  extra_image_fee: number;
  lateness_fee: number;
  gallery_days: number;
  training_contact: string;
  hero_video_url: string | null;
  hero_poster_url: string | null;
};

export type Term = { title: string; body: string };
export type Included = { title: string; detail: string };

export type SessionType = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  rate_card_url: string | null;
  notes: string[];
  terms: Term[];
  has_logistics: boolean;
  has_express: boolean;
  full_day: boolean;
  ready: boolean;
  sort: number;
};

export type Package = {
  id: string;
  session_type_id: string;
  name: string;
  subtitle: string;
  price: number | null;
  per_outfit: boolean;
  images_included: number | null;
  included: Included[];
  highlight: boolean;
  sort: number;
};

export type LogisticsFee = {
  id: string;
  session_type_id: string | null;
  kind: "outdoor" | "home";
  area: string;
  fee: number;
  sort: number;
};

export type Extra = {
  id: string;
  session_type_id: string | null;
  name: string;
  price: number | null;
  unit: string;
  sort: number;
};

export type FieldType = "text" | "long" | "email" | "tel" | "number" | "date" | "time" | "choice";

export type FormField = {
  id: string;
  session_type_id: string;
  label: string;
  field_type: FieldType;
  role: "name" | "email" | "phone" | null;
  options: string[];
  placeholder: string | null;
  required: boolean;
  sort: number;
};

export type Collection = {
  id: string;
  slug: string;
  name: string;
  description: string;
  cta_label: string;
  session_type_slug: string | null;
  cover_url: string | null;
  sort: number;
};

export type Photo = {
  id: string;
  collection_id: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  sort: number;
};

export type HomeItem = {
  id: string;
  section: "hero" | "featured" | "about";
  position: number;
  image_url: string;
  alt: string;
  caption: string;
  collection_slug: string | null;
};

export type Testimonial = { id: string; name: string; context: string; quote: string; sort: number };

export type SiteData = {
  settings: Settings;
  sessionTypes: SessionType[];
  packages: Package[];
  logistics: LogisticsFee[];
  extras: Extra[];
  fields: FormField[];
  collections: Collection[];
  home: HomeItem[];
  testimonials: Testimonial[];
  live: boolean; // false = running on built-in defaults (no database connected yet)
};

export type Availability = {
  blockedDays: string[]; // YYYY-MM-DD, whole day unavailable
  takenSlots: { day: string; time: string }[];
};
