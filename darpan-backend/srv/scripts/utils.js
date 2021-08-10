const cds = require(`@sap/cds`);
const path = require(`path`);
const moment = require('moment');
const axios = require('axios');
const config = require(`../config.json`);
const { updateExifProperty } = require(`./exifToolUtils`);
config.exportPath = path.resolve(config.exportPath);


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
    status: {
      deleted: false
    }

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

module.exports.searchPlaces = async (req) => {
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

module.exports.fileUpdateAsync = async (req, next) => {

  const _tx = cds.tx(req);

  debugger
  const { hash, takenDateTime, gps_latitudeRef, gps_latitude, gps_longitudeRef, gps_longitude } = req.data;

  const _file = await _tx.read(_tx.entities.Files).byKey(hash);

  const _args = [];
  if (takenDateTime) {
    const _newDate = moment(takenDateTime);
    if (_file && _newDate.isValid()) {
      //Update Date to photo tags
      _args.push(`-DateTimeOriginal="${_newDate.format("YYYY:MM:DD HH:mm:ss")}"`);
      _args.push(`-OffsetTimeOriginal="${_newDate.format('Z')}"`);
    }
  }

  if (gps_latitudeRef && gps_latitude && gps_longitudeRef && gps_longitude) {
    if (_file) {
      //Update gps co-ordinates to photo tags
      _args.push(`-GPSLatitudeRef=${gps_latitudeRef}`);
      _args.push(`-GPSLatitude=${Number(gps_latitude)}`);
      _args.push(`-GPSLongitudeRef=${gps_longitudeRef}`);
      _args.push(`-GPSLongitude=${Number(gps_longitude)}`);
    }
  }

  if (_args.length != 0) {
    try {
      await updateExifProperty(path.join(config.exportPath, _file.path, _file.name), _args);
      _file.status.reIndex = 1;
    } catch (error) {
      _file.status.reIndex = 3;
    }
    await _tx.update(_tx.entities.Files, hash).with(_file);
    _tx.commit();
    return;
  } else {
    return next();
  }

}