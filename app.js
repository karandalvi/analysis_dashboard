var oracledb = require('oracledb');
oracledb.outFormat = oracledb.OBJECT;

var websockets = require('socket.io'); // Use WebSockets
var http = require('http'); // Basic HTTP functionality
var path = require('path'); // Parse directory paths
var express = require('express'); // Provide static routing to pages
var port = 8080;
var app = setupExpress();
var start = "04012017";
var end = "04202017";

listen(function(socket)
{
socket.on('query1', function()
{
  oracledb.getConnection(
    {
      user          : "kdalvi",
      password      : "DBMSsp17",
      connectString : "oracle.cise.ufl.edu/orcl"
    },
    function(err, connection)
    {
      if (err) {
        console.error(err.message);
        return;
      }
      connection.execute(
        "SELECT DATA.PRODUCT_GROUP, DATA.OLD_ACCOUNTS, ROUND(DATA.OLD_LOAN_AMOUNT / DATA.OLD_ACCOUNTS) OLD_AVG_LOAN_AMT, DATA.NEW_ACCOUNTS, ROUND(DATA.NEW_LOAN_AMOUNT / DATA.NEW_ACCOUNTS) NEW_AVG_LOAN_AMT, ROUND(((ROUND(DATA.NEW_LOAN_AMOUNT / DATA.NEW_ACCOUNTS) - ROUND(DATA.OLD_LOAN_AMOUNT / DATA.OLD_ACCOUNTS)) / ROUND(DATA.OLD_LOAN_AMOUNT / DATA.OLD_ACCOUNTS)) * 100) VARIATION FROM (SELECT PRODUCT_MASTER.PRODUCT_GROUP, SUM(CASE WHEN ACCOUNT.LOAN_DISBURSED_DATE < " +
        "to_date(:sid, 'MMDDYYYY') THEN 1 ELSE 0 END) OLD_ACCOUNTS, SUM(CASE WHEN ACCOUNT.LOAN_DISBURSED_DATE >= to_date(:sid, 'MMDDYYYY') THEN 1 ELSE 0 END) NEW_ACCOUNTS, SUM(CASE WHEN ACCOUNT.LOAN_DISBURSED_DATE < to_date(:sid, 'MMDDYYYY') THEN ACCOUNT.LOAN_AMOUNT ELSE 0 END) OLD_LOAN_AMOUNT, SUM(CASE WHEN ACCOUNT.LOAN_DISBURSED_DATE >= to_date(:sid, 'MMDDYYYY') THEN ACCOUNT.LOAN_AMOUNT ELSE 0 END) NEW_LOAN_AMOUNT FROM (SELECT PRODUCT.PRODUCT_NO, " +
        "PRODUCT.SUB_PRODUCT_NO, PRODUCT.PRODUCT_GROUP FROM PRODUCT) PRODUCT_MASTER LEFT OUTER JOIN ACCOUNT ON (ACCOUNT.PRODUCT_NO = PRODUCT_MASTER.PRODUCT_NO AND ACCOUNT.SUB_PRODUCT_NO = PRODUCT_MASTER.SUB_PRODUCT_NO) WHERE ACCOUNT.LOAN_DISBURSED_DATE <= to_date(:eid, 'MMDDYYYY') GROUP BY PRODUCT_MASTER.PRODUCT_GROUP) DATA ORDER BY DATA.PRODUCT_GROUP",
          { sid : start, eid : end }, //bind variables
        function(err, result)
        {
          if (err) {
            console.error(err.message);
            doRelease(connection);
            return;
          }
          console.log('Request Processed Successfully');
          socket.emit('data_query1',result);
          doRelease(connection);
        });
    });
});
socket.on('query2', function()
{
  oracledb.getConnection(
    {
      user          : "kdalvi",
      password      : "DBMSsp17",
      connectString : "oracle.cise.ufl.edu/orcl"
    },
    function(err, connection)
    {
      if (err) {
        console.error(err.message);
        return;
      }
      connection.execute(
        "SELECT MASTER_BRANCH.BRANCH_NO || '-' || MASTER_BRANCH.NAME || '-' || MASTER_BRANCH.CITY BRANCH_NAME, ROUND(NVL(ACTUAL.ACTUAL_COLLECTION, 0)) ACTUAL_COLLECTION," +
        " ROUND(NVL(EXPECTED.EXPECTED_COLLECTION, 0)) EXPECTED_COLLECTION, ROUND(CASE WHEN NVL(ACTUAL.ACTUAL_COLLECTION, 0) > NVL(EXPECTED.EXPECTED_COLLECTION, 0) THEN 0 ELSE" +
        " (NVL(EXPECTED.EXPECTED_COLLECTION, 0) - NVL(ACTUAL.ACTUAL_COLLECTION, 0)) / NVL(EXPECTED.EXPECTED_COLLECTION, 0) * 100 END, 2) DEFICIT FROM BRANCH MASTER_BRANCH, (SELECT B.BRANCH_NO," +
        " SUM(T.CREDIT_AMOUNT) ACTUAL_COLLECTION FROM TRANSACTION T, ACCOUNT A, BRANCH B WHERE T.ACCOUNT_NO = A.ACCOUNT_NO AND A.BRANCH_NO = B.BRANCH_NO AND T.TRANSACTION_DATE BETWEEN " +
        " TO_DATE(:sid, 'MMDDYYYY') AND TO_DATE(:eid, 'MMDDYYYY') AND A.STATUS NOT IN ('Terminated', 'Cancelled') GROUP BY B.BRANCH_NO) ACTUAL, (SELECT B.BRANCH_NO, SUM(R.REPAY_AMOUNT)" +
        " EXPECTED_COLLECTION FROM REPAYMENT_SCHEDULE R, ACCOUNT A, BRANCH B WHERE R.ACCOUNT_NO = A.ACCOUNT_NO AND A.BRANCH_NO = B.BRANCH_NO AND R.REPAY_DATE BETWEEN TO_DATE(:sid, 'MMDDYYYY') AND" +
        " TO_DATE(:eid, 'MMDDYYYY') AND A.STATUS NOT IN ('Terminated', 'Cancelled') GROUP BY B.BRANCH_NO) EXPECTED WHERE MASTER_BRANCH.BRANCH_NO = ACTUAL.BRANCH_NO(+) AND MASTER_BRANCH.BRANCH_NO =" +
        " EXPECTED.BRANCH_NO(+) ORDER BY MASTER_BRANCH.BRANCH_NO",
          { sid : start, eid : end }, //bind variables
        function(err, result)
        {
          if (err) {
            console.error(err.message);
            doRelease(connection);
            return;
          }
          console.log('Request Processed Successfully');
          socket.emit('data_query2',result);
          doRelease(connection);
        });
    });
});
socket.on('query3', function()
{
  oracledb.getConnection(
    {
      user          : "kdalvi",
      password      : "DBMSsp17",
      connectString : "oracle.cise.ufl.edu/orcl"
    },
    function(err, connection)
    {
      if (err) {
        console.error(err.message);
        return;
      }
      connection.execute(
        "SELECT G.STATE, ROUND(G.ACTUAL_COLLECTION) ACTUAL_COLLECTION, ROUND(G.EXPECTED_COLLECTION) EXPECTED_COLLECTION, ROUND(CASE WHEN G.ACTUAL_COLLECTION > G.EXPECTED_COLLECTION THEN 0 ELSE" +
        " (G.EXPECTED_COLLECTION - G.ACTUAL_COLLECTION) / G.EXPECTED_COLLECTION * 100 END, 2) DEFICIT FROM (SELECT MASTER_BRANCH.STATE STATE, SUM(NVL(ACTUAL.ACTUAL_COLLECTION,0)) ACTUAL_COLLECTION," +
        " SUM(NVL(EXPECTED.EXPECTED_COLLECTION,0)) EXPECTED_COLLECTION FROM BRANCH MASTER_BRANCH, (SELECT B.BRANCH_NO, SUM(T.CREDIT_AMOUNT) ACTUAL_COLLECTION FROM TRANSACTION T, ACCOUNT A, BRANCH B WHERE T.ACCOUNT_NO ="+
        " A.ACCOUNT_NO AND A.BRANCH_NO = B.BRANCH_NO AND T.TRANSACTION_DATE BETWEEN TO_DATE(:sid, 'MMDDYYYY') AND TO_DATE(:eid, 'MMDDYYYY') AND A.STATUS NOT IN ('Terminated', 'Cancelled') GROUP BY B.BRANCH_NO) ACTUAL," +
        " (SELECT B.BRANCH_NO, SUM(R.REPAY_AMOUNT) EXPECTED_COLLECTION FROM REPAYMENT_SCHEDULE R, ACCOUNT A, BRANCH B WHERE R.ACCOUNT_NO = A.ACCOUNT_NO AND A.BRANCH_NO = B.BRANCH_NO AND R.REPAY_DATE BETWEEN TO_DATE(:sid," +
        " 'MMDDYYYY') AND TO_DATE(:eid, 'MMDDYYYY') AND A.STATUS NOT IN ('Terminated', 'Cancelled') GROUP BY B.BRANCH_NO) EXPECTED WHERE MASTER_BRANCH.BRANCH_NO = ACTUAL.BRANCH_NO(+) AND MASTER_BRANCH.BRANCH_NO =" +
        " EXPECTED.BRANCH_NO(+) GROUP BY MASTER_BRANCH.STATE) G ORDER BY G.STATE",
          { sid : start, eid : end }, //bind variables
        function(err, result)
        {
          if (err) {
            console.error(err.message);
            doRelease(connection);
            return;
          }
          console.log('Request Processed Successfully');
          socket.emit('data_query3',result);
          doRelease(connection);
        });
    });
});
socket.on('query4', function()
{
  oracledb.getConnection(
    {
      user          : "kdalvi",
      password      : "DBMSsp17",
      connectString : "oracle.cise.ufl.edu/orcl"
    },
    function(err, connection)
    {
      if (err) {
        console.error(err.message);
        return;
      }
      connection.execute(
        "SELECT HIGH.PRODUCT_GROUP, HIGH.STATE HIGHEST, ROUND(HIGH.REVENUE/1000) HIGHEST_REVENUE, LOW.STATE LOWEST, ROUND(LOW.REVENUE/1000) LOWEST_REVENUE FROM(SELECT PRODUCT_GROUP, RANK, STATE, REVENUE FROM (SELECT" +
        " PRODUCT_GROUP, RANK() OVER (PARTITION BY PRODUCT_GROUP ORDER BY REVENUE DESC) RANK, STATE, REVENUE FROM (SELECT P.PRODUCT_GROUP, B.STATE, (SUM(T.CREDIT_AMOUNT) - SUM(T.DEBIT_AMOUNT)) REVENUE FROM TRANSACTION T," +
        " ACCOUNT A, BRANCH B, PRODUCT P WHERE T.TRANSACTION_DATE BETWEEN TO_DATE(:sid, 'MMDDYYYY') AND TO_DATE(:eid, 'MMDDYYYY') AND T.ACCOUNT_NO = A.ACCOUNT_NO AND B.BRANCH_NO = T.BRANCH_NO AND A.PRODUCT_NO = " +
        " P.PRODUCT_NO AND A.SUB_PRODUCT_NO = P.SUB_PRODUCT_NO GROUP BY P.PRODUCT_GROUP, B.STATE)) WHERE RANK = 1 ORDER BY PRODUCT_GROUP, RANK) HIGH, (SELECT PRODUCT_GROUP, RANK, STATE, REVENUE FROM (SELECT " +
        " PRODUCT_GROUP, RANK() OVER (PARTITION BY PRODUCT_GROUP ORDER BY REVENUE) RANK, STATE, REVENUE FROM (SELECT P.PRODUCT_GROUP, B.STATE, (SUM(T.CREDIT_AMOUNT) - SUM(T.DEBIT_AMOUNT)) REVENUE FROM TRANSACTION T," +
        " ACCOUNT A, BRANCH B, PRODUCT P WHERE T.TRANSACTION_DATE BETWEEN TO_DATE(:sid, 'MMDDYYYY') AND TO_DATE(:eid, 'MMDDYYYY') AND T.ACCOUNT_NO = A.ACCOUNT_NO AND B.BRANCH_NO = T.BRANCH_NO AND A.PRODUCT_NO = " +
        " P.PRODUCT_NO AND A.SUB_PRODUCT_NO = P.SUB_PRODUCT_NO GROUP BY P.PRODUCT_GROUP, B.STATE)) WHERE RANK = 1 ORDER BY PRODUCT_GROUP, RANK) LOW WHERE HIGH.PRODUCT_GROUP = LOW.PRODUCT_GROUP",
          { sid : start, eid : end }, //bind variables
        function(err, result)
        {
          if (err) {
            console.error(err.message);
            doRelease(connection);
            return;
          }
          console.log('Request Processed Successfully');
          socket.emit('data_query4',result);
          doRelease(connection);
        });
    });
});

socket.on('query5', function()
{
  oracledb.getConnection(
    {
      user          : "kdalvi",
      password      : "DBMSsp17",
      connectString : "oracle.cise.ufl.edu/orcl"
    },
    function(err, connection)
    {
      if (err) {
        console.error(err.message);
        return;
      }
      connection.execute(
        "SELECT MASTER.PRODUCT_GROUP, MASTER.SLAB, NVL(D.CT,0) NO_OF_CUSTOMERS FROM (SELECT PRODUCT_MASTER.PRODUCT_GROUP, AGE_MASTER.SLAB FROM (SELECT DISTINCT PRODUCT_GROUP FROM PRODUCT) PRODUCT_MASTER," +
        " (SELECT '20 Under' SLAB FROM DUAL UNION ALL SELECT '21-30' SLAB FROM DUAL UNION ALL SELECT '31-40' SLAB FROM DUAL UNION ALL SELECT '41-50' SLAB FROM DUAL UNION ALL SELECT '50 Above' " +
        " SLAB FROM DUAL) AGE_MASTER) MASTER, (SELECT P.PRODUCT_GROUP, C.CUSTOMER_PROFILE, COUNT(1) CT FROM PRODUCT P, ACCOUNT A, (SELECT C.CUSTOMER_NO, CASE WHEN ROUND((SYSDATE " +
        " - C.DATE_OF_BIRTH)/365) < 20 THEN '20 Under' WHEN ROUND((SYSDATE - C.DATE_OF_BIRTH)/365) BETWEEN 21 AND 30 THEN '21-30' WHEN ROUND((SYSDATE - C.DATE_OF_BIRTH)/365) BETWEEN 31 AND " +
        " 40 THEN '31-40' WHEN ROUND((SYSDATE - C.DATE_OF_BIRTH)/365) BETWEEN 41 AND 50 THEN '41-50' WHEN ROUND((SYSDATE - C.DATE_OF_BIRTH)/365) > 50 THEN '50 Above' END CUSTOMER_PROFILE " +
        " FROM CUSTOMER C) C WHERE A.PRODUCT_NO = P.PRODUCT_NO AND A.SUB_PRODUCT_NO = P.SUB_PRODUCT_NO AND A.CUSTOMER_NO = C.CUSTOMER_NO GROUP BY P.PRODUCT_GROUP, C.CUSTOMER_PROFILE) D WHERE" +
        " D.PRODUCT_GROUP(+) = MASTER.PRODUCT_GROUP AND D.CUSTOMER_PROFILE(+) = MASTER.SLAB ORDER BY MASTER.PRODUCT_GROUP, MASTER.SLAB",
          {}, //bind variables
        function(err, result)
        {
          if (err) {
            console.error(err.message);
            doRelease(connection);
            return;
          }
          console.log('Request Processed Successfully');
          socket.emit('data_query5',result);
          doRelease(connection);
        });
    });
});

socket.on('query6', function()
{
  oracledb.getConnection(
    {
      user          : "kdalvi",
      password      : "DBMSsp17",
      connectString : "oracle.cise.ufl.edu/orcl"
    },
    function(err, connection)
    {
      if (err) {
        console.error(err.message);
        return;
      }
      connection.execute(
        "SELECT TO_CHAR(NEXT.REPAY_DATE,'MM-DD-YYYY') COLLECTION_DATE, ROUND(NVL(NEXT.TOT_AMT,0)) COLLECTIONS, ROUND(NVL(PREV.TOT_AMT, 0)) PREV_DAY_COLLECTIONS, CASE" +
        " WHEN PREV.TOT_AMT IS NULL THEN 0 ELSE ROUND(((NEXT.TOT_AMT - PREV.TOT_AMT) / PREV.TOT_AMT) * 100, 2) END CHANGE" +
        " FROM (SELECT R.REPAY_DATE, SUM(R.REPAY_AMOUNT) TOT_AMT, SUM(R.INTEREST_PART) INT_AMT, SUM(R.PRINCIPAL_PART) PRIN_AMT FROM REPAYMENT_SCHEDULE R WHERE R.REPAY_DATE" +
        " BETWEEN (TO_DATE(:sid, 'MMDDYYYY')-1) AND TO_DATE(:eid, 'MMDDYYYY') GROUP BY R.REPAY_DATE) PREV RIGHT OUTER JOIN (SELECT R.REPAY_DATE, SUM(R.REPAY_AMOUNT) TOT_AMT, SUM(R.INTEREST_PART)" +
        " INT_AMT, SUM(R.PRINCIPAL_PART) PRIN_AMT FROM REPAYMENT_SCHEDULE R WHERE R.REPAY_DATE BETWEEN TO_DATE(:sid, 'MMDDYYYY') AND TO_DATE(:eid, 'MMDDYYYY') GROUP BY R.REPAY_DATE) NEXT ON" +
        " (PREV.REPAY_DATE + 1 = NEXT.REPAY_DATE) ORDER BY NEXT.REPAY_DATE",
          { sid : start, eid : end }, //bind variables
        function(err, result)
        {
          if (err) {
            console.error(err.message);
            doRelease(connection);
            return;
          }
          console.log('Request Processed Successfully');
          socket.emit('data_query6',result);
          doRelease(connection);
        });
    });
});
socket.on('query7', function()
{
  oracledb.getConnection(
    {
      user          : "kdalvi",
      password      : "DBMSsp17",
      connectString : "oracle.cise.ufl.edu/orcl"
    },
    function(err, connection)
    {
      if (err) {
        console.error(err.message);
        return;
      }
      connection.execute(
        "SELECT TO_CHAR(NEXT.TRANSACTION_DATE,'MM-DD-YYYY') TRANSACTION_DATE, ROUND(NVL(NEXT.TOT_AMT,0)) COLLECTIONS, ROUND(NVL(PREV.TOT_AMT, 0)) PREV_DAY_COLLECTIONS, CASE WHEN PREV.TOT_AMT IS NULL THEN 0 ELSE ROUND(((NEXT.TOT_AMT - PREV.TOT_AMT)" +
        " / PREV.TOT_AMT) * 100, 2) END CHANGE FROM (SELECT T.TRANSACTION_DATE, SUM(T.CREDIT_AMOUNT) TOT_AMT FROM TRANSACTION T WHERE T.TRANSACTION_DATE BETWEEN (TO_DATE(:sid, 'MMDDYYYY')-1)" +
        " AND TO_DATE(:eid, 'MMDDYYYY') GROUP BY T.TRANSACTION_DATE) PREV RIGHT OUTER JOIN (SELECT T.TRANSACTION_DATE, SUM(T.CREDIT_AMOUNT) TOT_AMT FROM TRANSACTION T WHERE T.TRANSACTION_DATE" +
        " BETWEEN TO_DATE(:sid, 'MMDDYYYY') AND TO_DATE(:eid, 'MMDDYYYY') GROUP BY T.TRANSACTION_DATE) NEXT ON (PREV.TRANSACTION_DATE + 1 = NEXT.TRANSACTION_DATE) ORDER BY NEXT.TRANSACTION_DATE",
          { sid : start, eid : end }, //bind variables
        function(err, result)
        {
          if (err) {
            console.error(err.message);
            doRelease(connection);
            return;
          }
          console.log('Request Processed Successfully');
          socket.emit('data_query7',result);
          doRelease(connection);
        });
    });
});

socket.on('query8', function()
{
  oracledb.getConnection(
    {
      user          : "kdalvi",
      password      : "DBMSsp17",
      connectString : "oracle.cise.ufl.edu/orcl"
    },
    function(err, connection)
    {
      if (err) {
        console.error(err.message);
        return;
      }
      connection.execute(
        "WITH RETURNING AS (SELECT C.CUSTOMER_NO, A.ACCOUNT_NO, A.LOAN_DISBURSED_DATE, P.PRODUCT_GROUP, RANK() OVER (PARTITION BY C.CUSTOMER_NO ORDER BY A.LOAN_DISBURSED_DATE) SEQ " +
        " FROM ACCOUNT A, CUSTOMER C, (SELECT C.CUSTOMER_NO FROM ACCOUNT A, CUSTOMER C WHERE A.CUSTOMER_NO = C.CUSTOMER_NO GROUP BY C.CUSTOMER_NO HAVING COUNT(DISTINCT A.ACCOUNT_NO) " +
        " > 1) R, PRODUCT P WHERE A.CUSTOMER_NO = C.CUSTOMER_NO AND C.CUSTOMER_NO = R.CUSTOMER_NO AND A.PRODUCT_NO = P.PRODUCT_NO AND A.SUB_PRODUCT_NO = P.SUB_PRODUCT_NO), PG AS " +
        " (SELECT DISTINCT PRODUCT_GROUP FROM PRODUCT) SELECT MASTER.FIRST_PROD, MASTER.SEC_PROD, NVL(DATA.CASES,0) NO_OF_CASES FROM (SELECT P1.PRODUCT_GROUP FIRST_PROD, P2.PRODUCT_GROUP SEC_PROD " +
        " FROM PG P1, PG P2 WHERE P1.PRODUCT_GROUP <> P2.PRODUCT_GROUP) MASTER, (SELECT FIRST_PROD, SEC_PROD, COUNT(1) CASES FROM (SELECT R1.PRODUCT_GROUP FIRST_PROD, R2.PRODUCT_GROUP " +
        " SEC_PROD FROM (SELECT * FROM RETURNING WHERE SEQ = 1) R1, (SELECT * FROM RETURNING WHERE SEQ = 2) R2 WHERE R1.CUSTOMER_NO = R2.CUSTOMER_NO) GROUP BY FIRST_PROD, SEC_PROD) DATA " +
        " WHERE MASTER.FIRST_PROD = DATA.FIRST_PROD(+) AND MASTER.SEC_PROD = DATA.SEC_PROD(+) ORDER BY MASTER.FIRST_PROD, MASTER.SEC_PROD",
        {}, //bind variables
        function(err, result)
        {
          if (err) {
            console.error(err.message);
            doRelease(connection);
            return;
          }
          console.log('Request Processed Successfully');
          socket.emit('data_query8',result);
          doRelease(connection);
        });
    });
});

socket.on('query9', function()
{
  oracledb.getConnection(
    {
      user          : "kdalvi",
      password      : "DBMSsp17",
      connectString : "oracle.cise.ufl.edu/orcl"
    },
    function(err, connection)
    {
      if (err) {
        console.error(err.message);
        return;
      }
      connection.execute(
        "SELECT D.CUSTOMER_PROFILE, ROUND(AVG(D.INCOME)) AVG_INCOME, ROUND(AVG(D.OBLIGATIONS)) AVG_OBLIGATIONS, ROUND(AVG(D.REPAY_AMOUNT))" +
        " AVG_EMI FROM (SELECT CC.*, R.REPAY_AMOUNT FROM (SELECT C.CUSTOMER_NO, CASE WHEN ROUND((SYSDATE - C.DATE_OF_BIRTH)/365) < 20 THEN '20" +
        "Under' WHEN ROUND((SYSDATE - C.DATE_OF_BIRTH)/365) BETWEEN 21 AND 30 THEN '21-30' WHEN ROUND((SYSDATE - C.DATE_OF_BIRTH)/365) BETWEEN 31" +
        " AND 40 THEN '31-40' WHEN ROUND((SYSDATE - C.DATE_OF_BIRTH)/365) BETWEEN 41 AND 50 THEN '41-50' WHEN ROUND((SYSDATE - C.DATE_OF_BIRTH)/365) > 50 THEN '50 Above' END " +
        "CUSTOMER_PROFILE, C.INCOME, C.OBLIGATIONS FROM CUSTOMER C) CC, ACCOUNT A, REPAYMENT_SCHEDULE R WHERE CC.CUSTOMER_NO = A.CUSTOMER_NO AND A.ACCOUNT_NO = R.ACCOUNT_NO AND R.REPAY_NO = 1) D " +
        "GROUP BY D.CUSTOMER_PROFILE ORDER BY D.CUSTOMER_PROFILE",
        {}, //bind variables
        function(err, result)
        {
          if (err) {
            console.error(err.message);
            doRelease(connection);
            return;
          }
          console.log('Request Processed Successfully');
          socket.emit('data_query9',result);
          doRelease(connection);
        });
    });
});

socket.on('query10', function()
{
  oracledb.getConnection(
    {
      user          : "kdalvi",
      password      : "DBMSsp17",
      connectString : "oracle.cise.ufl.edu/orcl"
    },
    function(err, connection)
    {
      if (err) {
        console.error(err.message);
        return;
      }
      connection.execute(
        "SELECT D.STATE, D.NO_BRANCHES BRANCHES, D.TOTAL_NO_OF_LOANS TOTAL, D.ACTIVE_LOANS ACTIVE, DECODE(GREATEST(D.EDUCATION_LOANS, D.VEHICLE_LOANS, "
        +" D.COMMERCIAL_LOANS, D.PERSONAL_LOANS, D.HOME_LOANS), D.EDUCATION_LOANS, 'EDUCATION LOAN', D.VEHICLE_LOANS, 'CAR LOAN', D.PERSONAL_LOANS, 'PERSONAL LOAN', D.HOME_LOANS, 'HOME LOAN', D.COMMERCIAL_LOANS, 'COMMERCIAL LOAN')"
        +" MOST_POPULAR, ROUND(GREATEST(D.EDUCATION_LOANS, D.VEHICLE_LOANS, D.COMMERCIAL_LOANS, D.PERSONAL_LOANS, D.HOME_LOANS) / D.TOTAL_NO_OF_LOANS * 100, 2) PSHARE, DECODE(LEAST(D.EDUCATION_LOANS, D.VEHICLE_LOANS,"
        +" D.COMMERCIAL_LOANS, D.PERSONAL_LOANS, D.HOME_LOANS), D.EDUCATION_LOANS, 'EDUCATION LOAN', D.VEHICLE_LOANS, 'CAR LOAN', D.PERSONAL_LOANS, 'PERSONAL LOAN', D.HOME_LOANS, 'HOME LOAN', D.COMMERCIAL_LOANS, 'COMMERCIAL LOAN')"
        +" LEAST_POPULAR, ROUND(LEAST(D.EDUCATION_LOANS, D.VEHICLE_LOANS, D.COMMERCIAL_LOANS, D.PERSONAL_LOANS, D.HOME_LOANS) / D.TOTAL_NO_OF_LOANS * 100, 2) LSHARE FROM (SELECT B.STATE, COUNT(DISTINCT B.BRANCH_NO)"
        +" NO_BRANCHES, COUNT(1) TOTAL_NO_OF_LOANS, SUM(DECODE(A.STATUS, 'Disbursed', 1, 'Approved', 1, 0)) ACTIVE_LOANS, SUM(DECODE(A.STATUS, 'Cancelled', 1, 'Terminated', 1, 0)) CLOSED_LOANS, ROUND(AVG(A.LOAN_AMOUNT),2) AVG_LOAN,"
        +" ROUND(AVG(A.REPAYMENT_TENURE),2) AVG_TENURE, ROUND(AVG(SYSDATE - C.DATE_OF_BIRTH)/365) AVG_CUSTOMER_AGE, SUM(DECODE(P.PRODUCT_NO, 100, 1, 0)) VEHICLE_LOANS, SUM(DECODE(P.PRODUCT_NO, 200, 1, 0)) EDUCATION_LOANS,"
        +" SUM(DECODE(P.PRODUCT_NO, 300, 1, 0)) HOME_LOANS, SUM(DECODE(P.PRODUCT_NO, 400, 1, 0)) PERSONAL_LOANS, SUM(DECODE(P.PRODUCT_NO, 500, 1, 0)) COMMERCIAL_LOANS FROM ACCOUNT A, BRANCH B, CUSTOMER C, PRODUCT P WHERE A.BRANCH_NO ="
        +" B.BRANCH_NO AND A.CUSTOMER_NO = C.CUSTOMER_NO AND A.PRODUCT_NO = P.PRODUCT_NO AND A.SUB_PRODUCT_NO = P.SUB_PRODUCT_NO GROUP BY B.STATE) D",
        {}, //bind variables
        function(err, result)
        {
          if (err) {
            console.error(err.message);
            doRelease(connection);
            return;
          }
          console.log('Request Processed Successfully');
          socket.emit('data_query10',result);
          doRelease(connection);
        });
    });
});

socket.on('query11', function()
{
  oracledb.getConnection(
    {
      user          : "kdalvi",
      password      : "DBMSsp17",
      connectString : "oracle.cise.ufl.edu/orcl"
    },
    function(err, connection)
    {
      if (err) {
        console.error(err.message);
        return;
      }
      connection.execute(
        "SELECT D.CITY CITY, D.NO_BRANCHES BRANCHES, D.TOTAL_NO_OF_LOANS LOANS, D.ACTIVE_LOANS ACTIVE, DECODE(GREATEST(D.EDUCATION_LOANS, D.VEHICLE_LOANS, D.COMMERCIAL_LOANS, D.PERSONAL_LOANS,"
        +" D.HOME_LOANS), D.EDUCATION_LOANS, 'EDUCATION LOAN', D.VEHICLE_LOANS, 'CAR LOAN', D.PERSONAL_LOANS, 'PERSONAL LOAN', D.HOME_LOANS, 'HOME LOAN', D.COMMERCIAL_LOANS, 'COMMERCIAL LOAN') MOST_POPULAR, ROUND(GREATEST(D.EDUCATION_LOANS, D.VEHICLE_LOANS,"
        +" D.COMMERCIAL_LOANS, D.PERSONAL_LOANS, D.HOME_LOANS) / D.TOTAL_NO_OF_LOANS * 100, 2) PSHARE, DECODE(LEAST(D.EDUCATION_LOANS, D.VEHICLE_LOANS, D.COMMERCIAL_LOANS, D.PERSONAL_LOANS, D.HOME_LOANS), D.EDUCATION_LOANS, 'EDUCATION LOAN',"
        +" D.VEHICLE_LOANS, 'CAR LOAN', D.PERSONAL_LOANS, 'PERSONAL LOAN', D.HOME_LOANS, 'HOME LOAN', D.COMMERCIAL_LOANS, 'COMMERCIAL LOAN') LEAST_POPULAR, ROUND(LEAST(D.EDUCATION_LOANS, D.VEHICLE_LOANS, D.COMMERCIAL_LOANS, D.PERSONAL_LOANS, D.HOME_LOANS) /"
        +" D.TOTAL_NO_OF_LOANS * 100, 2) LSHARE FROM (SELECT B.CITY, B.STATE, COUNT(DISTINCT B.BRANCH_NO) NO_BRANCHES, COUNT(1) TOTAL_NO_OF_LOANS, SUM(DECODE(A.STATUS, 'Disbursed', 1, 'Approved', 1, 0)) ACTIVE_LOANS, SUM(DECODE(A.STATUS, 'Cancelled', 1, 'Terminated',"
        +" 1, 0)) CLOSED_LOANS, ROUND(AVG(A.LOAN_AMOUNT),2) AVG_LOAN, ROUND(AVG(A.REPAYMENT_TENURE),2) AVG_TENURE, ROUND(AVG(SYSDATE - C.DATE_OF_BIRTH)/365) AVG_CUSTOMER_AGE, SUM(DECODE(P.PRODUCT_NO, 100, 1, 0)) VEHICLE_LOANS, SUM(DECODE(P.PRODUCT_NO, 200, 1, 0))"
        +" EDUCATION_LOANS, SUM(DECODE(P.PRODUCT_NO, 300, 1, 0)) HOME_LOANS, SUM(DECODE(P.PRODUCT_NO, 400, 1, 0)) PERSONAL_LOANS, SUM(DECODE(P.PRODUCT_NO, 500, 1, 0)) COMMERCIAL_LOANS FROM ACCOUNT A, BRANCH B, CUSTOMER C, PRODUCT P WHERE A.BRANCH_NO = B.BRANCH_NO AND"
        +" A.CUSTOMER_NO = C.CUSTOMER_NO AND A.PRODUCT_NO = P.PRODUCT_NO AND A.SUB_PRODUCT_NO = P.SUB_PRODUCT_NO GROUP BY B.CITY, B.STATE) D",
        {}, //bind variables
        function(err, result)
        {
          if (err) {
            console.error(err.message);
            doRelease(connection);
            return;
          }
          console.log('Request Processed Successfully');
          socket.emit('data_query11',result);
          doRelease(connection);
        });
    });
});

socket.on('query12', function()
{
  oracledb.getConnection(
    {
      user          : "kdalvi",
      password      : "DBMSsp17",
      connectString : "oracle.cise.ufl.edu/orcl"
    },
    function(err, connection)
    {
      if (err) {
        console.error(err.message);
        return;
      }
      connection.execute(
        "SELECT * FROM TOT_TUP",
        {}, //bind variables
        function(err, result)
        {
          if (err) {
            console.error(err.message);
            doRelease(connection);
            return;
          }
          console.log('Request Processed Successfully');
          socket.emit('data_query12',result);
          doRelease(connection);
        });
    });
});
//
// socket.on('query13', function()
// {
//   oracledb.getConnection(
//     {
//       user          : "kdalvi",
//       password      : "DBMSsp17",
//       connectString : "oracle.cise.ufl.edu/orcl"
//     },
//     function(err, connection)
//     {
//       if (err) {
//         console.error(err.message);
//         return;
//       }
//       connection.execute(
//         ,
//         {}, //bind variables
//         function(err, result)
//         {
//           if (err) {
//             console.error(err.message);
//             doRelease(connection);
//             return;
//           }
//           console.log('Request Processed Successfully');
//           socket.emit('data_query13',result);
//           doRelease(connection);
//         });
//     });
// });
//
// socket.on('query14', function()
// {
//   oracledb.getConnection(
//     {
//       user          : "kdalvi",
//       password      : "DBMSsp17",
//       connectString : "oracle.cise.ufl.edu/orcl"
//     },
//     function(err, connection)
//     {
//       if (err) {
//         console.error(err.message);
//         return;
//       }
//       connection.execute(
//         ,
//         {}, //bind variables
//         function(err, result)
//         {
//           if (err) {
//             console.error(err.message);
//             doRelease(connection);
//             return;
//           }
//           console.log('Request Processed Successfully');
//           socket.emit('data_query14',result);
//           doRelease(connection);
//         });
//     });
// });
//
// socket.on('query15', function()
// {
//   oracledb.getConnection(
//     {
//       user          : "kdalvi",
//       password      : "DBMSsp17",
//       connectString : "oracle.cise.ufl.edu/orcl"
//     },
//     function(err, connection)
//     {
//       if (err) {
//         console.error(err.message);
//         return;
//       }
//       connection.execute(
//         ,
//         {}, //bind variables
//         function(err, result)
//         {
//           if (err) {
//             console.error(err.message);
//             doRelease(connection);
//             return;
//           }
//           console.log('Request Processed Successfully');
//           socket.emit('data_query15',result);
//           doRelease(connection);
//         });
//     });
// });


socket.on('start', function(data)
{
  start = data;
});
socket.on('end', function(data)
{
  end = data;
});
}, function(socket, notification) {});

