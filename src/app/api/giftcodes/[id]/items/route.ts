import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams { params: Promise<{ id: string }> }

// GET /api/giftcodes/[id]/items -> list items with options
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const gift_code_id = parseInt(id, 10);
    if (!Number.isFinite(gift_code_id) || gift_code_id <= 0) {
      return NextResponse.json({ error: 'Invalid gift code id' }, { status: 400 });
    }

    const items = await prisma.gift_code_items.findMany({
      where: { gift_code_id },
      orderBy: { id: 'asc' },
      include: { gift_code_item_options: true },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching gift code items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

// POST /api/giftcodes/[id]/items -> create an item with optional options
// body: { item_id: number, quantity: number, options?: Array<{ option_id: number, param: number }> }
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const gift_code_id = parseInt(id, 10);
    if (!Number.isFinite(gift_code_id) || gift_code_id <= 0) {
      return NextResponse.json({ error: 'Invalid gift code id' }, { status: 400 });
    }

    const body = await request.json();
    const item_id = Number(body?.item_id);
    const quantity = Number(body?.quantity ?? 1);
    const options = Array.isArray(body?.options) ? body.options : [];

    if (!Number.isFinite(item_id) || item_id < 0) {
      return NextResponse.json({ error: 'item_id không hợp lệ' }, { status: 400 });
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      return NextResponse.json({ error: 'quantity không hợp lệ' }, { status: 400 });
    }

    const created = await prisma.gift_code_items.create({
      data: {
        gift_code_id,
        item_id,
        quantity,
        gift_code_item_options: {
          create: options
            .filter((o: any) => Number.isFinite(Number(o.option_id)))
            .map((o: any) => ({ option_id: Number(o.option_id), param: Number(o.param ?? 0) })),
        },
      },
      include: { gift_code_item_options: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating gift code item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
