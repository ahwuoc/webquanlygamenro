import { prisma } from "@/lib/prisma";
import Link from "next/link";
import React from "react";
import { Card, Input, Button } from "antd";
import AccountTable from "@/components/AccountTable";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  pageA?: string; // accounts page
  pageP?: string; // players page
  accountId?: string; // filter players by account
};

export default async function AccountPlayerPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = (sp.q || "").toString().trim();
  const pageA = Math.max(1, parseInt((sp.pageA || "1").toString()));
  const pageP = Math.max(1, parseInt((sp.pageP || "1").toString()));
  const accountIdFilter = sp.accountId ? parseInt(sp.accountId.toString()) : undefined;

  const pageSizeA = 20;
  const pageSizeP = 20;

  const accountWhere: any = {};
  if (q) {
    accountWhere.username = { contains: q };
  }

  const playerWhere: any = {};
  if (q) {
    playerWhere.name = { contains: q };
  }
  if (!isNaN(accountIdFilter as any) && accountIdFilter) {
    playerWhere.account_id = accountIdFilter;
  }

  const [[accounts, totalAcc], [players, totalPl]] = await Promise.all([
    Promise.all([
      prisma.account.findMany({
        where: accountWhere,
        orderBy: { id: "asc" },
        skip: (pageA - 1) * pageSizeA,
        take: pageSizeA,
        select: {
          id: true,
          username: true,
          role: true,
          is_admin: true,
          active: true,
          last_time_login: true,
          last_time_logout: true,
        },
      }),
      prisma.account.count({ where: accountWhere }),
    ]),
    Promise.all([
      prisma.player.findMany({
        where: playerWhere,
        orderBy: { id: "asc" },
        skip: (pageP - 1) * pageSizeP,
        take: pageSizeP,
        select: {
          id: true,
          account_id: true,
          name: true,
          gender: true,
          head: true,
          thoi_vang: true,
        },
      }),
      prisma.player.count({ where: playerWhere }),
    ]),
  ]);

  const _totalPagesA = Math.max(1, Math.ceil(totalAcc / pageSizeA));
  const _totalPagesP = Math.max(1, Math.ceil(totalPl / pageSizeP));

  const baseParams = { q, accountId: accountIdFilter, pageA, pageP } as Record<string, string | number | undefined>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Player</h1>
            <p className="text-gray-600 mt-1">Tìm kiếm, phân trang, và lọc player theo account</p>
          </div>
          <Link href="/" className="text-blue-600 hover:underline">← Về trang chủ</Link>
        </div>

        {/* Search */}
        <form action="/account" method="get" className="bg-white rounded-lg shadow-md p-4 flex gap-3 items-center">
          <Input
            name="q"
            defaultValue={q}
            placeholder="Tìm account theo username hoặc player theo tên..."
            className="flex-1"
          />
          {accountIdFilter && (
            <input type="hidden" name="accountId" value={String(accountIdFilter)} />
          )}
          <input type="hidden" name="pageA" value="1" />
          <input type="hidden" name="pageP" value="1" />
          <Button type="primary" htmlType="submit">Tìm kiếm</Button>
          <Link href="/account" className="px-4 py-2 border rounded">Xóa lọc</Link>
        </form>

        {/* Accounts Table */}
        <Card
          title="Bảng Account"
          extra={<span className="text-sm text-gray-500">Tổng: {totalAcc}</span>}
        >
          <AccountTable
            dataSource={accounts}
            type="account"
            baseParams={baseParams}
            pagination={{
              current: pageA,
              total: totalAcc,
              pageSize: pageSizeA,
              showSizeChanger: false,
              showQuickJumper: false,
            }}
          />
        </Card>

        {/* Players Table */}
        <Card
          id="players"
          title={`Bảng Player ${accountIdFilter ? `(account_id = ${accountIdFilter})` : ''}`}
          extra={<span className="text-sm text-gray-500">Tổng: {totalPl}</span>}
        >
          <AccountTable
            dataSource={players}
            type="player"
            baseParams={baseParams}
            pagination={{
              current: pageP,
              total: totalPl,
              pageSize: pageSizeP,
              showSizeChanger: false,
              showQuickJumper: false,
            }}
          />
        </Card>
      </div>
    </div>
  );
}
