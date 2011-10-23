// Maximum number of contacts in a k-bucket
global._k = 6;

// Degree of parallelism for network calls
global._alpha = 3;

// Size of the space in bits
global._B = 160;

// sha1 function
//global._digest = Crypto.digest.SHA1;

/*!
  * klass: a classical JS OOP façade
  * https://github.com/ded/klass
  * http://www.dustindiaz.com/klass
  *
  * License MIT (c) Dustin Diaz & Jacob Thornton
  */
(function(exports){

  var KadOH = exports;
  KadOH.core = {};

  KadOH.core.Class  = function () {
    var context = this
      , old = context.klass
      , f = 'function'
      , fnTest = /xyz/.test(function () {xyz}) ? /\bsupr\b/ : /.*/
      , proto = 'prototype'

    function klass(o) {
      return extend.call(isFn(o) ? o : function () {}, o, 1)
    }

    function isFn(o) {
      return typeof o === f
    }

    function wrap(k, fn, supr) {
      return function () {
        var tmp = this.supr
        this.supr = supr[proto][k]
        var ret = fn.apply(this, arguments)
        this.supr = tmp
        return ret
      }
    }

    function process(what, o, supr) {
      for (var k in o) {
        if (o.hasOwnProperty(k)) {
          what[k] = isFn(o[k])
            && isFn(supr[proto][k])
            && fnTest.test(o[k])
            ? wrap(k, o[k], supr) : o[k]
        }
      }
    }

    function extend(o, fromSub) {
      // must redefine noop each time so it doesn't inherit from previous arbitrary classes
      function noop() {}
      noop[proto] = this[proto]
      var supr = this
        , prototype = new noop()
        , isFunction = isFn(o)
        , _constructor = isFunction ? o : this
        , _methods = isFunction ? {} : o
      function fn() {
        if (this.initialize) this.initialize.apply(this, arguments)
        else {
          fromSub || isFunction && supr.apply(this, arguments)
          _constructor.apply(this, arguments)
        }
      }

      fn.methods = function (o) {
        process(prototype, o, supr)
        fn[proto] = prototype
        return this
      }

      fn.methods.call(fn, _methods).prototype.constructor = fn

      fn.extend = arguments.callee
      fn[proto].implement = fn.statics = function (o, optFn) {
        o = typeof o == 'string' ? (function () {
          var obj = {}
          obj[o] = optFn
          return obj
        }()) : o
        process(this, o, supr)
        return this
      }

      return fn
    }

    klass.noConflict = function () {
      context.klass = old
      return this
    }
    context.klass = klass

    return klass
  }();

  })('object' === typeof module ? module.exports : (this.KadOH = {}));
