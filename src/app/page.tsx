import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function Home() {
  // Test database connection
  let dbStatus = "Disconnected";
  let tableCount = 0;
  let accountCount = 0;

  try {
    await prisma.$connect();
    dbStatus = "Connected";

    const result = await prisma.$queryRaw`SHOW TABLES`;
    tableCount = Array.isArray(result) ? result.length : 0;

    // Get account count
    accountCount = await prisma.account.count();
  } catch (error) {
    console.error("Database connection error:", error);
    dbStatus = "Error";
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Dashboard Web NRO
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Next.js + Bun + Prisma + MySQL
          </p>

          <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Database Status
            </h2>
            <div className="flex items-center justify-center">
              <div className={`w-4 h-4 rounded-full mr-3 ${dbStatus === "Connected"
                ? "bg-green-500"
                : dbStatus === "Error"
                  ? "bg-red-500"
                  : "bg-yellow-500"
                }`}></div>
              <span className="text-lg font-medium">
                {dbStatus}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              MySQL: 36.50.135.62:3306/nro_1
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded p-2">
                <span className="font-medium">Tables:</span> {tableCount}
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="font-medium">Accounts:</span> {accountCount}
              </div>
            </div>
          </div>


          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Quản Lý Hệ Thống
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link
                href="/boss"
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center"
              >
                <div className="p-3 rounded-full bg-red-100 mx-auto w-fit mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Boss Management</h3>
                <p className="text-gray-600">Quản lý hệ thống boss trong game</p>
              </Link>

              <Link
                href="/shop"
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center"
              >
                <div className="p-3 rounded-full bg-purple-100 mx-auto w-fit mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 10-8 0v4M5 11h14l-1 9H6l-1-9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Shop Management</h3>
                <p className="text-gray-600">Quản lý shop, tab và item bán trong shop</p>
              </Link>

              <Link
                href="/account"
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center"
              >
                <div className="p-3 rounded-full bg-blue-100 mx-auto w-fit mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Management</h3>
                <p className="text-gray-600">Quản lý tài khoản người chơi</p>
              </Link>

              <Link
                href="/analytics"
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center"
              >
                <div className="p-3 rounded-full bg-green-100 mx-auto w-fit mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
                <p className="text-gray-600">Thống kê và phân tích dữ liệu</p>
              </Link>

              {/* Mob Rewards Manager */}
              <Link
                href="/mob-rewards"
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center"
              >
                <div className="p-3 rounded-full bg-orange-100 mx-auto w-fit mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c1.657 0 3-.895 3-2s-1.343-2-3-2-3 .895-3 2 1.343 2 3 2zm0 0v12m-7 0h14a2 2 0 002-2v-3a4 4 0 00-4-4H9a4 4 0 00-4 4v3a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Mob Reward Manager</h3>
                <p className="text-gray-600">Quản lý drop item của mob</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
