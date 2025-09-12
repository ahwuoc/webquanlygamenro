import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    const options = await prisma.item_option_template.findMany({
      select: { id: true, NAME: true },
      orderBy: { id: 'asc' },
    });
    return NextResponse.json(options);
  } catch (error) {
    console.error('Error fetching item option templates:', error);
    return NextResponse.json({ error: 'Failed to fetch item option templates' }, { status: 500 });
  }
}
