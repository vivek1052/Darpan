const fs = require(`fs`);
const path = require(`path`);
const axios = require(`axios`);
const { generateImageThumbnail, generateVideoThumbnail, transcodeVideo } = require('./ffmpegUtils');
const config = require(`../config.json`);

config.importPath = path.resolve(config.importPath);
config.exportPath = path.resolve(config.exportPath);
config.staticMapPath = path.resolve(config.staticMapPath);
config.thumnailPath = path.resolve(config.thumnailPath);

module.exports.getDirRecursive = async (_path = "/") => {
    const _files = await fs.promises.readdir(path.join(config.importPath, _path), {
        withFileTypes: true,
    });

    const _dirs = _files.filter((_file) => _file.isDirectory());
    const _output = [];
    _output.push(path.join(_path));
    for (let index = 0; index < _dirs.length; index++) {
        const _dir = path.join(_path, _dirs[index].name);
        _output.push(...(await this.getDirRecursive(_dir)));
    }
    return _output;
};

module.exports.fileOperations = async (_data, _fileMetadata) => {
    //Generate thumbnails for images

    const _thumbnailPath = path.join(
        config.thumnailPath,
        _data.hash.slice(0, 1),
        _data.hash.slice(1, 2),
        _data.hash.slice(2, 3)
    );

    await fs.promises.mkdir(_thumbnailPath, {
        recursive: true,
    });

    let _scaleWidth = false;
    if (_data.dimensions.width_orient <= _data.dimensions.height_orient) {
        _scaleWidth = true;
    }

    if (_data.mimeType.startsWith(`image`)) {

        try {
            await generateImageThumbnail(_fileMetadata.SourceFile, path.join(_thumbnailPath, `${_data.hash}_240.jpg`), _scaleWidth ? '240x?' : '?x240', Number(_data.dimensions.orientation));
            await generateImageThumbnail(_fileMetadata.SourceFile, path.join(_thumbnailPath, `${_data.hash}_1280.jpg`), _scaleWidth ? '?x1280' : '1280x?', Number(_data.dimensions.orientation));
            console.log("Thumbnails generated");
        } catch (error) {
            console.error('Thumbnail couldnt be generated');
        }

    }
    //Generate thumbnail for video.
    else if (_data.mimeType.startsWith(`video`)) {

        try {
            console.log('Generating live video file');
            await generateVideoThumbnail(_fileMetadata.SourceFile, path.join(_thumbnailPath, _data.hash + `.mp4`), _scaleWidth ? '240x?' : '?x240');
        } catch (error) {
            console.error('Couldnt generate live video file');
        }


        //Transcode video other than mp4 in mp4
        if (config.transcodedFormats.includes(_data.format)) {
            try {
                console.log(`Transcoding ${_fileMetadata.FileName} to MP4`);
                await transcodeVideo(_fileMetadata.SourceFile, path.join(_thumbnailPath, _data.hash + `_transcoded.mp4`));
            } catch (error) {
                console.log('Couldnt transcode video');
            }
        }
    }

    //Generate Static maps
    if (_data.gps.latitudeRef && _data.gps.latitude && _data.gps.longitudeRef && _data.gps.longitude) {
        console.log(`Geolocation found. Generating Static map`);
        const lat = _data.gps.latitudeRef == 'N' ? _data.gps.latitude : _data.gps.latitude * -1;
        const lon = _data.gps.longitudeRef == 'E' ? _data.gps.longitude : _data.gps.longitude * -1;
        const _staticMapPath = path.join(
            config.staticMapPath,
            _data.hash.slice(0, 1),
            _data.hash.slice(1, 2),
            _data.hash.slice(2, 3)
        );

        //Make thumbnail path
        await fs.promises.mkdir(_staticMapPath, {
            recursive: true,
        });

        try {
            const res = await axios.get(`https://image.maps.ls.hereapi.com/mia/1.6/mapview`, {
                responseType: 'stream',
                params: {
                    apikey: process.env.MAPAPIKEY,
                    lat: lat,
                    lon: lon,
                    z: 15,
                    w: 600,
                    h: 400,
                    i: ''
                }

            });

            res.data.pipe(fs.createWriteStream(path.join(_staticMapPath, `${_data.hash}.jpg`)));
        } catch (error) {
            console.log(error);
        }

    }

    //Create export path if not there
    await fs.promises.mkdir(path.join(config.exportPath, _data.path), { recursive: true });

    //Move file
    console.log(`Moving file ${_fileMetadata.FileName}`);

    await fs.promises.rename(_fileMetadata.SourceFile,
        path.join(config.exportPath, _data.path, _data.name));

    return;
}