// The product configurator's logic, kept free of Astro and the browser so it can
// be tested on its own and reused by any UI. Given a product's options and what
// the customer picked, `evaluate` works out everything the page shows.
// See docs/product-configurator.md for how products are set up.

/** Option name → choice label, e.g. { Doors: 'Yes' }. Every entry has to hold. */
export type Condition = Record<string, string>;
export type Picks = Record<string, string>;

export interface Choice {
  label: string;
  price: number;
  layer?: string;
  swatch?: string;
  selected: boolean;
}

/** A crop of the preview: position in % and magnification. */
export interface Thumbnail {
  x: number;
  y: number;
  zoom: number;
}

export interface Option {
  name: string;
  label: string;
  badge?: string;
  woodDetails: boolean;
  showWhen?: Condition;
  thumbnail?: Thumbnail;
  choices: Choice[];
}

export interface Step {
  name: string;
  options: Option[];
}

export interface Rule {
  if: Condition;
  require: Condition;
  message: string;
}

export interface ProductConfig {
  steps: Step[];
  rules: Rule[];
  layerOrder: string[];
}

export interface Line {
  step: number;
  option: string;
  label: string;
  choice: string;
  price: number;
}

export interface Evaluation {
  /** Options currently offered. */
  visible: string[];
  /** Options a rule has fixed to one choice. */
  locks: Picks;
  /** Rule explanations to show next to an option. */
  messages: Record<string, string[]>;
  /** The active layers, bottom to top. */
  layers: string[];
  /** The choices that count, in page order. */
  lines: Line[];
  total: number;
  /** Options still waiting for a choice. */
  missing: { step: number; option: string; label: string }[];
}

const allOptions = (config: ProductConfig) => config.steps.flatMap((step) => step.options);

export function defaultPicks(config: ProductConfig): Picks {
  const picks: Picks = {};
  for (const option of allOptions(config)) {
    const choice = option.choices.find((c) => c.selected);
    if (choice) picks[option.name] = choice.label;
  }
  return picks;
}

