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
router.get("/set-points", function(req, res, next) {
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

            var strHrs = timeObject["hours"].toString();
            if (strHrs.length == 1) strHrs = "0" + strHrs;

            var strMin = timeObject["minutes"].toString();
            if (strMin.length == 1) strMin = "0" + strMin;

            var strSec = timeObject["seconds"].toString();
            if (strSec.length == 1) strSec = "0" + strSec;

            var currentTime = strHrs + strMin + strSec;
            currentTime = parseInt(currentTime);

            var currentTemperature = req.body.temp;

            currentTemperature = parseFloat(currentTemperature);
            var actionId = 1;
            var actionTable = "action";
            var actionCol = "status";
            //Time is between setpoint 1 and 2
            if (currentTime > rows[0]["time1"] && currentTime < rows[1]["time1"]) {
                if (currentTemperature < rows[0]["temp1"]) {
                    var status = {
                        status: "ON",
                        dateTime: timeObject["date"],
                        temp1: rows[0]["temp1"],
                        temp2: rows[0]["temp2"],
                    };
                    var val = "ON";

                    updateTable(actionId, actionTable, actionCol, val);
                    actionCol = "time";
                    val = currentTime;
                    updateTable(actionId, actionTable, actionCol, val);

                    const json = JSON.stringify(status);
                    res.send(json);
                } else if (currentTemperature > rows[0]["temp2"]) {
                    var status = {
                        status: "OFF",
                        dateTime: timeObject["date"],
                        temp1: rows[0]["temp1"],
                        temp2: rows[0]["temp2"],
                    };
                    var val = "OFF";

                    updateTable(actionId, actionTable, actionCol, val);
                    actionCol = "time";
                    val = currentTime;
                    updateTable(actionId, actionTable, actionCol, val);

                    const json = JSON.stringify(status);
                    res.send(json);
                } else {
                    pool.getConnection((err, connection) => {
                        if (err) throw err;

                        const sql = "SELECT * FROM action WHERE id = 1";

                        connection.query(sql, (err, result) => {
                            connection.release();
                            if (err) throw err;

                            var results = JSON.parse(JSON.stringify(result));
                            var statVal = results[0]["status"];
                            var status = {
                                status: statVal,
                                dateTime: timeObject["date"],
                                temp1: rows[0]["temp1"],
                                temp2: rows[0]["temp2"],
                            };
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
                    var status = {
                        status: "ON",
                        dateTime: timeObject["date"],
                        temp1: rows[1]["temp1"],
                        temp2: rows[1]["temp2"],
                    };
                    var val = "ON";

                    updateTable(actionId, actionTable, actionCol, val);
                    actionCol = "time";
                    val = currentTime;
                    updateTable(actionId, actionTable, actionCol, val);

                    const json = JSON.stringify(status);
                    res.send(json);
                } else if (currentTemperature > rows[1]["temp2"]) {
                    var status = {
                        status: "OFF",
                        dateTime: timeObject["date"],
                        temp1: rows[1]["temp1"],
                        temp2: rows[1]["temp2"],
                    };
                    var val = "OFF";

                    updateTable(actionId, actionTable, actionCol, val);
                    actionCol = "time";
                    val = currentTime;
                    updateTable(actionId, actionTable, actionCol, val);

                    const json = JSON.stringify(status);
                    res.send(json);
                } else {
                    pool.getConnection((err, connection) => {
                        if (err) throw err;

                        const sql = "SELECT * FROM action WHERE id = 1";

                        connection.query(sql, (err, result) => {
                            connection.release();
                            if (err) throw err;

                            var results = JSON.parse(JSON.stringify(result));
                            var statVal = results[0]["status"];
                            var status = {
                                status: statVal,
                                dateTime: timeObject["date"],
                                temp1: rows[1]["temp1"],
                                temp2: rows[1]["temp2"],
                            };
                            const json = JSON.stringify(status);
                            res.send(json);
                        });
                    });
                }
            } //Time is between setpoint 3 and 1
            else if (
                currentTime > rows[2]["time1"] ||
                currentTime < rows[0]["time1"]
            ) {
                if (currentTemperature < rows[2]["temp1"]) {
                    var status = {
                        status: "ON",
                        dateTime: timeObject["date"],
                        temp1: rows[2]["temp1"],
                        temp2: rows[2]["temp2"],
                    };
                    var val = "ON";

                    updateTable(actionId, actionTable, actionCol, val);
                    actionCol = "time";
                    val = currentTime;
                    updateTable(actionId, actionTable, actionCol, val);

                    const json = JSON.stringify(status);
                    res.send(json);
                } else if (currentTemperature > rows[2]["temp2"]) {
                    var status = {
                        status: "OFF",
                        dateTime: timeObject["date"],
                        temp1: rows[2]["temp1"],
                        temp2: rows[2]["temp2"],
                    };
                    var val = "OFF";

                    updateTable(actionId, actionTable, actionCol, val);
                    actionCol = "time";
                    val = currentTime;
                    updateTable(actionId, actionTable, actionCol, val);

                    const json = JSON.stringify(status);
                    res.send(json);
                } else {
                    pool.getConnection((err, connection) => {
                        if (err) throw err;

                        const sql = "SELECT * FROM action WHERE id = 1";

                        connection.query(sql, (err, result) => {
                            connection.release();
                            if (err) throw err;

                            var results = JSON.parse(JSON.stringify(result));
                            var statVal = results[0]["status"];
                            var status = {
                                status: statVal,
                                dateTime: timeObject["date"],
                                temp1: rows[2]["temp1"],
                                temp2: rows[2]["temp2"],
                            };
                            const json = JSON.stringify(status);
                            res.send(json);
                        });
                    });
                }
            }
        });
    });
});

