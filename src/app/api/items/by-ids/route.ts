import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/items/by-ids?ids=1,2,3
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = (searchParams.get('ids') || '').trim();
    if (!idsParam) return NextResponse.json({ items: [] });

    const ids = idsParam
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n));

    if (ids.length === 0) return NextResponse.json({ items: [] });

    const rows = await prisma.item_template.findMany({
      where: { id: { in: ids } },
      select: { id: true, NAME: true },
    });

    return NextResponse.json({ items: rows });
  } catch (error) {
    console.error('Fetch items by ids error:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}
