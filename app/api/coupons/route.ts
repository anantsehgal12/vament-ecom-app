import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, discountType, value, expiryDate, usageLimit } = body;

    if (!code || !discountType || !value || !expiryDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        discountType,
        value: parseFloat(value),
        expiryDate: new Date(expiryDate),
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
      },
    });

    // Create notification for new coupon
    await prisma.notification.create({
      data: {
        message: `New coupon created: ${coupon.code} (${coupon.discountType} - ${coupon.value}${coupon.discountType === 'PERCENT' ? '%' : '₹'})`,
        type: 'COUPON',
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}