(function(exports){

  var KadOH = exports;

  var Class = KadOH.core.Class;

  KadOH.util = {};
  var Crypto = KadOH.util.Crypto = {};

  Crypto.util = Class().statics({
    // Bit-wise rotate left
    rotl: function (n, b) {
      return (n << b) | (n >>> (32 - b));
    },

    // Bit-wise rotate right
    rotr: function (n, b) {
      return (n << (32 - b)) | (n >>> b);
    },

    // Swap big-endian to little-endian and vice versa
    endian: function (n) {

      // If number given, swap endian
      if (n.constructor == Number) {
        return util.rotl(n,  8) & 0x00FF00FF |
        util.rotl(n, 24) & 0xFF00FF00;
      }

      // Else, assume array and swap all items
      for (var i = 0; i < n.length; i++)
      n[i] = util.endian(n[i]);
      return n;

    },

    // Generate an array of any length of random bytes
    randomBytes: function (n) {
      for (var bytes = []; n > 0; n--)
      bytes.push(Math.floor(Math.random() * 256));
      return bytes;
    },

    // Convert a byte array to big-endian 32-bit words
    bytesToWords: function (bytes) {
      for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)
      words[b >>> 5] |= bytes[i] << (24 - b % 32);
      return words;
    },

    // Convert big-endian 32-bit words to a byte array
    wordsToBytes: function (words) {
      for (var bytes = [], b = 0; b < words.length * 32; b += 8)
      bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
      return bytes;
    },

    // Convert a byte array to a hex string
    bytesToHex: function (bytes) {
      for (var hex = [], i = 0; i < bytes.length; i++) {
        hex.push((bytes[i] >>> 4).toString(16));
        hex.push((bytes[i] & 0xF).toString(16));
      }
      return hex.join("");
    },

    // Convert a hex string to a byte array
    hexToBytes: function (hex) {
      for (var bytes = [], c = 0; c < hex.length; c += 2)
      bytes.push(parseInt(hex.substr(c, 2), 16));
      return bytes;
    },

    // Return the bytes xor of two hexadecimal strings
    XOR: function(hex1, hex2) {
      if (hex1.length != hex2.length)
      return;

      hex1 = util.hexToBytes(hex1);
      hex2 = util.hexToBytes(hex2);

      var xor = [];
      for (var i = 0; i < key1.length; i++) {
        xor.push(key1[i] ^ key2[i]);
      }
      return xor;
    },

    distance: function(key1, key2) {
      if (key1 === key2)
      return 0;

      key1 = Crypto.util.hexToBytes(key1);
      key2 = Crypto.util.hexToBytes(key2);

      var length = key1.length;
      if (length != key2.length) {
        console.error("distance between two different sized key");
        return -1;
      }

      var max_dist = length*8 - 1;

      for (i = 0; i < length; i++) {
        var diff = key1[i] ^ key2[i];

        if (diff) {
          for (var j = 0; j < 7; j++)
          if (diff >>> (7 - j))
          break;
          return max_dist - i*8 - j;
        }
      }
      return max_dist;
    }

  });

  var charenc = Crypto.charenc = {};
  Crypto.charenc.Binary = Class().statics({

    // Convert a string to a byte array
    stringToBytes: function (str) {
      for (var bytes = [], i = 0; i < str.length; i++)
      bytes.push(str.charCodeAt(i) & 0xFF);
      return bytes;
    },

    // Convert a byte array to a string
    bytesToString: function (bytes) {
      for (var str = [], i = 0; i < bytes.length; i++)
      str.push(String.fromCharCode(bytes[i]));
      return str.join("");
    }

  });

  Crypto.charenc.UTF8 = Class().statics({

    // Convert a string to a byte array
    stringToBytes: function (str) {
      return Binary.stringToBytes(unescape(encodeURIComponent(str)));
    },

    // Convert a byte array to a string
    bytesToString: function (bytes) {
      return decodeURIComponent(escape(Binary.bytesToString(bytes)));
    }

  });

  // Digest (SHA1)

  var digest = Crypto.digest = Class().statics({

    SHA1: function(message, options) {
      var digestbytes = util.wordsToBytes(digest._sha1(message));
      return options && options.asBytes ? digestbytes :
      options && options.asString ? Binary.bytesToString(digestbytes) :
      util.bytesToHex(digestbytes);
    },

    _sha1: function (message) {

      // Convert to byte array
      if (message.constructor == String) message = UTF8.stringToBytes(message);
      /* else, assume byte array already */

      var m  = util.bytesToWords(message),
      l  = message.length * 8,
      w  =  [],
      H0 =  1732584193,
      H1 = -271733879,
      H2 = -1732584194,
      H3 =  271733878,
      H4 = -1009589776;

      // Padding
      m[l >> 5] |= 0x80 << (24 - l % 32);
      m[((l + 64 >>> 9) << 4) + 15] = l;

      for (var i = 0; i < m.length; i += 16) {

        var a = H0,
        b = H1,
        c = H2,
        d = H3,
        e = H4;

        for (var j = 0; j < 80; j++) {

          if (j < 16) w[j] = m[i + j];
          else {
            var n = w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16];
            w[j] = (n << 1) | (n >>> 31);
          }

          var t = ((H0 << 5) | (H0 >>> 27)) + H4 + (w[j] >>> 0) + (
            j < 20 ? (H1 & H2 | ~H1 & H3) + 1518500249 :
            j < 40 ? (H1 ^ H2 ^ H3) + 1859775393 :
            j < 60 ? (H1 & H2 | H1 & H3 | H2 & H3) - 1894007588 :
            (H1 ^ H2 ^ H3) - 899497514);

            H4 =  H3;
            H3 =  H2;
            H2 = (H1 << 30) | (H1 >>> 2);
            H1 =  H0;
            H0 =  t;

          }

          H0 += a;
          H1 += b;
          H2 += c;
          H3 += d;
          H4 += e;

        }

        return [H0, H1, H2, H3, H4];

      },

      // Package private blocksize
      _blocksize: 16,

      _digestsize: 20
    });

    })('object' === typeof module ? module.exports : (this.KadOH = {}));

var Node = Class().create({
  
  initialize: function(ip, port, id) {
    if (typeof id === 'undefined') {
      this.id = this._generateId();
    } else {
      this.id = id;
    }
    
    this._routing_table = new RoutingTable(this.id);
  },
  
  _generateId: function() {
    return _digest(this.ip + ':' + this.port);
  }
  
});

