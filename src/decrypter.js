/* eslint class-methods-use-this: "off", no-new: "off" */
import { Decrypter as AESDecrypter } from 'aes-decrypter';

class Decrypter {
  constructor() {
    this.keyBuffer = null;
    this.keyUint32Array = null;
    this.ivBuffer = null;
    this.ivUint32Array = null;
  }

  // noinspection JSMethodCanBeStatic
  supportsWebCrypto() {
    return false;
  }

  static buffer2Hex(buffer) {
    return Array.prototype.map.call(
      new Uint8Array(buffer),
      /** number */x => (`00${x.toString(16)}`).slice(-2),
    ).join('');
  }

  /**
   * @param {ArrayBuffer} data
   * @param {ArrayBuffer} key
   * @param {ArrayBuffer} iv
   * @param {function} callback
   */
  decrypt(data, key, iv, callback) {
    if (this.keyBuffer !== key) {
      this.keyBuffer = key;
      const keyView = new DataView(key);
      this.keyUint32Array = new Uint32Array([
        keyView.getUint32(0),
        keyView.getUint32(4),
        keyView.getUint32(8),
        keyView.getUint32(12),
      ]);
    }
    if (this.ivBuffer !== iv) {
      this.ivUint32Array = new Uint32Array(iv);
    }

    /*
     * @param {Uint8Array} encrypted the encrypted bytes
     * @param {Uint32Array} key the bytes of the decryption key
     * @param {Uint32Array} initVector the initialization vector (IV) to
     * @param {Function} done the function to run when done
     */
    new AESDecrypter(
      new Uint8Array(data),
      this.keyUint32Array,
      this.ivUint32Array,
      ((err, bytes) => {
        callback(bytes.buffer);
      }),
    );
  }
}

export default Decrypter;
