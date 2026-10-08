import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

const API_URL = "http://localhost:5000/api/transactions";

const emptyForm = {
  type: "expense",
  amount: "",
  category: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
};

function App() {
  const [transactions, setTransactions] = useState([]);

  const [monthlySummary, setMonthlySummary] = useState({
    income: 0,
    expense: 0,
    balance: 0,
  });

  const [yearlySummary, setYearlySummary] = useState({
    income: 0,
    expense: 0,
    balance: 0,
  });

  const [categorySummary, setCategorySummary] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  // -----------------------------
  // FETCH TRANSACTIONS
  // -----------------------------

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(API_URL);
      setTransactions(response.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // MONTHLY SUMMARY
  // -----------------------------

  const fetchMonthlySummary = async () => {
    try {
      const today = new Date();

      const year = today.getFullYear();
      const month = today.getMonth() + 1;

      const response = await axios.get(
        `${API_URL}/monthly-summary?year=${year}&month=${month}`
      );

      setMonthlySummary(response.data);
    } catch (err) {
      console.error("Monthly summary error:", err);
    }
  };

  // -----------------------------
  // YEARLY SUMMARY
  // -----------------------------

  const fetchYearlySummary = async () => {
    try {
      const year = new Date().getFullYear();

      const response = await axios.get(
        `${API_URL}/yearly-summary?year=${year}`
      );

      setYearlySummary(response.data);
    } catch (err) {
      console.error("Yearly summary error:", err);
    }
  };

  // -----------------------------
  // CATEGORY SUMMARY
  // -----------------------------

  const fetchCategorySummary = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/category-summary`
      );

      setCategorySummary(response.data);
    } catch (err) {
      console.error("Category summary error:", err);
    }
  };

  // -----------------------------
  // FETCH EVERYTHING
  // -----------------------------

  const fetchAllData = async () => {
    await Promise.all([
      fetchTransactions(),
      fetchMonthlySummary(),
      fetchYearlySummary(),
      fetchCategorySummary(),
    ]);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // -----------------------------
  // FORM CHANGE
  // -----------------------------

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // -----------------------------
  // ADD / UPDATE
  // -----------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.amount || !form.category || !form.date) {
      alert("Please fill in amount, category and date.");
      return;
    }

    try {
      const data = {
        ...form,
        amount: Number(form.amount),
      };

      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, data);

        alert("Transaction updated successfully.");
      } else {
        await axios.post(API_URL, data);
      }

      setForm(emptyForm);
      setEditingId(null);

      await fetchAllData();
    } catch (err) {
      console.error(err);
      alert("Failed to save transaction.");
    }
  };

  // -----------------------------
  // EDIT
  // -----------------------------

  const handleEdit = (transaction) => {
    setEditingId(transaction._id);

    setForm({
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      date: transaction.date.split("T")[0],
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // -----------------------------
  // CANCEL EDIT
  // -----------------------------

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  // -----------------------------
  // DELETE
  // -----------------------------

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/${id}`);

      await fetchAllData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete transaction.");
    }
  };

  // -----------------------------
  // TOTALS
  // -----------------------------

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce(
      (total, transaction) => total + transaction.amount,
      0
    );

  const totalExpense = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce(
      (total, transaction) => total + transaction.amount,
      0
    );

  const totalBalance = totalIncome - totalExpense;

  // -----------------------------
  // CHART DATA
  // -----------------------------

  const incomeExpenseData = [
    {
      name: "Income",
      amount: totalIncome,
    },
    {
      name: "Expense",
      amount: totalExpense,
    },
  ];

  const pieData = categorySummary.map((item) => ({
    name: item._id,
    value: item.total,
  }));

  // -----------------------------
  // DASHBOARD
  // -----------------------------

  return (
    <div className="app">

      {/* HEADER */}

      <header>
        <div>
          <h1>Expense Tracker</h1>
          <p>Manage your income and expenses</p>
        </div>
      </header>

      <main>

        {/* TOP CARDS */}

        <section className="dashboard-cards">

          <div className="summary-card balance-card">
            <p>Total Balance</p>

            <h2>
              ₹{totalBalance.toLocaleString()}
            </h2>
          </div>

          <div className="summary-card income-card">
            <p>Total Income</p>

            <h2>
              ₹{totalIncome.toLocaleString()}
            </h2>
          </div>

          <div className="summary-card expense-card">
            <p>Total Expense</p>

            <h2>
              ₹{totalExpense.toLocaleString()}
            </h2>
          </div>

        </section>

        {/* FINANCIAL SUMMARY */}

        <section>

          <h2>Financial Summary</h2>

          <div className="summary-grid">

            <div className="summary-box">

              <h3>This Month</h3>

              <p>
                Income:

                <strong className="income">
                  ₹{monthlySummary.income.toLocaleString()}
                </strong>
              </p>

              <p>
                Expense:

                <strong className="expense">
                  ₹{monthlySummary.expense.toLocaleString()}
                </strong>
              </p>

              <p>
                Balance:

                <strong>
                  ₹{monthlySummary.balance.toLocaleString()}
                </strong>
              </p>

            </div>

            <div className="summary-box">

              <h3>This Year</h3>

              <p>
                Income:

                <strong className="income">
                  ₹{yearlySummary.income.toLocaleString()}
                </strong>
              </p>

              <p>
                Expense:

                <strong className="expense">
                  ₹{yearlySummary.expense.toLocaleString()}
                </strong>
              </p>

              <p>
                Balance:

                <strong>
                  ₹{yearlySummary.balance.toLocaleString()}
                </strong>
              </p>

            </div>

          </div>

        </section>

        {/* CHARTS */}

        <section className="charts-section">

          <h2>Financial Analytics</h2>

          <div className="charts-grid">

            {/* INCOME VS EXPENSE */}

            <div className="chart-card">

              <h3>Income vs Expense</h3>

              <ResponsiveContainer
                width="100%"
                height={300}
              >

                <BarChart data={incomeExpenseData}>

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="name" />

                  <YAxis />

                  <Tooltip />

                  <Legend />

                  <Bar
  dataKey="amount"
  name="Amount"
>
  {incomeExpenseData.map((entry, index) => (
    <Cell
      key={`bar-${index}`}
      fill={entry.name === "Income" ? "#16a34a" : "#dc2626"}
    />
  ))}
</Bar>

                </BarChart>

              </ResponsiveContainer>

            </div>

            {/* CATEGORY PIE CHART */}

            <div className="chart-card">

              <h3>Expense by Category</h3>

              {pieData.length === 0 ? (

                <p>No expense data available.</p>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >

                  <PieChart>

                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >

                      {pieData.map((entry, index) => (
                        <Cell
  key={`cell-${index}`}
  fill={
    [
      "#2563eb",
      "#16a34a",
      "#f59e0b",
      "#dc2626",
      "#7c3aed",
      "#0891b2",
    ][index % 6]
  }
/>
                      ))}

                    </Pie>

                    <Tooltip />

                    <Legend />

                  </PieChart>

                </ResponsiveContainer>

              )}

            </div>

          </div>

        </section>

        {/* CATEGORY LIST */}

        <section>

          <h2>Expense by Category</h2>

          {categorySummary.length === 0 ? (

            <p>No expense data available.</p>

          ) : (

            <div className="category-list">

              {categorySummary.map((item) => (

                <div
                  className="category-item"
                  key={item._id}
                >

                  <span>{item._id}</span>

                  <strong>
                    ₹{item.total.toLocaleString()}
                  </strong>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* FORM */}

        <section className="form-section">

          <div className="section-heading">

            <h2>
              {editingId
                ? "Edit Transaction"
                : "Add Transaction"}
            </h2>

            {editingId && (

              <button
                type="button"
                className="cancel-button"
                onClick={handleCancelEdit}
              >
                Cancel Edit
              </button>

            )}

          </div>

          <form
            onSubmit={handleSubmit}
            className="transaction-form"
          >

            <div className="form-group">

              <label>Type</label>

              <select
                name="type"
                value={form.type}
                onChange={handleChange}
              >

                <option value="expense">
                  Expense
                </option>

                <option value="income">
                  Income
                </option>

              </select>

            </div>

            <div className="form-group">

              <label>Amount</label>

              <input
                type="number"
                name="amount"
                placeholder="Enter amount"
                value={form.amount}
                onChange={handleChange}
                min="1"
              />

            </div>

            <div className="form-group">

              <label>Category</label>

              <input
                type="text"
                name="category"
                placeholder="Food, Salary, Travel..."
                value={form.category}
                onChange={handleChange}
              />

            </div>

            <div className="form-group">

              <label>Description</label>

              <input
                type="text"
                name="description"
                placeholder="Enter description"
                value={form.description}
                onChange={handleChange}
              />

            </div>

            <div className="form-group">

              <label>Date</label>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />

            </div>

            <button type="submit">

              {editingId
                ? "Update Transaction"
                : "Add Transaction"}

            </button>

          </form>

        </section>

        {/* TRANSACTIONS */}

        <section className="transactions-section">

          <h2>Transactions</h2>

          {loading && (
            <p>Loading transactions...</p>
          )}

          {error && (
            <p className="error">
              {error}
            </p>
          )}

          {!loading &&
            !error &&
            transactions.length === 0 && (

              <p>No transactions found.</p>

            )}

          {!loading &&
            !error &&
            transactions.length > 0 && (

              <div className="transactions">

                {transactions.map((transaction) => (

                  <div
                    className="transaction-card"
                    key={transaction._id}
                  >

                    <div className="transaction-info">

                      <h3>
                        {transaction.category}
                      </h3>

                      <p>
                        {transaction.description}
                      </p>

                      <small>
                        {new Date(
                          transaction.date
                        ).toLocaleDateString()}
                      </small>

                    </div>

                    <div className="transaction-right">

                      <strong
                        className={transaction.type}
                      >

                        {transaction.type === "income"
                          ? "+"
                          : "-"}{" "}
                        ₹{transaction.amount}

                      </strong>

                      <div className="action-buttons">

                        <button
                          className="edit-button"
                          onClick={() =>
                            handleEdit(transaction)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="delete-button"
                          onClick={() =>
                            handleDelete(
                              transaction._id
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            )}

        </section>

      </main>

    </div>
  );
}

export default App;