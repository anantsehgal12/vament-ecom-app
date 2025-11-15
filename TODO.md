# TODO: Display Final Price in Bestsellers

## Steps to Complete
- [x] Update BestSeller.tsx to calculate final price including tax (finalPrice = parseFloat(product.price) * (1 + product.taxRate / 100))
- [x] Update the price display in the component to show the final price instead of base price
- [x] Add taxRate to Product interface in BestSeller.tsx
