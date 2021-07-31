var express = require("express");
var router = express.Router();
var mysql = require("mysql");
const { route } = require("./users");

const pool = mysql.createPool({
  host: "migo.cym4s4x6gfpj.us-east-2.rds.amazonaws.com",
  user: "migo",
  password: "migomigo",
  database: "iot_project",
});

//Get table: set_points
router.get("/set-points", function (req, res, next) {
  rows = getSetPoints();

  str = {
    id1: rows[0]["id"],
    time1: rows[0]["time1"],
    temp1: rows[0]["temp1"],
    temp2: rows[0]["temp2"],
    id2: rows[1]["id"],
    time2: rows[1]["time1"],
    temp3: rows[1]["temp1"],
    temp4: rows[1]["temp2"],
    id3: rows[2]["id"],
    time3: rows[2]["time1"],
    temp5: rows[2]["temp1"],
    temp6: rows[2]["temp2"],
  };

  const json = JSON.stringify(str);
  res.send(json);
});

//Update table: set_points
router.post("/set-points", (req, res, next) => {
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
router.get("/action", (req, res, next) => {
  var conn = connectDb();

  conn.getConnection((err, connection) => {
    if (err) throw err;

    const sql = "SELECT * FROM action";

    connection.query(sql, (err, result) => {
      if (err) res.send("\r\n Failed\r\n");

      var rows = JSON.parse(JSON.stringify(result[result.length - 1]));
      console.table(rows);
      res.send(rows);
    });
  });
});

//Update table: action
router.post("/action", (req, res, next) => {
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
});

function getTime() {
  var today = new Date();
  today.setHours(today.getHours() - 6);

  var timeObject = {
    date: today,
    hours: today.getHours(),
    minutes: today.getMinutes(),
    seconds: today.getSeconds(),
  };
  return timeObject;
}

router.get("/time", (req, res, next) => {
  var timeObject = getTime();
  const json = JSON.stringify(today);
  res.send(json);
});

function getSetPoints() {
  pool.getConnection((err, connection) => {
    if (err) throw err;

    const sql = "SELECT * FROM set_points";
    var rows;

    connection.query(sql, (err, result) => {
      connection.release();
      if (err) res.send("\r\n Failed\r\n");

      rows = JSON.parse(JSON.stringify(result));
      return rows;
    });
  });
}

function getAction() {
  var rows;
  pool.getConnection((err, connection) => {
    if (err) throw err;

    const sql = "SELECT * FROM set_points";

    connection.query(sql, (err, result) => {
      connection.release();
      if (err) throw err;

      rows = JSON.parse(JSON.stringify(result));
      return rows;
    });
  });
}

//Proxy actually updates db
function updateTable(id, table, column, val) {
  pool.getConnection((err, connection) => {
    if (err) throw err;

    const sql =
      "UPDATE " +
      table +
      " SET " +
      column +
      " = '" +
      val +
      "' WHERE id = " +
      id;
    connection.query(sql, (err, result) => {
      connection.release();
      if (err) throw err;
    });
  });
}

router.post("/get-status", (req, res, next) => {
  var rows;
  pool.getConnection((err, connection) => {
    if (err) throw err;

    const sql = "SELECT * FROM set_points";

    connection.query(sql, (err, result) => {
      connection.release();
      if (err) throw err;

      rows = JSON.parse(JSON.stringify(result));

      var timeObject = getTime();
      var currentTime =
        timeObject["hours"].toString() +
        timeObject["minutes"].toString() +
        timeObject["seconds"].toString();
      currentTime = parseInt(currentTime);

      var currentTemperature = req.body.temp;

      currentTemperature = parseFloat(currentTemperature);
      var actionId = 1;
      var actionTable = "action";
      var actionCol = "status";
      //Time is between setpoint 1 and 2
      if (currentTime > rows[0]["time1"] && currentTime < rows[1]["time1"]) {


        if (currentTemperature < rows[0]["temp1"]) {
          var status = { status: "ON", dateTime: timeObject["date"] };
          var val = "ON";
          updateTable(actionId, actionTable, actionCol, val);


        } else if (currentTemperature > rows[0]["temp2"]) {


          var status = { status: "OFF", dateTime: timeObject["date"] };
          var val = "OFF";
          updateTable(actionId, actionTable, actionCol, val);


        } else {
          var results;


          pool.getConnection((err, connection) => {
            if (err) throw err;

            const sql = "SELECT * FROM set_points";

            connection.query(sql, (err, result) => {
              connection.release();
              if (err) throw err;

              results = JSON.parse(JSON.stringify(result));
              var statVal = results[0]["status"];
              var status = { status: statVal, dateTime: timeObject["date"] };
              const json = JSON.stringify(status);
              res.send(json);
              
            });
          });
         
        }
      } //Time is between setpoint 2 and 3
      else if (
        currentTime > rows[1]["time1"] &&
        currentTime < rows[2]["time1"]
      ) {
        if (currentTemperature < rows[1]["temp1"]) {
          var status = { status: "ON", dateTime: timeObject["date"] };
        } else if (currentTemperature > rows[1]["temp2"]) {
          var status = { status: "OFF", dateTime: timeObject["date"] };
        } else {
          var status = { status: "Gay", dateTime: timeObject["date"] };
        }
      } //Time is between setpoint 3 and 1
      else if (
        currentTime > rows[2]["time1"] ||
        currentTime < rows[0]["time1"]
      ) {
        if (currentTemperature < rows[2]["temp1"]) {
          var status = { status: "ON", dateTime: timeObject["date"] };
        } else if (currentTemperature > rows[2]["temp2"]) {
          var status = { status: "OFF", dateTime: timeObject["date"] };
        } else {
          var status = { status: "Bay", dateTime: timeObject["date"] };
        }
      }

      const json = JSON.stringify(status);
      res.send(json);
    });
  });

  //Times should already be sorted on the way into db
  //So now just compare time from POST to times in db
});

module.exports = router;
