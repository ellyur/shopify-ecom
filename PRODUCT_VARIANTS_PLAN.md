# Product Color Variants — Feature Plan

## What You're Asking For

- Admin can add color options (e.g. Red, Pink, White) to any product
- Each color has its own image
- On the product page, clicking a color fades to that color's image
- Each color variant has an available / out-of-stock toggle

---

## Honest Criticism First

Before building, here are the gaps in the current idea that will bite you later:

### 1. Cart has no idea which color was chosen
This is the biggest problem. Right now when a customer clicks "Add to Cart," nothing records the color they picked. If you don't fix this now, you'll have orders like "12 roses" with no record of whether the customer wanted red or pink. Every order will be ambiguous.

**Fix:** The cart item and order line item must store `variantId` (the chosen color).

### 2. "Available / Out of Stock" loses too much information
A simple toggle can't tell you that you have 3 red roses left but 15 pink. You also currently reduce stock on checkout — that entire logic breaks if stock isn't tracked per color.

**Fix:** Give each color variant its own `stock` integer, not just a boolean. You can still display it as "Available" vs "Out of Stock" to the customer, but the number behind it lets you manage inventory properly.

### 3. No price per variant
Red roses and white roses might cost the same today. But what if you get a rare blue rose that costs more? With no price per variant, you'd have to create a whole new product instead of just a variant.

**Recommendation:** Add an optional `price` field per variant (if null, falls back to the product price). This costs almost nothing to add now and saves a full refactor later.

### 4. Existing products break without a default
Products without color variants must still work. The product card, product detail page, and add-to-cart all need to handle "no variants" gracefully.

### 5. Image on the product card doesn't change
You mentioned the product page fades between images — but the product card on the shop grid also currently shows the first image. Should the card show the image for the selected color? Probably yes, but that's not possible on the card since no color is selected yet. You need to decide: does the card always show the first image, or should there be a default color?

---

## Proposed Data Model

### New Table: `product_variants`
| Field | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `productId` | integer FK | References `products.id` |
| `colorName` | text | e.g. "Red", "Pink", "White" |
| `colorHex` | text | e.g. `#E63946` — for the color swatch circle |
| `imageUrl` | text | The image specific to this color |
| `stock` | integer | Per-color stock count |
| `price` | numeric (nullable) | Override price, or null to use product price |
| `displayOrder` | integer | Order swatches appear |

### Changes to Existing Tables
- **`order_items`**: add `variantId` (nullable FK), `variantColorName` (text snapshot)
- **`products`**: existing `stock` field becomes the fallback when no variants exist

---

## Implementation Scope

### Phase 1 — Database & Backend
- [ ] Create `product_variants` table and migration
- [ ] Add CRUD endpoints: `GET/POST/PATCH/DELETE /api/products/:id/variants`
- [ ] Update `createOrder` to reduce per-variant stock on checkout
- [ ] Update `order_items` to store chosen variant info

### Phase 2 — Admin Panel
- [ ] In the product form (create/edit), add a "Color Variants" section
- [ ] Add color row: color name input + hex color picker + image upload + stock field + optional price override
- [ ] Reorder variants via drag or display-order field
- [ ] Per-variant available/out-of-stock toggle (maps to stock = 0)

### Phase 3 — Customer Product Page
- [ ] Show color swatches (colored circles) below product images
- [ ] Clicking a swatch fades the main image to that variant's image
- [ ] Out-of-stock variants shown with a strikethrough or "X" but still visible
- [ ] "Add to Cart" is disabled until a color is selected (if variants exist)
- [ ] Selected color name shown below swatches ("Selected: Red")

### Phase 4 — Cart & Checkout
- [ ] Cart item stores `variantId` + `variantColorName`
- [ ] Cart display shows color name under product name
- [ ] Order confirmation and order detail shows color chosen

---

## What This Does NOT Include (to keep scope manageable)

- Multiple color selections per cart item (you pick one color per item)
- Variant-level ratings (ratings remain product-level)
- Size or other variant dimensions (color only, as requested)

---

## Recommendation

Start with Phase 1 and 2 (database + admin), verify the data model is correct with real products, then move to Phase 3 and 4. Do not skip adding `variantId` to cart/order — it's the most critical part.
