const fs = require("fs");
const path = require("path");

const log = (message) => {
    const customMessage = `[${new Date()}] ${message}`;

    console.log(customMessage);
    fs.writeFileSync(
        path.resolve(__dirname, "../log.txt"),
        `${customMessage}\n`,
        {
            flag: "a",
        }
    );
};

module.exports = log;
