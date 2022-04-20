const cli = require("./cli");

let git = {};

let workingDir;

git.setWorkingDirectory = (path) => {
    workingDir = path;
};

git.init = () => {
    cli.run(`git init`, {
        cwd: workingDir,
    });
};

git.config = (key, value, global = false) => {
    let cmd = `git config ${key} ${value}`;

    if (global) {
        cmd += " --global";
    }

    cli.run(cmd, {
        cwd: workingDir,
    });
};

git.checkout = (options) => {
    let cmd = "git checkout";

    if (options.branch) {
        cmd += ` -b ${options.branch}`;
    }

    cli.run(cmd, {
        cwd: workingDir,
    });
};

git.commit = (options) => {
    let cmd = "git commit";

    if (options.message) {
        cmd += ` -m "${options.message}"`;
    }

    if (options.allowEmpty) {
        cmd += ` --allow-empty`;
    }

    cli.run(cmd, {
        cwd: workingDir,
    });
};

git.tag = (name) => {
    const cmd = `git tag ${name}`;

    cli.run(cmd, {
        cwd: workingDir,
    });
};

git.rm = (options) => {
    let cmd = "git rm";

    if (options.force) {
        cmd += ` -f`;
    }

    if (options.recursive) {
        cmd += ` -r`;
    }

    cmd += ` ${options.glob}`;

    cli.run(cmd, {
        cwd: workingDir,
    });
};

git.clean = (options) => {
    let cmd = "git clean";

    if (options.force) {
        cmd += ` -f`;
    }

    if (options.recurseDirectories) {
        cmd += ` -d`;
    }

    if (options.noStandardIgnoreRules) {
        cmd += ` -x`;
    }

    cli.run(cmd, {
        cwd: workingDir,
    });
};

git.add = (glob) => {
    cli.run(`git add ${glob}`, {
        cwd: workingDir,
    });
};

module.exports = git;
