import AccountStatus from "./AccountStatus";
import TransactionHistory from "./TransactionHistory";

export default function FinanceDashboard() {
    return (
        <main className="min-h-screen bg-slate-50 px-6 py-8">
            <div className="mx-auto flex max-w-5xl flex-col gap-6">
                {/* Page title */}
                <header>
                    <p className="text-sm font-medium text-slate-500">My Budget App</p>
                </header>

                {/* Account status */}
                <AccountStatus />

                {/* Create transaction */}
                <div>
                    <button
                        type="button"
                        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                        New Transaction
                    </button>
                </div>

                {/* Transaction history */}
                <TransactionHistory />
            </div>
        </main>
    );
}
