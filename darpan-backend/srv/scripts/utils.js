const exiftool = require(`dist-exiftool`);
const execFile = require(`child_process`).execFileSync;
const fs = require(`fs`);
const path = require(`path`);
const moment = require('moment');
const axios = require('axios');
const ffmpeg_static = require(`ffmpeg-static`);
const ffprobe_static = require(`ffprobe-static`);
const ffmpeg = require(`fluent-ffmpeg`);
const config = require(`../config.json`);

config.importPath = path.resolve(config.importPath);
config.exportPath = path.resolve(config.exportPath);
config.staticMapPath = path.resolve(config.staticMapPath);
config.thumnailPath = path.resolve(config.thumnailPath);

ffmpeg.setFfmpegPath(ffmpeg_static);
ffmpeg.setFfprobePath(ffprobe_static.path);

module.exports.getFilesMetadata = (_path) => {
  console.info("Reading media metadata");
  try {
    const _response = execFile(exiftool, [
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
    ]);

    return JSON.parse(_response.toString());
  } catch (error) {
    console.error(error);
    return [];
  }
};

module.exports.updateExifProperty = (_path, _keyValue) => {
  const _args = [];
  _args.push(..._keyValue);
  _args.push(`-overwrite_original_in_place`);
  _args.push(_path);
  const _response = execFile(exiftool, _args);
  console.log(_response.toString());
}

module.exports.getDirRecursive = (_path = "/") => {
  const _files = fs.readdirSync(path.join(config.importPath, _path), {
    withFileTypes: true,
  });

  const _dirs = _files.filter((_file) => _file.isDirectory());
  const _output = [];
  _output.push(path.join(_path));
  for (let index = 0; index < _dirs.length; index++) {
    const _dir = path.join(_path, _dirs[index].name);
    _output.push(...this.getDirRecursive(_dir));
  }
  return _output;
};

