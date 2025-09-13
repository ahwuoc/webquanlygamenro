import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const sid = parseInt(id, 10);
    if (Number.isNaN(sid) || sid <= 0) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const data = await prisma.task_sub_template.findUnique({ where: { id: sid } });
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    console.error('Error fetching task_sub_template:', e);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const sid = parseInt(id, 10);
    if (Number.isNaN(sid) || sid <= 0) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const body = await request.json();
    const { task_main_id, NAME, max_count, notify, npc_id, map } = body || {};

    const updated = await prisma.task_sub_template.update({
      where: { id: sid },
      data: {
        task_main_id: typeof task_main_id === 'number' ? task_main_id : undefined,
        NAME: typeof NAME === 'string' ? NAME.trim() : undefined,
        max_count: typeof max_count === 'number' ? max_count : undefined,
        notify: typeof notify === 'string' ? notify : undefined,
        npc_id: typeof npc_id === 'number' ? npc_id : undefined,
        map: typeof map === 'number' ? map : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error('Error updating task_sub_template:', e);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const sid = parseInt(id, 10);
    if (Number.isNaN(sid) || sid <= 0) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    await prisma.task_sub_template.delete({ where: { id: sid } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (e) {
    console.error('Error deleting task_sub_template:', e);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
