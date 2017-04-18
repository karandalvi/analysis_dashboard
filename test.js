var oracledb = require('oracledb');
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
      "SELECT name, city " +
        "FROM branch " +
        "WHERE 2=2",
        {}, //no binds
      function(err, result)
      {
        if (err) {
          console.error(err.message);
          doRelease(connection);
          return;
        }
        console.log(result.rows);
        doRelease(connection);
      });
  });

function doRelease(connection)
{
  connection.close(
    function(err) {
      if (err)
        console.error(err.message);
    });
}
