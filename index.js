#!/usr/bin/env node

const path = require("path");

const { program } = require("commander");

const package = require("./package");

const log = require("./lib/log");
const fs = require("./lib/fs");
const git = require("./lib/git");

program
    .name("autosave")
    .description("Autosave changes in a directory in a git repository.")
    .version(package.version)
    .option(
        "-d, --duration <seconds>",
        "Time in seconds to check if files changed.",
        60
    )
    .argument("<path>", "Path to watch changes.")
    .argument(
        "<repo>",
        "Repository name to be created.",
        (value, previousValue) => {
            if (value.includes("/") || value.includes("\\")) {
                console.error(
                    "error: repository name does not support path separators."
                );
                process.exit(1);
            }
        }
    );

program.parse();

const options = program.opts();

log(process.argv.join(" "));
log(JSON.stringify(options, null, 4));

const duration = 1000 * options.duration;

const repositoriesFolder = "repos";
const inputDir = program.args[0];
const outputDir = program.args[1];

let changeLock = false;

const resolvedInputDir = path.resolve(inputDir);
const resolvedOutputDir = path.resolve(
    __dirname,
    repositoriesFolder,
    outputDir
);

if (!fs.exists(resolvedInputDir)) {
    throw new Error(
        `Input directory '${resolvedInputDir}' ('${inputDir}') could not be resolved.`
    );
}

log(
    JSON.stringify(
        {
            resolvedInputDir,
            resolvedOutputDir,
        },
        null,
        4
    )
);

git.setWorkingDirectory(resolvedOutputDir);

if (!fs.exists(resolvedOutputDir)) {
    fs.mkDir(resolvedOutputDir, {
        recursive: true,
    });
}

if (!fs.exists(path.resolve(resolvedOutputDir, ".git"))) {
    git.init();
    git.config("user.name", "autosave");
    git.config("user.email", "autosave@localhost");

    git.checkout({
        branch: "autosave",
    });

    git.commit({
        message: "blank slate",
        allowEmpty: true,
    });

    git.tag("blank-slate");
}

function checkChanges() {
    const compareConfig = {
        exclude: [".git", "node_modules"],
    };

    if (!changeLock) {
        log("Comparing files...");
    }

    const resultCompare = fs.compare(
        resolvedInputDir,
        resolvedOutputDir,
        compareConfig
    );

    if (!changeLock) {
        log("Comparing files done!");
    }

    if (!resultCompare.changed) {
        if (!changeLock) {
            log(`Checking folders...`);
            log("Folders already synced, do nothing.");
            changeLock = true;
        }
        return;
    }

    changeLock = false;

    log(`Checking folders...`);
    log(`Syncing '${resolvedInputDir}' to ${resolvedOutputDir}...`);

    fs.computeCompare(resultCompare, compareConfig);

    log("Sync of folders done!");

    git.add(".");
    git.commit({
        message: `autosave #${Math.floor(new Date().getTime() / duration)}`,
    });
}

checkChanges();

setInterval(() => {
    checkChanges();
}, duration);
