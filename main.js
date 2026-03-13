const fs = require("fs");

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {

    function timeToSeconds(time) {
        let parts = time.trim().split(" ");
        let timeParts = parts[0].split(":");
        let hours = parseInt(timeParts[0]);
        let minutes = parseInt(timeParts[1]);
        let seconds = parseInt(timeParts[2]);
        let period = parts[1];

        if (period === "pm" && hours !== 12) hours += 12;
        if (period === "am" && hours === 12) hours = 0;

        return hours * 3600 + minutes * 60 + seconds;
    }

    let totalSeconds = timeToSeconds(endTime) - timeToSeconds(startTime);

    let h = Math.floor(totalSeconds / 3600);
    let m = Math.floor((totalSeconds % 3600) / 60);
    let s = totalSeconds % 60;

    let mm = m < 10 ? "0" + m : "" + m;
    let ss = s < 10 ? "0" + s : "" + s;

    return h + ":" + mm + ":" + ss;
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {

    function timeToSeconds(time) {
        let parts = time.trim().split(" ");
        let timeParts = parts[0].split(":");
        let hours = parseInt(timeParts[0]);
        let minutes = parseInt(timeParts[1]);
        let seconds = parseInt(timeParts[2]);
        let period = parts[1];

        if (period === "pm" && hours !== 12) hours += 12;
        if (period === "am" && hours === 12) hours = 0;

        return hours * 3600 + minutes * 60 + seconds;
    }

    function secondsToTime(totalSeconds) {
        let h = Math.floor(totalSeconds / 3600);
        let m = Math.floor((totalSeconds % 3600) / 60);
        let s = totalSeconds % 60;
        let mm = m < 10 ? "0" + m : "" + m;
        let ss = s < 10 ? "0" + s : "" + s;
        return h + ":" + mm + ":" + ss;
    }

    let start = timeToSeconds(startTime);
    let end = timeToSeconds(endTime);
    let deliveryStart = 8 * 3600;   
    let deliveryEnd = 22 * 3600;    

    let idleBefore = 0;
    let idleAfter = 0;

    if (start < deliveryStart) idleBefore = deliveryStart - start;
    if (end > deliveryEnd) idleAfter = end - deliveryEnd;

    return secondsToTime(idleBefore + idleAfter);
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {

    function timeToSeconds(time) {
        let parts = time.trim().split(":");
        let hours = parseInt(parts[0]);
        let minutes = parseInt(parts[1]);
        let seconds = parseInt(parts[2]);
        return hours * 3600 + minutes * 60 + seconds;
    }

    function secondsToTime(totalSeconds) {
        let h = Math.floor(totalSeconds / 3600);
        let m = Math.floor((totalSeconds % 3600) / 60);
        let s = totalSeconds % 60;
        let mm = m < 10 ? "0" + m : "" + m;
        let ss = s < 10 ? "0" + s : "" + s;
        return h + ":" + mm + ":" + ss;
    }

    let total = timeToSeconds(shiftDuration) - timeToSeconds(idleTime);
    return secondsToTime(total);
}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {

    function timeToSeconds(time) {
        let parts = time.trim().split(":");
        let hours = parseInt(parts[0]);
        let minutes = parseInt(parts[1]);
        let seconds = parseInt(parts[2]);
        return hours * 3600 + minutes * 60 + seconds;
    }

    let dateParts = date.split("-");
    let month = parseInt(dateParts[1]);
    let day = parseInt(dateParts[2]);
    let year = parseInt(dateParts[0]);

    let isEid = (year === 2025 && month === 4 && day >= 10 && day <= 30);

    let quota = isEid ? 6 * 3600 : 8 * 3600 + 24 * 60;
    let active = timeToSeconds(activeTime);

    return active >= quota;
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
     let content = fs.readFileSync(textFile, "utf-8");
    let lines = content.trim().split("\n");

    for (let i = 0; i < lines.length; i++) {
        let cols = lines[i].split(",");
        if (cols[0].trim() === shiftObj.driverID && cols[2].trim() === shiftObj.date) {
            return {};
        }
    }

    let shiftDuration = getShiftDuration(shiftObj.startTime, shiftObj.endTime);
    let idleTime = getIdleTime(shiftObj.startTime, shiftObj.endTime);
    let activeTime = getActiveTime(shiftDuration, idleTime);
    let quota = metQuota(shiftObj.date, activeTime);

    let newRecord = {
        driverID: shiftObj.driverID,
        driverName: shiftObj.driverName,
        date: shiftObj.date,
        startTime: shiftObj.startTime,
        endTime: shiftObj.endTime,
        shiftDuration: shiftDuration,
        idleTime: idleTime,
        activeTime: activeTime,
        metQuota: quota,
        hasBonus: false
    };

    let newLine = `${newRecord.driverID},${newRecord.driverName},${newRecord.date},${newRecord.startTime},${newRecord.endTime},${newRecord.shiftDuration},${newRecord.idleTime},${newRecord.activeTime},${newRecord.metQuota},${newRecord.hasBonus}`;

    let lastIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].split(",")[0].trim() === shiftObj.driverID) {
            lastIndex = i;
        }
    }

    if (lastIndex === -1) {
        lines.push(newLine);
    } else {
        lines.splice(lastIndex + 1, 0, newLine);
    }

    fs.writeFileSync(textFile, lines.join("\n"), "utf-8");
    return newRecord;
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    let content = fs.readFileSync(textFile, "utf-8");
    let lines = content.trim().split("\n");

    for (let i = 0; i < lines.length; i++) {
        let cols = lines[i].split(",");
        if (cols[0].trim() === driverID && cols[2].trim() === date) {
            cols[9] = newValue;
            lines[i] = cols.join(",");
        }
    }

    fs.writeFileSync(textFile, lines.join("\n"), "utf-8");
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    let content = fs.readFileSync(textFile, "utf-8");
    let lines = content.trim().split("\n");

    let driverExists = false;
    let count = 0;

    for (let i = 0; i < lines.length; i++) {
        let cols = lines[i].split(",");
        if (cols[0].trim() === driverID) {
            driverExists = true;
            let recordMonth = parseInt(cols[2].trim().split("-")[1]);
            if (recordMonth === parseInt(month)) {
                if (cols[9].trim() === "true") {
                    count++;
                }
            }
        }
    }

    if (!driverExists) return -1;
    return count;
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
     let content = fs.readFileSync(textFile, "utf-8");
    let lines = content.trim().split("\n");

    let totalSeconds = 0;

    for (let i = 0; i < lines.length; i++) {
        let cols = lines[i].split(",");
        if (cols[0].trim() === driverID) {
            let recordMonth = parseInt(cols[2].trim().split("-")[1]);
            if (recordMonth === month) {
                let parts = cols[7].trim().split(":");
                let h = parseInt(parts[0]);
                let m = parseInt(parts[1]);
                let s = parseInt(parts[2]);
                totalSeconds += h * 3600 + m * 60 + s;
            }
        }
    }

    let h = Math.floor(totalSeconds / 3600);
    let m = Math.floor((totalSeconds % 3600) / 60);
    let s = totalSeconds % 60;

    let hh = h < 10 ? "0" + h : "" + h;
    let mm = m < 10 ? "0" + m : "" + m;
    let ss = s < 10 ? "0" + s : "" + s;

    return hh + ":" + mm + ":" + ss;
}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    let shiftContent = fs.readFileSync(textFile, "utf-8");
    let shiftLines = shiftContent.trim().split("\n");

    let rateContent = fs.readFileSync(rateFile, "utf-8");
    let rateLines = rateContent.trim().split("\n");

    let dayOff = "";
    for (let i = 0; i < rateLines.length; i++) {
        let cols = rateLines[i].split(",");
        if (cols[0].trim() === driverID) {
            dayOff = cols[1].trim();
        }
    }

    let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let totalSeconds = 0;

    for (let i = 0; i < shiftLines.length; i++) {
        let cols = shiftLines[i].split(",");
        if (cols[0].trim() === driverID) {
            let recordMonth = parseInt(cols[2].trim().split("-")[1]);
            if (recordMonth === month) {
                let date = new Date(cols[2].trim());
                let dayName = days[date.getDay()];

                if (dayName === dayOff) continue;

                let dateParts = cols[2].trim().split("-");
                let year = parseInt(dateParts[0]);
                let mon = parseInt(dateParts[1]);
                let day = parseInt(dateParts[2]);

                let isEid = (year === 2025 && mon === 4 && day >= 10 && day <= 30);
                let quota = isEid ? 6 * 3600 : 8 * 3600 + 24 * 60;
                totalSeconds += quota;
            }
        }
    }

    totalSeconds -= bonusCount * 2 * 3600;

    let h = Math.floor(totalSeconds / 3600);
    let m = Math.floor((totalSeconds % 3600) / 60);
    let s = totalSeconds % 60;

    let hh = h < 10 ? "0" + h : "" + h;
    let mm = m < 10 ? "0" + m : "" + m;
    let ss = s < 10 ? "0" + s : "" + s;

    return hh + ":" + mm + ":" + ss;
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    let rateContent = fs.readFileSync(rateFile, "utf-8");
    let rateLines = rateContent.trim().split("\n");

    let basePay = 0;
    let tier = 0;

    for (let i = 0; i < rateLines.length; i++) {
        let cols = rateLines[i].split(",");
        if (cols[0].trim() === driverID) {
            basePay = parseInt(cols[2].trim());
            tier = parseInt(cols[3].trim());
        }
    }

    function timeToSeconds(time) {
        let parts = time.trim().split(":");
        let h = parseInt(parts[0]);
        let m = parseInt(parts[1]);
        let s = parseInt(parts[2]);
        return h * 3600 + m * 60 + s;
    }

    let actualSeconds = timeToSeconds(actualHours);
    let requiredSeconds = timeToSeconds(requiredHours);

    if (actualSeconds >= requiredSeconds) return basePay;

    let missingSeconds = requiredSeconds - actualSeconds;

    let allowedHours = 0;
    if (tier === 1) allowedHours = 50;
    else if (tier === 2) allowedHours = 20;
    else if (tier === 3) allowedHours = 10;
    else if (tier === 4) allowedHours = 3;

    let missingHours = missingSeconds / 3600;
    let billableHours = missingHours - allowedHours;

    if (billableHours <= 0) return basePay;

    billableHours = Math.floor(billableHours);

    let deductionRatePerHour = Math.floor(basePay / 185);
    let salaryDeduction = billableHours * deductionRatePerHour;

    return basePay - salaryDeduction;
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
