 const oracledb = require('oracledb');

// Create Customer
exports.createCustomer = async (req, res) => {
  let connection;
  try {
    const { cnic, name, contact } = req.body;

    if (!cnic || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'CNIC and Name are required' 
      });
    }

    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `BEGIN
         sp_create_customer(:cnic, :name, :contact, :customer_id);
       END;`,
      {
        cnic: cnic,
        name: name,
        contact: contact || null,
        customer_id: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 20 }
      },
      { autoCommit: true }
    );

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: { customer_id: result.outBinds.customer_id }
    });

  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
};

// Get All Customers
exports.getAllCustomers = async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `SELECT Customer_ID, CNIC, Name, Contact, Have_Account 
       FROM Customer 
       ORDER BY Customer_ID DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error('Error fetching customers:', err);
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

// Get Customer by ID
exports.getCustomerById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `SELECT c.*, 
              COUNT(a.Account_No) as Total_Accounts,
              NVL(SUM(a.Balance), 0) as Total_Balance
       FROM Customer c
       LEFT JOIN Account a ON c.Customer_ID = a.Customer_ID
       WHERE c.Customer_ID = :id
       GROUP BY c.Customer_ID, c.CNIC, c.Name, c.Contact, c.Have_Account`,
      { id: id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error('Error fetching customer:', err);
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

// Update Customer
exports.updateCustomer = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { name, contact } = req.body;

    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `UPDATE Customer 
       SET Name = :name, Contact = :contact 
       WHERE Customer_ID = :id`,
      { name: name, contact: contact, id: id },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    res.json({
      success: true,
      message: 'Customer updated successfully'
    });

  } catch (err) {
    console.error('Error updating customer:', err);
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

// Delete Customer
exports.deleteCustomer = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `DELETE FROM Customer WHERE Customer_ID = :id`,
      { id: id },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });

  } catch (err) {
    console.error('Error deleting customer:', err);
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
