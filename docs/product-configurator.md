# Product configurator

Products live at `/cabinets/<slug>`. Everything about them is data, so most changes never touch code.

| What | Where |
| --- | --- |
| Options, prices, rules, layer order | `src/content/option-sets/<set>.yaml` |
| A product: its name, option set, own prices and differences | `src/content/products/<slug>.yaml` |
| A product's images | `src/content/products/<slug>/` |
| Logic (visibility, price, rules, checks) and tests | `src/lib/configurator.ts`, `configurator.test.ts` |
| Page and wiring | `src/components/Configurator*.astro`, `src/scripts/configurator.ts` |

After a change, run `npm run build`. It stops with a list of problems if a setup has mistakes, such as a misspelled field or option name, a missing image, or rules that contradict each other.

## Option set format

```yaml
steps:
  - name: Doors                  # A tab in the step bar
    options:
      - name: Shaker Design      # Unique. Appears in form submissions and shared links
        label: Flat/Shaker Doors # What the customer reads
        badge: Choose in store   # Optional small tag next to the label
        showWhen: { Doors: 'Yes' } # Optional. Only offered while this holds
        thumbnail: { x: 0, y: 1, zoom: 3 } # Optional. Shows each choice as a crop of the preview
        woodDetails: true        # Optional. Adds the wood comparison link
        choices:
          - label: Shaker
            price: 150           # Optional. Added while selected; default 0
            layer: shaker        # Optional. Image shown while selected
            swatch: walnut       # Optional. Photo from src/content/woods.yaml
            selected: true       # Optional. Picked when the page loads

rules:
  - if: { Glass: 'Yes' }
    require: { Doors: 'Yes' }
    message: Middle glass needs bottom doors, so they’re included.

layerOrder: # Preview layers, bottom to top
  - doors
  - shaker
```

- Quote `'Yes'` and `'No'`.
- `showWhen` and `if` can list several options, and all of them must hold.
- `require` selects that choice and locks the others while the `if` holds, and shows the message beside both options.
- Every visible option that has choices must be answered before submitting, so give an option a `selected` choice if it shouldn't demand an answer. An option with no `choices` is just a note.
- An option in `showWhen` can be anywhere in the file.

## Common edits

**Change a price or a label:** edit the choice in the option set. To change a price for one product only, use `prices` in its product file. Renaming a label or option also means updating any `showWhen` or `rules` that mention it; the build will point them out.

**Add a choice:** add it to `choices`. If it changes the preview, also add a `layer` and add the name to `layerOrder`. Then, for each product using this set, either add `<layer>.webp` to its image folder or list the layer in its `withoutLayers`.

**Add an option:** add it under a step. Options can move between steps without affecting the preview, because stacking comes from `layerOrder`.

**Add a rule:** add it under `rules`.

**Remove an option from one product:** list it in that product's `withoutOptions`.

**Add a wood:** add it to `src/content/woods.yaml` with its photos, which also adds it to the About page and the comparison dialog, then add a choice with `swatch: <id>`.

## Adding a product

1. Create `src/content/products/<slug>.yaml`:

   ```yaml
   name: 4-piece Bookshelf
   uses: bookshelf-options
   prices:
     Wood: { Maple: 3300, Oak: 3950, Walnut: 4500 }
   withoutOptions: [Glass, Mirrors] # Options this product doesn't offer
   withoutLayers: [molding-single-crown] # Layers with no artwork for this product
   thumbnails: # Crops, if the product sits differently on its canvas
     Moldings: { x: 5, y: 11, zoom: 3 }
   ```

2. Add its images to `src/content/products/<slug>/`: a `base.webp`, plus one `<layer>.webp` for each layer the option set uses, except any in `withoutLayers`.

`withoutOptions` also drops rules that mention those options, steps left empty and their layers. Leave out any option that depends on one you remove, or the build will flag it. If the product's options differ a lot, copy the option set to a new file and point `uses` at it.

When artwork arrives for a layer, add the image and remove the layer from `withoutLayers`.

### Image requirements

All images for a product must be the same square size and line up exactly: `base.webp` is the bare product and every layer is a transparent overlay of the same canvas. Each layer is drawn in a single wood tone today, which is why wood type isn't shown in the preview.

## Extending the logic

New kinds of behavior go in `src/lib/configurator.ts`, with a test in `configurator.test.ts`: `evaluate` for what happens, and `validate` for catching setup mistakes in the new feature. `src/content.config.ts` holds the file format.

After changing `src/content.config.ts`, stop the dev server, delete `.astro/data-store.json` and start it again. The dev server otherwise reuses cached entries in the old format for files that haven't changed. Production builds aren't affected.
