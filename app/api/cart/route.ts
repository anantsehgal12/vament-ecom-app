import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// GET /api/cart - Fetch user's cart with items
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create cart for user
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                mrp: true,
                taxRate: true,
                category: true,
                variants: {
                  include: {
                    images: true,
                  },
                },
              },
            },
            variant: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                mrp: true,
                taxRate: true,
                category: true,
                variants: {
                  include: {
                    images: true,
                  },
                },
              },
            },
              variant: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
      });
    }

    return NextResponse.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, variantId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify variant exists if provided
    if (variantId) {
      const variant = await prisma.variant.findUnique({
        where: { id: variantId },
      });

      if (!variant || variant.productId !== productId) {
        return NextResponse.json({ error: 'Invalid variant' }, { status: 400 });
      }
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
      },
    });

    if (existingItem) {
      // Update quantity
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: {
          product: {
            include: {
              category: true,
              variants: {
                include: {
                  images: true,
                },
              },
            },
          },
          variant: {
            include: {
              images: true,
            },
          },
        },
      });
      return NextResponse.json(updatedItem, { status: 200 });
    } else {
      // Create new item
      const newItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId || null,
          quantity,
        },
        include: {
          product: {
            include: {
              category: true,
              variants: {
                include: {
                  images: true,
                },
              },
            },
          },
          variant: {
            include: {
              images: true,
            },
          },
        },
      });
      return NextResponse.json(newItem, { status: 201 });
    }
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 });
  }
}
