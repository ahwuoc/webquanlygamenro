import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single item
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const item = await prisma.item_template.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

// PUT update single item
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const body = await request.json();
    const data: any = {};

    const fields = ['NAME','TYPE','part','gender','description','icon_id','power_require','gold','gem','head','body','leg','ruby','is_up_to_up'];
    for (const f of fields) {
      if (body[f] !== undefined) data[f] = body[f];
    }

    const updated = await prisma.item_template.update({ where: { id }, data });
    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}
