import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/task-requirements/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const reqId = parseInt(id, 10);

    const requirement = await prisma.task_requirements.findUnique({ where: { id: reqId } });
    if (!requirement) return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    return NextResponse.json(requirement);
  } catch (error) {
    console.error('Error fetching requirement:', error);
    return NextResponse.json({ error: 'Failed to fetch requirement' }, { status: 500 });
  }
}

// PUT /api/task-requirements/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const reqId = parseInt(id, 10);
    const body = await request.json();
    const {
      task_main_id,
      task_sub_id,
      requirement_type,
      target_id,
      target_count,
      map_restriction,
      extra_data,
      is_active,
    } = body;

    const requirement = await prisma.task_requirements.update({
      where: { id: reqId },
      data: {
        task_main_id: task_main_id !== undefined ? parseInt(task_main_id) : undefined,
        task_sub_id: task_sub_id !== undefined ? parseInt(task_sub_id) : undefined,
        requirement_type,
        target_id: target_id !== undefined ? parseInt(target_id) : undefined,
        target_count: target_count !== undefined ? parseInt(target_count) : undefined,
        map_restriction,
        extra_data,
        is_active: is_active !== undefined ? Boolean(is_active) : undefined,
      },
    });

    return NextResponse.json(requirement);
  } catch (error) {
    console.error('Error updating requirement:', error);
    return NextResponse.json({ error: 'Failed to update requirement' }, { status: 500 });
  }
}

// DELETE /api/task-requirements/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const reqId = parseInt(id, 10);

    await prisma.task_requirements.delete({ where: { id: reqId } });
    return NextResponse.json({ message: 'Requirement deleted successfully' });
  } catch (error) {
    console.error('Error deleting requirement:', error);
    return NextResponse.json({ error: 'Failed to delete requirement' }, { status: 500 });
  }
}
