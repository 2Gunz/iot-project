var express = require('express');
var router = express.Router();
var mysql = require('mysql');
const { route } = require('./users');

//DB connection
function connectDb() {
    var conn = mysql.createConnection({
        host: "migo.cym4s4x6gfpj.us-east-2.rds.amazonaws.com",
        user: "migo",
        password: "migomigo",
        database: "iot_project",
    });
    return conn;
    /*  const pool = mysql.createPool({
       host     : 'migo.cym4s4x6gfpj.us-east-2.rds.amazonaws.com',
       user     : 'migo',
       password : 'migomigo',
       database : 'iot_project'
     });

     return pool; */
}



//Proxy actually updates db
function updateTable(id, table, column, val) {
    var conn = connectDb();

    conn.connect((err) => {
        if (err) throw err;

        const sql = "UPDATE " + table + " SET " + column + " = " + val + " WHERE id = " + id;
        conn.query(sql, (err, result) => {
            if (err) res.send("\r\n Failed\r\n");

            res.send("Data updated :)");
        });

    });
}


//Get table: set_points
router.get('/set-points', function(req, res, next) {
    var conn = connectDb();

    conn.connect((err) => {
        if (err) throw err;

        const sql = "SELECT * FROM set_points";
        var rows;

        conn.query(sql, (err, result) => {
            if (err) res.send("\r\n Failed\r\n");

            rows = JSON.parse(JSON.stringify(result[result.length - 1]));
            console.table(rows);
            res.send(rows);
        });
    });


});


//Update table: set_points
router.post('/set-points', (req, res, next) => {

    var id = req.params.id;
    id = parseInt(id);

    const table = "set_points";
    if (req.params.temp1 !== "") {
        let val = parseFloat(req.params.temp1);
        let column = "temp1";
        updateTable(id, table, column, val);


    }

    if (req.params.temp2 !== "") {
        let val = parseFloat(req.params.temp2);
        let column = "temp2";
        updateTable(id, table, column, val);


    }

    if (req.params.time1 !== "") {
        let val = req.params.time1;
        let column = "time1";
        updateTable(id, table, column, val);


    }

    if (req.params.time2 !== "") {
        let val = req.params.time2;
        let column = "time2";
        updateTable(id, table, column, val);


    }

    if (req.params.time3 !== "") {
        let val = req.params.time3;
        let column = "time3";
        updateTable(id, table, column, val);


    }
});

//Get table: action
router.get('/action', (req, res, next) => {
    var conn = connectDb();

    conn.connect((err) => {
        if (err) throw err;

        const sql = "SELECT * FROM action";

        conn.query(sql, (err, result) => {
            if (err) res.send("\r\n Failed\r\n");

            var rows = JSON.parse(JSON.stringify(result[result.length - 1]));
            console.table(rows);
            res.send(rows);
        });
    });
})

//Update table: action
router.post('/action', (req, res, next) => {

    var id = 1;
    const table = "action";
    if (req.params.status) {
        let val = req.params.status;
        let column = "status";
        updateTable(id, table, column, val);
    }

    if (req.params.time) {
        let val = req.params.time;
        let column = "time";
        updateTable(id, table, column, val);
    }

})

router.get('/time', (req, res, next) => {
    var today = new Date();
    //today.toLocaleString('en-US', { timeZone: 'America/Denver', hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    today = today.toString();
  /*   var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

    console.log("today:" + today);
    console.log("time:" + time); */
    //var timeObject = { "time": time };
    const json = JSON.stringify(time);
    res.send(json);
})

module.exports = router;