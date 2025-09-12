import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// WARNING: This endpoint updates data. Consider protecting it in production.
export async function POST(_request: NextRequest) {
  try {
    const result: any = await prisma.$executeRawUnsafe(
      `UPDATE item_shop s
       JOIN item_template t ON s.temp_id = t.id
       SET s.icon_spec = t.icon_id
       WHERE s.icon_spec IS NULL OR s.icon_spec = 0 OR s.icon_spec <> t.icon_id`
    );
    return NextResponse.json({ updated: result ?? 0 });
  } catch (error) {
    console.error('Error fixing icon_spec:', error);
    return NextResponse.json({ error: 'Failed to fix icon_spec' }, { status: 500 });
  }
}
