const childProcess = require("child_process");
const api = childProcess.execSync;

const log = require("./log");

let cli = {};

cli.run = (cmd, args) => {
    try {
        log(`$ ${cmd}`);

        return api(cmd, args);
    } catch (err) {
        log(err.message);
    }
};

module.exports = cli;
