const _fs = require("fs-extra");
const path = require("path");
const log = require("./log");

let fs = {};

fs.native = _fs;

fs.exists = (dirent) => {
    return fs.native.existsSync(dirent);
};

fs.isDir = (dirent) => {
    return fs.exists(dirent) && fs.native.statSync(dirent).isDirectory();
};

fs.mkDir = (path, args) => {
    return fs.native.mkdirSync(path, args);
};

fs.getPathEntries = (dir, options = {}) => {
    const defaults = {
        exclude: [],
    };

    const config = { ...defaults, ...options };

    const dirEntries = fs.native.readdirSync(dir);

    let entries = [];

    dirEntries.map((dirent) => {
        if (config.exclude.includes(dirent)) {
            return;
        }

        const resolvedDirent = path.resolve(dir, dirent);

        if (fs.isDir(resolvedDirent)) {
            const subEntries = fs.getPathEntries(resolvedDirent, options);

            entries = entries.concat(subEntries);
        } else {
            entries.push(resolvedDirent);
        }
    });

    return entries;
};

fs.getDetailedEntries = (rootPath, entries, config) => {
    const detailedEntries = entries.map((entry) => {
        let entryData = {
            fullpath: entry,
            relpath: path.relative(rootPath, entry),
        };

        const fileStats = fs.native.statSync(entry);

        if (config.compareSize) {
            const size = fileStats.size;
            entryData.size = size;
        }

        if (config.compareContent) {
            const fileContents = fs.native.readFileSync(entry).toString();
            entryData.content = fileContents;
        }

        if (config.compareDate) {
            entryData.date = fileStats.ctime;
        }

        return entryData;
    });

    return detailedEntries;
};

fs.compare = (origin, dest, options = {}) => {
    const defaults = {
        compareDate: true,
        compareSize: true,
        compareContent: true,
    };

    const config = { ...defaults, ...options };

    const originEntries = fs.getPathEntries(origin, options);

    const destEntries = fs.getPathEntries(dest, options);

    let data = {
        originPath: origin,
        destPath: dest,
        origin: [],
        dest: [],
        diff: {
            moved: [],
            added: [],
            removed: [],
            changes: [],
        },
        changed: false,
    };

    data.origin = fs.getDetailedEntries(origin, originEntries, config);
    data.dest = fs.getDetailedEntries(dest, destEntries, config);

    // added
    data.origin.map((entryData) => {
        let fileFound = data.dest.find((destEntryData) => {
            return entryData.relpath === destEntryData.relpath;
        });

        if (!fileFound) {
            data.diff.added.push({
                origin: entryData,
                dest: {
                    ...entryData,
                    fullpath: path.resolve(dest, entryData.relpath),
                },
            });
        }
    });

    // removed
    data.dest.map((entryData) => {
        let fileFound = data.origin.find((originEntryData) => {
            return entryData.relpath === originEntryData.relpath;
        });

        if (!fileFound) {
            data.diff.removed.push(entryData);
        }
    });

    // changed
    data.origin.map((entryData) => {
        let fileFound = data.dest.find((destEntryData) => {
            return entryData.relpath === destEntryData.relpath;
        });

        if (fileFound) {
            if (config.compareDate) {
                if (entryData.date.getTime() !== fileFound.date.getTime()) {
                    data.diff.changes.push({
                        type: "date",
                        origin: entryData,
                        dest: fileFound,
                    });
                }
            } else if (config.compareSize) {
                if (entryData.size !== fileFound.size) {
                    data.diff.changes.push({
                        type: "size",
                        origin: entryData,
                        dest: fileFound,
                    });
                }
            } else if (config.compareContent) {
                if (entryData.content !== fileFound.content) {
                    data.diff.changes.push({
                        type: "content",
                        origin: entryData,
                        dest: fileFound,
                    });
                }
            }
        }
    });

    // moved
    if (config.compareContent) {
        data.diff.added.map((addedEntry, addedIndex) => {
            let removedIndex;

            const removedEntry = data.diff.removed.find(
                (removedEntry, _removedIndex) => {
                    removedIndex = _removedIndex;
                    return addedEntry.content === removedEntry.content;
                }
            );

            if (removedEntry) {
                data.diff.moved.push({
                    origin: removedEntry,
                    dest: {
                        ...addedEntry,
                        fullpath: path.resolve(dest, addedEntry.relpath),
                    },
                });

                data.diff.added.splice(addedIndex, 1);
                data.diff.removed.splice(removedIndex, 1);
            }
        });
    }

    data.changed = Boolean(
        data.diff.added.length ||
            data.diff.removed.length ||
            data.diff.changes.length ||
            data.diff.moved.length
    );

    return data;
};

fs.move = (origin, dest, options = {}) => {
    const defaults = {
        createDestPath: true,
    };

    const config = { ...defaults, ...options };

    if (config.createDestPath) {
        const destPath = path.dirname(dest);

        if (!fs.isDir(destPath)) {
            fs.mkDir(destPath, {
                recursive: true,
            });
        }
    }

    fs.native.renameSync(origin, dest);
};

