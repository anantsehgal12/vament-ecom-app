import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: true,
        variants: {
          include: {
            images: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const body = await request.json();
    const { name, price, taxRate, description, categoryId, images, variants } = body;

    // Validate categoryId
    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 });
    }

    // First, delete existing images and variants
    await prisma.image.deleteMany({
      where: {
        OR: [
          {
            variant: {
              productId: productId,
            },
          },
          {
            productId: productId,
          },
        ],
      },
    });

    await prisma.variant.deleteMany({
      where: { productId },
    });

    // Update the product
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        price,
        taxRate: parseFloat(taxRate) || 0,
        description,
        categoryId,
        images: {
          create: images.map((image: any) => ({
            src: image.src,
            alt: image.alt,
          })),
        },
        variants: {
          create: variants.map((variant: any) => ({
            name: variant.name,
            images: {
              create: variant.images.map((image: any) => ({
                src: image.src,
                alt: image.alt,
              })),
            },
          })),
        },
      },
      include: {
        category: true,
        variants: {
          include: {
            images: true,
          },
        },
        images: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const body = await request.json();
    const { stock } = body;

    if (typeof stock !== 'number' || stock < 0) {
      return NextResponse.json({ error: 'Invalid stock value' }, { status: 400 });
    }

    const oldProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, name: true },
    });

    const product = await prisma.product.update({
      where: { id: productId },
      data: { stock },
      include: {
        category: true,
        variants: {
          include: {
            images: true,
          },
        },
        images: true,
      },
    });

    // Create notification for stock update
    if (oldProduct && oldProduct.stock !== stock) {
      await prisma.notification.create({
        data: {
          message: `Stock updated for ${product.name}: ${oldProduct.stock} → ${stock}`,
          type: 'STOCK_UPDATE',
        },
      });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product stock:', error);
    return NextResponse.json({ error: 'Failed to update product stock' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    // Delete related records first (Images -> Variants -> Product)
    await prisma.image.deleteMany({
      where: {
        OR: [
          {
            variant: {
              productId: productId,
            },
          },
          {
            productId: productId,
          },
        ],
      },
    });

    await prisma.variant.deleteMany({
      where: { productId },
    });

    // Now delete the product
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