router.get("/", (req, res, next) => {
    res.render("index", {
        message: "You must fill in ALL fields.  Use 24-hour time format. ",
    });
});

router.post("/", (req, res, next) => {
    var message;
    var time1 = req.body.time1;
    var time2 = req.body.time2;
    var time3 = req.body.time3;
    time1.trim();
    time2.trim();
    time3.trim();

    var temp1 = req.body.temp1;
    var temp2 = req.body.temp2;

    var temp3 = req.body.temp3;
    var temp4 = req.body.temp4;

    var temp5 = req.body.temp5;
    var temp6 = req.body.temp6;

    temp1.trim();
    temp2.trim();
    temp3.trim();
    temp4.trim();
    temp5.trim();
    temp6.trim();

    if (time1.length > 5 || time2.length > 5 || time3.length > 5 || time1.length < 4 || time2.length < 4 || time3.length < 4) {

        message = "You entered bad time values. Time values must be at least 4 characters or a maximum of 5. Examples -- 4-char: 01:00, 5-char: 14:00"

    } else if (!temp1 || !temp2 || !temp3 || !temp4 || !temp5 || !temp6 || !time1 || !time2 || !time3) {

        message = "You left fields blank. All fields are required, try again..."

    } else {
        var myError = 0;
        time1 = time1.split(":");
        if (
            time1[0].length > 2 ||
            time1[0].length < 1 ||
            isNaN(parseInt(time1[0])) ||
            parseInt(time1[0]) > 23
        ) myError = 1;

        if (time1[1].length > 2 || time1[1].length < 1 || isNaN(parseInt(time1[1])) || parseInt(time1[1]) > 59)
            myError = 1;

        time1 = time1[0] + time1[1] + "00";

        time2 = time2.split(":");
        if (time2[0].length > 2 || time2[0].length < 1 || isNaN(parseInt(time2[0])) || parseInt(time2[0]) > 23)
            myError = 1;

        if (time2[1].length > 2 || time2[1].length < 1 || isNaN(parseInt(time2[1])) || parseInt(time2[1]) > 59)
            myError = 1;

        time2 = time2[0] + time2[1] + "00";

        time3 = time3.split(":");
        if (time3[0].length > 2 || time3[0].length < 1 || isNaN(parseInt(time3[0])) || parseInt(time3[0]) > 23)
            myError = 1;

        if (time3[1].length > 2 || time3[1].length < 1 || isNaN(parseInt(time3[1])) || parseInt(time3[1]) > 59)
            myError = 1;

        time3 = time3[0] + time3[1] + "00";

        time1 = parseInt(time1);
        time2 = parseInt(time2);
        time3 = parseInt(time3);

        if (isNaN(time1) || isNaN(time2) || isNaN(time3) || isNaN(parseFloat(temp1)) || isNaN(parseFloat(temp2)) || isNaN(parseFloat(temp3)) || isNaN(parseFloat(temp4)) || isNaN(parseFloat(temp5)) || isNaN(parseFloat(temp6))) {

            message = "You're inputting junk values...You know this is free software right??? ;)"

        } else if (myError == 1) {

            message = "Bad time values. Try again :["

        } else {

            if (parseFloat(temp1) < parseFloat(temp2))
                var sp1 = { time: time1, temp1: temp1, temp2: temp2 };
            else var sp1 = { time: time1, temp1: temp2, temp2: temp1 };

            if (parseFloat(temp3) < parseFloat(temp4))
                var sp2 = { time: time2, temp1: temp3, temp2: temp4 };
            else var sp2 = { time: time2, temp1: temp4, temp2: temp3 };

            if (parseFloat(temp5) < parseFloat(temp6))
                var sp3 = { time: time3, temp1: temp5, temp2: temp6 };
            else var sp3 = { time: time3, temp1: temp6, temp2: temp5 };

            var spArr = [sp1, sp2, sp3];

            spArr.sort((a, b) => (a.time > b.time ? 1 : -1));

            var spCount = 1;
            spArr.map((object, index) => {
                pool.getConnection((err, connection) => {
                    if (err) throw err;

                    const sql =
                        "UPDATE set_points SET time1 = " +
                        object["time"] +
                        ", temp1 = " +
                        object["temp1"] +
                        ", temp2 = " +
                        object["temp2"] +
                        " WHERE id = " +
                        spCount;

                    connection.query(sql, (err, result) => {
                        connection.release();
                        if (err) throw err;


                        message = "Success! Your set points have been updated :)"

                    });
                    spCount++;
                });
            });
        }
    }
    res.render("index", {
        mes: message
    });
});

module.exports = router;