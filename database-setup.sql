-- =====================================================
-- CORE BANKING SYSTEM - DATABASE SETUP SCRIPT

-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

-- Customer Table
CREATE TABLE Customer (
    Customer_ID VARCHAR2(20) PRIMARY KEY,
    CNIC VARCHAR2(15) UNIQUE NOT NULL,
    Name VARCHAR2(100) NOT NULL,
    Contact VARCHAR2(20),
    Have_Account NUMBER(1) DEFAULT 0
);

-- Account Table
CREATE TABLE Account (
    Account_No VARCHAR2(20) PRIMARY KEY,
    Customer_ID VARCHAR2(20) NOT NULL,
    Type VARCHAR2(20) NOT NULL,
    Balance NUMBER(12,2) DEFAULT 0,
    Status VARCHAR2(20) DEFAULT 'ACTIVE',
    Opening_Date DATE DEFAULT SYSDATE,
    CONSTRAINT fk_customer FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID)
);

-- Transaction Table
CREATE TABLE Transaction (
    Transaction_ID VARCHAR2(20) PRIMARY KEY,
    From_Account VARCHAR2(20),
    To_Account VARCHAR2(20),
    Type VARCHAR2(20) NOT NULL,
    Account NUMBER(12,2) NOT NULL,
    Date_Time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status VARCHAR2(20) DEFAULT 'COMPLETED',
    Transaction_Fee NUMBER(10,2) DEFAULT 0
);

-- Loan Table
CREATE TABLE Loan (
    Loan_ID VARCHAR2(20) PRIMARY KEY,
    Customer_ID VARCHAR2(20) NOT NULL,
    Loan_Amount NUMBER(12,2) NOT NULL,
    Time_Period NUMBER(5) NOT NULL,
    Interest NUMBER(5,2) NOT NULL,
    Loan_Type VARCHAR2(20) NOT NULL,
    Remaining_Amount NUMBER(12,2),
    CONSTRAINT fk_loan_customer FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID)
);

-- Audit Log Table
CREATE TABLE Audit_Log (
    Log_ID NUMBER PRIMARY KEY,
    Table_Affected VARCHAR2(50),
    User_ID VARCHAR2(50),
    Operation VARCHAR2(20),
    Date_Time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Description VARCHAR2(500)
);

-- Bank Branch Table
CREATE TABLE BankBranch (
    Manager_ID VARCHAR2(20) PRIMARY KEY,
    Branch_ID VARCHAR2(20) UNIQUE NOT NULL,
    Branch_Name VARCHAR2(100) NOT NULL,
    Location VARCHAR2(200),
    Phone VARCHAR2(20)
);

-- User Table
CREATE TABLE "USER" (
    User_ID VARCHAR2(20) PRIMARY KEY,
    Username VARCHAR2(50) UNIQUE NOT NULL,
    Password VARCHAR2(100) NOT NULL,
    Role VARCHAR2(20) NOT NULL,
    Last_Login_Date DATE
);

-- History Table
CREATE TABLE History (
    History_ID NUMBER PRIMARY KEY,
    Customer_ID VARCHAR2(20),
    Action VARCHAR2(100) NOT NULL,
    Action_Date DATE DEFAULT SYSDATE,
    Description VARCHAR2(500),
    CONSTRAINT fk_history_customer FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID)
);

-- Account Type Table
CREATE TABLE AccountType (
    AccountType_ID NUMBER PRIMARY KEY,
    Type_Name VARCHAR2(50) NOT NULL,
    Description VARCHAR2(200),
    Min_Balance NUMBER(10,2),
    Interest_Rate NUMBER(5,2),
    Salary_Account NUMBER(1) DEFAULT 0,
    Student NUMBER(1) DEFAULT 0,
    Business NUMBER(1) DEFAULT 0,
    Saving NUMBER(1) DEFAULT 0,
    Current NUMBER(1) DEFAULT 0
);

-- =====================================================
-- 2. CREATE SEQUENCES
-- =====================================================

