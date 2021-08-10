require('dotenv').config();
const cds = require(`@sap/cds`);
const path = require(`path`);
const md5 = require(`md5-file`);
const fs = require(`fs`);
const { transformData } = require(`./utils`);
const { getDirRecursive, fileOperations } = require('./FileSystemUtils');
const { getFilesMetadata } = require('./exifToolUtils');
const { Admin } = require(`./userRoles`);
const config = require(`../config.json`);

config.importPath = path.resolve(config.importPath);

async function importAsync() {
    debugger;

    const folder = process.argv[2];

    const userName = process.argv[3];

    const _srv = await cds.connect.to('db');

    const _nestedFolders = await getDirRecursive(folder || `/`);

    _nestedFolders.sort((a, b) => b.length - a.length);

    for (const _folder of _nestedFolders) {
        const _importPath = path.join(config.importPath, _folder);

        console.log(`Importing photos from ${_importPath}`);

        const _filesMetadata = await getFilesMetadata(_importPath);

        for (const _fileMetadata of _filesMetadata) {

            if (!(_fileMetadata.MIMEType.startsWith(`image`) || _fileMetadata.MIMEType.startsWith(`video`))) continue;
            //Generate Hash

            const _hash = (await md5(_fileMetadata.SourceFile)).toUpperCase();

            //Check if file already exist
            try {
                if (
                    await _srv.read(_srv.entities.Files).byKey(_hash)
                ) {
                    console.log(
                        `${_fileMetadata.FileName} already exists!.`
                    );
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
                continue;
            }

            //Update DB
            try {
                const _tx = _srv.tx({
                    user: new Admin(userName)
                });
                await _tx.create(_srv.entities.Files).entries(_data);
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