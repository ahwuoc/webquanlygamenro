import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams { params: Promise<{ id: string, itemId: string }> }

// GET /api/giftcodes/[id]/items/[itemId]/options -> list options for an item
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, itemId } = await params;
    const gift_code_id = parseInt(id, 10);
    const gift_code_item_id = parseInt(itemId, 10);
    if (!Number.isFinite(gift_code_id) || gift_code_id <= 0) return NextResponse.json({ error: 'Invalid gift code id' }, { status: 400 });
    if (!Number.isFinite(gift_code_item_id) || gift_code_item_id <= 0) return NextResponse.json({ error: 'Invalid item id' }, { status: 400 });

    const options = await prisma.gift_code_item_options.findMany({
      where: { gift_code_item_id },
      orderBy: { id: 'asc' },
    });
    return NextResponse.json(options);
  } catch (error) {
    console.error('Error fetching item options:', error);
    return NextResponse.json({ error: 'Failed to fetch item options' }, { status: 500 });
  }
}

// POST /api/giftcodes/[id]/items/[itemId]/options -> add option
// body: { option_id: number, param: number }
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, itemId } = await params;
    const gift_code_id = parseInt(id, 10);
    const gift_code_item_id = parseInt(itemId, 10);
    if (!Number.isFinite(gift_code_id) || gift_code_id <= 0) return NextResponse.json({ error: 'Invalid gift code id' }, { status: 400 });
    if (!Number.isFinite(gift_code_item_id) || gift_code_item_id <= 0) return NextResponse.json({ error: 'Invalid item id' }, { status: 400 });

    const body = await request.json();
    const option_id = Number(body?.option_id);
    const param = Number(body?.param ?? 0);
    if (!Number.isFinite(option_id) || option_id < 0) return NextResponse.json({ error: 'option_id không hợp lệ' }, { status: 400 });

    const created = await prisma.gift_code_item_options.create({
      data: { gift_code_item_id, option_id, param },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating item option:', error);
    return NextResponse.json({ error: 'Failed to create item option' }, { status: 500 });
  }
}
