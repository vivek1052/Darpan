const exiftool = require(`dist-exiftool`);
const { execFile } = require(`child_process`);

module.exports.getFilesMetadata = (_path) => {

    return new Promise(resolve => {
        try {
            execFile(exiftool, [
                `-j`,
                `-n`,
                `-FileName`,
                `-Directory`,
                `-FileSize`,
                `-FileType`,
                `-FileTypeExtension`,
                `-MIMEType`,
                `-DateTimeOriginal`,
                `-CreateDate`,
                `-MediaCreateDate`,
                `-OffsetTimeOriginal`,
                `-TimeZone`,
                `-Duration`,
                `-MediaDuration`,
                `-ImageWidth`,
                `-ImageHeight`,
                `-Orientation`,
                `-Make`,
                `-Model`,
                `-GPSLatitudeRef`,
                `-GPSLatitude`,
                `-GPSLongitudeRef`,
                `-GPSLongitude`,
                `-GPSAltitudeRef`,
                `-GPSAltitude`,
                `-Rotation`,
                _path,
            ], (error, out, err) => {

                if (error) {
                    console.log(err)
                    resolve([]);
                } else {
                    resolve(JSON.parse(out));
                }

            });

        } catch (error) {
            console.error(error);
            resolve([]);
        }
    });

};

module.exports.updateExifProperty = (_path, _keyValue) => {

    const _args = [];
    _args.push(..._keyValue);
    _args.push(`-overwrite_original_in_place`);
    _args.push(_path);

    return new Promise((resolve, reject) => {
        execFile(exiftool, _args, (error, out, err) => {
            if (error) {
                console.log(err);
                reject(err);
            } else {
                console.log(out);
                resolve();
            }
        });
    })

}