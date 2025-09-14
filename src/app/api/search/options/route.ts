import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('query') || '').trim();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const qNum = Number(query);
    const isNum = !Number.isNaN(qNum);
    const where: any = query
      ? (isNum
        ? { OR: [{ id: qNum }, { NAME: { contains: query } }] }
        : { NAME: { contains: query } })
      : {};

    const [rows, total] = await Promise.all([
      prisma.item_option_template.findMany({
        where,
        select: { id: true, NAME: true },
        orderBy: { id: 'asc' },
        skip,
        take: limit,
      }),
      prisma.item_option_template.count({ where }),
    ]);

    return NextResponse.json({ options: rows, total });
  } catch (error) {
    console.error('Search options error:', error);
    return NextResponse.json({ error: 'Failed to search options' }, { status: 500 });
  }
}