module.exports.transformData = async (_hash, _fileMetadata) => {

  //Prepare Data
  const _data = {
    hash: _hash,
    takenDateTime: null,
    takenDate: null,
    takenMonth: null,
    path: null,
    name: null,
    format: _fileMetadata.FileType || null,
    mimeType: _fileMetadata.MIMEType || null,
    size: _fileMetadata.FileSize || null,
    dimensions: {
      orientation: _fileMetadata.Orientation || null,
      width_actual: _fileMetadata.ImageWidth || null,
      height_actual: _fileMetadata.ImageHeight || null,
      width_orient:
        _fileMetadata.Orientation == 6 || _fileMetadata.Orientation == 8 || _fileMetadata.Rotation == 90 || _fileMetadata.Rotation == 270
          ? _fileMetadata.ImageHeight || null
          : _fileMetadata.ImageWidth || null,
      height_orient:
        _fileMetadata.Orientation == 6 || _fileMetadata.Orientation == 8 || _fileMetadata.Rotation == 90 || _fileMetadata.Rotation == 270
          ? _fileMetadata.ImageWidth || null
          : _fileMetadata.ImageHeight || null,
    },
    duration: _fileMetadata.Duration || null,
    make: _fileMetadata.Make || null,
    model: _fileMetadata.Model || null,
    gps: {
      latitudeRef: _fileMetadata.GPSLatitudeRef || null,
      latitude: _fileMetadata.GPSLatitude || null,
      longitudeRef: _fileMetadata.GPSLongitudeRef || null,
      longitude: _fileMetadata.GPSLongitude || null,
      altitudeRef: _fileMetadata.GPSAltitudeRef || null,
      altitude: _fileMetadata.GPSAltitude || null,
    },
    address: {
      label: null,
      houseNumber: null,
      postalCode: null,
      subblock: null,
      block: null,
      street: null,
      subdistrict: null,
      district: null,
      city: null,
      county: null,
      state: null,
      countryName: null,

    },
    UIpaths: {
      srcSD: null,
      srcFHD: null,
      srcOriginal: null,
      srcMap: null,
    },
    deleted: false
  };

  //Original date time
  const _dateTimeOriginal = _fileMetadata.DateTimeOriginal
    ? _fileMetadata.DateTimeOriginal
    : _fileMetadata.CreateDate
      ? _fileMetadata.CreateDate
      : _fileMetadata.MediaCreateDate;

  //Timezone
  const _timeZone = _fileMetadata.OffsetTimeOriginal;

  //Creation Timestamp
  const _creationDate = moment(_dateTimeOriginal + (moment(_timeZone, "ZZ").isValid() ? _timeZone : ``), `YYYY:MM:DD hh:mm:ssZZ`);

  _data.takenDateTime = _creationDate.isValid() ? _creationDate.format() : null;
  _data.takenDate = _creationDate.isValid() ? _creationDate.format("YYYY-MM-DD") : null;
  _data.takenMonth = _creationDate.isValid() ? _creationDate.format("YYYY-MM") : null;

  //Export path for image
  _data.path = _creationDate.isValid()
    ? [_creationDate.year().toString(), _creationDate.format("MM")].join(path.posix.sep)
    : `Unknown`;

  //File Name
  _data.name = _creationDate.isValid()
    ? `${_creationDate.format("YYYYMMDD_HHmmss")}_${_hash}.${_fileMetadata.FileTypeExtension.toLowerCase()}`
    : `${_hash}.${_fileMetadata.FileTypeExtension.toLowerCase()}`;

  //UI file paths
  if (_data.mimeType.startsWith('image')) {
    _data.UIpaths.srcSD = [_hash.slice(0, 1), _hash.slice(1, 2), _hash.slice(2, 3), _hash + '_240.jpg'].join(path.posix.sep);
    _data.UIpaths.srcFHD = [_hash.slice(0, 1), _hash.slice(1, 2), _hash.slice(2, 3), _hash + '_1280.jpg'].join(path.posix.sep);
    _data.UIpaths.srcOriginal = [..._data.path.split(path.posix.sep), _data.name].join(path.posix.sep);
    _data.UIpaths.srcMap = [_hash.slice(0, 1), _hash.slice(1, 2), _hash.slice(2, 3), _hash + '.jpg'].join(path.posix.sep);

  } else if (_data.mimeType.startsWith('video')) {
    _data.UIpaths.srcSD = [_hash.slice(0, 1), _hash.slice(1, 2), _hash.slice(2, 3), _hash + '.mp4'].join(path.posix.sep);
    _data.UIpaths.srcFHD = [_hash.slice(0, 1), _hash.slice(1, 2), _hash.slice(2, 3), _hash + '_transcoded.mp4'].join(path.posix.sep);
    _data.UIpaths.srcOriginal = [..._data.path.split(path.posix.sep), _data.name].join(path.posix.sep);
    _data.UIpaths.srcMap = [_hash.slice(0, 1), _hash.slice(1, 2), _hash.slice(2, 3), _hash + '.jpg'].join(path.posix.sep);
  }

  //Geo Location

  try {

    if (_fileMetadata.GPSLatitudeRef && _fileMetadata.GPSLatitude && _fileMetadata.GPSLongitudeRef && _fileMetadata.GPSLongitude) {
      const lat = _fileMetadata.GPSLatitudeRef == 'N' ? _fileMetadata.GPSLatitude : _fileMetadata.GPSLatitude * -1;
      const lon = _fileMetadata.GPSLongitudeRef == 'E' ? _fileMetadata.GPSLongitude : _fileMetadata.GPSLongitude * -1;

      const res = await axios.get(`https://revgeocode.search.hereapi.com/v1/revgeocode`, {
        params: {
          apikey: process.env.MAPAPIKEY,
          at: lat + ',' + lon
        }
      });

      if (res.data.items && res.data.items.length != 0) {
        const item = res.data.items[0];

        if (item.address) {
          for (const key in _data.address) {
            _data.address[key] = item.address[key] || null;
          }
        }
        if (item.categories) {
          _data.addressCategories = item.categories.map(_category => {
            return {
              file_hash: _hash,
              category: _category.name
            }
          });
        }
      }
    }
  } catch (error) {
    console.error(error);
  }

  return _data;
}

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

async function generateVideoThumbnail(_sourceFile, _outputFile, _size) {
  return new Promise(resolve => {
    ffmpeg(_sourceFile)
      .on(`end`, () => {
        resolve();
      })
      .videoCodec('libx264')
      .withNoAudio()
      .withOutputFPS(10)
      .withSize(_size)
      .withFrames(50)
      .save(_outputFile);
  });
}

async function transcodeVideo(_sourceFile, _outputFile) {
  return new Promise(resolve => {
    ffmpeg(_sourceFile)
      .on(`end`, () => {
        resolve();
      })
      .videoCodec('libx264')
      .save(_outputFile);
  });
}

async function generateImageThumbnail(_sourceFile, _outputFile, _size, _rotation) {
  const orientation = [];

  switch (_rotation) {
    case 1:
      //Normal image
      break;
    case 2:
      orientation.push('transpose=cclock_flip');
      orientation.push('transpose=clock');
      break;
    case 3:
      orientation.push('transpose=clock');
      orientation.push('transpose=clock');
      break;
    case 4:
      orientation.push('transpose=cclock_flip');
      orientation.push('transpose=cclock');
      break;
    case 5:
      orientation.push('transpose=clock_flip');
      orientation.push('transpose=clock');
      orientation.push('transpose=clock');
      break;
    case 6:
      orientation.push('transpose=clock');
      break;
    case 7:
      orientation.push('transpose=clock_flip');
      break;
    case 8:
      orientation.push('transpose=cclock');
    default:
      break;
  }
  return new Promise(resolve => {
    const _image = ffmpeg(_sourceFile)
      .on(`end`, () => {
        resolve();
      })
      .size(`?x${_size}`);

    for (const orient of orientation) {
      _image.videoFilter(orient);
    }
    _image.save(_outputFile);
  });
}