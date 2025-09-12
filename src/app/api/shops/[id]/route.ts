import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const shopId = parseInt(id, 10);
    if (Number.isNaN(shopId) || shopId <= 0) {
      return NextResponse.json({ error: 'Invalid shop id' }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const tabs = await prisma.tab_shop.findMany({ where: { shop_id: shopId }, orderBy: { id: 'asc' } });

    return NextResponse.json({ shop, tabs });
  } catch (error) {
    console.error('Error fetching shop:', error);
    return NextResponse.json({ error: 'Failed to fetch shop' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const shopId = parseInt(id, 10);
    if (Number.isNaN(shopId) || shopId <= 0) {
      return NextResponse.json({ error: 'Invalid shop id' }, { status: 400 });
    }

    const body = await request.json();
    const { npc_id, tag_name, type_shop } = body || {};

    const updated = await prisma.shop.update({
      where: { id: shopId },
      data: {
        npc_id: typeof npc_id === 'number' ? npc_id : undefined,
        tag_name: tag_name === undefined ? undefined : tag_name,
        type_shop: typeof type_shop === 'number' ? type_shop : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating shop:', error);
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const shopId = parseInt(id, 10);
    if (Number.isNaN(shopId) || shopId <= 0) {
      return NextResponse.json({ error: 'Invalid shop id' }, { status: 400 });
    }

    // Optionally ensure tabs/items are handled by ON DELETE constraints at DB level. Here we delete tabs then items manually by relations.
    const tabs = await prisma.tab_shop.findMany({ where: { shop_id: shopId } });
    const tabIds = tabs.map(t => t.id);

    if (tabIds.length > 0) {
      await prisma.item_shop.deleteMany({ where: { tab_id: { in: tabIds } } });
      await prisma.tab_shop.deleteMany({ where: { id: { in: tabIds } } });
    }

    await prisma.shop.delete({ where: { id: shopId } });
    return NextResponse.json({ message: 'Shop deleted' });
  } catch (error) {
    console.error('Error deleting shop:', error);
    return NextResponse.json({ error: 'Failed to delete shop' }, { status: 500 });
  }
}