var RoutingTable = Class.create({
  
  initialize: function(parent_id) {
    this._parent_id = parent_id;
    this._kbuckets = [new KBucket(0, _B-1)];
  },
  
  // Public
  
  /**
   * Calculates the distance from 0 to B-1 between the parent id and the given key
   * These keys are SHA1 hashes as hexadecimal `String`
   *
   * @param {String} key
   * @return {String} distance between the two keys
   * @api public 
   */
  distance: function(id) {
    return Crypto.util.distance(this._parent_id, id);
  },
  
  /**
   * Add a peer to the routing table or update it if its already in
   * 
   * @param {Peer} peer object to add
   * @return {Void}
   * @api public 
   */
  addPeer: function(peer) {
    if (peer.id == this._parent_id) {
      return;
    }
    
    // find the kbucket for the peer
    try {
      var kbucket = this._kbucketFor(peer.id);
      
    }
    // if the kbucket is full, try to split it in two
    catch(e) {
    }
  },
  
  getPeer: function(id) {
    var peer = this._kbucketFor(id).getPeer(id);
    if (peer) {
      return peer;
    }
    return false;
  },
  
  removePeer: function(peer) {
    if (typeof peer === 'object') {
      peer = peer.getId();
    }
    return this._kbucketFor(peer).removePeer(peer);
  },
  
  // Private
  
  /**
   * Find the appropriate KBucket index for a given key
   *
   * @param {String} key SHA1 hash
   * @return {Integer} index for the `_kbuckets`
   * @api private
   */
  _kbucketIndexFor: function(id) {
    dist = this.distance(id);
    
    for(kbucket in this._kbuckets) {
      if (this._kbuckets[kbucket].distanceInRange(dist)) {
        return kbucket;
      }
    }
    return false;
  },
  
  _kbucketFor: function(id) {
    var index = this._keybucketIndexFor(id);
    if (index)
      return this._kbuckets[index];
    return false;
  }
  
});

var KBucket = Class.create({
  
  initialize: function(min, max) {
    this._min = (typeof min === 'undefined') ? 0      : min;
    this._max = (typeof max === 'undefined') ? (_B-1) : max;
    
    this._size = 0;
    this._peers_ids = [];
    this._peers = {};
  },
  
  // Public
  
  addPeer: function(peer) {
    var tuple = this._peerExists(peer);
    // if the peer is already in the kbucket, delete it and append it at the end of the list
    if (tuple != false) {
      delete this._peer_ids[tuple.index];
      
      this._size = this._peer_ids.unshift(peer.getId());
    }
    // if it doesn't and the kbucket is not full, append it at the end of the list
    else if (this._size < _k) {
      this._peers[peer.id] = peer;
      this._size = this._peers_ids.unshift(peer.id);
    }
    else {
      console.error('The kbucket ' + this.toString() + 'is full');
      throw new Error('FULL');
    }
  },
  
  getPeer: function(peer) {
    var tuple = this._peerExists(peer)
    if (tuple === false)
      return false;
    
    return this._peers[tuple.id];
  },
  
  getPeers: function(number) {
    number = Math.max(0, Math.min(number, this._size));
    
  },
  
  removePeer: function(peer) {
    var tuple = this._peerExists(peer)
    if (tuple === false) {
      return false;
    }
    
    delete this._peers_ids[tuple.index];
    delete this._peers[tuple.id];
    return true;
  },

  idInRange: function(id) {
    
  },
  
  distanceInRange: function(distance) {
    return (this._min <= distance) && (distance < this._max);
  },
  
  toString: function() {
    return '<' + this._min + ':' + this._max + '>';
  },
  
  // Private
  
  _peerExists: function(peer) {
    var peer_id, index;
    
    if (typeof peer === 'object') {
      peer_id = peer.getId();
      index = this._peers_ids.indexOf(peer_id);
    } else {
      peer_id = peer;
      index = this._peers_ids.indexOf(peer);
    }
    
    if (index === -1) {
      return false;
    }
    
    return {
        index: index
      , id: peer_id
    };
  }
  
});

var Peer = Class.create({
  
  initialize: function(ip, port, id) {
    this._ip = ip;
    this._port = port;
    this._socket = ip + ':' + port;
    
    if (typeof id === 'undefined') {
      this._id = this._generateId();
    } else {
      this._id = id;
    }
  },
  
  // Public
  getId: function() {
    return this._id;
  },
  
  getSocket: function() {
    return this._socket;
  },
  
  toString: function() {
    return '<' + this._id + '; ' + this._socket + '>';
  },
  
  // Private
  _generateId: function() {
    return _digest(this._socket); 
  }
  
});