export function evaluate(config: ProductConfig, picks: Picks): Evaluation {
  const options = allOptions(config);
  const byName = new Map(options.map((option) => [option.name, option]));
  const current = { ...picks };

  const isVisible = (name: string): boolean => {
    const showWhen = byName.get(name)?.showWhen;
    return !showWhen || holds(showWhen);
  };
  const holds = (condition: Condition) =>
    Object.entries(condition).every(([name, value]) => current[name] === value && isVisible(name));

  // A rule's requirement can switch on another rule, so repeat until nothing changes.
  for (let pass = 0; pass <= config.rules.length; pass++) {
    let changed = false;
    for (const rule of config.rules) {
      if (!holds(rule.if)) continue;
      for (const [name, value] of Object.entries(rule.require)) {
        if (current[name] !== value) {
          current[name] = value;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  const locks: Picks = {};
  const messages: Record<string, string[]> = {};
  for (const rule of config.rules) {
    if (!holds(rule.if)) continue;
    Object.assign(locks, rule.require);
    for (const name of [...Object.keys(rule.if), ...Object.keys(rule.require)]) {
      (messages[name] ??= []).push(rule.message);
    }
  }

  const visible: string[] = [];
  const lines: Line[] = [];
  const missing: Evaluation['missing'] = [];
  const active = new Set<string>();
  config.steps.forEach((step, stepIndex) => {
    for (const option of step.options) {
      if (!isVisible(option.name)) continue;
      visible.push(option.name);
      if (!option.choices.length) continue;
      const choice = option.choices.find((c) => c.label === current[option.name]);
      if (!choice) {
        missing.push({ step: stepIndex, option: option.name, label: option.label });
        continue;
      }
      lines.push({
        step: stepIndex,
        option: option.name,
        label: option.label,
        choice: choice.label,
        price: choice.price,
      });
      if (choice.layer) active.add(choice.layer);
    }
  });

  return {
    visible,
    locks,
    messages,
    layers: config.layerOrder.filter((layer) => active.has(layer)),
    lines,
    total: lines.reduce((sum, line) => sum + line.price, 0),
    missing,
  };
}

/** The picks to share in a link: only what differs from the defaults. */
export function picksToParams(config: ProductConfig, picks: Picks): URLSearchParams {
  const defaults = defaultPicks(config);
  const params = new URLSearchParams();
  for (const line of evaluate(config, picks).lines) {
    if (defaults[line.option] !== line.choice) params.set(line.option, line.choice);
  }
  return params;
}

/** Default picks plus any valid ones from a shared link; anything unrecognized is ignored. */
export function picksFromParams(config: ProductConfig, params: URLSearchParams): Picks {
  const picks = defaultPicks(config);
  for (const option of allOptions(config)) {
    const value = params.get(option.name);
    if (value && option.choices.some((c) => c.label === value)) picks[option.name] = value;
  }
  return picks;
}

export interface ProductChanges {
  /** This product's prices: option name → choice label → price. */
  prices: Record<string, Record<string, number>>;
  /** Options this product doesn't offer. Rules that mention them no longer apply. */
  withoutOptions: string[];
  /** Layers with no artwork for this product; those choices simply don't change the preview. */
  withoutLayers: string[];
  /** Crops for this product, where it sits differently on its canvas: option name → crop. */
  thumbnails: Record<string, Thumbnail>;
}

/** Adapts a shared option set to one product. Returns any unknown names as errors. */
export function applyProduct(
  config: ProductConfig,
  { prices, withoutOptions, withoutLayers, thumbnails }: ProductChanges,
): { config: ProductConfig; errors: string[] } {
  const errors: string[] = [];
  const options = allOptions(config);

  for (const [name, choices] of Object.entries(prices)) {
    const option = options.find((o) => o.name === name);
    if (!option) errors.push(`prices: there is no option called "${name}".`);
    for (const label of Object.keys(choices)) {
      if (option && !option.choices.some((c) => c.label === label)) {
        errors.push(`prices: option "${name}" has no choice called "${label}".`);
      }
    }
  }
  for (const name of withoutOptions) {
    if (!options.some((o) => o.name === name)) errors.push(`withoutOptions: there is no option called "${name}".`);
  }
  for (const name of Object.keys(thumbnails)) {
    if (!options.some((o) => o.name === name)) errors.push(`thumbnails: there is no option called "${name}".`);
  }
  for (const layer of withoutLayers) {
    if (!config.layerOrder.includes(layer)) errors.push(`withoutLayers: there is no layer called "${layer}".`);
  }

  const removed = new Set(withoutOptions);
  const mentionsRemoved = (condition: Condition) => Object.keys(condition).some((name) => removed.has(name));
  const unusedLayers = new Set([
    ...withoutLayers,
    ...options.filter((o) => removed.has(o.name)).flatMap((o) => o.choices.flatMap((c) => c.layer ?? [])),
  ]);

  return {
    errors,
    config: {
      layerOrder: config.layerOrder.filter((layer) => !unusedLayers.has(layer)),
      rules: config.rules.filter((rule) => !mentionsRemoved(rule.if) && !mentionsRemoved(rule.require)),
      steps: config.steps
        .map((step) => ({
          ...step,
          options: step.options
            .filter((option) => !removed.has(option.name))
            .map((option) => ({
              ...option,
              thumbnail: thumbnails[option.name] ?? option.thumbnail,
              choices: option.choices.map((choice) => ({
                ...choice,
                price: prices[option.name]?.[choice.label] ?? choice.price,
                layer: choice.layer && unusedLayers.has(choice.layer) ? undefined : choice.layer,
              })),
            })),
        }))
        .filter((step) => step.options.length),
    },
  };
}

/**
 * Finds mistakes in a product's setup so the build can stop with a clear message.
 * `layers` and `swatches` are the names that actually exist. Returns [] when all is well.
 */
export function validate(
  config: ProductConfig,
  { layers, swatches }: { layers: Set<string>; swatches: Set<string> },
): string[] {
  const errors: string[] = [];
  const options = allOptions(config);
  const byName = new Map(options.map((option) => [option.name, option]));

  const seenOptions = new Set<string>();
  for (const option of options) {
    if (seenOptions.has(option.name)) errors.push(`Two options are called "${option.name}".`);
    seenOptions.add(option.name);

    const labels = option.choices.map((c) => c.label);
    for (const label of new Set(labels.filter((l, i) => labels.indexOf(l) !== i))) {
      errors.push(`Option "${option.name}" has two choices called "${label}".`);
    }
    if (option.choices.filter((c) => c.selected).length > 1) {
      errors.push(`Option "${option.name}" has more than one selected choice.`);
    }
    for (const choice of option.choices) {
      if (choice.swatch && !swatches.has(choice.swatch)) {
        errors.push(`Choice "${option.name}: ${choice.label}" uses a swatch that doesn't exist: "${choice.swatch}".`);
      }
      if (!choice.layer) continue;
      if (!layers.has(choice.layer)) {
        errors.push(`Choice "${option.name}: ${choice.label}" needs a layer image that doesn't exist: "${choice.layer}".`);
      }
      if (!config.layerOrder.includes(choice.layer)) {
        errors.push(`Layer "${choice.layer}" is missing from layerOrder.`);
      }
    }
  }

  const usedLayers = new Set(options.flatMap((o) => o.choices.flatMap((c) => c.layer ?? [])));
  config.layerOrder.forEach((layer, index) => {
    if (!usedLayers.has(layer)) errors.push(`layerOrder lists "${layer}", but no choice uses it.`);
    if (config.layerOrder.indexOf(layer) !== index) errors.push(`layerOrder lists "${layer}" twice.`);
  });

  const checkNames = (condition: Condition, where: string) => {
    for (const [name, value] of Object.entries(condition)) {
      const option = byName.get(name);
      if (!option) errors.push(`${where} refers to an option that doesn't exist: "${name}".`);
      else if (!option.choices.some((c) => c.label === value)) {
        errors.push(`${where} refers to a choice that doesn't exist: "${name}: ${value}".`);
      }
    }
  };
  for (const option of options) {
    if (option.showWhen) checkNames(option.showWhen, `showWhen on "${option.name}"`);
  }
  config.rules.forEach((rule, index) => {
    checkNames(rule.if, `Rule ${index + 1} (if)`);
    checkNames(rule.require, `Rule ${index + 1} (require)`);
  });
  // The checks below follow these references, so they need them to be sound.
  if (errors.length) return errors;

  const inLoop = (name: string, path: string[] = []): boolean => {
    if (path.includes(name)) return true;
    return Object.keys(byName.get(name)?.showWhen ?? {}).some((parent) => inLoop(parent, [...path, name]));
  };
  for (const option of options) {
    if (inLoop(option.name)) errors.push(`Option "${option.name}" depends on itself through showWhen.`);
  }
  if (errors.length) return errors;

  // Everything that has to be true for these conditions to hold, including what
  // makes the options involved visible. Null when that's contradictory.
  const needs = (...conditions: Condition[]): Picks | null => {
    const result: Picks = {};
    const add = (condition: Condition): boolean =>
      Object.entries(condition).every(([name, value]) => {
        if (name in result) return result[name] === value;
        result[name] = value;
        return add(byName.get(name)?.showWhen ?? {});
      });
    return conditions.every(add) ? result : null;
  };

  for (const option of options) {
    if (option.showWhen && !needs(option.showWhen)) errors.push(`Option "${option.name}" can never be shown.`);
  }
  config.rules.forEach((rule, index) => {
    if (!needs(rule.if)) errors.push(`Rule ${index + 1} can never apply: its "if" contradicts itself.`);
    else if (!needs(rule.if, rule.require)) {
      errors.push(`Rule ${index + 1} can never be met: its "require" contradicts its "if".`);
    }
    config.rules.slice(index + 1).forEach((other, offset) => {
      if (!needs(rule.if, other.if)) return;
      for (const [name, value] of Object.entries(rule.require)) {
        if (name in other.require && other.require[name] !== value) {
          errors.push(`Rules ${index + 1} and ${index + offset + 2} can require different choices for "${name}".`);
        }
      }
    });
  });

  return errors;
}