fs.copy = (origin, dest, options = {}) => {
    const defaults = {
        createDestPath: true,
    };

    const config = { ...defaults, ...options };

    if (config.createDestPath) {
        const destPath = path.dirname(dest);

        if (!fs.isDir(destPath)) {
            fs.mkDir(destPath, {
                recursive: true,
            });
        }
    }

    fs.native.copyFileSync(origin, dest);
};

fs.getFolderTree = (dirPath, entry = "", level = 0, options = {}) => {
    const defaults = {
        exclude: [],
    };

    const config = { ...defaults, ...options };

    const entries = fs.native.readdirSync(dirPath);
    const dirEntries = entries.filter((entry) => {
        const resolvedEntry = path.resolve(dirPath, entry);

        return fs.isDir(resolvedEntry);
    });

    let tree = {
        path: dirPath,
        isEmpty: false,
        entry,
        subfolders: [],
        level,
        numEntries: entries.length,
        numDirEntries: dirEntries.length,
    };

    tree.isEmpty = entries.length === 0;

    dirEntries.map((dirEntry) => {
        if (config.exclude.includes(dirEntry)) {
            return;
        }

        const resolvedEntry = path.resolve(dirPath, dirEntry);
        const subtree = fs.getFolderTree(
            resolvedEntry,
            dirEntry,
            level + 1,
            config
        );
        tree.subfolders.push(subtree);
    });

    return tree;
};

fs.markFolderTreeToDelete = (folderTree, options = {}) => {
    const defaults = {
        exclude: [],
    };

    const config = { ...defaults, ...options };

    folderTree.subfolders = folderTree.subfolders.map((subfolder) => {
        return fs.markFolderTreeToDelete(subfolder, config);
    });

    folderTree.markedToDelete = false;

    if (folderTree.level !== 0 && !config.exclude.includes(folderTree.entry)) {
        if (folderTree.isEmpty) {
            folderTree.markedToDelete = true;
        } else if (folderTree.numEntries === folderTree.numDirEntries) {
            const allSubFoldersMarkedToDelete = folderTree.subfolders.every(
                (subfolder) => {
                    return subfolder.markedToDelete;
                }
            );

            if (allSubFoldersMarkedToDelete) {
                folderTree.markedToDelete = true;
            }
        }
    }

    return folderTree;
};

fs.getFoldersMarkedForDelete = (folderTree, folders = []) => {
    let folder = { ...folderTree };

    delete folder.subfolders;

    if (folder.markedToDelete) {
        folders.push(folder);
    }

    folderTree.subfolders.map((subfolder) => {
        folders = fs.getFoldersMarkedForDelete(subfolder, folders);
    });

    folders = folders.sort((a, b) => {
        if (a.level > b.level) {
            return -1;
        } else if (a.level < b.level) {
            return 1;
        }

        return 0;
    });

    return folders;
};

fs.getEmptyFolders = (dirPath, options = {}) => {
    const folderTree = fs.getFolderTree(dirPath, "", 0, options);
    const markedFolderTree = fs.markFolderTreeToDelete(folderTree);
    const foldersMarkedByDelete =
        fs.getFoldersMarkedForDelete(markedFolderTree);

    return foldersMarkedByDelete;
};

fs.computeCompare = (resultCompare, options = {}) => {
    const defaults = {
        dry: false,
    };

    const config = { ...defaults, ...options };

    if (resultCompare.changed) {
        resultCompare.diff.moved.map((movedEntry) => {
            const originFile = movedEntry.origin.fullpath;
            const destFile = movedEntry.dest.fullpath;

            log(`[Moved] Move from '${originFile}' to '${destFile}'.`);

            if (!config.dry) {
                fs.move(originFile, destFile);
            }
        });

        resultCompare.diff.added.map((addedEntry) => {
            const originFile = addedEntry.origin.fullpath;
            const destFile = addedEntry.dest.fullpath;

            log(`[Added] Copy from '${originFile}' to '${destFile}'.`);

            if (!config.dry) {
                fs.copy(originFile, destFile);
            }
        });

        resultCompare.diff.removed.map((removedEntry) => {
            const fileToRemove = removedEntry.fullpath;

            log(`[Removed] Remove file '${fileToRemove}'.`);

            if (!config.dry) {
                fs.native.unlink(fileToRemove);
            }
        });

        resultCompare.diff.changes.map((changedEntry) => {
            const originFile = changedEntry.origin.fullpath;
            const destFile = changedEntry.dest.fullpath;

            log(
                `[Changes][${changedEntry.type}] Copy from '${originFile}' to '${destFile}'.`
            );

            if (!config.dry) {
                fs.copy(originFile, destFile);
            }
        });

        const emptyFolders = fs.getEmptyFolders(resultCompare.destPath, config);

        emptyFolders.map((emptyFolder) => {
            log(
                `[Delete empty folder][level:${emptyFolder.level}] Delete '${emptyFolder.path}'.`
            );

            if (!config.dry) {
                fs.native.rmdirSync(emptyFolder.path);
            }
        });
    }
};

fs.sync = (origin, dest, options = {}) => {
    const defaults = {
        exclude: [".git", "node_modules"],
    };

    const config = { ...defaults, ...options };

    const compareResult = fs.compare(origin, dest, config);

    fs.computeCompare(compareResult, config);
};

module.exports = fs;