CREATE SEQUENCE customer_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE account_seq START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE transaction_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE loan_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE history_seq START WITH 1 INCREMENT BY 1;

-- =====================================================
-- 3. STORED PROCEDURES
-- =====================================================

-- Procedure: Create Customer
CREATE OR REPLACE PROCEDURE sp_create_customer (
    p_cnic IN VARCHAR2,
    p_name IN VARCHAR2,
    p_contact IN VARCHAR2,
    p_customer_id OUT VARCHAR2
) AS
BEGIN
    p_customer_id := 'CUST' || LPAD(customer_seq.NEXTVAL, 6, '0');
    
    INSERT INTO Customer (Customer_ID, CNIC, Name, Contact)
    VALUES (p_customer_id, p_cnic, p_name, p_contact);
    
    COMMIT; --TCL
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK; --TCL
        RAISE;
END;
/

-- Procedure: Create Account
CREATE OR REPLACE PROCEDURE sp_create_account (
    p_customer_id IN VARCHAR2,
    p_type IN VARCHAR2,
    p_initial_balance IN NUMBER,
    p_account_no OUT VARCHAR2
) AS
BEGIN
    p_account_no := 'ACC' || LPAD(account_seq.NEXTVAL, 8, '0');
    
    INSERT INTO Account (Account_No, Customer_ID, Type, Balance)
    VALUES (p_account_no, p_customer_id, p_type, p_initial_balance);
    
    UPDATE Customer SET Have_Account = 1 WHERE Customer_ID = p_customer_id;
    
    COMMIT; --TCL
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK; --TCL
        RAISE;
END;
/

-- Procedure: Deposit
CREATE OR REPLACE PROCEDURE sp_deposit (
    p_account_no IN VARCHAR2,
    p_amount IN NUMBER,
    p_transaction_id OUT VARCHAR2
) AS
BEGIN
    p_transaction_id := 'TXN' || LPAD(transaction_seq.NEXTVAL, 10, '0');
    
    UPDATE Account 
    SET Balance = Balance + p_amount 
    WHERE Account_No = p_account_no;
    
    INSERT INTO Transaction (Transaction_ID, To_Account, Type, Account, Status)
    VALUES (p_transaction_id, p_account_no, 'DEPOSIT', p_amount, 'COMPLETED');
    
    COMMIT; --TCL
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK; --TCL
        RAISE;
END;
/

-- Procedure: Withdraw
CREATE OR REPLACE PROCEDURE sp_withdraw (
    p_account_no IN VARCHAR2,
    p_amount IN NUMBER,
    p_transaction_id OUT VARCHAR2
) AS
    v_balance NUMBER;
BEGIN
    SELECT Balance INTO v_balance FROM Account WHERE Account_No = p_account_no;
    
    IF v_balance < p_amount THEN
        RAISE_APPLICATION_ERROR(-20001, 'Insufficient balance');
    END IF;
    
    p_transaction_id := 'TXN' || LPAD(transaction_seq.NEXTVAL, 10, '0');
    
    UPDATE Account 
    SET Balance = Balance - p_amount 
    WHERE Account_No = p_account_no;
    
    INSERT INTO Transaction (Transaction_ID, From_Account, Type, Account, Status)
    VALUES (p_transaction_id, p_account_no, 'WITHDRAWAL', p_amount, 'COMPLETED');
    
    COMMIT; --TCL
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK; --TCL
        RAISE;
END;
/

-- Procedure: Transfer
CREATE OR REPLACE PROCEDURE sp_transfer (
    p_from_account IN VARCHAR2,
    p_to_account IN VARCHAR2,
    p_amount IN NUMBER,
    p_transaction_id OUT VARCHAR2
) AS
    v_balance NUMBER;
