const cds = require(`@sap/cds`);
const fs = require(`fs`);
const path = require(`path`);
const md5 = require(`md5-file`);
const utils = require(`./utils.js`);
const config = require(`./config.json`);
const moment = require(`moment`);
const axios = require('axios');
const ffmpeg_static = require(`ffmpeg-static`);
const ffprobe_static = require(`ffprobe-static`);
const ffmpeg = require(`fluent-ffmpeg`);

config.importPath = path.resolve(config.importPath);
config.exportPath = path.resolve(config.exportPath);
config.staticMapPath = path.resolve(config.staticMapPath);
config.thumnailPath = path.resolve(config.thumnailPath);

ffmpeg.setFfmpegPath(ffmpeg_static);
ffmpeg.setFfprobePath(ffprobe_static.path);

const status = Object.freeze({
  info: `I`,
  warn: "W",
  error: `E`,
  success: `S`,
});

class DarpanService extends cds.ApplicationService {
  async init() {
    this.on(`Import`, (_req) => {
      this.importAsync(_req);
    });
    this.on(`Reindex`, _req => {
      this.reIndexAsync(_req);
    });
    this.on(`GetImportFolders`, this.onGetImportFolders);
    this.on(`SearchPlaces`, this.searchPlaces);
    this.on(`UPDATE`, `Files`, (_req, next) => {
      this.fileUpdateAsync(_req);
      return next();
    });
    await super.init();
  }


  async importAsync(req) {
    debugger;

    const { folder } = req.data;

    const _tx = this.tx(req);

    const _nestedFolders = utils.getDirRecursive(folder || "/");

    _nestedFolders.sort((a, b) => b.length - a.length);

    for (const _folder of _nestedFolders) {
      const _importPath = path.join(config.importPath, _folder);

      this.log(status.info, `Importing photos from ${_importPath}`);

      const _filesMetadata = utils.getFilesMetadata(_importPath);

      for (const _fileMetadata of _filesMetadata) {

        if (!(_fileMetadata.MIMEType.startsWith(`image`) || _fileMetadata.MIMEType.startsWith(`video`))) continue;
        //Generate Hash

        const _hash = (await md5(_fileMetadata.SourceFile)).toUpperCase();

        //Check if file already exist
        try {
          if (
            await _tx.read(_tx.entities.Files).byKey(_hash)
          ) {
            this.log(
              status.warn,
              `${_fileMetadata.FileName} already exists!.`
            );
            continue;
          }
        } catch (error) {
          debugger;
        }


        const _data = await this.transformData(_hash, _fileMetadata);

        //Generate/Move relavent files
        try {
          await this.fileOperations(_data, _fileMetadata);
        } catch (error) {
          console.log(error);
          continue;
        }

        //Update DB
        try {
          await _tx.create(_tx.entities.Files).entries(_data);
          await _tx.commit();
        } catch (error) {
          this.log(status.error, error);
          return;
        }
      }

      // Delete empty nested folders.
      if (path.join(_importPath) != path.join(config.importPath, "/")) {
        if (await (await fs.promises.readdir(_importPath)).length == 0) {
          console.log(`Deleting folder ${_importPath}`);
          await fs.promises.rmdir(_importPath);
        }
      }
    }

    return;
  }

