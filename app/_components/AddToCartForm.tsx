'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Variant {
  id: number
  name: string | null
}

interface AddToCartFormProps {
  productId: string
  variants: Variant[]
}

export default function AddToCartForm({ productId, variants }: AddToCartFormProps) {
  const [selectedVariant, setSelectedVariant] = useState<number | null>(variants.length > 0 ? variants[0].id : null)
  const [loading, setLoading] = useState(false)

  const handleAddToCart = async () => {
    if (variants.length > 0 && selectedVariant === null) {
      alert('Please select a variant before adding to cart.')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
          variantId: selectedVariant,
        }),
      })

      if (response.ok) {
        alert('Item added to cart!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add item to cart')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="mt-8" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
      {variants?.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-100">Variants</h3>
          <Select value={selectedVariant?.toString()} onValueChange={(value) => setSelectedVariant(Number(value))}>
            <SelectTrigger className="w-full mt-4">
              <SelectValue placeholder="Select a variant" />
            </SelectTrigger>
            <SelectContent>
              {variants.map((variant) => {
                const name = variant.name ?? `Variant ${variant.id}`
                return (
                  <SelectItem key={variant.id} value={variant.id.toString()}>
                    {name}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={loading}
        className="mt-6 w-full rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add to Cart'}
      </button>
    </form>
  )
}
