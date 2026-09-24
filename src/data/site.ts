// Site-wide details used by the layout, navbar, footer and WhatsApp button.
// Change contact info or navigation here, not in the components.

export const site = {
  name: 'Woodream',
  title: 'Woodream Custom Wood | Millwork Made for You',
  description:
    'Built by hand. Backed by heart. Woodream creates timeless, custom millwork for homes and sacred spaces.',
};

export const contact = {
  phone: '732-757-4094',
  email: 'Info@woodreamhome.com',
  /** WhatsApp number in international format, digits only. */
  whatsapp: '17327574094',
};

/**
 * Where the footer contact form posts to. Any service that accepts a form POST
 * and answers JSON works (Formspree, Web3Forms, Basin…), e.g.
 * 'https://formspree.io/f/abcdwxyz'. Leave empty until one is set up; the form
 * then shows its error message instead of pretending to send.
 */
export const formEndpoint = '';

export const phoneHref = `tel:${contact.phone.replace(/\D/g, '')}`;
export const emailHref = `mailto:${contact.email}`;
export const whatsappHref = `https://wa.me/${contact.whatsapp}`;

export type NavLink = { href: string; label: string };

export const navLinks: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];

export const legalLinks: NavLink[] = [
  { href: '/legal/privacy-policy', label: 'Privacy Policy' },
  { href: '/legal/terms-of-use', label: 'Terms of Use' },
  { href: '/legal/cookie-settings', label: 'Cookie Settings' },
];

/** Whether `href` is the page at `url` (ignores a trailing slash). */
export const isCurrentPage = (url: URL, href: string) => (url.pathname.replace(/\/$/, '') || '/') === href;
