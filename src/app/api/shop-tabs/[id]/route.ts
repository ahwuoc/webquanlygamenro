import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tabId = parseInt(id, 10);
    if (Number.isNaN(tabId) || tabId <= 0) {
      return NextResponse.json({ error: 'Invalid tab id' }, { status: 400 });
    }
    const body = await request.json();
    const { NAME } = body || {};

    const updated = await prisma.tab_shop.update({
      where: { id: tabId },
      data: {
        NAME: typeof NAME === 'string' ? NAME : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating tab:', error);
    return NextResponse.json({ error: 'Failed to update tab' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tabId = parseInt(id, 10);
    if (Number.isNaN(tabId) || tabId <= 0) {
      return NextResponse.json({ error: 'Invalid tab id' }, { status: 400 });
    }

    await prisma.item_shop.deleteMany({ where: { tab_id: tabId } });
    await prisma.tab_shop.delete({ where: { id: tabId } });
    return NextResponse.json({ message: 'Tab deleted' });
  } catch (error) {
    console.error('Error deleting tab:', error);
    return NextResponse.json({ error: 'Failed to delete tab' }, { status: 500 });
  }
}
