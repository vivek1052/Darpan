require('dotenv').config();
const cds = require(`@sap/cds`);
const path = require(`path`);
const md5 = require(`md5-file`);
const fs = require(`fs`);
const { getDirRecursive, getFilesMetadata, transformData, fileOperations } = require(`./utils`);
const { Admin } = require(`./userRoles`);
const config = require(`../config.json`);

config.importPath = path.resolve(config.importPath);

async function importAsync() {
    debugger;

    const folder = process.argv[2];

    const userName = process.argv[3];

    const _srv = await cds.connect.to('db');

    const _tx = _srv.tx({
        user: new Admin(userName)
    });

    const _nestedFolders = getDirRecursive(folder || `/`);

    _nestedFolders.sort((a, b) => b.length - a.length);

    for (const _folder of _nestedFolders) {
        const _importPath = path.join(config.importPath, _folder);

        console.log(`Importing photos from ${_importPath}`);

        const _filesMetadata = getFilesMetadata(_importPath);

        for (const _fileMetadata of _filesMetadata) {

            if (!(_fileMetadata.MIMEType.startsWith(`image`) || _fileMetadata.MIMEType.startsWith(`video`))) continue;
            //Generate Hash

            const _hash = (await md5(_fileMetadata.SourceFile)).toUpperCase();

            //Check if file already exist
            try {
                if (
                    await _tx.read(_tx.entities.Files).byKey(_hash)
                ) {
                    console.log(
                        `${_fileMetadata.FileName} already exists!.`
                    );
                    await _tx.commit();
                    continue;
                }
            } catch (error) {
                debugger;
            }


            const _data = await transformData(_hash, _fileMetadata);

            //Generate/Move relavent files
            try {
                await fileOperations(_data, _fileMetadata);
            } catch (error) {
                console.log(error);
                await _tx.commit();
                continue;
            }

            //Update DB
            try {
                await _tx.create(_tx.entities.Files).entries(_data);
                await _tx.commit();
            } catch (error) {
                console.log(error);
                return;
            }
        }

        // Delete empty nested folders.
        if (path.join(_importPath) != path.join(config.importPath, `/`)) {
            if (await (await fs.promises.readdir(_importPath)).length == 0) {
                console.log(`Deleting folder ${_importPath}`);
                await fs.promises.rmdir(_importPath);
            }
        }
    }

    return;
}

importAsync();