import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams { params: Promise<{ id: string, itemId: string }> }

// PUT /api/giftcodes/[id]/items/[itemId] -> update quantity
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, itemId } = await params;
    const gift_code_id = parseInt(id, 10);
    const item_id = parseInt(itemId, 10);
    if (!Number.isFinite(gift_code_id) || gift_code_id <= 0) return NextResponse.json({ error: 'Invalid gift code id' }, { status: 400 });
    if (!Number.isFinite(item_id) || item_id <= 0) return NextResponse.json({ error: 'Invalid item id' }, { status: 400 });

    const body = await request.json();
    const quantity = Number(body?.quantity);
    if (!Number.isFinite(quantity) || quantity < 0) return NextResponse.json({ error: 'quantity không hợp lệ' }, { status: 400 });

    const updated = await prisma.gift_code_items.update({ where: { id: item_id }, data: { quantity } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

// DELETE /api/giftcodes/[id]/items/[itemId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, itemId } = await params;
    const gift_code_id = parseInt(id, 10);
    const item_id = parseInt(itemId, 10);
    if (!Number.isFinite(gift_code_id) || gift_code_id <= 0) return NextResponse.json({ error: 'Invalid gift code id' }, { status: 400 });
    if (!Number.isFinite(item_id) || item_id <= 0) return NextResponse.json({ error: 'Invalid item id' }, { status: 400 });

    await prisma.gift_code_items.delete({ where: { id: item_id } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