  async transformData(_hash, _fileMetadata) {

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

  async reIndexAsync(req) {
    debugger;

    const { hashes } = req.data;

    const _tx = this.tx(req);

    if (hashes.length == 0) {
      return;
    }
    const _files = await _tx.read(_tx.entities.Files).where({
      hash: hashes,
    });

    for (const _file of _files) {

      //Read current metadata
      console.log(`Reading Metadata for ${_file.name}`);

      const _filesMetadata = utils.getFilesMetadata(
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

      const _data = await this.transformData(_file.hash, _fileMetadata);

      //Generate/Move relavent files
      try {
        await this.fileOperations(_data, _fileMetadata);
      } catch (error) {
        console.log(error);
        continue;
      }

      //Crush update DB
      try {
        if (_data.addressCategories) {
          await _tx.delete(_tx.entities.Address_Categories).where({
            file_hash: _data.hash
          });
          await _tx.create(_tx.entities.Address_Categories).entries(_data.addressCategories);
          delete _data.addressCategories;
        }

        await _tx.update(this.entities.Files, _data.hash).with(_data);
        await _tx.commit();
      } catch (error) {
        this.log(status.error, error);
        await _tx.rollback();
      }
    }
    return;
  }

  async fileOperations(_data, _fileMetadata) {
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

    if (_data.mimeType.startsWith(`image`)) {

      let _scaleWidth = false;
      if (_data.dimensions.width_orient <= _data.dimensions.height_orient) {
        _scaleWidth = true;
      }

      await this.generateImageThumbnail(_fileMetadata.SourceFile, path.join(_thumbnailPath, `${_data.hash}_240.jpg`), _scaleWidth ? '240x?' : '?x240', Number(_data.dimensions.orientation));
      await this.generateImageThumbnail(_fileMetadata.SourceFile, path.join(_thumbnailPath, `${_data.hash}_1280.jpg`), _scaleWidth ? '?x1280' : '1280x?', Number(_data.dimensions.orientation));

      console.log("Thumbnails generated");
    }
    //Generate thumbnail for video.
    else if (_data.mimeType.startsWith(`video`)) {

      console.log('Generating live video file');
      await this.generateVideoThumbnail(_fileMetadata.SourceFile, path.join(_thumbnailPath, _data.hash + `.mp4`));

      //Transcode video other than mp4 in mp4
      if (config.transcodedFormats.includes(_data.format)) {
        console.log(`Transcoding ${_fileMetadata.FileName} to MP4`);
        await this.transcodeVideo(_fileMetadata.SourceFile, path.join(_thumbnailPath, _data.hash + `_transcoded.mp4`));
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
    this.log(status.info, `Moving file ${_fileMetadata.FileName}`);

    await fs.promises.rename(_fileMetadata.SourceFile,
      path.join(config.exportPath, _data.path, _data.name));

    return;
  }

  async generateVideoThumbnail(_sourceFile, _outputFile) {
    return new Promise(resolve => {
      ffmpeg(_sourceFile)
        .on(`end`, () => {
          resolve();
        })
        .videoCodec('libx264')
        .withNoAudio()
        .withOutputFPS(10)
        .withSize('20%')
        .withFrames(50)
        .save(_outputFile);
    });
  }

  async transcodeVideo(_sourceFile, _outputFile) {
    return new Promise(resolve => {
      ffmpeg(_sourceFile)
        .on(`end`, () => {
          resolve();
        })
        .videoCodec('libx264')
        .save(_outputFile);
    });
  }

  async generateImageThumbnail(_sourceFile, _outputFile, _size, _rotation) {
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

  async onGetImportFolders() {
    return utils.getDirRecursive();
  }

  async searchPlaces(req) {
    try {
      const { query, at } = req.data;
      const res = await axios.get(`https://autosuggest.search.hereapi.com/v1/autosuggest`, {
        params: {
          apikey: process.env.MAPAPIKEY,
          at: at,
          q: query
        }
      });
      return res.data.items.map(item => {
        return {
          name: item.title,
          address: item.address.label,
          latRef: item.position.lat > 0 ? 'N' : 'S',
          lat: Math.abs(item.position.lat),
          longRef: item.position.lng > 0 ? 'E' : 'W',
          lon: Math.abs(item.position.lng)
        }
      })
    } catch (err) {
      return [];
    }
  }

  async fileUpdateAsync(req) {
    if (req.context.event == 'Reindex') return;

    const _tx = this.tx(req);

    debugger
    const { hash, takenDateTime, gps_latitudeRef, gps_latitude, gps_longitudeRef, gps_longitude } = req.data;

    const _file = await _tx.read(_tx.entities.Files).byKey(hash);

    if (takenDateTime) {
      const _args = [];
      const _newDate = moment(takenDateTime);
      if (_file) {
        //Update Date to photo tags
        _args.push(`-DateTimeOriginal="${_newDate.format("YYYY:MM:DD HH:mm:ss")}"`);
        _args.push(`-OffsetTimeOriginal="${_newDate.format('Z')}"`);
        utils.updateExifProperty(path.join(config.exportPath, _file.path, _file.name), _args);

        //Reindex in order to move it to right folders and populate transient fields
        this.reIndexAsync([hash]);
      }
    }
    if (gps_latitudeRef && gps_latitude && gps_longitudeRef && gps_longitude) {
      const _args = [];
      if (_file) {
        //Update gps co-ordinates to photo tags
        _args.push(`-GPSLatitudeRef=${gps_latitudeRef}`);
        _args.push(`-GPSLatitude=${Number(gps_latitude)}`);
        _args.push(`-GPSLongitudeRef=${gps_longitudeRef}`);
        _args.push(`-GPSLongitude=${Number(gps_longitude)}`);
        utils.updateExifProperty(path.join(config.exportPath, _file.path, _file.name), _args);

        //Reindex in order to move it to right folders and populate transient fields
        this.reIndexAsync([hash]);
      }
    }
    return;
  }

  async log(_status, _message) {
    console.log(_message);
  }

}

module.exports = { DarpanService };
