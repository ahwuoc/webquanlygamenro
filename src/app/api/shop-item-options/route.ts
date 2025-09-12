import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Note: model item_shop_option is @@ignore in Prisma schema, so we use raw SQL via $queryRaw / $executeRaw

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemShopIdParam = searchParams.get('item_shop_id');
    if (!itemShopIdParam) {
      return NextResponse.json({ error: 'item_shop_id is required' }, { status: 400 });
    }
    const item_shop_id = parseInt(itemShopIdParam, 10);
    if (Number.isNaN(item_shop_id) || item_shop_id <= 0) {
      return NextResponse.json({ error: 'Invalid item_shop_id' }, { status: 400 });
    }

    // Select join with item_option_template to get option name
    const rows: Array<{ item_shop_id: number; option_id: number; param: number; option_name: string }>
      = await prisma.$queryRaw`SELECT iso.item_shop_id, iso.option_id, iso.param, iot.NAME as option_name
                               FROM item_shop_option iso
                               LEFT JOIN item_option_template iot ON iso.option_id = iot.id
                               WHERE iso.item_shop_id = ${item_shop_id}`;

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching item options:', error);
    return NextResponse.json({ error: 'Failed to fetch item options' }, { status: 500 });
  }
}

// POST body: { item_shop_id: number, option_id: number, param: number }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { item_shop_id, option_id, param } = body || {};
    if (!item_shop_id || !option_id || typeof param !== 'number') {
      return NextResponse.json({ error: 'item_shop_id, option_id, param are required' }, { status: 400 });
    }

    // Ensure the item_shop exists
    const exists = await prisma.item_shop.findUnique({ where: { id: Number(item_shop_id) } });
    if (!exists) return NextResponse.json({ error: 'item_shop not found' }, { status: 404 });

    // Ensure option exists
    const opt = await prisma.item_option_template.findUnique({ where: { id: Number(option_id) } });
    if (!opt) return NextResponse.json({ error: 'item_option_template not found' }, { status: 404 });

    await prisma.$executeRaw`INSERT INTO item_shop_option (item_shop_id, option_id, param)
                             VALUES (${Number(item_shop_id)}, ${Number(option_id)}, ${Number(param)})`;

    return NextResponse.json({ message: 'Created' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating item option:', error);
    return NextResponse.json({ error: 'Failed to create item option' }, { status: 500 });
  }
}

// PUT body: { item_shop_id: number, option_id: number, param: number }
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { item_shop_id, option_id, param } = body || {};
    if (!item_shop_id || !option_id || typeof param !== 'number') {
      return NextResponse.json({ error: 'item_shop_id, option_id, param are required' }, { status: 400 });
    }

    const _result = await prisma.$executeRaw`UPDATE item_shop_option
                                            SET param = ${Number(param)}
                                            WHERE item_shop_id = ${Number(item_shop_id)} AND option_id = ${Number(option_id)}`;

    return NextResponse.json({ message: 'Updated' });
  } catch (error) {
    console.error('Error updating item option:', error);
    return NextResponse.json({ error: 'Failed to update item option' }, { status: 500 });
  }
}

// DELETE body: { item_shop_id: number, option_id: number }
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { item_shop_id, option_id } = body || {};
    if (!item_shop_id || !option_id) {
      return NextResponse.json({ error: 'item_shop_id and option_id are required' }, { status: 400 });
    }

    await prisma.$executeRaw`DELETE FROM item_shop_option
                              WHERE item_shop_id = ${Number(item_shop_id)} AND option_id = ${Number(option_id)}`;

    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting item option:', error);
    return NextResponse.json({ error: 'Failed to delete item option' }, { status: 500 });
  }
}
