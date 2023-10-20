export { BaseDirectory, BaseDirectory as Dir } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/primitives';

// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT
/**
 * Access the file system.
 *
 * ## Security
 *
 * This module prevents path traversal, not allowing absolute paths or parent dir components
 * (i.e. "/usr/path/to/file" or "../path/to/file" paths are not allowed).
 * Paths accessed with this API must be relative to one of the {@link BaseDirectory | base directories}
 * so if you need access to arbitrary filesystem paths, you must write such logic on the core layer instead.
 *
 * The API has a scope configuration that forces you to restrict the paths that can be accessed using glob patterns.
 *
 * The scope configuration is an array of glob patterns describing folder paths that are allowed.
 * For instance, this scope configuration only allows accessing files on the
 * *databases* folder of the {@link path.appDataDir | $APPDATA directory}:
 * ```json
 * {
 *   "plugins": {
 *     "fs": {
 *       "scope": ["$APPDATA/databases/*"]
 *     }
 *   }
 * }
 * ```
 *
 * Notice the use of the `$APPDATA` variable. The value is injected at runtime, resolving to the {@link path.appDataDir | app data directory}.
 * The available variables are:
 * {@link path.appConfigDir | `$APPCONFIG`}, {@link path.appDataDir | `$APPDATA`}, {@link path.appLocalDataDir | `$APPLOCALDATA`},
 * {@link path.appCacheDir | `$APPCACHE`}, {@link path.appLogDir | `$APPLOG`},
 * {@link path.audioDir | `$AUDIO`}, {@link path.cacheDir | `$CACHE`}, {@link path.configDir | `$CONFIG`}, {@link path.dataDir | `$DATA`},
 * {@link path.localDataDir | `$LOCALDATA`}, {@link path.desktopDir | `$DESKTOP`}, {@link path.documentDir | `$DOCUMENT`},
 * {@link path.downloadDir | `$DOWNLOAD`}, {@link path.executableDir | `$EXE`}, {@link path.fontDir | `$FONT`}, {@link path.homeDir | `$HOME`},
 * {@link path.pictureDir | `$PICTURE`}, {@link path.publicDir | `$PUBLIC`}, {@link path.runtimeDir | `$RUNTIME`},
 * {@link path.templateDir | `$TEMPLATE`}, {@link path.videoDir | `$VIDEO`}, {@link path.resourceDir | `$RESOURCE`},
 * {@link os.tempdir | `$TEMP`}.
 *
 * Trying to execute any API with a URL not configured on the scope results in a promise rejection due to denied access.
 *
 * Note that this scope applies to **all** APIs on this module.
 *
 * @module
 */
/**
 * Reads a file as an UTF-8 encoded string.
 * @example
 * ```typescript
 * import { readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
 * // Read the text file in the `$APPCONFIG/app.conf` path
 * const contents = await readTextFile('app.conf', { dir: BaseDirectory.AppConfig });
 * ```
 *
 * @since 2.0.0
 */
async function readTextFile(filePath, options = {}) {
    return await invoke("plugin:fs|read_text_file", {
        path: filePath,
        options,
    });
}
/**
 * Reads a file as byte array.
 * @example
 * ```typescript
 * import { readBinaryFile, BaseDirectory } from '@tauri-apps/plugin-fs';
 * // Read the image file in the `$RESOURCEDIR/avatar.png` path
 * const contents = await readBinaryFile('avatar.png', { dir: BaseDirectory.Resource });
 * ```
 *
 * @since 2.0.0
 */
async function readBinaryFile(filePath, options = {}) {
    const arr = await invoke("plugin:fs|read_file", {
        path: filePath,
        options,
    });
    return Uint8Array.from(arr);
}
/**
 * Writes a UTF-8 text file.
 *
 * @returns A promise indicating the success or failure of the operation.
 *
 * @since 2.0.0
 */
async function writeTextFile(path, contents, options) {
    if (typeof options === "object") {
        Object.freeze(options);
    }
    if (typeof path === "object") {
        Object.freeze(path);
    }
    const file = { path: "", contents: "" };
    let fileOptions = options;
    if (typeof path === "string") {
        file.path = path;
    }
    else {
        file.path = path.path;
        file.contents = path.contents;
    }
    if (typeof contents === "string") {
        file.contents = contents !== null && contents !== void 0 ? contents : "";
    }
    else {
        fileOptions = contents;
    }
    return await invoke("plugin:fs|write_file", {
        path: file.path,
        contents: Array.from(new TextEncoder().encode(file.contents)),
        options: fileOptions,
    });
}
/**
 * Writes a byte array content to a file.
 *
 * @returns A promise indicating the success or failure of the operation.
 *
 * @since 2.0.0
 */
