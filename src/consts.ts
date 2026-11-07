/** Site name. Appended to every page title and used as `og:site_name`. */
export const SITE_NAME = "Woodream";
/** Fallback meta description for pages that don't set their own. */
export const SITE_DESCRIPTION =
  "Built by hand. Backed by heart. Woodream creates timeless, custom millwork for homes and sacred spaces.";
/** Canonical origin. Resolves canonical URLs, social images, and the sitemap. */
export const SITE_URL = "https://woodreamhome.com";
/** BCP 47 locale tag used to format dates and numbers. */
export const SITE_LOCALE = "en-US";
/** Routes excluded from search and the sitemap. Surrounding slashes are ignored. */
export const NOINDEX_ROUTES: string[] = ["/404", "/example-components"];

/** Main navigation, read by `Nav` and `Footer`. */
export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/dreamline", label: "Dreamline" },
  { href: "/contact", label: "Contact" },
];

/** The nav's call to action. On small screens it folds into the menu as a link. */
export const NAV_CTA = { href: "/contact", label: "Contact us" };

/** Intro on the Gallery page and every gallery category page. */
export const GALLERY_INTRO =
  "Every piece we make is crafted in-house, designed, built, and finished by the same hands that first heard your idea.";

/** Legal pages, linked from the bottom of every footer. */
export const LEGAL_LINKS = [
  { href: "/legal/privacy-policy", label: "Privacy Policy" },
  { href: "/legal/terms-of-use", label: "Terms of Use" },
  { href: "/legal/cookie-settings", label: "Cookie Settings" },
];

const phone = "732-757-4094";
const email = "Info@woodreamhome.com";
/** WhatsApp number in international format, digits only. */
const whatsapp = "17327574094";

/** Contact details shown in the footer and the WhatsApp button. */
export const CONTACT = {
  phone,
  email,
  phoneHref: `tel:${phone.replace(/\D/g, "")}`,
  emailHref: `mailto:${email}`,
  whatsappHref: `https://wa.me/${whatsapp}`,
};
