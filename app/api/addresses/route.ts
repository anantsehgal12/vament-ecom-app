import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// GET /api/addresses - Get all addresses for the user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/addresses - Create a new address
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, fullName, contactNo, address, city, state, pincode, country, email, isDefault } = body;

    // Validate required fields
    if (!name || !fullName || !contactNo || !address || !city || !state || !pincode || !country || !email) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId,
        name,
        fullName,
        contactNo,
        address,
        city,
        state,
        pincode,
        country,
        email,
        isDefault: isDefault || false
      }
    });

    return NextResponse.json(newAddress, { status: 201 });
  } catch (error: any) {
    console.error('Error creating address:', error);

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Address name already exists' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
