var express = require('express');
var router = express.Router();
var mysql = require('mysql');

//database connect
function connectDb() {
    var conn = mysql.createConnection({
        host: "migo.cym4s4x6gfpj.us-east-2.rds.amazonaws.com",
        user: "migo",
        password: "migomigo",
        database: "iot_project",
    });
    return conn;
}
/* GET home page. */
router.get('/', function(req, res, next) {
    var conn = connectDb();

    conn.connect((err) => {

        if (err) throw err;
        sql = "SELECT * FROM set_points";
        var rows;


        conn.query(sql, (err, result) => {
            if (err) res.send("\r\n Failed\r\n");

            rows = JSON.parse(JSON.stringify(result[result.length - 1]));
            console.table(rows);
            res.send(rows["temp1"] + " " + rows["temp2"]);
        });
    });


});

module.exports = router;