import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, allow any authenticated user to update order status
    // In a real app, you'd check if the user is an admin/seller

    const { id } = await params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const oldOrder = await prisma.order.findUnique({
      where: { id },
      select: { status: true, orderId: true },
    });

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    // Create notification for order status update
    if (oldOrder && oldOrder.status !== status) {
      await prisma.notification.create({
        data: {
          message: `Order ${order.orderId} status updated: ${oldOrder.status} → ${status}`,
          type: 'ORDER',
        },
      });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
