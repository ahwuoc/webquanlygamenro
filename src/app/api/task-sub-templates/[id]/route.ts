import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/task-sub-templates/[id] - Lấy chi tiết sub task
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const subTaskId = parseInt(id, 10);

    const subTask = await prisma.task_sub_template.findUnique({
      where: { id: subTaskId },
    });

    if (!subTask) {
      return NextResponse.json({ error: 'Sub task not found' }, { status: 404 });
    }

    return NextResponse.json(subTask);
  } catch (error) {
    console.error('Error fetching sub task:', error);
    return NextResponse.json({ error: 'Failed to fetch sub task' }, { status: 500 });
  }
}

// PUT /api/task-sub-templates/[id] - Cập nhật sub task
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const subTaskId = parseInt(id, 10);
    const body = await request.json();
    const { NAME, max_count, notify, npc_id, map } = body;

    const subTask = await prisma.task_sub_template.update({
      where: { id: subTaskId },
      data: {
        NAME,
        max_count: parseInt(max_count) || -1,
        notify: notify || '',
        npc_id: parseInt(npc_id) || -1,
        map: parseInt(map),
      },
    });

    return NextResponse.json(subTask);
  } catch (error) {
    console.error('Error updating sub task:', error);
    return NextResponse.json({ error: 'Failed to update sub task' }, { status: 500 });
  }
}

// DELETE /api/task-sub-templates/[id] - Xóa sub task
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const subTaskId = parseInt(id, 10);

    // Lấy thông tin sub task để biết task_main_id và task_sub_id
    const subTask = await prisma.task_sub_template.findUnique({
      where: { id: subTaskId },
    });

    if (!subTask) {
      return NextResponse.json({ error: 'Sub task not found' }, { status: 404 });
    }

    // Xóa requirements và rewards
    await prisma.task_requirements.deleteMany({
      where: {
        task_main_id: subTask.task_main_id,
        task_sub_id: subTaskId,
      },
    });

    await prisma.task_rewards.deleteMany({
      where: {
        task_main_id: subTask.task_main_id,
        task_sub_id: subTaskId,
      },
    });

    // Xóa sub task
    await prisma.task_sub_template.delete({
      where: { id: subTaskId },
    });

    return NextResponse.json({ message: 'Sub task deleted successfully' });
  } catch (error) {
    console.error('Error deleting sub task:', error);
    return NextResponse.json({ error: 'Failed to delete sub task' }, { status: 500 });
  }
}