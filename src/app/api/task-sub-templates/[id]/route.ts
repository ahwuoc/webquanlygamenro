import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/task-sub-templates/[id] - Deprecated theo thiết kế mới
export async function GET(_request: NextRequest, _ctx: RouteParams) {
  return NextResponse.json({ error: 'Deprecated. Sub task được build từ task_requirements, không còn truy cập theo id.' }, { status: 410 });
}

// PUT /api/task-sub-templates/[id] - Deprecated
export async function PUT(_request: NextRequest, _ctx: RouteParams) {
  return NextResponse.json({ error: 'Deprecated. Hãy cập nhật qua task_requirements.' }, { status: 410 });
}

// DELETE /api/task-sub-templates/[id] - Deprecated
export async function DELETE(_request: NextRequest, _ctx: RouteParams) {
  return NextResponse.json({ error: 'Deprecated. Hãy xóa các task_requirements tương ứng thay vì sub template.' }, { status: 410 });
}