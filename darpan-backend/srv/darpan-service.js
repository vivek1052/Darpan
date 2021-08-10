const cds = require(`@sap/cds`);
const { fileUpdateAsync, searchPlaces } = require(`./scripts/utils`);
const { getDirRecursive } = require(`./scripts/FileSystemUtils`);
const { fork } = require(`child_process`);

class DarpanService extends cds.ApplicationService {
  async init() {

    this.on(`Import`, (_req) => {
      fork('./srv/scripts/import.js', [_req.data.folder, _req.user.id]);
    });

    this.on(`Reindex`, _req => {
      const { hashes } = _req.data;
      fork('./srv/scripts/reIndex.js', [_req.user.id, ...hashes]);
    });

    this.on(`GetImportFolders`, async () => await getDirRecursive());

    this.on(`SearchPlaces`, searchPlaces);

    this.on(`UPDATE`, `Files`, fileUpdateAsync);

    await super.init();
  }


}

module.exports = { DarpanService };
