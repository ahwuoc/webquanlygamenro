import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/mobs?search=&limit=all|number
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limitStr = searchParams.get('limit') || '50';

    const where: any = {};
    if (search) {
      where.NAME = { contains: search };
    }

    const take = limitStr === 'all' ? undefined : parseInt(limitStr, 10) || 50;

    const mobs = await prisma.mob_template.findMany({
      where,
      orderBy: { id: 'asc' },
      take,
      select: { id: true, NAME: true },
    });

    return NextResponse.json(mobs);
  } catch (e) {
    console.error('Error fetching mobs:', e);
    return NextResponse.json({ error: 'Failed to fetch mobs' }, { status: 500 });
  }
}
