import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/search/items?query=bean&page=1&limit=20
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('query') || '').trim();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query) where.NAME = { contains: query };

    const [rows, total] = await Promise.all([
      prisma.item_template.findMany({
        where,
        select: { id: true, NAME: true },
        orderBy: { id: 'asc' },
        skip,
        take: limit,
      }),
      prisma.item_template.count({ where }),
    ]);

    return NextResponse.json({ items: rows, total });
  } catch (error) {
    console.error('Search items error:', error);
    return NextResponse.json({ error: 'Failed to search items' }, { status: 500 });
  }
}
