import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/task-main-templates/[id] - Lấy chi tiết task chính
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);

    const task = await prisma.task_main_template.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

// PUT /api/task-main-templates/[id] - Cập nhật task chính
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);
    const body = await request.json();
    const { NAME, detail } = body;

    const task = await prisma.task_main_template.update({
      where: { id: taskId },
      data: {
        NAME,
        detail,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/task-main-templates/[id] - Xóa task chính
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);

    // Xóa requirements và rewards trước
    await prisma.task_requirements.deleteMany({
      where: { task_main_id: taskId },
    });

    await prisma.task_rewards.deleteMany({
      where: { task_main_id: taskId },
    });

    // Xóa sub tasks
    await prisma.task_sub_template.deleteMany({
      where: { task_main_id: taskId },
    });

    // Xóa main task
    await prisma.task_main_template.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}