//---------------------------------------------------------------------------------------------------

function setupExpress()
{
	// HTML files located here
	var viewsDir = path.join(__dirname, 'views');
	// JS/CSS support located here
	// This becomes the root directory used by the HTML files
	var publicDir = path.join(__dirname, 'public');

	var app = express();
	app.use(express.static(publicDir));

  app.get('/', function(req, res)
  {
    res.sendFile('views/error.html', { root: '.' });
  });

	// Get the index page (only option)
	app.get('/home', function(req, res)
	{
		res.sendFile('views/index.html', { root: '.' });
    start = "04012017";
    end = "04202017";
	});

  app.get('/login', function(req, res)
	{
		res.sendFile('views/login.html', { root: '.' });
	});

	// Handle any misc errors by redirecting to a simple page and logging
	app.use(function(err, req, res, next)
	{
		console.log(err.stack);
		res.status(err.status || 500);

		res.sendFile('/views/error.html', { root: '.' });
	});

	return app;
}

// ------------------------------------------------------------------------------

function listen(user_callback, mbed_callback)
{
	// Prepare to keep track of all connected users and sockets
	var sockets = [];
	var server = http.Server(app);
	var io = websockets(server);

	// A new user has connected
	io.on('connection', function(socket)
	{
		// Track them
		sockets.push(socket);
		// Call the function you specified
		user_callback(socket);
	});

	// Begin waiting for connections
	server.listen(port, function()
	{
		// Use long polling, else all responses are async
	});
}

//---------------------------------------------------------------------

function doRelease(connection)
{
  connection.close(
    function(err) {
      if (err)
        console.error(err.message);
    });
}
