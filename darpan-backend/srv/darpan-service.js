const cds = require(`@sap/cds`);
const path = require(`path`);
const utils = require(`./scripts/utils`);
const config = require(`./config.json`);
const moment = require(`moment`);
const axios = require('axios');
const { fork } = require(`child_process`);

config.importPath = path.resolve(config.importPath);
config.exportPath = path.resolve(config.exportPath);
config.staticMapPath = path.resolve(config.staticMapPath);
config.thumnailPath = path.resolve(config.thumnailPath);

class DarpanService extends cds.ApplicationService {
  async init() {
    this.on(`Import`, (_req) => {
      fork('./scripts/import.js', [_req.data.folder]);
    });
    this.on(`Reindex`, _req => {
      const { hashes } = _req.data;
      this.reIndexAsync(_req, hashes);
    });
    this.on(`GetImportFolders`, this.onGetImportFolders);
    this.on(`SearchPlaces`, this.searchPlaces);
    this.on(`UPDATE`, `Files`, (_req, next) => {
      this.fileUpdateAsync(_req);
      return next();
    });
    await super.init();
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

    const _tx = cds.tx(req);

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
        this.reIndexAsync(req, [hash]);
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
        this.reIndexAsync(req, [hash]);
      }
    }
    _tx.commit();
    return;
  }

}

module.exports = { DarpanService };
