import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/shops
// - Query params: page, limit, search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = (searchParams.get('search') || '').trim();
    const offset = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { tag_name: { contains: search } },
        { npc_id: { equals: Number.isNaN(Number(search)) ? undefined : Number(search) } },
      ];
    }

    const [shops, totalCount] = await Promise.all([
      prisma.shop.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.shop.count({ where }),
    ]);

    // Count tabs per shop
    const shopIds = shops.map((s) => s.id);
    const tabCounts = await prisma.tab_shop.groupBy({
      by: ['shop_id'],
      where: { shop_id: { in: shopIds } },
      _count: { id: true },
    });
    const tabCountMap = new Map(tabCounts.map((r) => [r.shop_id, r._count.id]));

    return NextResponse.json({
      shops: shops.map((s) => ({ ...s, tab_count: tabCountMap.get(s.id) || 0 })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / Math.max(1, limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 });
  }
}

// POST /api/shops
// body: { npc_id: number, tag_name?: string, type_shop?: number }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { npc_id, tag_name, type_shop } = body || {};
    if (!npc_id || Number.isNaN(Number(npc_id))) {
      return NextResponse.json({ error: 'npc_id is required' }, { status: 400 });
    }

    const shop = await prisma.shop.create({
      data: {
        npc_id: Number(npc_id),
        tag_name: tag_name ?? null,
        type_shop: typeof type_shop === 'number' ? type_shop : null,
      },
    });

    return NextResponse.json(shop, { status: 201 });
  } catch (error) {
    console.error('Error creating shop:', error);
    return NextResponse.json({ error: 'Failed to create shop' }, { status: 500 });
  }
}