BEGIN
    SELECT Balance INTO v_balance FROM Account WHERE Account_No = p_from_account;
    
    IF v_balance < p_amount THEN
        RAISE_APPLICATION_ERROR(-20001, 'Insufficient balance');
    END IF;
    
    p_transaction_id := 'TXN' || LPAD(transaction_seq.NEXTVAL, 10, '0');
    
    UPDATE Account 
    SET Balance = Balance - p_amount 
    WHERE Account_No = p_from_account;
    
    UPDATE Account 
    SET Balance = Balance + p_amount 
    WHERE Account_No = p_to_account;
    
    INSERT INTO Transaction (Transaction_ID, From_Account, To_Account, Type, Account, Status)
    VALUES (p_transaction_id, p_from_account, p_to_account, 'TRANSFER', p_amount, 'COMPLETED');
    
    COMMIT; --TCL
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK; --TCL
        RAISE;
END;
/

-- Procedure: Create Loan
CREATE OR REPLACE PROCEDURE sp_create_loan (
    p_customer_id IN VARCHAR2,
    p_loan_amount IN NUMBER,
    p_time_period IN NUMBER,
    p_interest_rate IN NUMBER,
    p_loan_type IN VARCHAR2,
    p_loan_id OUT VARCHAR2
) AS
BEGIN
    p_loan_id := 'LOAN' || LPAD(loan_seq.NEXTVAL, 6, '0');
    
    INSERT INTO Loan (Loan_ID, Customer_ID, Loan_Amount, Time_Period, Interest, Loan_Type, Remaining_Amount)
    VALUES (p_loan_id, p_customer_id, p_loan_amount, p_time_period, p_interest_rate, p_loan_type, p_loan_amount);
    
    COMMIT;--TCL
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK; --TCL
        RAISE;
END;
/

-- =====================================================
-- 4. FUNCTIONS
-- =====================================================

-- Function: Get Balance
CREATE OR REPLACE FUNCTION fn_get_balance (
    p_account_no IN VARCHAR2
) RETURN NUMBER AS
    v_balance NUMBER;
BEGIN
    SELECT Balance INTO v_balance 
    FROM Account 
    WHERE Account_No = p_account_no;
    
    RETURN v_balance;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0;
END;
/

-- Function: Calculate EMI
CREATE OR REPLACE FUNCTION fn_calculate_emi (
    p_loan_amount IN NUMBER,
    p_interest_rate IN NUMBER,
    p_time_period IN NUMBER
) RETURN NUMBER AS
    v_monthly_rate NUMBER;
    v_emi NUMBER;
BEGIN
    v_monthly_rate := p_interest_rate / 12 / 100;
    
    IF v_monthly_rate = 0 THEN
        v_emi := p_loan_amount / p_time_period;
    ELSE
        v_emi := p_loan_amount * v_monthly_rate * POWER(1 + v_monthly_rate, p_time_period) 
                 / (POWER(1 + v_monthly_rate, p_time_period) - 1);
    END IF;
    
    RETURN ROUND(v_emi, 2);
END;
/

-- =====================================================
-- 5. INSERT SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Sample Customer
INSERT INTO Customer VALUES ('CUST000001', '12345-6789012-3', 'John Doe', '0300-1234567', 1);

-- Sample Account
INSERT INTO Account VALUES ('ACC00001001', 'CUST000001', 'SAVINGS', 5000, 'ACTIVE', SYSDATE);

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
SELECT 'Tables created:' AS Status FROM DUAL;
SELECT table_name FROM user_tables WHERE table_name IN ('CUSTOMER', 'ACCOUNT', 'TRANSACTION', 'LOAN');

SELECT 'Procedures created:' AS Status FROM DUAL;
SELECT object_name FROM user_objects WHERE object_type = 'PROCEDURE';

SELECT 'Functions created:' AS Status FROM DUAL;
SELECT object_name FROM user_objects WHERE object_type = 'FUNCTION';

SELECT 'Sample data:' AS Status FROM DUAL;
SELECT * FROM Customer;
SELECT * FROM Account;

-- =====================================================
-- SCRIPT COMPLETE
-- =====================================================