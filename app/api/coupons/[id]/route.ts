import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, discountType, value, expiryDate, isActive, usageLimit } = body;

    const oldCoupon = await prisma.coupon.findUnique({
      where: { id },
      select: { code: true, isActive: true },
    });

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code,
        discountType,
        value: parseFloat(value),
        expiryDate: new Date(expiryDate),
        isActive,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
      },
    });

    // Create notification for coupon update
    if (oldCoupon) {
      let message = `Coupon ${coupon.code} updated`;
      if (oldCoupon.isActive !== isActive) {
        message += `: ${isActive ? 'Activated' : 'Deactivated'}`;
      }
      await prisma.notification.create({
        data: {
          message,
          type: 'COUPON',
        },
      });
    }

    return NextResponse.json(coupon);
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
