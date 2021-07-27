var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var conn = mysql.createConnection({
    host: "migo.cym4s4x6gfpj.us-east-2.rds.amazonaws.com",
    user: "migo",
    password: "migomigo",
    database: "mydb",
  });

  if(conn)
    res.send("connected to db");
  else
    res.send("not connected");
});

module.exports = router;


