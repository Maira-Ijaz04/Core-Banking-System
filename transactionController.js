const oracledb = require('oracledb');

// Deposit
exports.deposit = async (req, res) => {
  let connection;
  try {
    const { account_no, amount } = req.body;

    if (!account_no || !amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid account number and positive amount required' 
      });
    }

    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `BEGIN
         sp_deposit(:account_no, :amount, :transaction_id);
       END;`,
      {
        account_no: account_no,
        amount: amount,
        transaction_id: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 20 }
      },
      { autoCommit: true }
    );

    res.status(201).json({
      success: true,
      message: 'Deposit successful',
      data: { 
        transaction_id: result.outBinds.transaction_id,
        amount: amount
      }
    });

  } catch (err) {
    console.error('Error processing deposit:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

// Withdraw
exports.withdraw = async (req, res) => {
  let connection;
  try {
    const { account_no, amount } = req.body;

    if (!account_no || !amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid account number and positive amount required' 
      });
    }

    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `BEGIN
         sp_withdraw(:account_no, :amount, :transaction_id);
       END;`,
      {
        account_no: account_no,
        amount: amount,
        transaction_id: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 20 }
      },
      { autoCommit: true }
    );

    res.status(201).json({
      success: true,
      message: 'Withdrawal successful',
      data: { 
        transaction_id: result.outBinds.transaction_id,
        amount: amount
      }
    });

  } catch (err) {
    console.error('Error processing withdrawal:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

// Transfer
exports.transfer = async (req, res) => {
  let connection;
  try {
    const { from_account, to_account, amount } = req.body;

    if (!from_account || !to_account || !amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid from/to account numbers and positive amount required' 
      });
    }

    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `BEGIN
         sp_transfer(:from_account, :to_account, :amount, :transaction_id);
       END;`,
      {
        from_account: from_account,
        to_account: to_account,
        amount: amount,
        transaction_id: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 20 }
      },
      { autoCommit: true }
    );

    res.status(201).json({
      success: true,
      message: 'Transfer successful',
      data: { 
        transaction_id: result.outBinds.transaction_id,
        from_account: from_account,
        to_account: to_account,
        amount: amount
      }
    });

  } catch (err) {
    console.error('Error processing transfer:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

// Get All Transactions
exports.getAllTransactions = async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `SELECT Transaction_ID, From_Account, To_Account, Type, 
              Account, Date_Time, Status, Transaction_Fee
       FROM Transaction
       ORDER BY Date_Time DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

// Get Transaction by ID
exports.getTransactionById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `SELECT * FROM Transaction WHERE Transaction_ID = :id`,
      { id: id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error('Error fetching transaction:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}; 
