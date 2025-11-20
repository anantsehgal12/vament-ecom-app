# TODO: Implement Framer Motion Across Website (Excluding Seller Dashboard)

## Components to Update
- [x] Navbar.tsx: Add motion to header, logo, menu items (stagger), buttons
- [x] Footer.tsx: Add motion to footer container, links, logo
- [ ] BottomNav.tsx: Add motion to nav container and items (stagger)

## Pages to Update
- [x] shop/page.tsx: Add motion to title and product grid (stagger on products)
- [x] cart/page.tsx: Add motion to cart items (stagger), summary card
- [x] about-us/page.tsx: Add motion to main container
- [x] checkout/page.tsx: Add motion to checkout form and steps
- [ ] my-orders/page.tsx: Add motion to orders list
- [ ] my-addresses/page.tsx: Add motion to addresses list
- [ ] order-complete/[id]/page.tsx: Add motion to completion message
- [ ] shop/[id]/page.tsx: Add motion to product details

## Notes
- Use fade-in, slide-up animations for containers
- Use stagger for lists/items
- Ensure animations trigger on scroll where appropriate (whileInView)
- Exclude all files under app/seller-dashboard/
