# Autosave

A **CLI** to autosave directories in git repositories.

The main idea is use **Git**, which is a **VCS** (Version Control System) and that is used generally to manage software versioning, as a file history manager.

Keeping file versions like in **Google Docs** that you can access the history of the files you edited.

## Requirements

-   **Node.js** (I used the version 16 in this one).
-   **Git** (The version I use at this moment is 2.35.3, I believe you should be fine whatever version you have).

## Installation

```bash
$ yarn # or
$ npm install # then
$ npm link
```

\* Yarn or NPM will install the dependencies of this project.

\* `npm link` will create a shortcut in your system that links this cli command to run anywhere you wish. The name of cli command is `autosave`.

## Usage

```
Usage: autosave [options] <path> <repo>

Autosave changes in a directory in a git repository.

Arguments:
  path                      Path to watch changes.
  repo                      Repository name to be created.

Options:
  -V, --version             output the version number
  -d, --duration <seconds>  Time in seconds to check if files changed.
                            (default: 60)
  -h, --help                display help for command

```

## Notes

The command comes by default with verbose mode (more verbose the better!). The content that is showed as output in command line is mirrored in a `log.txt` that you will find whenever you run this command. You can run this command anywhere you have permission in your system.

## License

[MIT](https://opensource.org/licenses/MIT)

---

Copyright &copy; 2022 Lucas Vendramini
