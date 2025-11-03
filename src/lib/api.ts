const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function fetchTransactions() {
  const response = await fetch(`${API_BASE_URL}/transactions`);
  if (!response.ok) throw new Error('Failed to load transactions');
  return response.json();
}

export async function addTransaction(data: any) {
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to add transaction");
  return response.json();
}
