/* eslint no-underscore-dangle: "off" */
import videojs from 'video.js';
import Hlsjs from 'hls.js';
import MediaErrorCodes from './media-error-codes';
import Decrypter from './decrypter';
import isHlsType from './is-hls-type';

const Component = videojs.getComponent('Component');
const hlsExtRE = /\.m3u8/i;

class HlsjsSourceHandler extends Component {
  constructor(source, tech, options) {
    super(tech, options.hlsjs);

    videojs.log.debug(`hlsjs version ${Hlsjs.version}`);
    videojs.log.debug('hlsjsConfig', options.hlsjs);

    const tech_ = tech;
    this.tech_ = tech_;
    this.videoEl_ = tech_.el();

    this.hlsjs = new Hlsjs(options.hlsjs);
    this.hlsjsErrorHandler = this.crateErrorHandler();
    this.videoElementErrorHandler = this.crateErrorHandler();
    this.duration_ = null;

    this.hlsjs.on(Hlsjs.Events.MANIFEST_PARSED, videojs.bind(this, this.onHlsjsManifestParsed));
    this.hlsjs.on(Hlsjs.Events.LEVEL_LOADED, videojs.bind(this, this.onHlsjsLevelLoaded));
    this.hlsjs.on(Hlsjs.Events.FRAG_LOADED, videojs.bind(this, this.onHlsjsFragmentLoaded));
    this.hlsjs.on(Hlsjs.Events.ERROR, videojs.bind(this, this.onHlsjsError));

    this.on(this.videoEl_, 'error', this.onVideoElementError);

    Object.keys(Hlsjs.Events).forEach((key) => {
      const eventName = Hlsjs.Events[key];
      this.hlsjs.on(eventName, (event, data) => {
        this.tech_.trigger(eventName, data);
      });
    });

    // attach videoElement to hlsjs
    this.hlsjs.attachMedia(this.videoEl_);
  }

  dispose() {
    if (this.hlsjs) {
      this.hlsjs.destroy();
      this.hlsjs = null;
    }
  }

  /**
   * @param {Object} src the source object to handle
   */
  src(src) {
    if (!src) {
      return;
    }
    this.tech_.ready();
    this.hlsjs.loadSource(src);
  }

  /**
   * @returns {function()}
   */
  crateErrorHandler() {
    let recoverDecodingErrorDate = null;
    let recoverAudioCodecErrorDate = null;

    return () => {
      const now = Date.now();
      if (!recoverDecodingErrorDate || (now - recoverDecodingErrorDate) > 2000) {
        recoverDecodingErrorDate = now;
        this.hlsjs.recoverMediaError();
      } else if (!recoverAudioCodecErrorDate || (now - recoverAudioCodecErrorDate) > 2000) {
        recoverAudioCodecErrorDate = now;
        this.hlsjs.swapAudioCodec();
        this.hlsjs.recoverMediaError();
      } else {
        this.fireError({
          code: MediaErrorCodes.MEDIA_ERR_CUSTOM,
          message: `${Hlsjs.ErrorTypes.MEDIA_ERROR}`,
        });
      }
    };
  }

  /**
   * @param {MediaError|object} error
   */
  fireError(error) {
    const player = videojs.players[this.tech_.options_.playerId];
    player.error(error);
  }

  /**
   * @param event
   * @param eventData
   */
  onHlsjsManifestParsed(event, eventData) {
    videojs.log.debug('hls manifest levels', eventData.levels);
    this.hlsjs.startLoad();
  }

  /**
   * @param event
   * @param eventData
   */
  onHlsjsLevelLoaded(event, eventData) {
    const level = eventData.details;
    this.duration_ = level.live ? Infinity : level.totalduration;
  }

