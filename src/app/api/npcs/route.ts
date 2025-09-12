import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    const npcs = await prisma.npc_template.findMany({
      where: { NAME: { not: '' } },
      select: { id: true, NAME: true },
      orderBy: { NAME: 'asc' },
    });
    return NextResponse.json(npcs);
  } catch (error) {
    console.error('Error fetching npcs:', error);
    return NextResponse.json({ error: 'Failed to fetch npcs' }, { status: 500 });
  }
}
