function sendResp(req, resp) {
var oracledb = require('oracledb');
oracledb.getConnection(
  {
    user          : "",
    password      : "",
    connectString : "oracle.cise.ufl.edu/orcl"
  },
  function(err, connection)
  {
    if (err) {
      console.error(err.message);
      resp.write(err.message);
      resp.end();
      return;
    }
    connection.execute(
      "SELECT name " +
        "FROM branch " +
        "WHERE 2=2",
        {}, //no binds
        {
          outFormat: oracledb.OBJECT
        },
      // [110],  // bind value for :id
      function(err, result)
      {
        if (err) {
          console.error(err.message);
          resp.write(err.message);
          resp.end();
          doRelease(connection);
          return;
        }
        console.log(result[0]);
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
}

var http = require('http');
var port = 8080;
var httpServer = http.createServer(function(req, resp) {
  sendResp(req,resp);
});
httpServer.listen(port);
