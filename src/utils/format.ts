import { SITE_LOCALE } from "../consts.ts";

/** Whole-dollar price, e.g. `$4,750`. Used by the configurator. */
export const formatPrice = (amount: number) =>
  `$${amount.toLocaleString(SITE_LOCALE)}`;
