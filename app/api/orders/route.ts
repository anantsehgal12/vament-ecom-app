import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { sendOrderConfirmationEmail } from '@/lib/email';

const prisma = new PrismaClient();

function generateOrderId(): string {
  // Generate an 8-digit random number
  const randomNum = Math.floor(10000000 + Math.random() * 90000000);
  return randomNum.toString();
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { razorpayOrderId, razorpayPaymentId, totalAmount, customerDetails } = await request.json();

    if (!razorpayOrderId || !razorpayPaymentId || !totalAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
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

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Generate unique 8-digit order ID
    let orderId: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      orderId = generateOrderId();
      const existingOrder = await prisma.order.findUnique({
        where: { orderId },
      });
      if (!existingOrder) {
        isUnique = true;
      }
      attempts++;
    } while (!isUnique && attempts < maxAttempts);

    if (!isUnique) {
      return NextResponse.json({ error: 'Failed to generate unique order ID' }, { status: 500 });
    }

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderId,
        userId,
        totalAmount: parseFloat(totalAmount),
        razorpayOrderId,
        razorpayPaymentId,
        fullName: customerDetails?.fullName,
        contactNo: customerDetails?.contactNo,
        address: customerDetails?.address,
        city: customerDetails?.city,
        pincode: customerDetails?.pincode,
        country: customerDetails?.country,
        email: customerDetails?.email,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: parseFloat(item.product.price.replace(/[^\d.]/g, '')),
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                images: true,
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

    // Create notification for new order
    await prisma.notification.create({
      data: {
        message: `New order received: ${order.orderId} for ₹${order.totalAmount}`,
        type: 'ORDER',
      },
    });

    // Clear the cart
    console.log(`Clearing cart for user ${userId} with ${cart.items.length} items`);
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    console.log(`Cart cleared successfully for user ${userId}`);

    // Send order confirmation email
    if (customerDetails?.email) {
      try {
        await sendOrderConfirmationEmail(
          customerDetails.email,
          order.orderId,
          {
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
            items: order.items.map(item => ({
              product: { name: item.product.name },
              quantity: item.quantity,
              price: item.price,
            })),
          }
        );
        console.log(`Order confirmation email sent to ${customerDetails.email}`);
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
        // Don't fail the order creation if email fails
      }
    }

    return NextResponse.json({
      orderId: order.orderId,
      id: order.id,
      totalAmount: order.totalAmount,
      items: order.items,
      createdAt: order.createdAt,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isSeller = searchParams.get('seller') === 'true';

    let orders;

    if (isSeller) {
      // For seller dashboard - get all orders
      orders = await prisma.order.findMany({
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                  images: true,
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
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      // For customer - get their orders
      orders = await prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                  images: true,
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
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
