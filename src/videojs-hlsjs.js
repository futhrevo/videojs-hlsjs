import videojs from 'video.js';
import HlsjsSourceHandler from './hlsjs-source-handler';

const Html5Tech = videojs.getTech('Html5');

if (HlsjsSourceHandler.isSupported()) {
  Html5Tech.registerSourceHandler(HlsjsSourceHandler, 0);
}

export default HlsjsSourceHandler;
