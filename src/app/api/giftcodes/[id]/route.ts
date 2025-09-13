import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const gcId = parseInt(id, 10);
    if (Number.isNaN(gcId) || gcId <= 0) {
      return NextResponse.json({ error: 'Invalid giftcode id' }, { status: 400 });
    }

    const gift = await prisma.giftcode.findUnique({ where: { id: gcId } });
    if (!gift) return NextResponse.json({ error: 'Giftcode not found' }, { status: 404 });

    return NextResponse.json(gift);
  } catch (error) {
    console.error('Error fetching giftcode:', error);
    return NextResponse.json({ error: 'Failed to fetch giftcode' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const gcId = parseInt(id, 10);
    if (Number.isNaN(gcId) || gcId <= 0) {
      return NextResponse.json({ error: 'Invalid giftcode id' }, { status: 400 });
    }

    const body = await request.json();
    const {
      code,
      type,
      Delete,
      limit,
      listUser,
      listItem,
      bagCount,
      itemoption,
      active,
    } = body || {};

    const updated = await prisma.giftcode.update({
      where: { id: gcId },
      data: {
        code: typeof code === 'string' ? code.trim() : undefined,
        type: typeof type === 'number' ? type : undefined,
        Delete: typeof Delete === 'boolean' ? Delete : undefined,
        limit: typeof limit === 'number' ? limit : undefined,
        listUser: typeof listUser === 'string' ? listUser : undefined,
        listItem: typeof listItem === 'string' ? listItem : undefined,
        bagCount: typeof bagCount === 'boolean' ? bagCount : undefined,
        itemoption: typeof itemoption === 'string' ? itemoption : undefined,
        active: typeof active === 'number' ? active : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating giftcode:', error);
    return NextResponse.json({ error: 'Failed to update giftcode' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const gcId = parseInt(id, 10);
    if (Number.isNaN(gcId) || gcId <= 0) {
      return NextResponse.json({ error: 'Invalid giftcode id' }, { status: 400 });
    }

    await prisma.giftcode.delete({ where: { id: gcId } });
    return NextResponse.json({ message: 'Giftcode deleted' });
  } catch (error) {
    console.error('Error deleting giftcode:', error);
    return NextResponse.json({ error: 'Failed to delete giftcode' }, { status: 500 });
  }
}