async function writeBinaryFile(path, contents, options) {
    if (typeof options === "object") {
        Object.freeze(options);
    }
    if (typeof path === "object") {
        Object.freeze(path);
    }
    const file = { path: "", contents: [] };
    let fileOptions = options;
    if (typeof path === "string") {
        file.path = path;
    }
    else {
        file.path = path.path;
        file.contents = path.contents;
    }
    if (contents && "dir" in contents) {
        fileOptions = contents;
    }
    else if (typeof path === "string") {
        // @ts-expect-error in this case `contents` is always a BinaryFileContents
        file.contents = contents !== null && contents !== void 0 ? contents : [];
    }
    return await invoke("plugin:fs|write_file", {
        path: file.path,
        contents: Array.from(file.contents instanceof ArrayBuffer
            ? new Uint8Array(file.contents)
            : file.contents),
        options: fileOptions,
    });
}
/**
 * List directory files.
 * @example
 * ```typescript
 * import { readDir, BaseDirectory } from '@tauri-apps/plugin-fs';
 * // Reads the `$APPDATA/users` directory recursively
 * const entries = await readDir('users', { dir: BaseDirectory.AppData, recursive: true });
 *
 * function processEntries(entries) {
 *   for (const entry of entries) {
 *     console.log(`Entry: ${entry.path}`);
 *     if (entry.children) {
 *       processEntries(entry.children)
 *     }
 *   }
 * }
 * ```
 *
 * @since 2.0.0
 */
async function readDir(dir, options = {}) {
    return await invoke("plugin:fs|read_dir", {
        path: dir,
        options,
    });
}
/**
 * Creates a directory.
 * If one of the path's parent components doesn't exist
 * and the `recursive` option isn't set to true, the promise will be rejected.
 * @example
 * ```typescript
 * import { createDir, BaseDirectory } from '@tauri-apps/plugin-fs';
 * // Create the `$APPDATA/users` directory
 * await createDir('users', { dir: BaseDirectory.AppData, recursive: true });
 * ```
 *
 * @returns A promise indicating the success or failure of the operation.
 *
 * @since 2.0.0
 */
async function createDir(dir, options = {}) {
    return await invoke("plugin:fs|create_dir", {
        path: dir,
        options,
    });
}
/**
 * Removes a directory.
 * If the directory is not empty and the `recursive` option isn't set to true, the promise will be rejected.
 * @example
 * ```typescript
 * import { removeDir, BaseDirectory } from '@tauri-apps/plugin-fs';
 * // Remove the directory `$APPDATA/users`
 * await removeDir('users', { dir: BaseDirectory.AppData });
 * ```
 *
 * @returns A promise indicating the success or failure of the operation.
 *
 * @since 2.0.0
 */
async function removeDir(dir, options = {}) {
    return await invoke("plugin:fs|remove_dir", {
        path: dir,
        options,
    });
}
/**
 * Copies a file to a destination.
 * @example
 * ```typescript
 * import { copyFile, BaseDirectory } from '@tauri-apps/plugin-fs';
 * // Copy the `$APPCONFIG/app.conf` file to `$APPCONFIG/app.conf.bk`
 * await copyFile('app.conf', 'app.conf.bk', { dir: BaseDirectory.AppConfig });
 * ```
 *
 * @returns A promise indicating the success or failure of the operation.
 *
 * @since 2.0.0
 */
async function copyFile(source, destination, options = {}) {
    return await invoke("plugin:fs|copy_file", {
        source,
        destination,
        options,
    });
}
/**
 * Removes a file.
 * @example
 * ```typescript
 * import { removeFile, BaseDirectory } from '@tauri-apps/plugin-fs';
 * // Remove the `$APPConfig/app.conf` file
 * await removeFile('app.conf', { dir: BaseDirectory.AppConfig });
 * ```
 *
 * @returns A promise indicating the success or failure of the operation.
 *
 * @since 2.0.0
 */
async function removeFile(file, options = {}) {
    return await invoke("plugin:fs|remove_file", {
        path: file,
        options,
    });
}
/**
 * Renames a file.
 * @example
 * ```typescript
 * import { renameFile, BaseDirectory } from '@tauri-apps/plugin-fs';
 * // Rename the `$APPDATA/avatar.png` file
 * await renameFile('avatar.png', 'deleted.png', { dir: BaseDirectory.AppData });
 * ```
 *
 * @returns A promise indicating the success or failure of the operation.
 *
 * @since 2.0.0
 */
async function renameFile(oldPath, newPath, options = {}) {
    return await invoke("plugin:fs|rename_file", {
        oldPath,
        newPath,
        options,
    });
}
/**
 * Check if a path exists.
 * @example
 * ```typescript
 * import { exists, BaseDirectory } from '@tauri-apps/plugin-fs';
 * // Check if the `$APPDATA/avatar.png` file exists
 * await exists('avatar.png', { dir: BaseDirectory.AppData });
 * ```
 *
 * @since 2.0.0
 */
async function exists(path) {
    return await invoke("plugin:fs|exists", { path });
}
/**
 * Returns the metadata for the given path.
 *
 * @since 2.0.0
 */
async function metadata(path) {
    return await invoke("plugin:fs|metadata", {
        path,
    }).then((metadata) => {
        const { accessedAtMs, createdAtMs, modifiedAtMs, ...data } = metadata;
        return {
            accessedAt: new Date(accessedAtMs),
            createdAt: new Date(createdAtMs),
            modifiedAt: new Date(modifiedAtMs),
            ...data,
        };
    });
}

export { copyFile, createDir, exists, metadata, readBinaryFile, readDir, readTextFile, removeDir, removeFile, renameFile, writeBinaryFile, writeTextFile as writeFile, writeTextFile };
//# sourceMappingURL=index.mjs.map
