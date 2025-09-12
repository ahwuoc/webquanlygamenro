import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/shop-tabs?shop_id=number
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopIdParam = searchParams.get('shop_id');
    if (!shopIdParam) {
      return NextResponse.json({ error: 'shop_id is required' }, { status: 400 });
    }
    const shop_id = parseInt(shopIdParam, 10);
    if (Number.isNaN(shop_id) || shop_id <= 0) {
      return NextResponse.json({ error: 'Invalid shop_id' }, { status: 400 });
    }

    const tabs = await prisma.tab_shop.findMany({ where: { shop_id }, orderBy: { id: 'asc' } });
    return NextResponse.json(tabs);
  } catch (error) {
    console.error('Error fetching tabs:', error);
    return NextResponse.json({ error: 'Failed to fetch tabs' }, { status: 500 });
  }
}

// POST /api/shop-tabs
// body: { shop_id: number, NAME: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop_id, NAME } = body || {};
    if (!shop_id || Number.isNaN(Number(shop_id))) {
      return NextResponse.json({ error: 'shop_id is required' }, { status: 400 });
    }
    if (!NAME || typeof NAME !== 'string') {
      return NextResponse.json({ error: 'NAME is required' }, { status: 400 });
    }

    const tab = await prisma.tab_shop.create({ data: { shop_id: Number(shop_id), NAME } });
    return NextResponse.json(tab, { status: 201 });
  } catch (error) {
    console.error('Error creating tab:', error);
    return NextResponse.json({ error: 'Failed to create tab' }, { status: 500 });
  }
}
