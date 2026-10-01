import { useState, useEffect } from "react";

export default function CryptoDashboard() {
    const [priceData, setPriceData] = useState(null);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3000')

        ws.onopen = () => {
            console.log('Connected to server')
        }

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)

            console.log('Received:', data)

            setPriceData(data)
        }

        ws.onclose = () => {
            console.log('Disconnected from server')
        }

        return () => {
            ws.close()
        }
    }, [])

    const isPositive = priceData ? priceData.change >= 0 : false;

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Market Pulse
                    </h1>

                    <p className="mt-2 text-sm text-slate-400">
                        Live cryptocurrency market
                    </p>
                </header>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-800 text-left text-sm text-slate-400">
                                <th className="px-6 py-4 font-medium">
                                    Currency
                                </th>

                                <th className="px-6 py-4 text-right font-medium">
                                    Current Price
                                </th>

                                <th className="px-6 py-4 text-right font-medium">
                                    1s Change
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr className="border-b border-slate-800">
                                <td className="px-6 py-5 font-semibold">
                                    {priceData?.currency ?? 'Loading...'}
                                </td>

                                <td className="px-6 py-5 text-right font-mono">
                                    {priceData
                                        ? `$${priceData.price}`
                                        : 'Loading...'}
                                </td>

                                <td
                                    className={`px-6 py-5 text-right font-medium ${isPositive
                                            ? 'text-emerald-400'
                                            : 'text-red-400'
                                        }`}
                                >
                                    {priceData
                                        ? `${isPositive ? '+' : ''}${priceData.change.toFixed(5)}%`
                                        : 'Loading...'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    )
}
