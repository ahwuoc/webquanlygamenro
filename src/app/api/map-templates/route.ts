import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    const maps = await prisma.map_template.findMany({
      select: { id: true, NAME: true },
      orderBy: { id: 'asc' },
    });
    return NextResponse.json({ maps });
  } catch (error) {
    console.error('Error fetching map templates:', error);
    return NextResponse.json({ error: 'Failed to fetch map templates' }, { status: 500 });
  }
}
