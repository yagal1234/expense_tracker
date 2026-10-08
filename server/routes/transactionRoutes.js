const express = require("express");
const router = express.Router();

const Transaction = require("../models/Transaction");

// GET all transactions
router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
});

// POST create transaction
router.post("/", async (req, res) => {
  try {
    const { type, amount, category, description, date } = req.body;

    if (!type || !amount || !category || !date) {
      return res.status(400).json({
        message: "Type, amount, category and date are required",
      });
    }

    const transaction = new Transaction({
      type,
      amount,
      category,
      description,
      date,
    });

    const savedTransaction = await transaction.save();

    res.status(201).json(savedTransaction);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create transaction",
      error: error.message,
    });
  }
});

// PUT update transaction
router.put("/:id", async (req, res) => {
  try {
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedTransaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update transaction",
      error: error.message,
    });
  }
});

// DELETE transaction
router.delete("/:id", async (req, res) => {
  try {
    const deletedTransaction = await Transaction.findByIdAndDelete(
      req.params.id
    );

    if (!deletedTransaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.json({
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete transaction",
      error: error.message,
    });
  }
});

// MONTHLY SUMMARY
router.get("/monthly-summary", async (req, res) => {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const summary = await Transaction.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: "$type",
          total: {
            $sum: "$amount",
          },
        },
      },
    ]);

    let income = 0;
    let expense = 0;

    summary.forEach((item) => {
      if (item._id === "income") {
        income = item.total;
      }

      if (item._id === "expense") {
        expense = item.total;
      }
    });

    res.json({
      year,
      month,
      income,
      expense,
      balance: income - expense,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate monthly summary",
      error: error.message,
    });
  }
});

// YEARLY SUMMARY
router.get("/yearly-summary", async (req, res) => {
  try {
    const year = Number(req.query.year);

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const summary = await Transaction.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: "$type",
          total: {
            $sum: "$amount",
          },
        },
      },
    ]);

    let income = 0;
    let expense = 0;

    summary.forEach((item) => {
      if (item._id === "income") {
        income = item.total;
      }

      if (item._id === "expense") {
        expense = item.total;
      }
    });

    res.json({
      year,
      income,
      expense,
      balance: income - expense,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate yearly summary",
      error: error.message,
    });
  }
});

// CATEGORY SUMMARY
router.get("/category-summary", async (req, res) => {
  try {
    const summary = await Transaction.aggregate([
      {
        $match: {
          type: "expense",
        },
      },
      {
        $group: {
          _id: "$category",
          total: {
            $sum: "$amount",
          },
        },
      },
      {
        $sort: {
          total: -1,
        },
      },
    ]);

    res.json(summary);
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate category summary",
      error: error.message,
    });
  }
});

module.exports = router;