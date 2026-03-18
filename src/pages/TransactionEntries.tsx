import { useEffect, useState } from "react";
import { getTransactionEntries } from "@/api/transactions/transactionEntries.api";

export default function TransactionEntries() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const data = await getTransactionEntries(); // this is now Transaction[]
        setTransactions(data);
      } catch (error) {
        console.error("Failed to fetch transactions", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 rounded shadow">
      <ul>
        {transactions.map((transaction) => (
          <li key={transaction.transaction_idn}>
            {transaction.transaction_idn} - {transaction.transaction_client}
          </li>
        ))}
      </ul>
    </div>
  );
}
