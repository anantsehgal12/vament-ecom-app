import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const isAdmin = user.publicMetadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('invoice') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('application/pdf') && !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only PDF and image files are allowed' }, { status: 400 });
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Delete old invoice file if it exists
    if (order.invoiceUrl) {
      try {
        const oldFilePath = join(process.cwd(), 'public', order.invoiceUrl);
        await unlink(oldFilePath);
        console.log(`Deleted old invoice file: ${oldFilePath}`);
      } catch (error) {
        // File might not exist or couldn't be deleted, continue anyway
        console.warn(`Could not delete old invoice file: ${error}`);
      }
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `invoice_${id}_${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update order with invoice URL
    const invoiceUrl = `/uploads/${filename}`;
    await prisma.order.update({
      where: { id },
      data: { invoiceUrl },
    });

    return NextResponse.json({ invoiceUrl });
  } catch (error) {
    console.error('Error uploading invoice:', error);
    return NextResponse.json({ error: 'Failed to upload invoice' }, { status: 500 });
  }
}
