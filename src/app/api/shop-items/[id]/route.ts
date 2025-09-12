import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);
    if (Number.isNaN(itemId) || itemId <= 0) {
      return NextResponse.json({ error: 'Invalid item id' }, { status: 400 });
    }

    const item = await prisma.item_shop.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching shop item:', error);
    return NextResponse.json({ error: 'Failed to fetch shop item' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);
    if (Number.isNaN(itemId) || itemId <= 0) {
      return NextResponse.json({ error: 'Invalid item id' }, { status: 400 });
    }

    const body = await request.json();
    const { tab_id, temp_id, is_new, is_sell, type_sell, cost, icon_spec } = body || {};

    // Use provided icon_spec or fallback to item_template.icon_id if temp_id changes
    let iconSpecUpdate: number | undefined = undefined;
    if (typeof icon_spec === 'number') {
      iconSpecUpdate = icon_spec;
    } else if (typeof temp_id === 'number') {
      const tpl = await prisma.item_template.findUnique({ where: { id: temp_id } });
      if (!tpl) return NextResponse.json({ error: 'item_template not found' }, { status: 404 });
      iconSpecUpdate = tpl.icon_id;
    }

    const updated = await prisma.item_shop.update({
      where: { id: itemId },
      data: {
        tab_id: typeof tab_id === 'number' ? tab_id : undefined,
        temp_id: typeof temp_id === 'number' ? temp_id : undefined,
        is_new: typeof is_new === 'boolean' ? is_new : undefined,
        is_sell: typeof is_sell === 'boolean' ? is_sell : undefined,
        type_sell: typeof type_sell === 'number' ? type_sell : undefined,
        cost: typeof cost === 'number' ? cost : undefined,
        icon_spec: iconSpecUpdate,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating shop item:', error);
    return NextResponse.json({ error: 'Failed to update shop item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);
    if (Number.isNaN(itemId) || itemId <= 0) {
      return NextResponse.json({ error: 'Invalid item id' }, { status: 400 });
    }

    await prisma.item_shop.delete({ where: { id: itemId } });
    return NextResponse.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting shop item:', error);
    return NextResponse.json({ error: 'Failed to delete shop item' }, { status: 500 });
  }
}
