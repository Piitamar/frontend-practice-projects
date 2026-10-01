import { mockAccountStatus } from "./mockData";

export default function AccountStatus({ accountStatus = mockAccountStatus }) {
    return (
        <section className="w-full flex gap-6">
            {/* Balance */}
            <div className="flex-1 p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
                <p className="text-sm font-medium text-slate-500">Số dư</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{accountStatus.balance.toLocaleString()} ₫</p>
            </div>

            {/* Income */}
            <div className="flex-1 p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
                <p className="text-sm font-medium text-slate-500">Thu</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-600">{accountStatus.income.toLocaleString()} ₫</p>
            </div>

            {/* Expense */}
            <div className="flex-1 p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
                <p className="text-sm font-medium text-slate-500">Chi</p>
                <p className="mt-2 text-2xl font-semibold text-red-500">{accountStatus.expense.toLocaleString()} ₫</p>
            </div>
        </section>
    );
}
