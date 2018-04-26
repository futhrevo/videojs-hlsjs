/**
 * @param  {string} type mimeType
 * @return {boolean}
 * @private
 * @method isHlsType
 */
function isHlsType(type) {
  const hlsTypes = [
    'application/vnd.apple.mpegurl',
    'audio/mpegurl',
    'audio/x-mpegurl',
    'application/x-mpegurl',
    'video/x-mpegurl',
    'video/mpegurl',
    'application/mpegurl',
  ];
  const t = type.toLowerCase();
  return hlsTypes.find(hlsType => hlsType === t) !== undefined;
}

export default isHlsType;
