const exiftool = require(`dist-exiftool`);
const execFile = require(`child_process`).execFileSync;
const fs = require(`fs`);
const path = require(`path`);
const config = require(`../srv/config.json`);

config.importPath = path.resolve(config.importPath);
config.exportPath = path.resolve(config.exportPath);

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
    console.error(`No file found`);
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
