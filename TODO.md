# TODO: Update Checkout Page for No Address Handling

## Completed Tasks
- [x] Modified the "Select Delivery Address" section in `app/checkout/page.tsx` to always display the card
- [x] Added conditional rendering: if savedAddresses.length > 0, show the address grid; else show "No address found" message and "Add Your First Address" button
- [x] Ensured the "Add Your First Address" button sets showAddressForm to true to open the address form

## Summary
The checkout page now handles the case where there are no saved addresses by displaying a message "No address found" and providing a prominent button to "Add Your First Address" within the "Select Delivery Address" box.
