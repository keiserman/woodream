import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  applyPrices,
  defaultPicks,
  evaluate,
  picksFromParams,
  picksToParams,
  validate,
  type Choice,
  type Option,
  type ProductConfig,
} from './configurator.ts';

const choice = (label: string, extra: Partial<Choice> = {}): Choice => ({ label, price: 0, selected: false, ...extra });
const option = (name: string, choices: Choice[], extra: Partial<Option> = {}): Option => ({
  name,
  label: name,
  woodDetails: false,
  choices,
  ...extra,
});

const config = (): ProductConfig => ({
  layerOrder: ['glass', 'doors', 'shaker'],
  rules: [{ if: { Glass: 'Yes' }, require: { Doors: 'Yes' }, message: 'Glass needs doors.' }],
  steps: [
    {
      name: 'Wood',
      options: [
        option('Wood', [choice('Maple', { price: 2500, selected: true }), choice('Oak', { price: 3000 })]),
      ],
    },
    {
      name: 'Doors',
      options: [
        option('Glass', [choice('No', { selected: true }), choice('Yes', { price: 250, layer: 'glass' })]),
        option('Mirrors', [choice('No'), choice('Yes', { price: 300 })], { showWhen: { Glass: 'Yes' } }),
        option('Doors', [choice('No', { selected: true }), choice('Yes', { price: 250, layer: 'doors' })]),
        option('Style', [choice('Flat'), choice('Shaker', { price: 150, layer: 'shaker' })], {
          showWhen: { Doors: 'Yes' },
        }),
        option('Stain', []),
      ],
    },
  ],
});

const names = { layers: new Set(['glass', 'doors', 'shaker']), swatches: new Set<string>() };

test('starts from the selected choices', () => {
  const result = evaluate(config(), defaultPicks(config()));
  assert.equal(result.total, 2500);
  assert.deepEqual(result.visible, ['Wood', 'Glass', 'Doors', 'Stain']);
  assert.deepEqual(result.layers, []);
  assert.deepEqual(result.missing, []);
});

test('a chain of conditions shows, and hides, its options', () => {
  const picks = { ...defaultPicks(config()), Doors: 'Yes', Style: 'Shaker' };
  const on = evaluate(config(), picks);
  assert.ok(on.visible.includes('Style'));
  assert.equal(on.total, 2900);
  assert.deepEqual(on.layers, ['doors', 'shaker']);

  // Style is still picked, but no longer counts once Doors is off.
  const off = evaluate(config(), { ...picks, Doors: 'No' });
  assert.ok(!off.visible.includes('Style'));
  assert.equal(off.total, 2500);
  assert.deepEqual(off.layers, []);
});

test('options that are offered but unanswered are missing', () => {
  const result = evaluate(config(), { ...defaultPicks(config()), Doors: 'Yes' });
  assert.deepEqual(result.missing, [{ step: 1, option: 'Style', label: 'Style' }]);
});

test('a rule turns on what it requires, locks it and explains why', () => {
  const result = evaluate(config(), { ...defaultPicks(config()), Glass: 'Yes', Mirrors: 'No' });
  assert.equal(result.locks.Doors, 'Yes');
  assert.ok(result.lines.some((line) => line.option === 'Doors' && line.choice === 'Yes'));
  assert.ok(result.visible.includes('Style'));
  assert.equal(result.total, 3000);
  assert.deepEqual(result.messages.Glass, ['Glass needs doors.']);
  assert.deepEqual(result.messages.Doors, ['Glass needs doors.']);
});

test('a rule lets go when its condition ends', () => {
  const result = evaluate(config(), { ...defaultPicks(config()), Glass: 'No' });
  assert.deepEqual(result.locks, {});
  assert.ok(result.lines.some((line) => line.option === 'Doors' && line.choice === 'No'));
});

test('rules can switch on other rules', () => {
  const chained = config();
  chained.rules.push({ if: { Doors: 'Yes' }, require: { Style: 'Flat' }, message: 'Doors are flat.' });
  assert.equal(evaluate(chained, { Glass: 'Yes', Mirrors: 'No' }).locks.Style, 'Flat');
});

