import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function getProductById(productId: string) {
  try {
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

    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    // Depending on your error handling strategy, you might want to throw the error
    // or return null. Returning null for now.
    return null;
  }
}