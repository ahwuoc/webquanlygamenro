import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    const rows = await prisma.type_sell_item_shop.findMany({
      select: { id: true, NAME: true },
      orderBy: { id: 'asc' },
    });
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching type sell options:', error);
    return NextResponse.json({ error: 'Failed to fetch type sell options' }, { status: 500 });
  }
}
