import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/search/players?query=son&page=1&limit=20
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('query') || '').trim();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query) where.name = { contains: query };

    const [rows, total] = await Promise.all([
      prisma.player.findMany({
        where,
        select: { id: true, name: true },
        orderBy: { id: 'asc' },
        skip,
        take: limit,
      }),
      prisma.player.count({ where }),
    ]);

    return NextResponse.json({ items: rows, total });
  } catch (error) {
    console.error('Search players error:', error);
    return NextResponse.json({ error: 'Failed to search players' }, { status: 500 });
  }
}
