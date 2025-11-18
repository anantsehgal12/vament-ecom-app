import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    const products = await prisma.product.findMany({
      where: all ? {} : {
        isLive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 16,
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
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, price, mrp, taxRate, description, categoryId, images, variants, isLive } = body;

    // Validate categoryId
    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Check if category exists, if not, return error
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 });
    }

    // Generate alphanumeric ID
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const product = await prisma.product.create({
      data: {
        id,
        name,
        price,
        mrp: mrp ? parseFloat(mrp) : null,
        taxRate: parseFloat(taxRate) || 0,
        description,
        categoryId,
        isLive: isLive !== undefined ? isLive : true,
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

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
