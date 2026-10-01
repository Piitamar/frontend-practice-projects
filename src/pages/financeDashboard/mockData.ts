import type { accountHistory, accountStatus } from "./types";

export const mockAccountHistory: accountHistory[] = [
    {
        transactionId: "TXN001",
        transactionName: "Ăn trưa",
        transactionAmount: -45000,
        transactionTime: "01/10/2026 12:15",
    },
    {
        transactionId: "TXN002",
        transactionName: "Lương tháng 10",
        transactionAmount: 12000000,
        transactionTime: "01/10/2026 09:00",
    },
    {
        transactionId: "TXN003",
        transactionName: "Mua cà phê",
        transactionAmount: -35000,
        transactionTime: "30/09/2026 15:30",
    },
    {
        transactionId: "TXN004",
        transactionName: "Mua sách",
        transactionAmount: -180000,
        transactionTime: "29/09/2026 20:10",
    },
    {
        transactionId: "TXN005",
        transactionName: "Freelance",
        transactionAmount: 2500000,
        transactionTime: "28/09/2026 14:00",
    },
    {
        transactionId: "TXN006",
        transactionName: "Mua đồ ăn",
        transactionAmount: -120000,
        transactionTime: "27/09/2026 18:45",
    },
    {
        transactionId: "TXN007",
        transactionName: "Mua quần áo",
        transactionAmount: -650000,
        transactionTime: "25/09/2026 16:20",
    },
    {
        transactionId: "TXN008",
        transactionName: "Hoàn tiền",
        transactionAmount: 150000,
        transactionTime: "23/09/2026 11:30",
    },
];
export const mockAccountStatus: accountStatus = {
  balance: 13750000,
  income: 15000000,
  expense: 1250000,
};