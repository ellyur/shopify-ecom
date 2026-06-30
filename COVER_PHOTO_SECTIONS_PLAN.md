# Cover Photo Sections Plan

## Goal
Add admin-managed cover photo sections that can be inserted between storefront product sections. A cover section can have one image or multiple images; multiple images display as a carousel on the storefront.

## Data Storage
- Store cover section definitions in the existing settings table under `cover_sections` as JSON.
- Store storefront placement in the existing `section_order` setting.
- Use section keys like `cover:<id>` alongside existing `category:<id>` and `badge:<name>` keys.

## Admin Experience
- Add an `Add Cover` control inside Storefront Section Order.
- Admin can enter a cover title and add image URLs or upload multiple photos.
- Newly created cover sections appear in the draggable order list.
- Cover rows can be dragged between category and badge rows.
- Cover rows can be removed.
- Saving updates both the cover data and storefront order.

## Storefront Experience
- The All view renders product sections in the saved order.
- When a `cover:<id>` item appears in the order, render a wide image banner at that point.
- If a cover has multiple images, show it as an auto-rotating carousel with dots.
- Cover sections are only shown in the All category view.

## Acceptance Criteria
- Admin can create a cover section with one or more images.
- Admin can drag it between product sections and save the order.
- Storefront displays the cover section exactly between the selected sections.
- Single-image covers render as a banner; multi-image covers rotate as a carousel.
- App restarts without runtime errors.
