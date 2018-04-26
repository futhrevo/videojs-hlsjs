videojs-hlsjs
=================

Just another hls.js plugin.

Playback HLS with hls.js that is lightweight and a source handler with HTML5 tech.

## Getting Started

- [Videojs](https://videojs.com/) 6+
- [hls.js](https://github.com/video-dev/hls.js/) 0.9+

```
<head>
  ...
  <link href="video-js.css" rel="stylesheet">
  <script src="video.js"></script>
  <script src="hls.js"></script>
  <script src="videojs-hlsjs.js"></script>
</head>
<body>
<video id="player" class="video-js vjs-default-skin" controls>
  <source src="https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8" type="application/x-mpegURL">
</video>
<script>videojs('player');</script>
</body>
```

### Configuration

[hls.js config](https://video-dev.github.io/hls.js/docs/html/file/src/config.js.html)

```
videojs('player', {
  controls: true,
  autoplay: false,
  html5: {
    // https://video-dev.github.io/hls.js/docs/html/file/src/config.js.html
    hlsjs: {
      debug: true,
    }
  },
});
```
 