  /**
   * @param event
   * @param eventData
   */
  onHlsjsFragmentLoaded(event, eventData) {
    // Overwrite Decrypter
    if (this.hlsjs.streamController && this.hlsjs.streamController.demuxer) {
      if (!this.hlsjs.streamController.demuxer.decrypter_) {
        this.hlsjs.streamController.demuxer.decrypter_
          = this.hlsjs.streamController.demuxer.decrypter || true;
        this.hlsjs.streamController.demuxer.decrypter = new Decrypter();
      }
    }
    if (this.hlsjs.audioStreamController && this.hlsjs.audioStreamController.demuxer) {
      if (!this.hlsjs.audioStreamController.demuxer.decrypter_) {
        this.hlsjs.audioStreamController.demuxer.decrypter_
          = this.hlsjs.audioStreamController.demuxer.decrypter || true;
        this.hlsjs.audioStreamController.demuxer.decrypter = new Decrypter();
      }
    }
  }

  /**
   * @param event
   * @param eventData
   */
  onHlsjsError(event, eventData) {
    if (eventData.fatal) {
      videojs.log.error(`HLS Fetal Error: ${eventData.type}:${eventData.details}:${eventData.reason}`);
    } else {
      videojs.log.warn(`HLS Error: ${eventData.type}:${eventData.details}:${eventData.reason}`);
    }

    if (eventData.type === Hlsjs.ErrorTypes.NETWORK_ERROR) {
      if (eventData.response && eventData.response.code === 403) {
        this.fireError({
          code: MediaErrorCodes.MEDIA_ERR_NETWORK,
          message: `${eventData.type}:${eventData.details}`,
        });
        return;
      }

      switch (eventData.details) {
        case Hlsjs.ErrorDetails.MANIFEST_LOAD_ERROR:
        case Hlsjs.ErrorDetails.KEY_LOAD_ERROR:
          this.fireError({
            code: MediaErrorCodes.MEDIA_ERR_NETWORK,
            message: `${eventData.type}:${eventData.details}`,
          });
          return;
        default:
          break;
      }
    }

    // https://github.com/video-dev/hls.js/blob/master/docs/API.md
    if (eventData.fatal) {
      switch (eventData.type) {
        case Hlsjs.ErrorTypes.NETWORK_ERROR:
          this.hlsjs.startLoad();
          break;
        case Hlsjs.ErrorTypes.MEDIA_ERROR:
          this.hlsjsErrorHandler();
          break;
        default:
          this.fireError({
            code: MediaErrorCodes.MEDIA_ERR_CUSTOM,
            message: `${eventData.type}:${eventData.details}`,
          });
          break;
      }
    }
  }

  /**
   * @param event
   * @param eventData
   */
  onVideoElementError(event, eventData) {
    const mediaError = this.videoEl_.error;
    if (mediaError && mediaError.code === mediaError.MEDIA_ERR_DECODE) {
      this.videoElementErrorHandler();
    } else {
      videojs.log.error('Error loading media: File could not be played');
    }
  }

  /**
   * @returns {number}
   */
  duration() {
    return this.duration_ || this.videoEl_.duration || 0;
  }

  /**
   * @param {object} source
   * @returns {string}
   */
  static canHandleSource(source) {
    if (isHlsType(source.type)) {
      return 'probably';
    } else if (hlsExtRE.test(source.src)) {
      return 'maybe';
    }
    return '';
  }

  /**
   * @param {object} source
   * @param {Tech} tech
   * @param {object} options
   * @returns {HlsjsSourceHandler}
   */
  static handleSource(source, tech, options) {
    // https://video-dev.github.io/hls.js/docs/html/file/src/config.js.html
    const logLevel = videojs.log.level();
    const defaultHlsjsConfig = {
      debug: logLevel === 'all' || logLevel === 'debug',
    };
    const localOptions = videojs.mergeOptions(videojs.options, { hlsjs: defaultHlsjsConfig }, options);
    const tech_ = tech;
    tech_.hlsjs = new HlsjsSourceHandler(source, tech, localOptions);
    tech_.hlsjs.src(source.src);
    return tech_.hlsjs;
  }

  /**
   * @param {string} type
   * @returns {string}
   */
  static canPlayType(type) {
    if (isHlsType(type)) {
      return 'probably';
    }
    return '';
  }

  /**
   * @returns {boolean}
   */
  static isSupported() {
    const s = Hlsjs.isSupported();
    if (!s) {
      videojs.log.warn('hls.js is not supported in this browser');
    }
    return s;
  }
}

export default HlsjsSourceHandler;
