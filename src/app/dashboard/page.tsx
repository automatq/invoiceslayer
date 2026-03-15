import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <div className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">InvoiceMaster</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress}
          </span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <main>
        <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
        <p className="text-gray-600">
          Welcome back! Your invoice management dashboard is ready.
        </p>
      </main>
    </div>
  );
}
