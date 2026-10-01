import { mockAccountHistory } from "./mockData";

export default function TransactionHistory({
    accountHistory = mockAccountHistory
}) {
    return (
        <section className="w-full rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-900">
                    Lịch sử giao dịch
                </h2>

                {/* Month filter */}
                <select
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500"
                    defaultValue=""
                >
                    <option value="" disabled>
                        Chọn tháng
                    </option>
                    <option value="1">Tháng 1</option>
                    <option value="2">Tháng 2</option>
                    <option value="3">Tháng 3</option>
                    <option value="4">Tháng 4</option>
                    <option value="5">Tháng 5</option>
                    <option value="6">Tháng 6</option>
                    <option value="7">Tháng 7</option>
                    <option value="8">Tháng 8</option>
                    <option value="9">Tháng 9</option>
                    <option value="10">Tháng 10</option>
                    <option value="11">Tháng 11</option>
                    <option value="12">Tháng 12</option>
                </select>
            </div>

            {/* Transaction table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                            <th className="px-5 py-3 font-medium text-slate-500">
                                Số giao dịch
                            </th>
                            <th className="px-5 py-3 font-medium text-slate-500">
                                Tên giao dịch
                            </th>
                            <th className="px-5 py-3 font-medium text-slate-500">
                                Số tiền
                            </th>
                            <th className="px-5 py-3 font-medium text-slate-500">
                                Thời gian
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {accountHistory.map((transaction) => (
                            <tr key={transaction.transactionId}>
                                <td className="px-5 py-4 text-slate-700">
                                    {transaction.transactionId}
                                </td>
                                <td className="px-5 py-4 font-medium text-slate-900">
                                    {transaction.transactionName}
                                </td>
                                <td className="px-5 py-4 text-slate-700">
                                    {transaction.transactionAmount}
                                </td>
                                <td className="px-5 py-4 text-slate-500">
                                    {transaction.transactionTime}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
