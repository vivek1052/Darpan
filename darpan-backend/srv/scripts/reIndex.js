require('dotenv').config();
const cds = require(`@sap/cds`);
const path = require(`path`);
const { transformData } = require(`./utils`);
const { fileOperations } = require('./FileSystemUtils');
const { getFilesMetadata } = require('./exifToolUtils');
const { Admin } = require(`./userRoles`);
const config = require(`../config.json`);


config.exportPath = path.resolve(config.exportPath);


async function reIndexAsync() {
    debugger;

    const userName = process.argv[2];

    const hashes = [];
    for (let i = 3; i < process.argv.length; i++) {
        hashes.push(process.argv[i]);
    }

    if (hashes.length == 0) {
        return;
    }

    console.log(`Re-Indexing ${hashes.length} files`);

    const _srv = await cds.connect.to('db');

    const _tx = _srv.tx({
        user: new Admin(userName)
    });

    const _files = await _tx.read(_tx.entities.Files).where({
        hash: hashes,
    });

    for (const _file of _files) {

        //Read current metadata
        console.log(`Reading Metadata for ${_file.name}`);

        const _filesMetadata = await getFilesMetadata(
            path.join(config.exportPath, _file.path, _file.name)
        );

        if (_filesMetadata.length == 0) {
            console.error("File doesnt exist anymore. Deleting from database");
            try {
                await _tx.delete(_tx.entities.Files).byKey({
                    hash: _file.hash,
                });
                await _tx.commit();
                continue;
            } catch (error) {
                console.log(error);
                continue;
            }
        }

        const _fileMetadata = _filesMetadata[0];

        const _data = await transformData(_file.hash, _fileMetadata);

        //Generate/Move relavent files
        try {
            await fileOperations(_data, _fileMetadata);
        } catch (error) {
            console.log(error);
            continue;
        }

        //Crush update DB
        try {
            if (_data.addressCategories) {
                try {
                    await _tx.delete(_tx.entities.Address_Categories).where({
                        file_hash: _data.hash
                    });
                } catch (error) {
                    //Didnt exist
                }

                await _tx.create(_tx.entities.Address_Categories).entries(_data.addressCategories);
                delete _data.addressCategories;
            }

            await _tx.update(_tx.entities.Files, _data.hash).with(_data);
            await _tx.commit();
        } catch (error) {
            console.log(error);
            await _tx.rollback();
        }
    }

    return;
}

reIndexAsync();