test('layers stack in layerOrder, not option order', () => {
  const reordered = { ...config(), layerOrder: ['shaker', 'doors', 'glass'] };
  const result = evaluate(reordered, { Glass: 'Yes', Mirrors: 'No', Style: 'Shaker' });
  assert.deepEqual(result.layers, ['shaker', 'doors', 'glass']);
});

test('shared links round-trip and ignore anything unrecognized', () => {
  const picks = { ...defaultPicks(config()), Wood: 'Oak', Doors: 'Yes', Style: 'Flat' };
  const params = picksToParams(config(), picks);
  assert.equal(params.toString(), 'Wood=Oak&Doors=Yes&Style=Flat');
  assert.deepEqual(picksFromParams(config(), params), picks);

  const bad = picksFromParams(config(), new URLSearchParams('Wood=Plastic&Nope=1'));
  assert.deepEqual(bad, defaultPicks(config()));
});

test('a product can override shared prices', () => {
  const { config: priced, errors } = applyPrices(config(), { Wood: { Maple: 3100 } });
  assert.deepEqual(errors, []);
  assert.equal(evaluate(priced, defaultPicks(priced)).total, 3100);
  assert.equal(config().steps[0].options[0].choices[0].price, 2500);

  const wrong = applyPrices(config(), { Wod: { Maple: 1 }, Wood: { Cherry: 1 } });
  assert.equal(wrong.errors.length, 2);
});

test('a sound setup has no errors', () => {
  assert.deepEqual(validate(config(), names), []);
});

const errorsAfter = (change: (c: ProductConfig) => void, available = names) => {
  const broken = config();
  change(broken);
  return validate(broken, available);
};
const options = (c: ProductConfig) => c.steps.flatMap((step) => step.options);
const named = (c: ProductConfig, name: string) => options(c).find((o) => o.name === name)!;

const mistakes: [string, (c: ProductConfig) => void, RegExp][] = [
  ['a typo in showWhen', (c) => (named(c, 'Style').showWhen = { Dors: 'Yes' }), /doesn't exist: "Dors"/],
  ['a wrong choice in showWhen', (c) => (named(c, 'Style').showWhen = { Doors: 'Maybe' }), /doesn't exist: "Doors: Maybe"/],
  ['a typo in a rule', (c) => (c.rules[0].require = { Door: 'Yes' }), /Rule 1 \(require\).*"Door"/],
  ['duplicate options', (c) => c.steps[0].options.push(option('Wood', [])), /Two options are called "Wood"/],
  ['duplicate choices', (c) => named(c, 'Wood').choices.push(choice('Oak')), /two choices called "Oak"/],
  ['two defaults', (c) => (named(c, 'Wood').choices[1].selected = true), /more than one selected/],
  ['a layer not in layerOrder', (c) => c.layerOrder.pop(), /"shaker" is missing from layerOrder/],
  ['an unused layer in layerOrder', (c) => c.layerOrder.push('old'), /lists "old", but no choice uses it/],
  ['a missing layer image', (c) => (named(c, 'Doors').choices[1].layer = 'door'), /layer image that doesn't exist: "door"/],
  ['a missing swatch', (c) => (named(c, 'Wood').choices[0].swatch = 'teak'), /swatch that doesn't exist: "teak"/],
  ['a showWhen loop', (c) => (named(c, 'Glass').showWhen = { Mirrors: 'Yes' }), /depends on itself/],
  [
    'an option that can never show',
    (c) => (named(c, 'Mirrors').showWhen = { Glass: 'Yes', Doors: 'No' }) && (named(c, 'Style').showWhen = { Mirrors: 'Yes', Doors: 'Yes' }),
    /"Style" can never be shown/,
  ],
  ['a rule that can never apply', (c) => (c.rules[0].if = { Style: 'Flat', Doors: 'No' }), /can never apply/],
  ['a rule that contradicts itself', (c) => (c.rules[0].require = { Glass: 'No' }), /contradicts its "if"/],
  [
    'rules that disagree',
    (c) => c.rules.push({ if: { Wood: 'Oak' }, require: { Doors: 'No' }, message: 'x' }),
    /Rules 1 and 2 can require different choices for "Doors"/,
  ],
];

for (const [name, change, expected] of mistakes) {
  test(`catches ${name}`, () => {
    const errors = errorsAfter(change);
    assert.ok(errors.some((error) => expected.test(error)), errors.join('\n') || 'no errors');
  });
}
