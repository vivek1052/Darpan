const ffmpeg_static = require(`ffmpeg-static`);
const ffprobe_static = require(`ffprobe-static`);
const ffmpeg = require(`fluent-ffmpeg`);

ffmpeg.setFfmpegPath(ffmpeg_static);
ffmpeg.setFfprobePath(ffprobe_static.path);

module.exports.generateVideoThumbnail = async (_sourceFile, _outputFile, _size) => {
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

module.exports.transcodeVideo = async (_sourceFile, _outputFile) => {
    return new Promise(resolve => {
        ffmpeg(_sourceFile)
            .on(`end`, () => {
                resolve();
            })
            .videoCodec('libx264')
            .save(_outputFile);
    });
}

module.exports.generateImageThumbnail = async (_sourceFile, _outputFile, _size, _rotation) => {
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