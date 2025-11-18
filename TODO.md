# TODO: Add isLive Toggle to Products Page

## Steps to Complete

1. **Update Prisma Schema**: Add `isLive` field to Product model with default true.
2. **Run Database Migration**: Execute `prisma migrate dev` to apply schema changes.
3. **Update API Routes**:
   - Modify GET in `/api/products/route.ts` to include `isLive` in response.
   - Modify POST in `/api/products/route.ts` to accept and set `isLive`.
   - Modify GET, PUT in `/api/products/[id]/route.ts` to include `isLive`.
   - Modify PATCH in `/api/products/[id]/route.ts` to handle `isLive` updates.
4. **Update Products Page**:
   - Add `isLive` to Product interface.
   - Add "Live" column with toggle switch in table and mobile view.
   - Implement `handleToggleLive` function to update via API.
5. **Test Functionality**: Verify toggle works and updates persist.

## Progress Tracking
- [x] Step 1: Update Prisma Schema
- [x] Step 2: Run Migration
- [x] Step 3: Update API Routes
- [x] Step 4: Update Products Page
- [x] Step 5: Test
