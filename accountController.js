const oracledb = require('oracledb');

// Create Account
exports.createAccount = async (req, res) => {
  let connection;
  try {
    const { customer_id, type, initial_balance } = req.body;

    if (!customer_id || !type || initial_balance === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer ID, Type, and Initial Balance are required' 
      });
    }

    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `BEGIN
         sp_create_account(:customer_id, :type, :initial_balance, :account_no);
       END;`,
      {
        customer_id: customer_id,
        type: type,
        initial_balance: initial_balance,
        account_no: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 20 }
      },
      { autoCommit: true }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { account_no: result.outBinds.account_no }
    });

  } catch (err) {
    console.error('Error creating account:', err);
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

// Get All Accounts
exports.getAllAccounts = async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `SELECT a.Account_No, a.Customer_ID, c.Name as Customer_Name, 
              a.Type, a.Balance, a.Status, a.Opening_Date
       FROM Account a
       JOIN Customer c ON a.Customer_ID = c.Customer_ID
       ORDER BY a.Account_No DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error('Error fetching accounts:', err);
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

// Get Account by Number
exports.getAccountByNumber = async (req, res) => {
  let connection;
  try {
    const { accountNo } = req.params;
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `SELECT a.*, c.Name as Customer_Name, c.CNIC, c.Contact
       FROM Account a
       JOIN Customer c ON a.Customer_ID = c.Customer_ID
       WHERE a.Account_No = :accountNo`,
      { accountNo: accountNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Account not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });

  } catch (err) {
    console.error('Error fetching account:', err);
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

// Get Balance
exports.getBalance = async (req, res) => {
  let connection;
  try {
    const { accountNo } = req.params;
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `SELECT fn_get_balance(:accountNo) as Balance FROM DUAL`,
      { accountNo: accountNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({
      success: true,
      data: { 
        account_no: accountNo,
        balance: result.rows[0].BALANCE
      }
    });

  } catch (err) {
    console.error('Error fetching balance:', err);
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

// Update Account Status
exports.updateAccountStatus = async (req, res) => {
  let connection;
  try {
    const { accountNo } = req.params;
    const { status } = req.body;

    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `UPDATE Account SET Status = :status WHERE Account_No = :accountNo`,
      { status: status, accountNo: accountNo },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Account not found' 
      });
    }

    res.json({
      success: true,
      message: 'Account status updated successfully'
    });

  } catch (err) {
    console.error('Error updating account status:', err);
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