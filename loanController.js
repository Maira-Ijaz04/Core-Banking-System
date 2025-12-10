const oracledb = require('oracledb');

// Create Loan
exports.createLoan = async (req, res) => {
  let connection;
  try {
    const { customer_id, loan_amount, time_period, interest_rate, loan_type } = req.body;

    console.log('Received loan data:', { customer_id, loan_amount, time_period, interest_rate, loan_type }); // DEBUG

    if (!customer_id || !loan_amount || !time_period || !interest_rate || !loan_type) {
      return res.status(400).json({ 
        success: false, 
        message: 'All loan fields are required' 
      });
    }

    connection = await oracledb.getConnection();

    // FIX: Match stored procedure parameter names
    const result = await connection.execute(
      `BEGIN
         sp_create_loan(:p_customer_id, :p_loan_amount, :p_time_period, 
                       :p_interest_rate, :p_loan_type, :p_loan_id);
       END;`,
      {
        p_customer_id: customer_id,
        p_loan_amount: parseFloat(loan_amount),
        p_time_period: parseInt(time_period),
        p_interest_rate: parseFloat(interest_rate),
        p_loan_type: loan_type,
        p_loan_id: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 20 }
      },
      { autoCommit: true }
    );

    // Calculate EMI
    const emiResult = await connection.execute(
      `SELECT fn_calculate_emi(:loan_amount, :interest_rate, :time_period) as EMI FROM DUAL`,
      { 
        loan_amount: parseFloat(loan_amount), 
        interest_rate: parseFloat(interest_rate), 
        time_period: parseInt(time_period) 
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.status(201).json({
      success: true,
      message: 'Loan created successfully',
      data: { 
        loan_id: result.outBinds.p_loan_id,
        monthly_emi: emiResult.rows[0].EMI
      }
    });

  } catch (err) {
    console.error('Error creating loan:', err);
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

// Get All Loans
exports.getAllLoans = async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `SELECT l.Loan_ID, l.Customer_ID, c.Name as Customer_Name,
              l.Loan_Amount, l.Time_Period, l.Interest, l.Loan_Type,
              l.Remaining_Amount,
              fn_calculate_emi(l.Loan_Amount, l.Interest, l.Time_Period) as Monthly_EMI
       FROM Loan l
       JOIN Customer c ON l.Customer_ID = c.Customer_ID
       ORDER BY l.Loan_ID DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error('Error fetching loans:', err);
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

// Get Loan by ID
exports.getLoanById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `SELECT l.*, c.Name as Customer_Name, c.CNIC, c.Contact,
              fn_calculate_emi(l.Loan_Amount, l.Interest, l.Time_Period) as Monthly_EMI
       FROM Loan l
       JOIN Customer c ON l.Customer_ID = c.Customer_ID
       WHERE l.Loan_ID = :id`,
      { id: id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Loan not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    console.error('Error fetching loan:', err);
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