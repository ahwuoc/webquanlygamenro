import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader as THead, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  pageA?: string; // accounts page
  pageP?: string; // players page
  accountId?: string; // filter players by account
};

function buildQuery(base: Record<string, string | number | undefined>, overrides: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  const merged: Record<string, string | number | undefined> = { ...base, ...overrides };
  Object.entries(merged).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v) !== "") params.set(k, String(v));
  });
  return `?${params.toString()}`;
}

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

  const totalPagesA = Math.max(1, Math.ceil(totalAcc / pageSizeA));
  const totalPagesP = Math.max(1, Math.ceil(totalPl / pageSizeP));

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
          <Button type="submit">Tìm kiếm</Button>
          <Link href="/account" className="px-4 py-2 border rounded">Xóa lọc</Link>
        </form>

        {/* Accounts Table */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl">Bảng Account</CardTitle>
            <span className="text-sm text-gray-500">Tổng: {totalAcc}</span>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Last Logout</TableHead>
                </TableRow>
              </THead>
              <TableBody>
                {accounts.map((acc) => (
                  <TableRow key={acc.id}>
                    <TableCell>{acc.id}</TableCell>
                    <TableCell>
                      <Link
                        href={`/account${buildQuery({ ...baseParams, pageP: 1 }, { accountId: acc.id })}#players`}
                        className="text-blue-600 hover:underline"
                        title="Lọc player theo account này"
                      >
                        {acc.username}
                      </Link>
                    </TableCell>
                    <TableCell>{acc.role}</TableCell>
                    <TableCell>{acc.is_admin ? "Yes" : "No"}</TableCell>
                    <TableCell>{acc.active ? "Active" : "Inactive"}</TableCell>
                    <TableCell>{acc.last_time_login?.toLocaleString?.() ?? "-"}</TableCell>
                    <TableCell>{acc.last_time_logout?.toLocaleString?.() ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Accounts Pagination */}
            <div className="flex items-center justify-between mt-4 text-sm">
              <div>Trang {pageA} / {totalPagesA}</div>
              <div className="space-x-2">
                {pageA > 1 && (
                  <Link className="px-3 py-1 border rounded" href={`/account${buildQuery(baseParams, { pageA: pageA - 1 })}`}>Trước</Link>
                )}
                {pageA < totalPagesA && (
                  <Link className="px-3 py-1 border rounded" href={`/account${buildQuery(baseParams, { pageA: pageA + 1 })}`}>Sau</Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players Table */}
        <Card id="players">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl">Bảng Player {accountIdFilter ? `(account_id = ${accountIdFilter})` : ''}</CardTitle>
            <span className="text-sm text-gray-500">Tổng: {totalPl}</span>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Account ID</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Hành Tinh</TableHead>
                  <TableHead>Head</TableHead>
                  <TableHead>Thỏi vàng</TableHead>
                </TableRow>
              </THead>
              <TableBody>
                {players.map((pl) => (
                  <TableRow key={pl.id}>
                    <TableCell>{pl.id}</TableCell>
                    <TableCell>{pl.account_id ?? "-"}</TableCell>
                    <TableCell className="font-medium">{pl.name}</TableCell>
                    <TableCell>{pl.gender}</TableCell>
                    <TableCell>{pl.head}</TableCell>
                    <TableCell>{pl.thoi_vang}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Players Pagination */}
            <div className="flex items-center justify-between mt-4 text-sm">
              <div>Trang {pageP} / {totalPagesP}</div>
              <div className="space-x-2">
                {pageP > 1 && (
                  <Link className="px-3 py-1 border rounded" href={`/account${buildQuery(baseParams, { pageP: pageP - 1 })}#players`}>Trước</Link>
                )}
                {pageP < totalPagesP && (
                  <Link className="px-3 py-1 border rounded" href={`/account${buildQuery(baseParams, { pageP: pageP + 1 })}#players`}>Sau</Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
