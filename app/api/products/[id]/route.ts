import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/data/products';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const productId = params.id;
    const product = await getProductById(productId);

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
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  const params = await context.params;
  const productId = params.id;
  try {
    const body = await request.json();
    const { name, price, mrp, taxRate, description, categoryId, images, variants, isLive } = body;

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 });
    }

    const updatedProduct = await prisma.$transaction(
      async (tx: any) => {
        await tx.image.deleteMany({
          where: {
            OR: [
              { variant: { productId } },
              { productId },
            ],
          },
        });

        await tx.variant.deleteMany({
          where: { productId },
        });

        const product = await tx.product.update({
          where: { id: productId },
          data: {
            name,
            price,
            mrp: mrp ? parseFloat(mrp) : null,
            taxRate: parseFloat(taxRate) || 0,
            description,
            categoryId,
            isLive: isLive !== undefined ? isLive : undefined,
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

        return product;
      });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const productId = params.id;
    const body = await request.json();
    const { stock, isLive } = body;

    if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
      return NextResponse.json({ error: 'Invalid stock value' }, { status: 400 });
    }

    if (isLive !== undefined && typeof isLive !== 'boolean') {
      return NextResponse.json({ error: 'Invalid isLive value' }, { status: 400 });
    }

    const oldProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, name: true, isLive: true },
    });

    const updateData: any = {};
    if (stock !== undefined) updateData.stock = stock;
    if (isLive !== undefined) updateData.isLive = isLive;

    if (stock === 0) {
      updateData.isLive = false;
    }

    if (isLive === true) {
      const currentProduct = await prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true },
      });
      if (currentProduct && currentProduct.stock === 0) {
        return NextResponse.json({ error: 'Cannot set product to live when stock is 0' }, { status: 400 });
      }
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
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

    if (oldProduct && stock !== undefined && oldProduct.stock !== stock) {
      let message = `Stock updated for ${product.name}: ${oldProduct.stock} → ${stock}`;
      if (stock === 0) {
        message += ' (Product automatically set to not live due to zero stock)';
      }
      await prisma.notification.create({
        data: {
          message,
          type: 'STOCK_UPDATE',
        },
      });
    }

    if (oldProduct && isLive !== undefined && oldProduct.isLive !== isLive) {
      await prisma.notification.create({
        data: {
          message: `${product.name} is now ${isLive ? 'live' : 'not live'}`,
          type: 'GENERAL',
        },
      });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const productId = params.id;

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

    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
