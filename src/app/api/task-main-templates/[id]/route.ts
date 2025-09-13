import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tid = parseInt(id, 10);
    if (Number.isNaN(tid) || tid <= 0) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const data = await prisma.task_main_template.findUnique({ where: { id: tid } });
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    console.error('Error fetching task_main_template:', e);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tid = parseInt(id, 10);
    if (Number.isNaN(tid) || tid <= 0) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const body = await request.json();
    const { NAME, detail } = body || {};

    const updated = await prisma.task_main_template.update({
      where: { id: tid },
      data: {
        NAME: typeof NAME === 'string' ? NAME.trim() : undefined,
        detail: typeof detail === 'string' ? detail.trim() : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error('Error updating task_main_template:', e);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tid = parseInt(id, 10);
    if (Number.isNaN(tid) || tid <= 0) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    await prisma.task_main_template.delete({ where: { id: tid } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (e) {
    console.error('Error deleting task_main_template:', e);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
