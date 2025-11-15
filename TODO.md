# TODO: Add MRP Field and Discount Functionality

- [x] Update `prisma/schema.prisma` to add `mrp Float` to Product model
- [x] Run Prisma migration to apply schema changes
- [x] Modify `app/seller-dashboard/add-product/page.tsx` to include MRP input field and calculate/display discount
- [x] Modify `app/seller-dashboard/edit-product/[id]/page.tsx` to include MRP input field and calculate/display discount
- [x] Update `app/shop/[id]/page.tsx` to display MRP, selling price, and discount %
- [x] Update `app/api/products/route.ts` to handle MRP in POST requests
- [x] Update `app/api/products/[id]/route.ts` to handle MRP in PUT request