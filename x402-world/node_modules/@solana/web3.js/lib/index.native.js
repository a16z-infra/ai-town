'use strict';

var buffer = require('buffer');
var ed25519 = require('@noble/curves/ed25519');
var BN = require('bn.js');
var bs58 = require('bs58');
var sha256 = require('@noble/hashes/sha256');
var borsh = require('borsh');
var BufferLayout = require('@solana/buffer-layout');
var codecsNumbers = require('@solana/codecs-numbers');
var superstruct = require('superstruct');
var RpcClient = require('jayson/lib/client/browser');
var rpcWebsockets = require('rpc-websockets');
var sha3 = require('@noble/hashes/sha3');
var secp256k1 = require('@noble/curves/secp256k1');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e : { default: e }; }

function _interopNamespaceCompat(e) {
  if (e && typeof e === 'object' && 'default' in e) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var BN__default = /*#__PURE__*/_interopDefaultCompat(BN);
var bs58__default = /*#__PURE__*/_interopDefaultCompat(bs58);
var BufferLayout__namespace = /*#__PURE__*/_interopNamespaceCompat(BufferLayout);
var RpcClient__default = /*#__PURE__*/_interopDefaultCompat(RpcClient);

/**
 * A 64 byte secret key, the first 32 bytes of which is the
 * private scalar and the last 32 bytes is the public key.
 * Read more: https://blog.mozilla.org/warner/2011/11/29/ed25519-keys/
 */

/**
 * Ed25519 Keypair
 */

const generatePrivateKey = ed25519.ed25519.utils.randomPrivateKey;
const generateKeypair = () => {
  const privateScalar = ed25519.ed25519.utils.randomPrivateKey();
  const publicKey = getPublicKey(privateScalar);
  const secretKey = new Uint8Array(64);
  secretKey.set(privateScalar);
  secretKey.set(publicKey, 32);
  return {
    publicKey,
    secretKey
  };
};
const getPublicKey = ed25519.ed25519.getPublicKey;
function isOnCurve(publicKey) {
  try {
    ed25519.ed25519.ExtendedPoint.fromHex(publicKey);
    return true;
  } catch {
    return false;
  }
}
const sign = (message, secretKey) => ed25519.ed25519.sign(message, secretKey.slice(0, 32));
const verify = ed25519.ed25519.verify;

const toBuffer = arr => {
  if (buffer.Buffer.isBuffer(arr)) {
    return arr;
  } else if (arr instanceof Uint8Array) {
    return buffer.Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  } else {
    return buffer.Buffer.from(arr);
  }
};

// Class wrapping a plain object
class Struct {
  constructor(properties) {
    Object.assign(this, properties);
  }
  encode() {
    return buffer.Buffer.from(borsh.serialize(SOLANA_SCHEMA, this));
  }
  static decode(data) {
    return borsh.deserialize(SOLANA_SCHEMA, this, data);
  }
  static decodeUnchecked(data) {
    return borsh.deserializeUnchecked(SOLANA_SCHEMA, this, data);
  }
}

// Class representing a Rust-compatible enum, since enums are only strings or
// numbers in pure JS
class Enum extends Struct {
  constructor(properties) {
    super(properties);
    this.enum = '';
    if (Object.keys(properties).length !== 1) {
      throw new Error('Enum can only take single value');
    }
    Object.keys(properties).map(key => {
      this.enum = key;
    });
  }
}
const SOLANA_SCHEMA = new Map();

var _PublicKey;

/**
 * Maximum length of derived pubkey seed
 */
const MAX_SEED_LENGTH = 32;

/**
 * Size of public key in bytes
 */
const PUBLIC_KEY_LENGTH = 32;

/**
 * Value to be converted into public key
 */

/**
 * JSON object representation of PublicKey class
 */

function isPublicKeyData(value) {
  return value._bn !== undefined;
}

// local counter used by PublicKey.unique()
let uniquePublicKeyCounter = 1;

/**
 * A public key
 */
class PublicKey extends Struct {
  /**
   * Create a new PublicKey object
   * @param value ed25519 public key as buffer or base-58 encoded string
   */
  constructor(value) {
    super({});
    /** @internal */
    this._bn = void 0;
    if (isPublicKeyData(value)) {
      this._bn = value._bn;
    } else {
      if (typeof value === 'string') {
        // assume base 58 encoding by default
        const decoded = bs58__default.default.decode(value);
        if (decoded.length != PUBLIC_KEY_LENGTH) {
          throw new Error(`Invalid public key input`);
        }
        this._bn = new BN__default.default(decoded);
      } else {
        this._bn = new BN__default.default(value);
      }
      if (this._bn.byteLength() > PUBLIC_KEY_LENGTH) {
        throw new Error(`Invalid public key input`);
      }
    }
  }

  /**
   * Returns a unique PublicKey for tests and benchmarks using a counter
   */
  static unique() {
    const key = new PublicKey(uniquePublicKeyCounter);
    uniquePublicKeyCounter += 1;
    return new PublicKey(key.toBuffer());
  }

  /**
   * Default public key value. The base58-encoded string representation is all ones (as seen below)
   * The underlying BN number is 32 bytes that are all zeros
   */

  /**
   * Checks if two publicKeys are equal
   */
  equals(publicKey) {
    return this._bn.eq(publicKey._bn);
  }

  /**
   * Return the base-58 representation of the public key
   */
  toBase58() {
    return bs58__default.default.encode(this.toBytes());
  }
  toJSON() {
    return this.toBase58();
  }

  /**
   * Return the byte array representation of the public key in big endian
   */
  toBytes() {
    const buf = this.toBuffer();
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }

  /**
   * Return the Buffer representation of the public key in big endian
   */
  toBuffer() {
    const b = this._bn.toArrayLike(buffer.Buffer);
    if (b.length === PUBLIC_KEY_LENGTH) {
      return b;
    }
    const zeroPad = buffer.Buffer.alloc(32);
    b.copy(zeroPad, 32 - b.length);
    return zeroPad;
  }
  get [Symbol.toStringTag]() {
    return `PublicKey(${this.toString()})`;
  }

  /**
   * Return the base-58 representation of the public key
   */
  toString() {
    return this.toBase58();
  }

  /**
   * Derive a public key from another key, a seed, and a program ID.
   * The program ID will also serve as the owner of the public key, giving
   * it permission to write data to the account.
   */
  /* eslint-disable require-await */
  static async createWithSeed(fromPublicKey, seed, programId) {
    const buffer$1 = buffer.Buffer.concat([fromPublicKey.toBuffer(), buffer.Buffer.from(seed), programId.toBuffer()]);
    const publicKeyBytes = sha256.sha256(buffer$1);
    return new PublicKey(publicKeyBytes);
  }

  /**
   * Derive a program address from seeds and a program ID.
   */
  /* eslint-disable require-await */
  static createProgramAddressSync(seeds, programId) {
    let buffer$1 = buffer.Buffer.alloc(0);
    seeds.forEach(function (seed) {
      if (seed.length > MAX_SEED_LENGTH) {
        throw new TypeError(`Max seed length exceeded`);
      }
      buffer$1 = buffer.Buffer.concat([buffer$1, toBuffer(seed)]);
    });
    buffer$1 = buffer.Buffer.concat([buffer$1, programId.toBuffer(), buffer.Buffer.from('ProgramDerivedAddress')]);
    const publicKeyBytes = sha256.sha256(buffer$1);
    if (isOnCurve(publicKeyBytes)) {
      throw new Error(`Invalid seeds, address must fall off the curve`);
    }
    return new PublicKey(publicKeyBytes);
  }

  /**
   * Async version of createProgramAddressSync
   * For backwards compatibility
   *
   * @deprecated Use {@link createProgramAddressSync} instead
   */
  /* eslint-disable require-await */
  static async createProgramAddress(seeds, programId) {
    return this.createProgramAddressSync(seeds, programId);
  }

  /**
   * Find a valid program address
   *
   * Valid program addresses must fall off the ed25519 curve.  This function
   * iterates a nonce until it finds one that when combined with the seeds
   * results in a valid program address.
   */
  static findProgramAddressSync(seeds, programId) {
    let nonce = 255;
    let address;
    while (nonce != 0) {
      try {
        const seedsWithNonce = seeds.concat(buffer.Buffer.from([nonce]));
        address = this.createProgramAddressSync(seedsWithNonce, programId);
      } catch (err) {
        if (err instanceof TypeError) {
          throw err;
        }
        nonce--;
        continue;
      }
      return [address, nonce];
    }
    throw new Error(`Unable to find a viable program address nonce`);
  }

  /**
   * Async version of findProgramAddressSync
   * For backwards compatibility
   *
   * @deprecated Use {@link findProgramAddressSync} instead
   */
  static async findProgramAddress(seeds, programId) {
    return this.findProgramAddressSync(seeds, programId);
  }

  /**
   * Check that a pubkey is on the ed25519 curve.
   */
  static isOnCurve(pubkeyData) {
    const pubkey = new PublicKey(pubkeyData);
    return isOnCurve(pubkey.toBytes());
  }
}
_PublicKey = PublicKey;
PublicKey.default = new _PublicKey('11111111111111111111111111111111');
SOLANA_SCHEMA.set(PublicKey, {
  kind: 'struct',
  fields: [['_bn', 'u256']]
});

/**
 * An account key pair (public and secret keys).
 *
 * @deprecated since v1.10.0, please use {@link Keypair} instead.
 */
class Account {
  /**
   * Create a new Account object
   *
   * If the secretKey parameter is not provided a new key pair is randomly
   * created for the account
   *
   * @param secretKey Secret key for the account
   */
  constructor(secretKey) {
    /** @internal */
    this._publicKey = void 0;
    /** @internal */
    this._secretKey = void 0;
    if (secretKey) {
      const secretKeyBuffer = toBuffer(secretKey);
      if (secretKey.length !== 64) {
        throw new Error('bad secret key size');
      }
      this._publicKey = secretKeyBuffer.slice(32, 64);
      this._secretKey = secretKeyBuffer.slice(0, 32);
    } else {
      this._secretKey = toBuffer(generatePrivateKey());
      this._publicKey = toBuffer(getPublicKey(this._secretKey));
    }
  }

  /**
   * The public key for this account
   */
  get publicKey() {
    return new PublicKey(this._publicKey);
  }

  /**
   * The **unencrypted** secret key for this account. The first 32 bytes
   * is the private scalar and the last 32 bytes is the public key.
   * Read more: https://blog.mozilla.org/warner/2011/11/29/ed25519-keys/
   */
  get secretKey() {
    return buffer.Buffer.concat([this._secretKey, this._publicKey], 64);
  }
}

const BPF_LOADER_DEPRECATED_PROGRAM_ID = new PublicKey('BPFLoader1111111111111111111111111111111111');

/**
 * Maximum over-the-wire size of a Transaction
 *
 * 1280 is IPv6 minimum MTU
 * 40 bytes is the size of the IPv6 header
 * 8 bytes is the size of the fragment header
 */
const PACKET_DATA_SIZE = 1280 - 40 - 8;
const VERSION_PREFIX_MASK = 0x7f;
const SIGNATURE_LENGTH_IN_BYTES = 64;

class TransactionExpiredBlockheightExceededError extends Error {
  constructor(signature) {
    super(`Signature ${signature} has expired: block height exceeded.`);
    this.signature = void 0;
    this.signature = signature;
  }
}
Object.defineProperty(TransactionExpiredBlockheightExceededError.prototype, 'name', {
  value: 'TransactionExpiredBlockheightExceededError'
});
class TransactionExpiredTimeoutError extends Error {
  constructor(signature, timeoutSeconds) {
    super(`Transaction was not confirmed in ${timeoutSeconds.toFixed(2)} seconds. It is ` + 'unknown if it succeeded or failed. Check signature ' + `${signature} using the Solana Explorer or CLI tools.`);
    this.signature = void 0;
    this.signature = signature;
  }
}
Object.defineProperty(TransactionExpiredTimeoutError.prototype, 'name', {
  value: 'TransactionExpiredTimeoutError'
});
class TransactionExpiredNonceInvalidError extends Error {
  constructor(signature) {
    super(`Signature ${signature} has expired: the nonce is no longer valid.`);
    this.signature = void 0;
    this.signature = signature;
  }
}
Object.defineProperty(TransactionExpiredNonceInvalidError.prototype, 'name', {
  value: 'TransactionExpiredNonceInvalidError'
});

class MessageAccountKeys {
  constructor(staticAccountKeys, accountKeysFromLookups) {
    this.staticAccountKeys = void 0;
    this.accountKeysFromLookups = void 0;
    this.staticAccountKeys = staticAccountKeys;
    this.accountKeysFromLookups = accountKeysFromLookups;
  }
  keySegments() {
    const keySegments = [this.staticAccountKeys];
    if (this.accountKeysFromLookups) {
      keySegments.push(this.accountKeysFromLookups.writable);
      keySegments.push(this.accountKeysFromLookups.readonly);
    }
    return keySegments;
  }
  get(index) {
    for (const keySegment of this.keySegments()) {
      if (index < keySegment.length) {
        return keySegment[index];
      } else {
        index -= keySegment.length;
      }
    }
    return;
  }
  get length() {
    return this.keySegments().flat().length;
  }
  compileInstructions(instructions) {
    // Bail early if any account indexes would overflow a u8
    const U8_MAX = 255;
    if (this.length > U8_MAX + 1) {
      throw new Error('Account index overflow encountered during compilation');
    }
    const keyIndexMap = new Map();
    this.keySegments().flat().forEach((key, index) => {
      keyIndexMap.set(key.toBase58(), index);
    });
    const findKeyIndex = key => {
      const keyIndex = keyIndexMap.get(key.toBase58());
      if (keyIndex === undefined) throw new Error('Encountered an unknown instruction account key during compilation');
      return keyIndex;
    };
    return instructions.map(instruction => {
      return {
        programIdIndex: findKeyIndex(instruction.programId),
        accountKeyIndexes: instruction.keys.map(meta => findKeyIndex(meta.pubkey)),
        data: instruction.data
      };
    });
  }
}

/**
 * Layout for a public key
 */
const publicKey = (property = 'publicKey') => {
  return BufferLayout__namespace.blob(32, property);
};

/**
 * Layout for a signature
 */
const signature = (property = 'signature') => {
  return BufferLayout__namespace.blob(64, property);
};
/**
 * Layout for a Rust String type
 */
const rustString = (property = 'string') => {
  const rsl = BufferLayout__namespace.struct([BufferLayout__namespace.u32('length'), BufferLayout__namespace.u32('lengthPadding'), BufferLayout__namespace.blob(BufferLayout__namespace.offset(BufferLayout__namespace.u32(), -8), 'chars')], property);
  const _decode = rsl.decode.bind(rsl);
  const _encode = rsl.encode.bind(rsl);
  const rslShim = rsl;
  rslShim.decode = (b, offset) => {
    const data = _decode(b, offset);
    return data['chars'].toString();
  };
  rslShim.encode = (str, b, offset) => {
    const data = {
      chars: buffer.Buffer.from(str, 'utf8')
    };
    return _encode(data, b, offset);
  };
  rslShim.alloc = str => {
    return BufferLayout__namespace.u32().span + BufferLayout__namespace.u32().span + buffer.Buffer.from(str, 'utf8').length;
  };
  return rslShim;
};

/**
 * Layout for an Authorized object
 */
const authorized = (property = 'authorized') => {
  return BufferLayout__namespace.struct([publicKey('staker'), publicKey('withdrawer')], property);
};

/**
 * Layout for a Lockup object
 */
const lockup = (property = 'lockup') => {
  return BufferLayout__namespace.struct([BufferLayout__namespace.ns64('unixTimestamp'), BufferLayout__namespace.ns64('epoch'), publicKey('custodian')], property);
};

/**
 *  Layout for a VoteInit object
 */
const voteInit = (property = 'voteInit') => {
  return BufferLayout__namespace.struct([publicKey('nodePubkey'), publicKey('authorizedVoter'), publicKey('authorizedWithdrawer'), BufferLayout__namespace.u8('commission')], property);
};

/**
 *  Layout for a VoteAuthorizeWithSeedArgs object
 */
const voteAuthorizeWithSeedArgs = (property = 'voteAuthorizeWithSeedArgs') => {
  return BufferLayout__namespace.struct([BufferLayout__namespace.u32('voteAuthorizationType'), publicKey('currentAuthorityDerivedKeyOwnerPubkey'), rustString('currentAuthorityDerivedKeySeed'), publicKey('newAuthorized')], property);
};
function getAlloc(type, fields) {
  const getItemAlloc = item => {
    if (item.span >= 0) {
      return item.span;
    } else if (typeof item.alloc === 'function') {
      return item.alloc(fields[item.property]);
    } else if ('count' in item && 'elementLayout' in item) {
      const field = fields[item.property];
      if (Array.isArray(field)) {
        return field.length * getItemAlloc(item.elementLayout);
      }
    } else if ('fields' in item) {
      // This is a `Structure` whose size needs to be recursively measured.
      return getAlloc({
        layout: item
      }, fields[item.property]);
    }
    // Couldn't determine allocated size of layout
    return 0;
  };
  let alloc = 0;
  type.layout.fields.forEach(item => {
    alloc += getItemAlloc(item);
  });
  return alloc;
}

function decodeLength(bytes) {
  let len = 0;
  let size = 0;
  for (;;) {
    let elem = bytes.shift();
    len |= (elem & 0x7f) << size * 7;
    size += 1;
    if ((elem & 0x80) === 0) {
      break;
    }
  }
  return len;
}
function encodeLength(bytes, len) {
  let rem_len = len;
  for (;;) {
    let elem = rem_len & 0x7f;
    rem_len >>= 7;
    if (rem_len == 0) {
      bytes.push(elem);
      break;
    } else {
      elem |= 0x80;
      bytes.push(elem);
    }
  }
}

function assert (condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

class CompiledKeys {
  constructor(payer, keyMetaMap) {
    this.payer = void 0;
    this.keyMetaMap = void 0;
    this.payer = payer;
    this.keyMetaMap = keyMetaMap;
  }
  static compile(instructions, payer) {
    const keyMetaMap = new Map();
    const getOrInsertDefault = pubkey => {
      const address = pubkey.toBase58();
      let keyMeta = keyMetaMap.get(address);
      if (keyMeta === undefined) {
        keyMeta = {
          isSigner: false,
          isWritable: false,
          isInvoked: false
        };
        keyMetaMap.set(address, keyMeta);
      }
      return keyMeta;
    };
    const payerKeyMeta = getOrInsertDefault(payer);
    payerKeyMeta.isSigner = true;
    payerKeyMeta.isWritable = true;
    for (const ix of instructions) {
      getOrInsertDefault(ix.programId).isInvoked = true;
      for (const accountMeta of ix.keys) {
        const keyMeta = getOrInsertDefault(accountMeta.pubkey);
        keyMeta.isSigner ||= accountMeta.isSigner;
        keyMeta.isWritable ||= accountMeta.isWritable;
      }
    }
    return new CompiledKeys(payer, keyMetaMap);
  }
  getMessageComponents() {
    const mapEntries = [...this.keyMetaMap.entries()];
    assert(mapEntries.length <= 256, 'Max static account keys length exceeded');
    const writableSigners = mapEntries.filter(([, meta]) => meta.isSigner && meta.isWritable);
    const readonlySigners = mapEntries.filter(([, meta]) => meta.isSigner && !meta.isWritable);
    const writableNonSigners = mapEntries.filter(([, meta]) => !meta.isSigner && meta.isWritable);
    const readonlyNonSigners = mapEntries.filter(([, meta]) => !meta.isSigner && !meta.isWritable);
    const header = {
      numRequiredSignatures: writableSigners.length + readonlySigners.length,
      numReadonlySignedAccounts: readonlySigners.length,
      numReadonlyUnsignedAccounts: readonlyNonSigners.length
    };

    // sanity checks
    {
      assert(writableSigners.length > 0, 'Expected at least one writable signer key');
      const [payerAddress] = writableSigners[0];
      assert(payerAddress === this.payer.toBase58(), 'Expected first writable signer key to be the fee payer');
    }
    const staticAccountKeys = [...writableSigners.map(([address]) => new PublicKey(address)), ...readonlySigners.map(([address]) => new PublicKey(address)), ...writableNonSigners.map(([address]) => new PublicKey(address)), ...readonlyNonSigners.map(([address]) => new PublicKey(address))];
    return [header, staticAccountKeys];
  }
  extractTableLookup(lookupTable) {
    const [writableIndexes, drainedWritableKeys] = this.drainKeysFoundInLookupTable(lookupTable.state.addresses, keyMeta => !keyMeta.isSigner && !keyMeta.isInvoked && keyMeta.isWritable);
    const [readonlyIndexes, drainedReadonlyKeys] = this.drainKeysFoundInLookupTable(lookupTable.state.addresses, keyMeta => !keyMeta.isSigner && !keyMeta.isInvoked && !keyMeta.isWritable);

    // Don't extract lookup if no keys were found
    if (writableIndexes.length === 0 && readonlyIndexes.length === 0) {
      return;
    }
    return [{
      accountKey: lookupTable.key,
      writableIndexes,
      readonlyIndexes
    }, {
      writable: drainedWritableKeys,
      readonly: drainedReadonlyKeys
    }];
  }

  /** @internal */
  drainKeysFoundInLookupTable(lookupTableEntries, keyMetaFilter) {
    const lookupTableIndexes = new Array();
    const drainedKeys = new Array();
    for (const [address, keyMeta] of this.keyMetaMap.entries()) {
      if (keyMetaFilter(keyMeta)) {
        const key = new PublicKey(address);
        const lookupTableIndex = lookupTableEntries.findIndex(entry => entry.equals(key));
        if (lookupTableIndex >= 0) {
          assert(lookupTableIndex < 256, 'Max lookup table index exceeded');
          lookupTableIndexes.push(lookupTableIndex);
          drainedKeys.push(key);
          this.keyMetaMap.delete(address);
        }
      }
    }
    return [lookupTableIndexes, drainedKeys];
  }
}

const END_OF_BUFFER_ERROR_MESSAGE = 'Reached end of buffer unexpectedly';

/**
 * Delegates to `Array#shift`, but throws if the array is zero-length.
 */
function guardedShift(byteArray) {
  if (byteArray.length === 0) {
    throw new Error(END_OF_BUFFER_ERROR_MESSAGE);
  }
  return byteArray.shift();
}

/**
 * Delegates to `Array#splice`, but throws if the section being spliced out extends past the end of
 * the array.
 */
function guardedSplice(byteArray, ...args) {
  const [start] = args;
  if (args.length === 2 // Implies that `deleteCount` was supplied
  ? start + (args[1] ?? 0) > byteArray.length : start >= byteArray.length) {
    throw new Error(END_OF_BUFFER_ERROR_MESSAGE);
  }
  return byteArray.splice(...args);
}

/**
 * An instruction to execute by a program
 *
 * @property {number} programIdIndex
 * @property {number[]} accounts
 * @property {string} data
 */

/**
 * Message constructor arguments
 */

/**
 * List of instructions to be processed atomically
 */
class Message {
  constructor(args) {
    this.header = void 0;
    this.accountKeys = void 0;
    this.recentBlockhash = void 0;
    this.instructions = void 0;
    this.indexToProgramIds = new Map();
    this.header = args.header;
    this.accountKeys = args.accountKeys.map(account => new PublicKey(account));
    this.recentBlockhash = args.recentBlockhash;
    this.instructions = args.instructions;
    this.instructions.forEach(ix => this.indexToProgramIds.set(ix.programIdIndex, this.accountKeys[ix.programIdIndex]));
  }
  get version() {
    return 'legacy';
  }
  get staticAccountKeys() {
    return this.accountKeys;
  }
  get compiledInstructions() {
    return this.instructions.map(ix => ({
      programIdIndex: ix.programIdIndex,
      accountKeyIndexes: ix.accounts,
      data: bs58__default.default.decode(ix.data)
    }));
  }
  get addressTableLookups() {
    return [];
  }
  getAccountKeys() {
    return new MessageAccountKeys(this.staticAccountKeys);
  }
  static compile(args) {
    const compiledKeys = CompiledKeys.compile(args.instructions, args.payerKey);
    const [header, staticAccountKeys] = compiledKeys.getMessageComponents();
    const accountKeys = new MessageAccountKeys(staticAccountKeys);
    const instructions = accountKeys.compileInstructions(args.instructions).map(ix => ({
      programIdIndex: ix.programIdIndex,
      accounts: ix.accountKeyIndexes,
      data: bs58__default.default.encode(ix.data)
    }));
    return new Message({
      header,
      accountKeys: staticAccountKeys,
      recentBlockhash: args.recentBlockhash,
      instructions
    });
  }
  isAccountSigner(index) {
    return index < this.header.numRequiredSignatures;
  }
  isAccountWritable(index) {
    const numSignedAccounts = this.header.numRequiredSignatures;
    if (index >= this.header.numRequiredSignatures) {
      const unsignedAccountIndex = index - numSignedAccounts;
      const numUnsignedAccounts = this.accountKeys.length - numSignedAccounts;
      const numWritableUnsignedAccounts = numUnsignedAccounts - this.header.numReadonlyUnsignedAccounts;
      return unsignedAccountIndex < numWritableUnsignedAccounts;
    } else {
      const numWritableSignedAccounts = numSignedAccounts - this.header.numReadonlySignedAccounts;
      return index < numWritableSignedAccounts;
    }
  }
  isProgramId(index) {
    return this.indexToProgramIds.has(index);
  }
  programIds() {
    return [...this.indexToProgramIds.values()];
  }
  nonProgramIds() {
    return this.accountKeys.filter((_, index) => !this.isProgramId(index));
  }
  serialize() {
    const numKeys = this.accountKeys.length;
    let keyCount = [];
    encodeLength(keyCount, numKeys);
    const instructions = this.instructions.map(instruction => {
      const {
        accounts,
        programIdIndex
      } = instruction;
      const data = Array.from(bs58__default.default.decode(instruction.data));
      let keyIndicesCount = [];
      encodeLength(keyIndicesCount, accounts.length);
      let dataCount = [];
      encodeLength(dataCount, data.length);
      return {
        programIdIndex,
        keyIndicesCount: buffer.Buffer.from(keyIndicesCount),
        keyIndices: accounts,
        dataLength: buffer.Buffer.from(dataCount),
        data
      };
    });
    let instructionCount = [];
    encodeLength(instructionCount, instructions.length);
    let instructionBuffer = buffer.Buffer.alloc(PACKET_DATA_SIZE);
    buffer.Buffer.from(instructionCount).copy(instructionBuffer);
    let instructionBufferLength = instructionCount.length;
    instructions.forEach(instruction => {
      const instructionLayout = BufferLayout__namespace.struct([BufferLayout__namespace.u8('programIdIndex'), BufferLayout__namespace.blob(instruction.keyIndicesCount.length, 'keyIndicesCount'), BufferLayout__namespace.seq(BufferLayout__namespace.u8('keyIndex'), instruction.keyIndices.length, 'keyIndices'), BufferLayout__namespace.blob(instruction.dataLength.length, 'dataLength'), BufferLayout__namespace.seq(BufferLayout__namespace.u8('userdatum'), instruction.data.length, 'data')]);
      const length = instructionLayout.encode(instruction, instructionBuffer, instructionBufferLength);
      instructionBufferLength += length;
    });
    instructionBuffer = instructionBuffer.slice(0, instructionBufferLength);
    const signDataLayout = BufferLayout__namespace.struct([BufferLayout__namespace.blob(1, 'numRequiredSignatures'), BufferLayout__namespace.blob(1, 'numReadonlySignedAccounts'), BufferLayout__namespace.blob(1, 'numReadonlyUnsignedAccounts'), BufferLayout__namespace.blob(keyCount.length, 'keyCount'), BufferLayout__namespace.seq(publicKey('key'), numKeys, 'keys'), publicKey('recentBlockhash')]);
    const transaction = {
      numRequiredSignatures: buffer.Buffer.from([this.header.numRequiredSignatures]),
      numReadonlySignedAccounts: buffer.Buffer.from([this.header.numReadonlySignedAccounts]),
      numReadonlyUnsignedAccounts: buffer.Buffer.from([this.header.numReadonlyUnsignedAccounts]),
      keyCount: buffer.Buffer.from(keyCount),
      keys: this.accountKeys.map(key => toBuffer(key.toBytes())),
      recentBlockhash: bs58__default.default.decode(this.recentBlockhash)
    };
    let signData = buffer.Buffer.alloc(2048);
    const length = signDataLayout.encode(transaction, signData);
    instructionBuffer.copy(signData, length);
    return signData.slice(0, length + instructionBuffer.length);
  }

  /**
   * Decode a compiled message into a Message object.
   */
  static from(buffer$1) {
    // Slice up wire data
    let byteArray = [...buffer$1];
    const numRequiredSignatures = guardedShift(byteArray);
    if (numRequiredSignatures !== (numRequiredSignatures & VERSION_PREFIX_MASK)) {
      throw new Error('Versioned messages must be deserialized with VersionedMessage.deserialize()');
    }
    const numReadonlySignedAccounts = guardedShift(byteArray);
    const numReadonlyUnsignedAccounts = guardedShift(byteArray);
    const accountCount = decodeLength(byteArray);
    let accountKeys = [];
    for (let i = 0; i < accountCount; i++) {
      const account = guardedSplice(byteArray, 0, PUBLIC_KEY_LENGTH);
      accountKeys.push(new PublicKey(buffer.Buffer.from(account)));
    }
    const recentBlockhash = guardedSplice(byteArray, 0, PUBLIC_KEY_LENGTH);
    const instructionCount = decodeLength(byteArray);
    let instructions = [];
    for (let i = 0; i < instructionCount; i++) {
      const programIdIndex = guardedShift(byteArray);
      const accountCount = decodeLength(byteArray);
      const accounts = guardedSplice(byteArray, 0, accountCount);
      const dataLength = decodeLength(byteArray);
      const dataSlice = guardedSplice(byteArray, 0, dataLength);
      const data = bs58__default.default.encode(buffer.Buffer.from(dataSlice));
      instructions.push({
        programIdIndex,
        accounts,
        data
      });
    }
    const messageArgs = {
      header: {
        numRequiredSignatures,
        numReadonlySignedAccounts,
        numReadonlyUnsignedAccounts
      },
      recentBlockhash: bs58__default.default.encode(buffer.Buffer.from(recentBlockhash)),
      accountKeys,
      instructions
    };
    return new Message(messageArgs);
  }
}

/**
 * Message constructor arguments
 */

class MessageV0 {
  constructor(args) {
    this.header = void 0;
    this.staticAccountKeys = void 0;
    this.recentBlockhash = void 0;
    this.compiledInstructions = void 0;
    this.addressTableLookups = void 0;
    this.header = args.header;
    this.staticAccountKeys = args.staticAccountKeys;
    this.recentBlockhash = args.recentBlockhash;
    this.compiledInstructions = args.compiledInstructions;
    this.addressTableLookups = args.addressTableLookups;
  }
  get version() {
    return 0;
  }
  get numAccountKeysFromLookups() {
    let count = 0;
    for (const lookup of this.addressTableLookups) {
      count += lookup.readonlyIndexes.length + lookup.writableIndexes.length;
    }
    return count;
  }
  getAccountKeys(args) {
    let accountKeysFromLookups;
    if (args && 'accountKeysFromLookups' in args && args.accountKeysFromLookups) {
      if (this.numAccountKeysFromLookups != args.accountKeysFromLookups.writable.length + args.accountKeysFromLookups.readonly.length) {
        throw new Error('Failed to get account keys because of a mismatch in the number of account keys from lookups');
      }
      accountKeysFromLookups = args.accountKeysFromLookups;
    } else if (args && 'addressLookupTableAccounts' in args && args.addressLookupTableAccounts) {
      accountKeysFromLookups = this.resolveAddressTableLookups(args.addressLookupTableAccounts);
    } else if (this.addressTableLookups.length > 0) {
      throw new Error('Failed to get account keys because address table lookups were not resolved');
    }
    return new MessageAccountKeys(this.staticAccountKeys, accountKeysFromLookups);
  }
  isAccountSigner(index) {
    return index < this.header.numRequiredSignatures;
  }
  isAccountWritable(index) {
    const numSignedAccounts = this.header.numRequiredSignatures;
    const numStaticAccountKeys = this.staticAccountKeys.length;
    if (index >= numStaticAccountKeys) {
      const lookupAccountKeysIndex = index - numStaticAccountKeys;
      const numWritableLookupAccountKeys = this.addressTableLookups.reduce((count, lookup) => count + lookup.writableIndexes.length, 0);
      return lookupAccountKeysIndex < numWritableLookupAccountKeys;
    } else if (index >= this.header.numRequiredSignatures) {
      const unsignedAccountIndex = index - numSignedAccounts;
      const numUnsignedAccounts = numStaticAccountKeys - numSignedAccounts;
      const numWritableUnsignedAccounts = numUnsignedAccounts - this.header.numReadonlyUnsignedAccounts;
      return unsignedAccountIndex < numWritableUnsignedAccounts;
    } else {
      const numWritableSignedAccounts = numSignedAccounts - this.header.numReadonlySignedAccounts;
      return index < numWritableSignedAccounts;
    }
  }
  resolveAddressTableLookups(addressLookupTableAccounts) {
    const accountKeysFromLookups = {
      writable: [],
      readonly: []
    };
    for (const tableLookup of this.addressTableLookups) {
      const tableAccount = addressLookupTableAccounts.find(account => account.key.equals(tableLookup.accountKey));
      if (!tableAccount) {
        throw new Error(`Failed to find address lookup table account for table key ${tableLookup.accountKey.toBase58()}`);
      }
      for (const index of tableLookup.writableIndexes) {
        if (index < tableAccount.state.addresses.length) {
          accountKeysFromLookups.writable.push(tableAccount.state.addresses[index]);
        } else {
          throw new Error(`Failed to find address for index ${index} in address lookup table ${tableLookup.accountKey.toBase58()}`);
        }
      }
      for (const index of tableLookup.readonlyIndexes) {
        if (index < tableAccount.state.addresses.length) {
          accountKeysFromLookups.readonly.push(tableAccount.state.addresses[index]);
        } else {
          throw new Error(`Failed to find address for index ${index} in address lookup table ${tableLookup.accountKey.toBase58()}`);
        }
      }
    }
    return accountKeysFromLookups;
  }
  static compile(args) {
    const compiledKeys = CompiledKeys.compile(args.instructions, args.payerKey);
    const addressTableLookups = new Array();
    const accountKeysFromLookups = {
      writable: new Array(),
      readonly: new Array()
    };
    const lookupTableAccounts = args.addressLookupTableAccounts || [];
    for (const lookupTable of lookupTableAccounts) {
      const extractResult = compiledKeys.extractTableLookup(lookupTable);
      if (extractResult !== undefined) {
        const [addressTableLookup, {
          writable,
          readonly
        }] = extractResult;
        addressTableLookups.push(addressTableLookup);
        accountKeysFromLookups.writable.push(...writable);
        accountKeysFromLookups.readonly.push(...readonly);
      }
    }
    const [header, staticAccountKeys] = compiledKeys.getMessageComponents();
    const accountKeys = new MessageAccountKeys(staticAccountKeys, accountKeysFromLookups);
    const compiledInstructions = accountKeys.compileInstructions(args.instructions);
    return new MessageV0({
      header,
      staticAccountKeys,
      recentBlockhash: args.recentBlockhash,
      compiledInstructions,
      addressTableLookups
    });
  }
  serialize() {
    const encodedStaticAccountKeysLength = Array();
    encodeLength(encodedStaticAccountKeysLength, this.staticAccountKeys.length);
    const serializedInstructions = this.serializeInstructions();
    const encodedInstructionsLength = Array();
    encodeLength(encodedInstructionsLength, this.compiledInstructions.length);
    const serializedAddressTableLookups = this.serializeAddressTableLookups();
    const encodedAddressTableLookupsLength = Array();
    encodeLength(encodedAddressTableLookupsLength, this.addressTableLookups.length);
    const messageLayout = BufferLayout__namespace.struct([BufferLayout__namespace.u8('prefix'), BufferLayout__namespace.struct([BufferLayout__namespace.u8('numRequiredSignatures'), BufferLayout__namespace.u8('numReadonlySignedAccounts'), BufferLayout__namespace.u8('numReadonlyUnsignedAccounts')], 'header'), BufferLayout__namespace.blob(encodedStaticAccountKeysLength.length, 'staticAccountKeysLength'), BufferLayout__namespace.seq(publicKey(), this.staticAccountKeys.length, 'staticAccountKeys'), publicKey('recentBlockhash'), BufferLayout__namespace.blob(encodedInstructionsLength.length, 'instructionsLength'), BufferLayout__namespace.blob(serializedInstructions.length, 'serializedInstructions'), BufferLayout__namespace.blob(encodedAddressTableLookupsLength.length, 'addressTableLookupsLength'), BufferLayout__namespace.blob(serializedAddressTableLookups.length, 'serializedAddressTableLookups')]);
    const serializedMessage = new Uint8Array(PACKET_DATA_SIZE);
    const MESSAGE_VERSION_0_PREFIX = 1 << 7;
    const serializedMessageLength = messageLayout.encode({
      prefix: MESSAGE_VERSION_0_PREFIX,
      header: this.header,
      staticAccountKeysLength: new Uint8Array(encodedStaticAccountKeysLength),
      staticAccountKeys: this.staticAccountKeys.map(key => key.toBytes()),
      recentBlockhash: bs58__default.default.decode(this.recentBlockhash),
      instructionsLength: new Uint8Array(encodedInstructionsLength),
      serializedInstructions,
      addressTableLookupsLength: new Uint8Array(encodedAddressTableLookupsLength),
      serializedAddressTableLookups
    }, serializedMessage);
    return serializedMessage.slice(0, serializedMessageLength);
  }
  serializeInstructions() {
    let serializedLength = 0;
    const serializedInstructions = new Uint8Array(PACKET_DATA_SIZE);
    for (const instruction of this.compiledInstructions) {
      const encodedAccountKeyIndexesLength = Array();
      encodeLength(encodedAccountKeyIndexesLength, instruction.accountKeyIndexes.length);
      const encodedDataLength = Array();
      encodeLength(encodedDataLength, instruction.data.length);
      const instructionLayout = BufferLayout__namespace.struct([BufferLayout__namespace.u8('programIdIndex'), BufferLayout__namespace.blob(encodedAccountKeyIndexesLength.length, 'encodedAccountKeyIndexesLength'), BufferLayout__namespace.seq(BufferLayout__namespace.u8(), instruction.accountKeyIndexes.length, 'accountKeyIndexes'), BufferLayout__namespace.blob(encodedDataLength.length, 'encodedDataLength'), BufferLayout__namespace.blob(instruction.data.length, 'data')]);
      serializedLength += instructionLayout.encode({
        programIdIndex: instruction.programIdIndex,
        encodedAccountKeyIndexesLength: new Uint8Array(encodedAccountKeyIndexesLength),
        accountKeyIndexes: instruction.accountKeyIndexes,
        encodedDataLength: new Uint8Array(encodedDataLength),
        data: instruction.data
      }, serializedInstructions, serializedLength);
    }
    return serializedInstructions.slice(0, serializedLength);
  }
  serializeAddressTableLookups() {
    let serializedLength = 0;
    const serializedAddressTableLookups = new Uint8Array(PACKET_DATA_SIZE);
    for (const lookup of this.addressTableLookups) {
      const encodedWritableIndexesLength = Array();
      encodeLength(encodedWritableIndexesLength, lookup.writableIndexes.length);
      const encodedReadonlyIndexesLength = Array();
      encodeLength(encodedReadonlyIndexesLength, lookup.readonlyIndexes.length);
      const addressTableLookupLayout = BufferLayout__namespace.struct([publicKey('accountKey'), BufferLayout__namespace.blob(encodedWritableIndexesLength.length, 'encodedWritableIndexesLength'), BufferLayout__namespace.seq(BufferLayout__namespace.u8(), lookup.writableIndexes.length, 'writableIndexes'), BufferLayout__namespace.blob(encodedReadonlyIndexesLength.length, 'encodedReadonlyIndexesLength'), BufferLayout__namespace.seq(BufferLayout__namespace.u8(), lookup.readonlyIndexes.length, 'readonlyIndexes')]);
      serializedLength += addressTableLookupLayout.encode({
        accountKey: lookup.accountKey.toBytes(),
        encodedWritableIndexesLength: new Uint8Array(encodedWritableIndexesLength),
        writableIndexes: lookup.writableIndexes,
        encodedReadonlyIndexesLength: new Uint8Array(encodedReadonlyIndexesLength),
        readonlyIndexes: lookup.readonlyIndexes
      }, serializedAddressTableLookups, serializedLength);
    }
    return serializedAddressTableLookups.slice(0, serializedLength);
  }
  static deserialize(serializedMessage) {
    let byteArray = [...serializedMessage];
    const prefix = guardedShift(byteArray);
    const maskedPrefix = prefix & VERSION_PREFIX_MASK;
    assert(prefix !== maskedPrefix, `Expected versioned message but received legacy message`);
    const version = maskedPrefix;
    assert(version === 0, `Expected versioned message with version 0 but found version ${version}`);
    const header = {
      numRequiredSignatures: guardedShift(byteArray),
      numReadonlySignedAccounts: guardedShift(byteArray),
      numReadonlyUnsignedAccounts: guardedShift(byteArray)
    };
    const staticAccountKeys = [];
    const staticAccountKeysLength = decodeLength(byteArray);
    for (let i = 0; i < staticAccountKeysLength; i++) {
      staticAccountKeys.push(new PublicKey(guardedSplice(byteArray, 0, PUBLIC_KEY_LENGTH)));
    }
    const recentBlockhash = bs58__default.default.encode(guardedSplice(byteArray, 0, PUBLIC_KEY_LENGTH));
    const instructionCount = decodeLength(byteArray);
    const compiledInstructions = [];
    for (let i = 0; i < instructionCount; i++) {
      const programIdIndex = guardedShift(byteArray);
      const accountKeyIndexesLength = decodeLength(byteArray);
      const accountKeyIndexes = guardedSplice(byteArray, 0, accountKeyIndexesLength);
      const dataLength = decodeLength(byteArray);
      const data = new Uint8Array(guardedSplice(byteArray, 0, dataLength));
      compiledInstructions.push({
        programIdIndex,
        accountKeyIndexes,
        data
      });
    }
    const addressTableLookupsCount = decodeLength(byteArray);
    const addressTableLookups = [];
    for (let i = 0; i < addressTableLookupsCount; i++) {
      const accountKey = new PublicKey(guardedSplice(byteArray, 0, PUBLIC_KEY_LENGTH));
      const writableIndexesLength = decodeLength(byteArray);
      const writableIndexes = guardedSplice(byteArray, 0, writableIndexesLength);
      const readonlyIndexesLength = decodeLength(byteArray);
      const readonlyIndexes = guardedSplice(byteArray, 0, readonlyIndexesLength);
      addressTableLookups.push({
        accountKey,
        writableIndexes,
        readonlyIndexes
      });
    }
    return new MessageV0({
      header,
      staticAccountKeys,
      recentBlockhash,
      compiledInstructions,
      addressTableLookups
    });
  }
}

// eslint-disable-next-line no-redeclare
const VersionedMessage = {
  deserializeMessageVersion(serializedMessage) {
    const prefix = serializedMessage[0];
    const maskedPrefix = prefix & VERSION_PREFIX_MASK;

    // if the highest bit of the prefix is not set, the message is not versioned
    if (maskedPrefix === prefix) {
      return 'legacy';
    }

    // the lower 7 bits of the prefix indicate the message version
    return maskedPrefix;
  },
  deserialize: serializedMessage => {
    const version = VersionedMessage.deserializeMessageVersion(serializedMessage);
    if (version === 'legacy') {
      return Message.from(serializedMessage);
    }
    if (version === 0) {
      return MessageV0.deserialize(serializedMessage);
    } else {
      throw new Error(`Transaction message version ${version} deserialization is not supported`);
    }
  }
};

/** @internal */

/**
 * Transaction signature as base-58 encoded string
 */

let TransactionStatus = /*#__PURE__*/function (TransactionStatus) {
  TransactionStatus[TransactionStatus["BLOCKHEIGHT_EXCEEDED"] = 0] = "BLOCKHEIGHT_EXCEEDED";
  TransactionStatus[TransactionStatus["PROCESSED"] = 1] = "PROCESSED";
  TransactionStatus[TransactionStatus["TIMED_OUT"] = 2] = "TIMED_OUT";
  TransactionStatus[TransactionStatus["NONCE_INVALID"] = 3] = "NONCE_INVALID";
  return TransactionStatus;
}({});

/**
 * Default (empty) signature
 */
const DEFAULT_SIGNATURE = buffer.Buffer.alloc(SIGNATURE_LENGTH_IN_BYTES).fill(0);

/**
 * Account metadata used to define instructions
 */

/**
 * List of TransactionInstruction object fields that may be initialized at construction
 */

/**
 * Configuration object for Transaction.serialize()
 */

/**
 * @internal
 */

/**
 * Transaction Instruction class
 */
class TransactionInstruction {
  constructor(opts) {
    /**
     * Public keys to include in this transaction
     * Boolean represents whether this pubkey needs to sign the transaction
     */
    this.keys = void 0;
    /**
     * Program Id to execute
     */
    this.programId = void 0;
    /**
     * Program input
     */
    this.data = buffer.Buffer.alloc(0);
    this.programId = opts.programId;
    this.keys = opts.keys;
    if (opts.data) {
      this.data = opts.data;
    }
  }

  /**
   * @internal
   */
  toJSON() {
    return {
      keys: this.keys.map(({
        pubkey,
        isSigner,
        isWritable
      }) => ({
        pubkey: pubkey.toJSON(),
        isSigner,
        isWritable
      })),
      programId: this.programId.toJSON(),
      data: [...this.data]
    };
  }
}

/**
 * Pair of signature and corresponding public key
 */

/**
 * List of Transaction object fields that may be initialized at construction
 */

// For backward compatibility; an unfortunate consequence of being
// forced to over-export types by the documentation generator.
// See https://github.com/solana-labs/solana/pull/25820

/**
 * Blockhash-based transactions have a lifetime that are defined by
 * the blockhash they include. Any transaction whose blockhash is
 * too old will be rejected.
 */

/**
 * Use these options to construct a durable nonce transaction.
 */

/**
 * Nonce information to be used to build an offline Transaction.
 */

/**
 * @internal
 */

/**
 * Transaction class
 */
class Transaction {
  /**
   * The first (payer) Transaction signature
   *
   * @returns {Buffer | null} Buffer of payer's signature
   */
  get signature() {
    if (this.signatures.length > 0) {
      return this.signatures[0].signature;
    }
    return null;
  }

  /**
   * The transaction fee payer
   */

  // Construct a transaction with a blockhash and lastValidBlockHeight

  // Construct a transaction using a durable nonce

  /**
   * @deprecated `TransactionCtorFields` has been deprecated and will be removed in a future version.
   * Please supply a `TransactionBlockhashCtor` instead.
   */

  /**
   * Construct an empty Transaction
   */
  constructor(opts) {
    /**
     * Signatures for the transaction.  Typically created by invoking the
     * `sign()` method
     */
    this.signatures = [];
    this.feePayer = void 0;
    /**
     * The instructions to atomically execute
     */
    this.instructions = [];
    /**
     * A recent transaction id. Must be populated by the caller
     */
    this.recentBlockhash = void 0;
    /**
     * the last block chain can advance to before tx is declared expired
     * */
    this.lastValidBlockHeight = void 0;
    /**
     * Optional Nonce information. If populated, transaction will use a durable
     * Nonce hash instead of a recentBlockhash. Must be populated by the caller
     */
    this.nonceInfo = void 0;
    /**
     * If this is a nonce transaction this represents the minimum slot from which
     * to evaluate if the nonce has advanced when attempting to confirm the
     * transaction. This protects against a case where the transaction confirmation
     * logic loads the nonce account from an old slot and assumes the mismatch in
     * nonce value implies that the nonce has been advanced.
     */
    this.minNonceContextSlot = void 0;
    /**
     * @internal
     */
    this._message = void 0;
    /**
     * @internal
     */
    this._json = void 0;
    if (!opts) {
      return;
    }
    if (opts.feePayer) {
      this.feePayer = opts.feePayer;
    }
    if (opts.signatures) {
      this.signatures = opts.signatures;
    }
    if (Object.prototype.hasOwnProperty.call(opts, 'nonceInfo')) {
      const {
        minContextSlot,
        nonceInfo
      } = opts;
      this.minNonceContextSlot = minContextSlot;
      this.nonceInfo = nonceInfo;
    } else if (Object.prototype.hasOwnProperty.call(opts, 'lastValidBlockHeight')) {
      const {
        blockhash,
        lastValidBlockHeight
      } = opts;
      this.recentBlockhash = blockhash;
      this.lastValidBlockHeight = lastValidBlockHeight;
    } else {
      const {
        recentBlockhash,
        nonceInfo
      } = opts;
      if (nonceInfo) {
        this.nonceInfo = nonceInfo;
      }
      this.recentBlockhash = recentBlockhash;
    }
  }

  /**
   * @internal
   */
  toJSON() {
    return {
      recentBlockhash: this.recentBlockhash || null,
      feePayer: this.feePayer ? this.feePayer.toJSON() : null,
      nonceInfo: this.nonceInfo ? {
        nonce: this.nonceInfo.nonce,
        nonceInstruction: this.nonceInfo.nonceInstruction.toJSON()
      } : null,
      instructions: this.instructions.map(instruction => instruction.toJSON()),
      signers: this.signatures.map(({
        publicKey
      }) => {
        return publicKey.toJSON();
      })
    };
  }

  /**
   * Add one or more instructions to this Transaction
   *
   * @param {Array< Transaction | TransactionInstruction | TransactionInstructionCtorFields >} items - Instructions to add to the Transaction
   */
  add(...items) {
    if (items.length === 0) {
      throw new Error('No instructions');
    }
    items.forEach(item => {
      if ('instructions' in item) {
        this.instructions = this.instructions.concat(item.instructions);
      } else if ('data' in item && 'programId' in item && 'keys' in item) {
        this.instructions.push(item);
      } else {
        this.instructions.push(new TransactionInstruction(item));
      }
    });
    return this;
  }

  /**
   * Compile transaction data
   */
  compileMessage() {
    if (this._message && JSON.stringify(this.toJSON()) === JSON.stringify(this._json)) {
      return this._message;
    }
    let recentBlockhash;
    let instructions;
    if (this.nonceInfo) {
      recentBlockhash = this.nonceInfo.nonce;
      if (this.instructions[0] != this.nonceInfo.nonceInstruction) {
        instructions = [this.nonceInfo.nonceInstruction, ...this.instructions];
      } else {
        instructions = this.instructions;
      }
    } else {
      recentBlockhash = this.recentBlockhash;
      instructions = this.instructions;
    }
    if (!recentBlockhash) {
      throw new Error('Transaction recentBlockhash required');
    }
    if (instructions.length < 1) {
      console.warn('No instructions provided');
    }
    let feePayer;
    if (this.feePayer) {
      feePayer = this.feePayer;
    } else if (this.signatures.length > 0 && this.signatures[0].publicKey) {
      // Use implicit fee payer
      feePayer = this.signatures[0].publicKey;
    } else {
      throw new Error('Transaction fee payer required');
    }
    for (let i = 0; i < instructions.length; i++) {
      if (instructions[i].programId === undefined) {
        throw new Error(`Transaction instruction index ${i} has undefined program id`);
      }
    }
    const programIds = [];
    const accountMetas = [];
    instructions.forEach(instruction => {
      instruction.keys.forEach(accountMeta => {
        accountMetas.push({
          ...accountMeta
        });
      });
      const programId = instruction.programId.toString();
      if (!programIds.includes(programId)) {
        programIds.push(programId);
      }
    });

    // Append programID account metas
    programIds.forEach(programId => {
      accountMetas.push({
        pubkey: new PublicKey(programId),
        isSigner: false,
        isWritable: false
      });
    });

    // Cull duplicate account metas
    const uniqueMetas = [];
    accountMetas.forEach(accountMeta => {
      const pubkeyString = accountMeta.pubkey.toString();
      const uniqueIndex = uniqueMetas.findIndex(x => {
        return x.pubkey.toString() === pubkeyString;
      });
      if (uniqueIndex > -1) {
        uniqueMetas[uniqueIndex].isWritable = uniqueMetas[uniqueIndex].isWritable || accountMeta.isWritable;
        uniqueMetas[uniqueIndex].isSigner = uniqueMetas[uniqueIndex].isSigner || accountMeta.isSigner;
      } else {
        uniqueMetas.push(accountMeta);
      }
    });

    // Sort. Prioritizing first by signer, then by writable
    uniqueMetas.sort(function (x, y) {
      if (x.isSigner !== y.isSigner) {
        // Signers always come before non-signers
        return x.isSigner ? -1 : 1;
      }
      if (x.isWritable !== y.isWritable) {
        // Writable accounts always come before read-only accounts
        return x.isWritable ? -1 : 1;
      }
      // Otherwise, sort by pubkey, stringwise.
      const options = {
        localeMatcher: 'best fit',
        usage: 'sort',
        sensitivity: 'variant',
        ignorePunctuation: false,
        numeric: false,
        caseFirst: 'lower'
      };
      return x.pubkey.toBase58().localeCompare(y.pubkey.toBase58(), 'en', options);
    });

    // Move fee payer to the front
    const feePayerIndex = uniqueMetas.findIndex(x => {
      return x.pubkey.equals(feePayer);
    });
    if (feePayerIndex > -1) {
      const [payerMeta] = uniqueMetas.splice(feePayerIndex, 1);
      payerMeta.isSigner = true;
      payerMeta.isWritable = true;
      uniqueMetas.unshift(payerMeta);
    } else {
      uniqueMetas.unshift({
        pubkey: feePayer,
        isSigner: true,
        isWritable: true
      });
    }

    // Disallow unknown signers
    for (const signature of this.signatures) {
      const uniqueIndex = uniqueMetas.findIndex(x => {
        return x.pubkey.equals(signature.publicKey);
      });
      if (uniqueIndex > -1) {
        if (!uniqueMetas[uniqueIndex].isSigner) {
          uniqueMetas[uniqueIndex].isSigner = true;
          console.warn('Transaction references a signature that is unnecessary, ' + 'only the fee payer and instruction signer accounts should sign a transaction. ' + 'This behavior is deprecated and will throw an error in the next major version release.');
        }
      } else {
        throw new Error(`unknown signer: ${signature.publicKey.toString()}`);
      }
    }
    let numRequiredSignatures = 0;
    let numReadonlySignedAccounts = 0;
    let numReadonlyUnsignedAccounts = 0;

    // Split out signing from non-signing keys and count header values
    const signedKeys = [];
    const unsignedKeys = [];
    uniqueMetas.forEach(({
      pubkey,
      isSigner,
      isWritable
    }) => {
      if (isSigner) {
        signedKeys.push(pubkey.toString());
        numRequiredSignatures += 1;
        if (!isWritable) {
          numReadonlySignedAccounts += 1;
        }
      } else {
        unsignedKeys.push(pubkey.toString());
        if (!isWritable) {
          numReadonlyUnsignedAccounts += 1;
        }
      }
    });
    const accountKeys = signedKeys.concat(unsignedKeys);
    const compiledInstructions = instructions.map(instruction => {
      const {
        data,
        programId
      } = instruction;
      return {
        programIdIndex: accountKeys.indexOf(programId.toString()),
        accounts: instruction.keys.map(meta => accountKeys.indexOf(meta.pubkey.toString())),
        data: bs58__default.default.encode(data)
      };
    });
    compiledInstructions.forEach(instruction => {
      assert(instruction.programIdIndex >= 0);
      instruction.accounts.forEach(keyIndex => assert(keyIndex >= 0));
    });
    return new Message({
      header: {
        numRequiredSignatures,
        numReadonlySignedAccounts,
        numReadonlyUnsignedAccounts
      },
      accountKeys,
      recentBlockhash,
      instructions: compiledInstructions
    });
  }

  /**
   * @internal
   */
  _compile() {
    const message = this.compileMessage();
    const signedKeys = message.accountKeys.slice(0, message.header.numRequiredSignatures);
    if (this.signatures.length === signedKeys.length) {
      const valid = this.signatures.every((pair, index) => {
        return signedKeys[index].equals(pair.publicKey);
      });
      if (valid) return message;
    }
    this.signatures = signedKeys.map(publicKey => ({
      signature: null,
      publicKey
    }));
    return message;
  }

  /**
   * Get a buffer of the Transaction data that need to be covered by signatures
   */
  serializeMessage() {
    return this._compile().serialize();
  }

  /**
   * Get the estimated fee associated with a transaction
   *
   * @param {Connection} connection Connection to RPC Endpoint.
   *
   * @returns {Promise<number | null>} The estimated fee for the transaction
   */
  async getEstimatedFee(connection) {
    return (await connection.getFeeForMessage(this.compileMessage())).value;
  }

  /**
   * Specify the public keys which will be used to sign the Transaction.
   * The first signer will be used as the transaction fee payer account.
   *
   * Signatures can be added with either `partialSign` or `addSignature`
   *
   * @deprecated Deprecated since v0.84.0. Only the fee payer needs to be
   * specified and it can be set in the Transaction constructor or with the
   * `feePayer` property.
   */
  setSigners(...signers) {
    if (signers.length === 0) {
      throw new Error('No signers');
    }
    const seen = new Set();
    this.signatures = signers.filter(publicKey => {
      const key = publicKey.toString();
      if (seen.has(key)) {
        return false;
      } else {
        seen.add(key);
        return true;
      }
    }).map(publicKey => ({
      signature: null,
      publicKey
    }));
  }

  /**
   * Sign the Transaction with the specified signers. Multiple signatures may
   * be applied to a Transaction. The first signature is considered "primary"
   * and is used identify and confirm transactions.
   *
   * If the Transaction `feePayer` is not set, the first signer will be used
   * as the transaction fee payer account.
   *
   * Transaction fields should not be modified after the first call to `sign`,
   * as doing so may invalidate the signature and cause the Transaction to be
   * rejected.
   *
   * The Transaction must be assigned a valid `recentBlockhash` before invoking this method
   *
   * @param {Array<Signer>} signers Array of signers that will sign the transaction
   */
  sign(...signers) {
    if (signers.length === 0) {
      throw new Error('No signers');
    }

    // Dedupe signers
    const seen = new Set();
    const uniqueSigners = [];
    for (const signer of signers) {
      const key = signer.publicKey.toString();
      if (seen.has(key)) {
        continue;
      } else {
        seen.add(key);
        uniqueSigners.push(signer);
      }
    }
    this.signatures = uniqueSigners.map(signer => ({
      signature: null,
      publicKey: signer.publicKey
    }));
    const message = this._compile();
    this._partialSign(message, ...uniqueSigners);
  }

  /**
   * Partially sign a transaction with the specified accounts. All accounts must
   * correspond to either the fee payer or a signer account in the transaction
   * instructions.
   *
   * All the caveats from the `sign` method apply to `partialSign`
   *
   * @param {Array<Signer>} signers Array of signers that will sign the transaction
   */
  partialSign(...signers) {
    if (signers.length === 0) {
      throw new Error('No signers');
    }

    // Dedupe signers
    const seen = new Set();
    const uniqueSigners = [];
    for (const signer of signers) {
      const key = signer.publicKey.toString();
      if (seen.has(key)) {
        continue;
      } else {
        seen.add(key);
        uniqueSigners.push(signer);
      }
    }
    const message = this._compile();
    this._partialSign(message, ...uniqueSigners);
  }

  /**
   * @internal
   */
  _partialSign(message, ...signers) {
    const signData = message.serialize();
    signers.forEach(signer => {
      const signature = sign(signData, signer.secretKey);
      this._addSignature(signer.publicKey, toBuffer(signature));
    });
  }

  /**
   * Add an externally created signature to a transaction. The public key
   * must correspond to either the fee payer or a signer account in the transaction
   * instructions.
   *
   * @param {PublicKey} pubkey Public key that will be added to the transaction.
   * @param {Buffer} signature An externally created signature to add to the transaction.
   */
  addSignature(pubkey, signature) {
    this._compile(); // Ensure signatures array is populated
    this._addSignature(pubkey, signature);
  }

  /**
   * @internal
   */
  _addSignature(pubkey, signature) {
    assert(signature.length === 64);
    const index = this.signatures.findIndex(sigpair => pubkey.equals(sigpair.publicKey));
    if (index < 0) {
      throw new Error(`unknown signer: ${pubkey.toString()}`);
    }
    this.signatures[index].signature = buffer.Buffer.from(signature);
  }

  /**
   * Verify signatures of a Transaction
   * Optional parameter specifies if we're expecting a fully signed Transaction or a partially signed one.
   * If no boolean is provided, we expect a fully signed Transaction by default.
   *
   * @param {boolean} [requireAllSignatures=true] Require a fully signed Transaction
   */
  verifySignatures(requireAllSignatures = true) {
    const signatureErrors = this._getMessageSignednessErrors(this.serializeMessage(), requireAllSignatures);
    return !signatureErrors;
  }

  /**
   * @internal
   */
  _getMessageSignednessErrors(message, requireAllSignatures) {
    const errors = {};
    for (const {
      signature,
      publicKey
    } of this.signatures) {
      if (signature === null) {
        if (requireAllSignatures) {
          (errors.missing ||= []).push(publicKey);
        }
      } else {
        if (!verify(signature, message, publicKey.toBytes())) {
          (errors.invalid ||= []).push(publicKey);
        }
      }
    }
    return errors.invalid || errors.missing ? errors : undefined;
  }

  /**
   * Serialize the Transaction in the wire format.
   *
   * @param {Buffer} [config] Config of transaction.
   *
   * @returns {Buffer} Signature of transaction in wire format.
   */
  serialize(config) {
    const {
      requireAllSignatures,
      verifySignatures
    } = Object.assign({
      requireAllSignatures: true,
      verifySignatures: true
    }, config);
    const signData = this.serializeMessage();
    if (verifySignatures) {
      const sigErrors = this._getMessageSignednessErrors(signData, requireAllSignatures);
      if (sigErrors) {
        let errorMessage = 'Signature verification failed.';
        if (sigErrors.invalid) {
          errorMessage += `\nInvalid signature for public key${sigErrors.invalid.length === 1 ? '' : '(s)'} [\`${sigErrors.invalid.map(p => p.toBase58()).join('`, `')}\`].`;
        }
        if (sigErrors.missing) {
          errorMessage += `\nMissing signature for public key${sigErrors.missing.length === 1 ? '' : '(s)'} [\`${sigErrors.missing.map(p => p.toBase58()).join('`, `')}\`].`;
        }
        throw new Error(errorMessage);
      }
    }
    return this._serialize(signData);
  }

  /**
   * @internal
   */
  _serialize(signData) {
    const {
      signatures
    } = this;
    const signatureCount = [];
    encodeLength(signatureCount, signatures.length);
    const transactionLength = signatureCount.length + signatures.length * 64 + signData.length;
    const wireTransaction = buffer.Buffer.alloc(transactionLength);
    assert(signatures.length < 256);
    buffer.Buffer.from(signatureCount).copy(wireTransaction, 0);
    signatures.forEach(({
      signature
    }, index) => {
      if (signature !== null) {
        assert(signature.length === 64, `signature has invalid length`);
        buffer.Buffer.from(signature).copy(wireTransaction, signatureCount.length + index * 64);
      }
    });
    signData.copy(wireTransaction, signatureCount.length + signatures.length * 64);
    assert(wireTransaction.length <= PACKET_DATA_SIZE, `Transaction too large: ${wireTransaction.length} > ${PACKET_DATA_SIZE}`);
    return wireTransaction;
  }

  /**
   * Deprecated method
   * @internal
   */
  get keys() {
    assert(this.instructions.length === 1);
    return this.instructions[0].keys.map(keyObj => keyObj.pubkey);
  }

  /**
   * Deprecated method
   * @internal
   */
  get programId() {
    assert(this.instructions.length === 1);
    return this.instructions[0].programId;
  }

  /**
   * Deprecated method
   * @internal
   */
  get data() {
    assert(this.instructions.length === 1);
    return this.instructions[0].data;
  }

  /**
   * Parse a wire transaction into a Transaction object.
   *
   * @param {Buffer | Uint8Array | Array<number>} buffer Signature of wire Transaction
   *
   * @returns {Transaction} Transaction associated with the signature
   */
  static from(buffer$1) {
    // Slice up wire data
    let byteArray = [...buffer$1];
    const signatureCount = decodeLength(byteArray);
    let signatures = [];
    for (let i = 0; i < signatureCount; i++) {
      const signature = guardedSplice(byteArray, 0, SIGNATURE_LENGTH_IN_BYTES);
      signatures.push(bs58__default.default.encode(buffer.Buffer.from(signature)));
    }
    return Transaction.populate(Message.from(byteArray), signatures);
  }

  /**
   * Populate Transaction object from message and signatures
   *
   * @param {Message} message Message of transaction
   * @param {Array<string>} signatures List of signatures to assign to the transaction
   *
   * @returns {Transaction} The populated Transaction
   */
  static populate(message, signatures = []) {
    const transaction = new Transaction();
    transaction.recentBlockhash = message.recentBlockhash;
    if (message.header.numRequiredSignatures > 0) {
      transaction.feePayer = message.accountKeys[0];
    }
    signatures.forEach((signature, index) => {
      const sigPubkeyPair = {
        signature: signature == bs58__default.default.encode(DEFAULT_SIGNATURE) ? null : bs58__default.default.decode(signature),
        publicKey: message.accountKeys[index]
      };
      transaction.signatures.push(sigPubkeyPair);
    });
    message.instructions.forEach(instruction => {
      const keys = instruction.accounts.map(account => {
        const pubkey = message.accountKeys[account];
        return {
          pubkey,
          isSigner: transaction.signatures.some(keyObj => keyObj.publicKey.toString() === pubkey.toString()) || message.isAccountSigner(account),
          isWritable: message.isAccountWritable(account)
        };
      });
      transaction.instructions.push(new TransactionInstruction({
        keys,
        programId: message.accountKeys[instruction.programIdIndex],
        data: bs58__default.default.decode(instruction.data)
      }));
    });
    transaction._message = message;
    transaction._json = transaction.toJSON();
    return transaction;
  }
}

class TransactionMessage {
  constructor(args) {
    this.payerKey = void 0;
    this.instructions = void 0;
    this.recentBlockhash = void 0;
    this.payerKey = args.payerKey;
    this.instructions = args.instructions;
    this.recentBlockhash = args.recentBlockhash;
  }
  static decompile(message, args) {
    const {
      header,
      compiledInstructions,
      recentBlockhash
    } = message;
    const {
      numRequiredSignatures,
      numReadonlySignedAccounts,
      numReadonlyUnsignedAccounts
    } = header;
    const numWritableSignedAccounts = numRequiredSignatures - numReadonlySignedAccounts;
    assert(numWritableSignedAccounts > 0, 'Message header is invalid');
    const numWritableUnsignedAccounts = message.staticAccountKeys.length - numRequiredSignatures - numReadonlyUnsignedAccounts;
    assert(numWritableUnsignedAccounts >= 0, 'Message header is invalid');
    const accountKeys = message.getAccountKeys(args);
    const payerKey = accountKeys.get(0);
    if (payerKey === undefined) {
      throw new Error('Failed to decompile message because no account keys were found');
    }
    const instructions = [];
    for (const compiledIx of compiledInstructions) {
      const keys = [];
      for (const keyIndex of compiledIx.accountKeyIndexes) {
        const pubkey = accountKeys.get(keyIndex);
        if (pubkey === undefined) {
          throw new Error(`Failed to find key for account key index ${keyIndex}`);
        }
        const isSigner = keyIndex < numRequiredSignatures;
        let isWritable;
        if (isSigner) {
          isWritable = keyIndex < numWritableSignedAccounts;
        } else if (keyIndex < accountKeys.staticAccountKeys.length) {
          isWritable = keyIndex - numRequiredSignatures < numWritableUnsignedAccounts;
        } else {
          isWritable = keyIndex - accountKeys.staticAccountKeys.length <
          // accountKeysFromLookups cannot be undefined because we already found a pubkey for this index above
          accountKeys.accountKeysFromLookups.writable.length;
        }
        keys.push({
          pubkey,
          isSigner: keyIndex < header.numRequiredSignatures,
          isWritable
        });
      }
      const programId = accountKeys.get(compiledIx.programIdIndex);
      if (programId === undefined) {
        throw new Error(`Failed to find program id for program id index ${compiledIx.programIdIndex}`);
      }
      instructions.push(new TransactionInstruction({
        programId,
        data: toBuffer(compiledIx.data),
        keys
      }));
    }
    return new TransactionMessage({
      payerKey,
      instructions,
      recentBlockhash
    });
  }
  compileToLegacyMessage() {
    return Message.compile({
      payerKey: this.payerKey,
      recentBlockhash: this.recentBlockhash,
      instructions: this.instructions
    });
  }
  compileToV0Message(addressLookupTableAccounts) {
    return MessageV0.compile({
      payerKey: this.payerKey,
      recentBlockhash: this.recentBlockhash,
      instructions: this.instructions,
      addressLookupTableAccounts
    });
  }
}

/**
 * Versioned transaction class
 */
class VersionedTransaction {
  get version() {
    return this.message.version;
  }
  constructor(message, signatures) {
    this.signatures = void 0;
    this.message = void 0;
    if (signatures !== undefined) {
      assert(signatures.length === message.header.numRequiredSignatures, 'Expected signatures length to be equal to the number of required signatures');
      this.signatures = signatures;
    } else {
      const defaultSignatures = [];
      for (let i = 0; i < message.header.numRequiredSignatures; i++) {
        defaultSignatures.push(new Uint8Array(SIGNATURE_LENGTH_IN_BYTES));
      }
      this.signatures = defaultSignatures;
    }
    this.message = message;
  }
  serialize() {
    const serializedMessage = this.message.serialize();
    const encodedSignaturesLength = Array();
    encodeLength(encodedSignaturesLength, this.signatures.length);
    const transactionLayout = BufferLayout__namespace.struct([BufferLayout__namespace.blob(encodedSignaturesLength.length, 'encodedSignaturesLength'), BufferLayout__namespace.seq(signature(), this.signatures.length, 'signatures'), BufferLayout__namespace.blob(serializedMessage.length, 'serializedMessage')]);
    const serializedTransaction = new Uint8Array(2048);
    const serializedTransactionLength = transactionLayout.encode({
      encodedSignaturesLength: new Uint8Array(encodedSignaturesLength),
      signatures: this.signatures,
      serializedMessage
    }, serializedTransaction);
    return serializedTransaction.slice(0, serializedTransactionLength);
  }
  static deserialize(serializedTransaction) {
    let byteArray = [...serializedTransaction];
    const signatures = [];
    const signaturesLength = decodeLength(byteArray);
    for (let i = 0; i < signaturesLength; i++) {
      signatures.push(new Uint8Array(guardedSplice(byteArray, 0, SIGNATURE_LENGTH_IN_BYTES)));
    }
    const message = VersionedMessage.deserialize(new Uint8Array(byteArray));
    return new VersionedTransaction(message, signatures);
  }
  sign(signers) {
    const messageData = this.message.serialize();
    const signerPubkeys = this.message.staticAccountKeys.slice(0, this.message.header.numRequiredSignatures);
    for (const signer of signers) {
      const signerIndex = signerPubkeys.findIndex(pubkey => pubkey.equals(signer.publicKey));
      assert(signerIndex >= 0, `Cannot sign with non signer key ${signer.publicKey.toBase58()}`);
      this.signatures[signerIndex] = sign(messageData, signer.secretKey);
    }
  }
  addSignature(publicKey, signature) {
    assert(signature.byteLength === 64, 'Signature must be 64 bytes long');
    const signerPubkeys = this.message.staticAccountKeys.slice(0, this.message.header.numRequiredSignatures);
    const signerIndex = signerPubkeys.findIndex(pubkey => pubkey.equals(publicKey));
    assert(signerIndex >= 0, `Can not add signature; \`${publicKey.toBase58()}\` is not required to sign this transaction`);
    this.signatures[signerIndex] = signature;
  }
}

// TODO: These constants should be removed in favor of reading them out of a
// Syscall account

/**
 * @internal
 */
const NUM_TICKS_PER_SECOND = 160;

/**
 * @internal
 */
const DEFAULT_TICKS_PER_SLOT = 64;

/**
 * @internal
 */
const NUM_SLOTS_PER_SECOND = NUM_TICKS_PER_SECOND / DEFAULT_TICKS_PER_SLOT;

/**
 * @internal
 */
const MS_PER_SLOT = 1000 / NUM_SLOTS_PER_SECOND;

const SYSVAR_CLOCK_PUBKEY = new PublicKey('SysvarC1ock11111111111111111111111111111111');
const SYSVAR_EPOCH_SCHEDULE_PUBKEY = new PublicKey('SysvarEpochSchedu1e111111111111111111111111');
const SYSVAR_INSTRUCTIONS_PUBKEY = new PublicKey('Sysvar1nstructions1111111111111111111111111');
const SYSVAR_RECENT_BLOCKHASHES_PUBKEY = new PublicKey('SysvarRecentB1ockHashes11111111111111111111');
const SYSVAR_RENT_PUBKEY = new PublicKey('SysvarRent111111111111111111111111111111111');
const SYSVAR_REWARDS_PUBKEY = new PublicKey('SysvarRewards111111111111111111111111111111');
const SYSVAR_SLOT_HASHES_PUBKEY = new PublicKey('SysvarS1otHashes111111111111111111111111111');
const SYSVAR_SLOT_HISTORY_PUBKEY = new PublicKey('SysvarS1otHistory11111111111111111111111111');
const SYSVAR_STAKE_HISTORY_PUBKEY = new PublicKey('SysvarStakeHistory1111111111111111111111111');

class SendTransactionError extends Error {
  constructor({
    action,
    signature,
    transactionMessage,
    logs
  }) {
    const maybeLogsOutput = logs ? `Logs: \n${JSON.stringify(logs.slice(-10), null, 2)}. ` : '';
    const guideText = '\nCatch the `SendTransactionError` and call `getLogs()` on it for full details.';
    let message;
    switch (action) {
      case 'send':
        message = `Transaction ${signature} resulted in an error. \n` + `${transactionMessage}. ` + maybeLogsOutput + guideText;
        break;
      case 'simulate':
        message = `Simulation failed. \nMessage: ${transactionMessage}. \n` + maybeLogsOutput + guideText;
        break;
      default:
        {
          message = `Unknown action '${(a => a)(action)}'`;
        }
    }
    super(message);
    this.signature = void 0;
    this.transactionMessage = void 0;
    this.transactionLogs = void 0;
    this.signature = signature;
    this.transactionMessage = transactionMessage;
    this.transactionLogs = logs ? logs : undefined;
  }
  get transactionError() {
    return {
      message: this.transactionMessage,
      logs: Array.isArray(this.transactionLogs) ? this.transactionLogs : undefined
    };
  }

  /* @deprecated Use `await getLogs()` instead */
  get logs() {
    const cachedLogs = this.transactionLogs;
    if (cachedLogs != null && typeof cachedLogs === 'object' && 'then' in cachedLogs) {
      return undefined;
    }
    return cachedLogs;
  }
  async getLogs(connection) {
    if (!Array.isArray(this.transactionLogs)) {
      this.transactionLogs = new Promise((resolve, reject) => {
        connection.getTransaction(this.signature).then(tx => {
          if (tx && tx.meta && tx.meta.logMessages) {
            const logs = tx.meta.logMessages;
            this.transactionLogs = logs;
            resolve(logs);
          } else {
            reject(new Error('Log messages not found'));
          }
        }).catch(reject);
      });
    }
    return await this.transactionLogs;
  }
}

// Keep in sync with client/src/rpc_custom_errors.rs
// Typescript `enums` thwart tree-shaking. See https://bargsten.org/jsts/enums/
const SolanaJSONRPCErrorCode = {
  JSON_RPC_SERVER_ERROR_BLOCK_CLEANED_UP: -32001,
  JSON_RPC_SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE: -32002,
  JSON_RPC_SERVER_ERROR_TRANSACTION_SIGNATURE_VERIFICATION_FAILURE: -32003,
  JSON_RPC_SERVER_ERROR_BLOCK_NOT_AVAILABLE: -32004,
  JSON_RPC_SERVER_ERROR_NODE_UNHEALTHY: -32005,
  JSON_RPC_SERVER_ERROR_TRANSACTION_PRECOMPILE_VERIFICATION_FAILURE: -32006,
  JSON_RPC_SERVER_ERROR_SLOT_SKIPPED: -32007,
  JSON_RPC_SERVER_ERROR_NO_SNAPSHOT: -32008,
  JSON_RPC_SERVER_ERROR_LONG_TERM_STORAGE_SLOT_SKIPPED: -32009,
  JSON_RPC_SERVER_ERROR_KEY_EXCLUDED_FROM_SECONDARY_INDEX: -32010,
  JSON_RPC_SERVER_ERROR_TRANSACTION_HISTORY_NOT_AVAILABLE: -32011,
  JSON_RPC_SCAN_ERROR: -32012,
  JSON_RPC_SERVER_ERROR_TRANSACTION_SIGNATURE_LEN_MISMATCH: -32013,
  JSON_RPC_SERVER_ERROR_BLOCK_STATUS_NOT_AVAILABLE_YET: -32014,
  JSON_RPC_SERVER_ERROR_UNSUPPORTED_TRANSACTION_VERSION: -32015,
  JSON_RPC_SERVER_ERROR_MIN_CONTEXT_SLOT_NOT_REACHED: -32016
};
class SolanaJSONRPCError extends Error {
  constructor({
    code,
    message,
    data
  }, customMessage) {
    super(customMessage != null ? `${customMessage}: ${message}` : message);
    this.code = void 0;
    this.data = void 0;
    this.code = code;
    this.data = data;
    this.name = 'SolanaJSONRPCError';
  }
}

/**
 * Sign, send and confirm a transaction.
 *
 * If `commitment` option is not specified, defaults to 'max' commitment.
 *
 * @param {Connection} connection
 * @param {Transaction} transaction
 * @param {Array<Signer>} signers
 * @param {ConfirmOptions} [options]
 * @returns {Promise<TransactionSignature>}
 */
async function sendAndConfirmTransaction(connection, transaction, signers, options) {
  const sendOptions = options && {
    skipPreflight: options.skipPreflight,
    preflightCommitment: options.preflightCommitment || options.commitment,
    maxRetries: options.maxRetries,
    minContextSlot: options.minContextSlot
  };
  const signature = await connection.sendTransaction(transaction, signers, sendOptions);
  let status;
  if (transaction.recentBlockhash != null && transaction.lastValidBlockHeight != null) {
    status = (await connection.confirmTransaction({
      abortSignal: options?.abortSignal,
      signature: signature,
      blockhash: transaction.recentBlockhash,
      lastValidBlockHeight: transaction.lastValidBlockHeight
    }, options && options.commitment)).value;
  } else if (transaction.minNonceContextSlot != null && transaction.nonceInfo != null) {
    const {
      nonceInstruction
    } = transaction.nonceInfo;
    const nonceAccountPubkey = nonceInstruction.keys[0].pubkey;
    status = (await connection.confirmTransaction({
      abortSignal: options?.abortSignal,
      minContextSlot: transaction.minNonceContextSlot,
      nonceAccountPubkey,
      nonceValue: transaction.nonceInfo.nonce,
      signature
    }, options && options.commitment)).value;
  } else {
    if (options?.abortSignal != null) {
      console.warn('sendAndConfirmTransaction(): A transaction with a deprecated confirmation strategy was ' + 'supplied along with an `abortSignal`. Only transactions having `lastValidBlockHeight` ' + 'or a combination of `nonceInfo` and `minNonceContextSlot` are abortable.');
    }
    status = (await connection.confirmTransaction(signature, options && options.commitment)).value;
  }
  if (status.err) {
    if (signature != null) {
      throw new SendTransactionError({
        action: 'send',
        signature: signature,
        transactionMessage: `Status: (${JSON.stringify(status)})`
      });
    }
    throw new Error(`Transaction ${signature} failed (${JSON.stringify(status)})`);
  }
  return signature;
}

// zzz
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @internal
 */

/**
 * Populate a buffer of instruction data using an InstructionType
 * @internal
 */
function encodeData(type, fields) {
  const allocLength = type.layout.span >= 0 ? type.layout.span : getAlloc(type, fields);
  const data = buffer.Buffer.alloc(allocLength);
  const layoutFields = Object.assign({
    instruction: type.index
  }, fields);
  type.layout.encode(layoutFields, data);
  return data;
}

/**
 * Decode instruction data buffer using an InstructionType
 * @internal
 */
function decodeData$1(type, buffer) {
  let data;
  try {
    data = type.layout.decode(buffer);
  } catch (err) {
    throw new Error('invalid instruction; ' + err);
  }
  if (data.instruction !== type.index) {
    throw new Error(`invalid instruction; instruction index mismatch ${data.instruction} != ${type.index}`);
  }
  return data;
}

/**
 * https://github.com/solana-labs/solana/blob/90bedd7e067b5b8f3ddbb45da00a4e9cabb22c62/sdk/src/fee_calculator.rs#L7-L11
 *
 * @internal
 */
const FeeCalculatorLayout = BufferLayout__namespace.nu64('lamportsPerSignature');

/**
 * Calculator for transaction fees.
 *
 * @deprecated Deprecated since Solana v1.8.0.
 */

/**
 * See https://github.com/solana-labs/solana/blob/0ea2843ec9cdc517572b8e62c959f41b55cf4453/sdk/src/nonce_state.rs#L29-L32
 *
 * @internal
 */
const NonceAccountLayout = BufferLayout__namespace.struct([BufferLayout__namespace.u32('version'), BufferLayout__namespace.u32('state'), publicKey('authorizedPubkey'), publicKey('nonce'), BufferLayout__namespace.struct([FeeCalculatorLayout], 'feeCalculator')]);
const NONCE_ACCOUNT_LENGTH = NonceAccountLayout.span;

/**
 * A durable nonce is a 32 byte value encoded as a base58 string.
 */

/**
 * NonceAccount class
 */
class NonceAccount {
  /**
   * @internal
   */
  constructor(args) {
    this.authorizedPubkey = void 0;
    this.nonce = void 0;
    this.feeCalculator = void 0;
    this.authorizedPubkey = args.authorizedPubkey;
    this.nonce = args.nonce;
    this.feeCalculator = args.feeCalculator;
  }

  /**
   * Deserialize NonceAccount from the account data.
   *
   * @param buffer account data
   * @return NonceAccount
   */
  static fromAccountData(buffer) {
    const nonceAccount = NonceAccountLayout.decode(toBuffer(buffer), 0);
    return new NonceAccount({
      authorizedPubkey: new PublicKey(nonceAccount.authorizedPubkey),
      nonce: new PublicKey(nonceAccount.nonce).toString(),
      feeCalculator: nonceAccount.feeCalculator
    });
  }
}

function u64(property) {
  const layout = BufferLayout.blob(8 /* bytes */, property);
  const decode = layout.decode.bind(layout);
  const encode = layout.encode.bind(layout);
  const bigIntLayout = layout;
  const codec = codecsNumbers.getU64Codec();
  bigIntLayout.decode = (buffer, offset) => {
    const src = decode(buffer, offset);
    return codec.decode(src);
  };
  bigIntLayout.encode = (bigInt, buffer, offset) => {
    const src = codec.encode(bigInt);
    return encode(src, buffer, offset);
  };
  return bigIntLayout;
}

/**
 * Create account system transaction params
 */

/**
 * Transfer system transaction params
 */

/**
 * Assign system transaction params
 */

/**
 * Create account with seed system transaction params
 */

/**
 * Create nonce account system transaction params
 */

/**
 * Create nonce account with seed system transaction params
 */

/**
 * Initialize nonce account system instruction params
 */

/**
 * Advance nonce account system instruction params
 */

/**
 * Withdraw nonce account system transaction params
 */

/**
 * Authorize nonce account system transaction params
 */

/**
 * Allocate account system transaction params
 */

/**
 * Allocate account with seed system transaction params
 */

/**
 * Assign account with seed system transaction params
 */

/**
 * Transfer with seed system transaction params
 */

/** Decoded transfer system transaction instruction */

/** Decoded transferWithSeed system transaction instruction */

/**
 * System Instruction class
 */
class SystemInstruction {
  /**
   * @internal
   */
  constructor() {}

  /**
   * Decode a system instruction and retrieve the instruction type.
   */
  static decodeInstructionType(instruction) {
    this.checkProgramId(instruction.programId);
    const instructionTypeLayout = BufferLayout__namespace.u32('instruction');
    const typeIndex = instructionTypeLayout.decode(instruction.data);
    let type;
    for (const [ixType, layout] of Object.entries(SYSTEM_INSTRUCTION_LAYOUTS)) {
      if (layout.index == typeIndex) {
        type = ixType;
        break;
      }
    }
    if (!type) {
      throw new Error('Instruction type incorrect; not a SystemInstruction');
    }
    return type;
  }

  /**
   * Decode a create account system instruction and retrieve the instruction params.
   */
  static decodeCreateAccount(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 2);
    const {
      lamports,
      space,
      programId
    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.Create, instruction.data);
    return {
      fromPubkey: instruction.keys[0].pubkey,
      newAccountPubkey: instruction.keys[1].pubkey,
      lamports,
      space,
      programId: new PublicKey(programId)
    };
  }

  /**
   * Decode a transfer system instruction and retrieve the instruction params.
   */
  static decodeTransfer(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 2);
    const {
      lamports
    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.Transfer, instruction.data);
    return {
      fromPubkey: instruction.keys[0].pubkey,
      toPubkey: instruction.keys[1].pubkey,
      lamports
    };
  }

  /**
   * Decode a transfer with seed system instruction and retrieve the instruction params.
   */
  static decodeTransferWithSeed(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 3);
    const {
      lamports,
      seed,
      programId
    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.TransferWithSeed, instruction.data);
    return {
      fromPubkey: instruction.keys[0].pubkey,
      basePubkey: instruction.keys[1].pubkey,
      toPubkey: instruction.keys[2].pubkey,
      lamports,
      seed,
      programId: new PublicKey(programId)
    };
  }

  /**
   * Decode an allocate system instruction and retrieve the instruction params.
   */
  static decodeAllocate(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 1);
    const {
      space
    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.Allocate, instruction.data);
    return {
      accountPubkey: instruction.keys[0].pubkey,
      space
    };
  }

  /**
   * Decode an allocate with seed system instruction and retrieve the instruction params.
   */
  static decodeAllocateWithSeed(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 1);
    const {
      base,
      seed,
      space,
      programId
    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.AllocateWithSeed, instruction.data);
    return {
      accountPubkey: instruction.keys[0].pubkey,
      basePubkey: new PublicKey(base),
      seed,
      space,
      programId: new PublicKey(programId)
    };
  }

  /**
   * Decode an assign system instruction and retrieve the instruction params.
   */
  static decodeAssign(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 1);
    const {
      programId
    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.Assign, instruction.data);
    return {
      accountPubkey: instruction.keys[0].pubkey,
      programId: new PublicKey(programId)
    };
  }

  /**
   * Decode an assign with seed system instruction and retrieve the instruction params.
   */
  static decodeAssignWithSeed(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 1);
    const {
      base,
      seed,
      programId
    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.AssignWithSeed, instruction.data);
    return {
      accountPubkey: instruction.keys[0].pubkey,
      basePubkey: new PublicKey(base),
      seed,
      programId: new PublicKey(programId)
    };
  }

  /**
   * Decode a create account with seed system instruction and retrieve the instruction params.
   */
  static decodeCreateWithSeed(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 2);
    const {
      base,
      seed,
      lamports,
      space,
      programId
    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.CreateWithSeed, instruction.data);
    return {
      fromPubkey: instruction.keys[0].pubkey,
      newAccountPubkey: instruction.keys[1].pubkey,
      basePubkey: new PublicKey(base),
      seed,
      lamports,
      space,
      programId: new PublicKey(programId)
    };
  }

  /**
   * Decode a nonce initialize system instruction and retrieve the instruction params.
   */
  static decodeNonceInitialize(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 3);
    const {
      authorized
    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.InitializeNonceAccount, instruction.data);
    return {
      noncePubkey: instruction.keys[0].pubkey,
      authorizedPubkey: new PublicKey(authorized)
    };
  }

  /**
   * Decode a nonce advance system instruction and retrieve the instruction params.
   */
  static decodeNonceAdvance(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 3);
    decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.AdvanceNonceAccount, instruction.data);
    return {
      noncePubkey: instruction.keys[0].pubkey,
      authorizedPubkey: instruction.keys[2].pubkey
    };
  }

  /**
   * Decode a nonce withdraw system instruction and retrieve the instruction params.
   */
  static decodeNonceWithdraw(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 5);
    const {
      lamports
    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.WithdrawNonceAccount, instruction.data);
    return {
      noncePubkey: instruction.keys[0].pubkey,
      toPubkey: instruction.keys[1].pubkey,
      authorizedPubkey: instruction.keys[4].pubkey,
      lamports
    };
  }

  /**
   * Decode a nonce authorize system instruction and retrieve the instruction params.
   */
  static decodeNonceAuthorize(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 2);
    const {
      authorized
    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.AuthorizeNonceAccount, instruction.data);
    return {
      noncePubkey: instruction.keys[0].pubkey,
      authorizedPubkey: instruction.keys[1].pubkey,
      newAuthorizedPubkey: new PublicKey(authorized)
    };
  }

  /**
   * @internal
   */
  static checkProgramId(programId) {
    if (!programId.equals(SystemProgram.programId)) {
      throw new Error('invalid instruction; programId is not SystemProgram');
    }
  }

  /**
   * @internal
   */
  static checkKeyLength(keys, expectedLength) {
    if (keys.length < expectedLength) {
      throw new Error(`invalid instruction; found ${keys.length} keys, expected at least ${expectedLength}`);
    }
  }
}

/**
 * An enumeration of valid SystemInstructionType's
 */

/**
 * An enumeration of valid system InstructionType's
 * @internal
 */
const SYSTEM_INSTRUCTION_LAYOUTS = Object.freeze({
  Create: {
    index: 0,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), BufferLayout__namespace.ns64('lamports'), BufferLayout__namespace.ns64('space'), publicKey('programId')])
  },
  Assign: {
    index: 1,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), publicKey('programId')])
  },
  Transfer: {
    index: 2,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), u64('lamports')])
  },
  CreateWithSeed: {
    index: 3,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), publicKey('base'), rustString('seed'), BufferLayout__namespace.ns64('lamports'), BufferLayout__namespace.ns64('space'), publicKey('programId')])
  },
  AdvanceNonceAccount: {
    index: 4,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction')])
  },
  WithdrawNonceAccount: {
    index: 5,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), BufferLayout__namespace.ns64('lamports')])
  },
  InitializeNonceAccount: {
    index: 6,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), publicKey('authorized')])
  },
  AuthorizeNonceAccount: {
    index: 7,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), publicKey('authorized')])
  },
  Allocate: {
    index: 8,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), BufferLayout__namespace.ns64('space')])
  },
  AllocateWithSeed: {
    index: 9,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), publicKey('base'), rustString('seed'), BufferLayout__namespace.ns64('space'), publicKey('programId')])
  },
  AssignWithSeed: {
    index: 10,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), publicKey('base'), rustString('seed'), publicKey('programId')])
  },
  TransferWithSeed: {
    index: 11,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), u64('lamports'), rustString('seed'), publicKey('programId')])
  },
  UpgradeNonceAccount: {
    index: 12,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction')])
  }
});

/**
 * Factory class for transactions to interact with the System program
 */
class SystemProgram {
  /**
   * @internal
   */
  constructor() {}

  /**
   * Public key that identifies the System program
   */

  /**
   * Generate a transaction instruction that creates a new account
   */
  static createAccount(params) {
    const type = SYSTEM_INSTRUCTION_LAYOUTS.Create;
    const data = encodeData(type, {
      lamports: params.lamports,
      space: params.space,
      programId: toBuffer(params.programId.toBuffer())
    });
    return new TransactionInstruction({
      keys: [{
        pubkey: params.fromPubkey,
        isSigner: true,
        isWritable: true
      }, {
        pubkey: params.newAccountPubkey,
        isSigner: true,
        isWritable: true
      }],
      programId: this.programId,
      data
    });
  }

  /**
   * Generate a transaction instruction that transfers lamports from one account to another
   */
  static transfer(params) {
    let data;
    let keys;
    if ('basePubkey' in params) {
      const type = SYSTEM_INSTRUCTION_LAYOUTS.TransferWithSeed;
      data = encodeData(type, {
        lamports: BigInt(params.lamports),
        seed: params.seed,
        programId: toBuffer(params.programId.toBuffer())
      });
      keys = [{
        pubkey: params.fromPubkey,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: params.basePubkey,
        isSigner: true,
        isWritable: false
      }, {
        pubkey: params.toPubkey,
        isSigner: false,
        isWritable: true
      }];
    } else {
      const type = SYSTEM_INSTRUCTION_LAYOUTS.Transfer;
      data = encodeData(type, {
        lamports: BigInt(params.lamports)
      });
      keys = [{
        pubkey: params.fromPubkey,
        isSigner: true,
        isWritable: true
      }, {
        pubkey: params.toPubkey,
        isSigner: false,
        isWritable: true
      }];
    }
    return new TransactionInstruction({
      keys,
      programId: this.programId,
      data
    });
  }

  /**
   * Generate a transaction instruction that assigns an account to a program
   */
  static assign(params) {
    let data;
    let keys;
    if ('basePubkey' in params) {
      const type = SYSTEM_INSTRUCTION_LAYOUTS.AssignWithSeed;
      data = encodeData(type, {
        base: toBuffer(params.basePubkey.toBuffer()),
        seed: params.seed,
        programId: toBuffer(params.programId.toBuffer())
      });
      keys = [{
        pubkey: params.accountPubkey,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: params.basePubkey,
        isSigner: true,
        isWritable: false
      }];
    } else {
      const type = SYSTEM_INSTRUCTION_LAYOUTS.Assign;
      data = encodeData(type, {
        programId: toBuffer(params.programId.toBuffer())
      });
      keys = [{
        pubkey: params.accountPubkey,
        isSigner: true,
        isWritable: true
      }];
    }
    return new TransactionInstruction({
      keys,
      programId: this.programId,
      data
    });
  }

  /**
   * Generate a transaction instruction that creates a new account at
   *   an address generated with `from`, a seed, and programId
   */
  static createAccountWithSeed(params) {
    const type = SYSTEM_INSTRUCTION_LAYOUTS.CreateWithSeed;
    const data = encodeData(type, {
      base: toBuffer(params.basePubkey.toBuffer()),
      seed: params.seed,
      lamports: params.lamports,
      space: params.space,
      programId: toBuffer(params.programId.toBuffer())
    });
    let keys = [{
      pubkey: params.fromPubkey,
      isSigner: true,
      isWritable: true
    }, {
      pubkey: params.newAccountPubkey,
      isSigner: false,
      isWritable: true
    }];
    if (!params.basePubkey.equals(params.fromPubkey)) {
      keys.push({
        pubkey: params.basePubkey,
        isSigner: true,
        isWritable: false
      });
    }
    return new TransactionInstruction({
      keys,
      programId: this.programId,
      data
    });
  }

  /**
   * Generate a transaction that creates a new Nonce account
   */
  static createNonceAccount(params) {
    const transaction = new Transaction();
    if ('basePubkey' in params && 'seed' in params) {
      transaction.add(SystemProgram.createAccountWithSeed({
        fromPubkey: params.fromPubkey,
        newAccountPubkey: params.noncePubkey,
        basePubkey: params.basePubkey,
        seed: params.seed,
        lamports: params.lamports,
        space: NONCE_ACCOUNT_LENGTH,
        programId: this.programId
      }));
    } else {
      transaction.add(SystemProgram.createAccount({
        fromPubkey: params.fromPubkey,
        newAccountPubkey: params.noncePubkey,
        lamports: params.lamports,
        space: NONCE_ACCOUNT_LENGTH,
        programId: this.programId
      }));
    }
    const initParams = {
      noncePubkey: params.noncePubkey,
      authorizedPubkey: params.authorizedPubkey
    };
    transaction.add(this.nonceInitialize(initParams));
    return transaction;
  }

  /**
   * Generate an instruction to initialize a Nonce account
   */
  static nonceInitialize(params) {
    const type = SYSTEM_INSTRUCTION_LAYOUTS.InitializeNonceAccount;
    const data = encodeData(type, {
      authorized: toBuffer(params.authorizedPubkey.toBuffer())
    });
    const instructionData = {
      keys: [{
        pubkey: params.noncePubkey,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
        isSigner: false,
        isWritable: false
      }, {
        pubkey: SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false
      }],
      programId: this.programId,
      data
    };
    return new TransactionInstruction(instructionData);
  }

  /**
   * Generate an instruction to advance the nonce in a Nonce account
   */
  static nonceAdvance(params) {
    const type = SYSTEM_INSTRUCTION_LAYOUTS.AdvanceNonceAccount;
    const data = encodeData(type);
    const instructionData = {
      keys: [{
        pubkey: params.noncePubkey,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
        isSigner: false,
        isWritable: false
      }, {
        pubkey: params.authorizedPubkey,
        isSigner: true,
        isWritable: false
      }],
      programId: this.programId,
      data
    };
    return new TransactionInstruction(instructionData);
  }

  /**
   * Generate a transaction instruction that withdraws lamports from a Nonce account
   */
  static nonceWithdraw(params) {
    const type = SYSTEM_INSTRUCTION_LAYOUTS.WithdrawNonceAccount;
    const data = encodeData(type, {
      lamports: params.lamports
    });
    return new TransactionInstruction({
      keys: [{
        pubkey: params.noncePubkey,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: params.toPubkey,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
        isSigner: false,
        isWritable: false
      }, {
        pubkey: SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false
      }, {
        pubkey: params.authorizedPubkey,
        isSigner: true,
        isWritable: false
      }],
      programId: this.programId,
      data
    });
  }

  /**
   * Generate a transaction instruction that authorizes a new PublicKey as the authority
   * on a Nonce account.
   */
  static nonceAuthorize(params) {
    const type = SYSTEM_INSTRUCTION_LAYOUTS.AuthorizeNonceAccount;
    const data = encodeData(type, {
      authorized: toBuffer(params.newAuthorizedPubkey.toBuffer())
    });
    return new TransactionInstruction({
      keys: [{
        pubkey: params.noncePubkey,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: params.authorizedPubkey,
        isSigner: true,
        isWritable: false
      }],
      programId: this.programId,
      data
    });
  }

  /**
   * Generate a transaction instruction that allocates space in an account without funding
   */
  static allocate(params) {
    let data;
    let keys;
    if ('basePubkey' in params) {
      const type = SYSTEM_INSTRUCTION_LAYOUTS.AllocateWithSeed;
      data = encodeData(type, {
        base: toBuffer(params.basePubkey.toBuffer()),
        seed: params.seed,
        space: params.space,
        programId: toBuffer(params.programId.toBuffer())
      });
      keys = [{
        pubkey: params.accountPubkey,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: params.basePubkey,
        isSigner: true,
        isWritable: false
      }];
    } else {
      const type = SYSTEM_INSTRUCTION_LAYOUTS.Allocate;
      data = encodeData(type, {
        space: params.space
      });
      keys = [{
        pubkey: params.accountPubkey,
        isSigner: true,
        isWritable: true
      }];
    }
    return new TransactionInstruction({
      keys,
      programId: this.programId,
      data
    });
  }
}
SystemProgram.programId = new PublicKey('11111111111111111111111111111111');

// Keep program chunks under PACKET_DATA_SIZE, leaving enough room for the
// rest of the Transaction fields
//
// TODO: replace 300 with a proper constant for the size of the other
// Transaction fields
const CHUNK_SIZE = PACKET_DATA_SIZE - 300;

/**
 * Program loader interface
 */
class Loader {
  /**
   * @internal
   */
  constructor() {}

  /**
   * Amount of program data placed in each load Transaction
   */

  /**
   * Minimum number of signatures required to load a program not including
   * retries
   *
   * Can be used to calculate transaction fees
   */
  static getMinNumSignatures(dataLength) {
    return 2 * (
    // Every transaction requires two signatures (payer + program)
    Math.ceil(dataLength / Loader.chunkSize) + 1 +
    // Add one for Create transaction
    1) // Add one for Finalize transaction
    ;
  }

  /**
   * Loads a generic program
   *
   * @param connection The connection to use
   * @param payer System account that pays to load the program
   * @param program Account to load the program into
   * @param programId Public key that identifies the loader
   * @param data Program octets
   * @return true if program was loaded successfully, false if program was already loaded
   */
  static async load(connection, payer, program, programId, data) {
    {
      const balanceNeeded = await connection.getMinimumBalanceForRentExemption(data.length);

      // Fetch program account info to check if it has already been created
      const programInfo = await connection.getAccountInfo(program.publicKey, 'confirmed');
      let transaction = null;
      if (programInfo !== null) {
        if (programInfo.executable) {
          console.error('Program load failed, account is already executable');
          return false;
        }
        if (programInfo.data.length !== data.length) {
          transaction = transaction || new Transaction();
          transaction.add(SystemProgram.allocate({
            accountPubkey: program.publicKey,
            space: data.length
          }));
        }
        if (!programInfo.owner.equals(programId)) {
          transaction = transaction || new Transaction();
          transaction.add(SystemProgram.assign({
            accountPubkey: program.publicKey,
            programId
          }));
        }
        if (programInfo.lamports < balanceNeeded) {
          transaction = transaction || new Transaction();
          transaction.add(SystemProgram.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: program.publicKey,
            lamports: balanceNeeded - programInfo.lamports
          }));
        }
      } else {
        transaction = new Transaction().add(SystemProgram.createAccount({
          fromPubkey: payer.publicKey,
          newAccountPubkey: program.publicKey,
          lamports: balanceNeeded > 0 ? balanceNeeded : 1,
          space: data.length,
          programId
        }));
      }

      // If the account is already created correctly, skip this step
      // and proceed directly to loading instructions
      if (transaction !== null) {
        await sendAndConfirmTransaction(connection, transaction, [payer, program], {
          commitment: 'confirmed'
        });
      }
    }
    const dataLayout = BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), BufferLayout__namespace.u32('offset'), BufferLayout__namespace.u32('bytesLength'), BufferLayout__namespace.u32('bytesLengthPadding'), BufferLayout__namespace.seq(BufferLayout__namespace.u8('byte'), BufferLayout__namespace.offset(BufferLayout__namespace.u32(), -8), 'bytes')]);
    const chunkSize = Loader.chunkSize;
    let offset = 0;
    let array = data;
    let transactions = [];
    while (array.length > 0) {
      const bytes = array.slice(0, chunkSize);
      const data = buffer.Buffer.alloc(chunkSize + 16);
      dataLayout.encode({
        instruction: 0,
        // Load instruction
        offset,
        bytes: bytes,
        bytesLength: 0,
        bytesLengthPadding: 0
      }, data);
      const transaction = new Transaction().add({
        keys: [{
          pubkey: program.publicKey,
          isSigner: true,
          isWritable: true
        }],
        programId,
        data
      });
      transactions.push(sendAndConfirmTransaction(connection, transaction, [payer, program], {
        commitment: 'confirmed'
      }));

      // Delay between sends in an attempt to reduce rate limit errors
      if (connection._rpcEndpoint.includes('solana.com')) {
        const REQUESTS_PER_SECOND = 4;
        await sleep(1000 / REQUESTS_PER_SECOND);
      }
      offset += chunkSize;
      array = array.slice(chunkSize);
    }
    await Promise.all(transactions);

    // Finalize the account loaded with program data for execution
    {
      const dataLayout = BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction')]);
      const data = buffer.Buffer.alloc(dataLayout.span);
      dataLayout.encode({
        instruction: 1 // Finalize instruction
      }, data);
      const transaction = new Transaction().add({
        keys: [{
          pubkey: program.publicKey,
          isSigner: true,
          isWritable: true
        }, {
          pubkey: SYSVAR_RENT_PUBKEY,
          isSigner: false,
          isWritable: false
        }],
        programId,
        data
      });
      const deployCommitment = 'processed';
      const finalizeSignature = await connection.sendTransaction(transaction, [payer, program], {
        preflightCommitment: deployCommitment
      });
      const {
        context,
        value
      } = await connection.confirmTransaction({
        signature: finalizeSignature,
        lastValidBlockHeight: transaction.lastValidBlockHeight,
        blockhash: transaction.recentBlockhash
      }, deployCommitment);
      if (value.err) {
        throw new Error(`Transaction ${finalizeSignature} failed (${JSON.stringify(value)})`);
      }
      // We prevent programs from being usable until the slot after their deployment.
      // See https://github.com/solana-labs/solana/pull/29654
      while (true // eslint-disable-line no-constant-condition
      ) {
        try {
          const currentSlot = await connection.getSlot({
            commitment: deployCommitment
          });
          if (currentSlot > context.slot) {
            break;
          }
        } catch {
          /* empty */
        }
        await new Promise(resolve => setTimeout(resolve, Math.round(MS_PER_SLOT / 2)));
      }
    }

    // success
    return true;
  }
}
Loader.chunkSize = CHUNK_SIZE;

/**
 * @deprecated Deprecated since Solana v1.17.20.
 */
const BPF_LOADER_PROGRAM_ID = new PublicKey('BPFLoader2111111111111111111111111111111111');

/**
 * Factory class for transactions to interact with a program loader
 *
 * @deprecated Deprecated since Solana v1.17.20.
 */
class BpfLoader {
  /**
   * Minimum number of signatures required to load a program not including
   * retries
   *
   * Can be used to calculate transaction fees
   */
  static getMinNumSignatures(dataLength) {
    return Loader.getMinNumSignatures(dataLength);
  }

  /**
   * Load a SBF program
   *
   * @param connection The connection to use
   * @param payer Account that will pay program loading fees
   * @param program Account to load the program into
   * @param elf The entire ELF containing the SBF program
   * @param loaderProgramId The program id of the BPF loader to use
   * @return true if program was loaded successfully, false if program was already loaded
   */
  static load(connection, payer, program, elf, loaderProgramId) {
    return Loader.load(connection, payer, program, loaderProgramId, elf);
  }
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var fastStableStringify$1;
var hasRequiredFastStableStringify;

function requireFastStableStringify () {
	if (hasRequiredFastStableStringify) return fastStableStringify$1;
	hasRequiredFastStableStringify = 1;
	var objToString = Object.prototype.toString;
	var objKeys = Object.keys || function(obj) {
			var keys = [];
			for (var name in obj) {
				keys.push(name);
			}
			return keys;
		};

	function stringify(val, isArrayProp) {
		var i, max, str, keys, key, propVal, toStr;
		if (val === true) {
			return "true";
		}
		if (val === false) {
			return "false";
		}
		switch (typeof val) {
			case "object":
				if (val === null) {
					return null;
				} else if (val.toJSON && typeof val.toJSON === "function") {
					return stringify(val.toJSON(), isArrayProp);
				} else {
					toStr = objToString.call(val);
					if (toStr === "[object Array]") {
						str = '[';
						max = val.length - 1;
						for(i = 0; i < max; i++) {
							str += stringify(val[i], true) + ',';
						}
						if (max > -1) {
							str += stringify(val[i], true);
						}
						return str + ']';
					} else if (toStr === "[object Object]") {
						// only object is left
						keys = objKeys(val).sort();
						max = keys.length;
						str = "";
						i = 0;
						while (i < max) {
							key = keys[i];
							propVal = stringify(val[key], false);
							if (propVal !== undefined) {
								if (str) {
									str += ',';
								}
								str += JSON.stringify(key) + ':' + propVal;
							}
							i++;
						}
						return '{' + str + '}';
					} else {
						return JSON.stringify(val);
					}
				}
			case "function":
			case "undefined":
				return isArrayProp ? null : undefined;
			case "string":
				return JSON.stringify(val);
			default:
				return isFinite(val) ? val : null;
		}
	}

	fastStableStringify$1 = function(val) {
		var returnVal = stringify(val, false);
		if (returnVal !== undefined) {
			return ''+ returnVal;
		}
	};
	return fastStableStringify$1;
}

var fastStableStringifyExports = /*@__PURE__*/ requireFastStableStringify();
var fastStableStringify = /*@__PURE__*/getDefaultExportFromCjs(fastStableStringifyExports);

const MINIMUM_SLOT_PER_EPOCH = 32;

// Returns the number of trailing zeros in the binary representation of self.
function trailingZeros(n) {
  let trailingZeros = 0;
  while (n > 1) {
    n /= 2;
    trailingZeros++;
  }
  return trailingZeros;
}

// Returns the smallest power of two greater than or equal to n
function nextPowerOfTwo(n) {
  if (n === 0) return 1;
  n--;
  n |= n >> 1;
  n |= n >> 2;
  n |= n >> 4;
  n |= n >> 8;
  n |= n >> 16;
  n |= n >> 32;
  return n + 1;
}

/**
 * Epoch schedule
 * (see https://docs.solana.com/terminology#epoch)
 * Can be retrieved with the {@link Connection.getEpochSchedule} method
 */
class EpochSchedule {
  constructor(slotsPerEpoch, leaderScheduleSlotOffset, warmup, firstNormalEpoch, firstNormalSlot) {
    /** The maximum number of slots in each epoch */
    this.slotsPerEpoch = void 0;
    /** The number of slots before beginning of an epoch to calculate a leader schedule for that epoch */
    this.leaderScheduleSlotOffset = void 0;
    /** Indicates whether epochs start short and grow */
    this.warmup = void 0;
    /** The first epoch with `slotsPerEpoch` slots */
    this.firstNormalEpoch = void 0;
    /** The first slot of `firstNormalEpoch` */
    this.firstNormalSlot = void 0;
    this.slotsPerEpoch = slotsPerEpoch;
    this.leaderScheduleSlotOffset = leaderScheduleSlotOffset;
    this.warmup = warmup;
    this.firstNormalEpoch = firstNormalEpoch;
    this.firstNormalSlot = firstNormalSlot;
  }
  getEpoch(slot) {
    return this.getEpochAndSlotIndex(slot)[0];
  }
  getEpochAndSlotIndex(slot) {
    if (slot < this.firstNormalSlot) {
      const epoch = trailingZeros(nextPowerOfTwo(slot + MINIMUM_SLOT_PER_EPOCH + 1)) - trailingZeros(MINIMUM_SLOT_PER_EPOCH) - 1;
      const epochLen = this.getSlotsInEpoch(epoch);
      const slotIndex = slot - (epochLen - MINIMUM_SLOT_PER_EPOCH);
      return [epoch, slotIndex];
    } else {
      const normalSlotIndex = slot - this.firstNormalSlot;
      const normalEpochIndex = Math.floor(normalSlotIndex / this.slotsPerEpoch);
      const epoch = this.firstNormalEpoch + normalEpochIndex;
      const slotIndex = normalSlotIndex % this.slotsPerEpoch;
      return [epoch, slotIndex];
    }
  }
  getFirstSlotInEpoch(epoch) {
    if (epoch <= this.firstNormalEpoch) {
      return (Math.pow(2, epoch) - 1) * MINIMUM_SLOT_PER_EPOCH;
    } else {
      return (epoch - this.firstNormalEpoch) * this.slotsPerEpoch + this.firstNormalSlot;
    }
  }
  getLastSlotInEpoch(epoch) {
    return this.getFirstSlotInEpoch(epoch) + this.getSlotsInEpoch(epoch) - 1;
  }
  getSlotsInEpoch(epoch) {
    if (epoch < this.firstNormalEpoch) {
      return Math.pow(2, epoch + trailingZeros(MINIMUM_SLOT_PER_EPOCH));
    } else {
      return this.slotsPerEpoch;
    }
  }
}

var fetchImpl = globalThis.fetch;

class RpcWebSocketClient extends rpcWebsockets.CommonClient {
  constructor(address, options, generate_request_id) {
    const webSocketFactory = url => {
      const rpc = rpcWebsockets.WebSocket(url, {
        autoconnect: true,
        max_reconnects: 5,
        reconnect: true,
        reconnect_interval: 1000,
        ...options
      });
      if ('socket' in rpc) {
        this.underlyingSocket = rpc.socket;
      } else {
        this.underlyingSocket = rpc;
      }
      return rpc;
    };
    super(webSocketFactory, address, options, generate_request_id);
    this.underlyingSocket = void 0;
  }
  call(...args) {
    const readyState = this.underlyingSocket?.readyState;
    if (readyState === 1 /* WebSocket.OPEN */) {
      return super.call(...args);
    }
    return Promise.reject(new Error('Tried to call a JSON-RPC method `' + args[0] + '` but the socket was not `CONNECTING` or `OPEN` (`readyState` was ' + readyState + ')'));
  }
  notify(...args) {
    const readyState = this.underlyingSocket?.readyState;
    if (readyState === 1 /* WebSocket.OPEN */) {
      return super.notify(...args);
    }
    return Promise.reject(new Error('Tried to send a JSON-RPC notification `' + args[0] + '` but the socket was not `CONNECTING` or `OPEN` (`readyState` was ' + readyState + ')'));
  }
}

/**
 * @internal
 */

/**
 * Decode account data buffer using an AccountType
 * @internal
 */
function decodeData(type, data) {
  let decoded;
  try {
    decoded = type.layout.decode(data);
  } catch (err) {
    throw new Error('invalid instruction; ' + err);
  }
  if (decoded.typeIndex !== type.index) {
    throw new Error(`invalid account data; account type mismatch ${decoded.typeIndex} != ${type.index}`);
  }
  return decoded;
}

/// The serialized size of lookup table metadata
const LOOKUP_TABLE_META_SIZE = 56;
class AddressLookupTableAccount {
  constructor(args) {
    this.key = void 0;
    this.state = void 0;
    this.key = args.key;
    this.state = args.state;
  }
  isActive() {
    const U64_MAX = BigInt('0xffffffffffffffff');
    return this.state.deactivationSlot === U64_MAX;
  }
  static deserialize(accountData) {
    const meta = decodeData(LookupTableMetaLayout, accountData);
    const serializedAddressesLen = accountData.length - LOOKUP_TABLE_META_SIZE;
    assert(serializedAddressesLen >= 0, 'lookup table is invalid');
    assert(serializedAddressesLen % 32 === 0, 'lookup table is invalid');
    const numSerializedAddresses = serializedAddressesLen / 32;
    const {
      addresses
    } = BufferLayout__namespace.struct([BufferLayout__namespace.seq(publicKey(), numSerializedAddresses, 'addresses')]).decode(accountData.slice(LOOKUP_TABLE_META_SIZE));
    return {
      deactivationSlot: meta.deactivationSlot,
      lastExtendedSlot: meta.lastExtendedSlot,
      lastExtendedSlotStartIndex: meta.lastExtendedStartIndex,
      authority: meta.authority.length !== 0 ? new PublicKey(meta.authority[0]) : undefined,
      addresses: addresses.map(address => new PublicKey(address))
    };
  }
}
const LookupTableMetaLayout = {
  index: 1,
  layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('typeIndex'), u64('deactivationSlot'), BufferLayout__namespace.nu64('lastExtendedSlot'), BufferLayout__namespace.u8('lastExtendedStartIndex'), BufferLayout__namespace.u8(),
  // option
  BufferLayout__namespace.seq(publicKey(), BufferLayout__namespace.offset(BufferLayout__namespace.u8(), -1), 'authority')])
};

const URL_RE = /^[^:]+:\/\/([^:[]+|\[[^\]]+\])(:\d+)?(.*)/i;
function makeWebsocketUrl(endpoint) {
  const matches = endpoint.match(URL_RE);
  if (matches == null) {
    throw TypeError(`Failed to validate endpoint URL \`${endpoint}\``);
  }
  const [_,
  // eslint-disable-line @typescript-eslint/no-unused-vars
  hostish, portWithColon, rest] = matches;
  const protocol = endpoint.startsWith('https:') ? 'wss:' : 'ws:';
  const startPort = portWithColon == null ? null : parseInt(portWithColon.slice(1), 10);
  const websocketPort =
  // Only shift the port by +1 as a convention for ws(s) only if given endpoint
  // is explicitly specifying the endpoint port (HTTP-based RPC), assuming
  // we're directly trying to connect to agave-validator's ws listening port.
  // When the endpoint omits the port, we're connecting to the protocol
  // default ports: http(80) or https(443) and it's assumed we're behind a reverse
  // proxy which manages WebSocket upgrade and backend port redirection.
  startPort == null ? '' : `:${startPort + 1}`;
  return `${protocol}//${hostish}${websocketPort}${rest}`;
}

const PublicKeyFromString = superstruct.coerce(superstruct.instance(PublicKey), superstruct.string(), value => new PublicKey(value));
const RawAccountDataResult = superstruct.tuple([superstruct.string(), superstruct.literal('base64')]);
const BufferFromRawAccountData = superstruct.coerce(superstruct.instance(buffer.Buffer), RawAccountDataResult, value => buffer.Buffer.from(value[0], 'base64'));

/**
 * Attempt to use a recent blockhash for up to 30 seconds
 * @internal
 */
const BLOCKHASH_CACHE_TIMEOUT_MS = 30 * 1000;

/**
 * HACK.
 * Copied from rpc-websockets/dist/lib/client.
 * Otherwise, `yarn build` fails with:
 * https://gist.github.com/steveluscher/c057eca81d479ef705cdb53162f9971d
 */

/** @internal */
/** @internal */
/** @internal */
/** @internal */

/** @internal */
/**
 * @internal
 * Every subscription contains the args used to open the subscription with
 * the server, and a list of callers interested in notifications.
 */

/**
 * @internal
 * A subscription may be in various states of connectedness. Only when it is
 * fully connected will it have a server subscription id associated with it.
 * This id can be returned to the server to unsubscribe the client entirely.
 */

/**
 * A type that encapsulates a subscription's RPC method
 * names and notification (callback) signature.
 */

/**
 * @internal
 * Utility type that keeps tagged unions intact while omitting properties.
 */

/**
 * @internal
 * This type represents a single subscribable 'topic.' It's made up of:
 *
 * - The args used to open the subscription with the server,
 * - The state of the subscription, in terms of its connectedness, and
 * - The set of callbacks to call when the server publishes notifications
 *
 * This record gets indexed by `SubscriptionConfigHash` and is used to
 * set up subscriptions, fan out notifications, and track subscription state.
 */

/**
 * @internal
 */

/**
 * Extra contextual information for RPC responses
 */

/**
 * Options for sending transactions
 */

/**
 * Options for confirming transactions
 */

/**
 * Options for getConfirmedSignaturesForAddress2
 */

/**
 * Options for getSignaturesForAddress
 */

/**
 * RPC Response with extra contextual information
 */

/**
 * A strategy for confirming transactions that uses the last valid
 * block height for a given blockhash to check for transaction expiration.
 */

/**
 * A strategy for confirming durable nonce transactions.
 */

/**
 * Properties shared by all transaction confirmation strategies
 */

/**
 * This type represents all transaction confirmation strategies
 */

/* @internal */
function assertEndpointUrl(putativeUrl) {
  if (/^https?:/.test(putativeUrl) === false) {
    throw new TypeError('Endpoint URL must start with `http:` or `https:`.');
  }
  return putativeUrl;
}

/** @internal */
function extractCommitmentFromConfig(commitmentOrConfig) {
  let commitment;
  let config;
  if (typeof commitmentOrConfig === 'string') {
    commitment = commitmentOrConfig;
  } else if (commitmentOrConfig) {
    const {
      commitment: specifiedCommitment,
      ...specifiedConfig
    } = commitmentOrConfig;
    commitment = specifiedCommitment;
    config = specifiedConfig;
  }
  return {
    commitment,
    config
  };
}

/**
 * @internal
 */
function applyDefaultMemcmpEncodingToFilters(filters) {
  return filters.map(filter => 'memcmp' in filter ? {
    ...filter,
    memcmp: {
      ...filter.memcmp,
      encoding: filter.memcmp.encoding ?? 'base58'
    }
  } : filter);
}

/**
 * @internal
 */
function createRpcResult(result) {
  return superstruct.union([superstruct.type({
    jsonrpc: superstruct.literal('2.0'),
    id: superstruct.string(),
    result
  }), superstruct.type({
    jsonrpc: superstruct.literal('2.0'),
    id: superstruct.string(),
    error: superstruct.type({
      code: superstruct.unknown(),
      message: superstruct.string(),
      data: superstruct.optional(superstruct.any())
    })
  })]);
}
const UnknownRpcResult = createRpcResult(superstruct.unknown());

/**
 * @internal
 */
function jsonRpcResult(schema) {
  return superstruct.coerce(createRpcResult(schema), UnknownRpcResult, value => {
    if ('error' in value) {
      return value;
    } else {
      return {
        ...value,
        result: superstruct.create(value.result, schema)
      };
    }
  });
}

/**
 * @internal
 */
function jsonRpcResultAndContext(value) {
  return jsonRpcResult(superstruct.type({
    context: superstruct.type({
      slot: superstruct.number()
    }),
    value
  }));
}

/**
 * @internal
 */
function notificationResultAndContext(value) {
  return superstruct.type({
    context: superstruct.type({
      slot: superstruct.number()
    }),
    value
  });
}

/**
 * @internal
 */
function versionedMessageFromResponse(version, response) {
  if (version === 0) {
    return new MessageV0({
      header: response.header,
      staticAccountKeys: response.accountKeys.map(accountKey => new PublicKey(accountKey)),
      recentBlockhash: response.recentBlockhash,
      compiledInstructions: response.instructions.map(ix => ({
        programIdIndex: ix.programIdIndex,
        accountKeyIndexes: ix.accounts,
        data: bs58__default.default.decode(ix.data)
      })),
      addressTableLookups: response.addressTableLookups
    });
  } else {
    return new Message(response);
  }
}

/**
 * The level of commitment desired when querying state
 * <pre>
 *   'processed': Query the most recent block which has reached 1 confirmation by the connected node
 *   'confirmed': Query the most recent block which has reached 1 confirmation by the cluster
 *   'finalized': Query the most recent block which has been finalized by the cluster
 * </pre>
 */

// Deprecated as of v1.5.5

/**
 * A subset of Commitment levels, which are at least optimistically confirmed
 * <pre>
 *   'confirmed': Query the most recent block which has reached 1 confirmation by the cluster
 *   'finalized': Query the most recent block which has been finalized by the cluster
 * </pre>
 */

/**
 * Filter for largest accounts query
 * <pre>
 *   'circulating':    Return the largest accounts that are part of the circulating supply
 *   'nonCirculating': Return the largest accounts that are not part of the circulating supply
 * </pre>
 */

/**
 * Configuration object for changing `getAccountInfo` query behavior
 */

/**
 * Configuration object for changing `getBalance` query behavior
 */

/**
 * Configuration object for changing `getBlock` query behavior
 */

/**
 * Configuration object for changing `getBlock` query behavior
 */

/**
 * Configuration object for changing `getStakeMinimumDelegation` query behavior
 */

/**
 * Configuration object for changing `getBlockHeight` query behavior
 */

/**
 * Configuration object for changing `getEpochInfo` query behavior
 */

/**
 * Configuration object for changing `getInflationReward` query behavior
 */

/**
 * Configuration object for changing `getLatestBlockhash` query behavior
 */

/**
 * Configuration object for changing `isBlockhashValid` query behavior
 */

/**
 * Configuration object for changing `getSlot` query behavior
 */

/**
 * Configuration object for changing `getSlotLeader` query behavior
 */

/**
 * Configuration object for changing `getTransaction` query behavior
 */

/**
 * Configuration object for changing `getTransaction` query behavior
 */

/**
 * Configuration object for changing `getLargestAccounts` query behavior
 */

/**
 * Configuration object for changing `getSupply` request behavior
 */

/**
 * Configuration object for changing query behavior
 */

/**
 * Information describing a cluster node
 */

/**
 * Information describing a vote account
 */

/**
 * A collection of cluster vote accounts
 */

/**
 * Network Inflation
 * (see https://docs.solana.com/implemented-proposals/ed_overview)
 */

const GetInflationGovernorResult = superstruct.type({
  foundation: superstruct.number(),
  foundationTerm: superstruct.number(),
  initial: superstruct.number(),
  taper: superstruct.number(),
  terminal: superstruct.number()
});

/**
 * The inflation reward for an epoch
 */

/**
 * Expected JSON RPC response for the "getInflationReward" message
 */
const GetInflationRewardResult = jsonRpcResult(superstruct.array(superstruct.nullable(superstruct.type({
  epoch: superstruct.number(),
  effectiveSlot: superstruct.number(),
  amount: superstruct.number(),
  postBalance: superstruct.number(),
  commission: superstruct.optional(superstruct.nullable(superstruct.number()))
}))));

/**
 * Configuration object for changing `getRecentPrioritizationFees` query behavior
 */

/**
 * Expected JSON RPC response for the "getRecentPrioritizationFees" message
 */
const GetRecentPrioritizationFeesResult = superstruct.array(superstruct.type({
  slot: superstruct.number(),
  prioritizationFee: superstruct.number()
}));
/**
 * Expected JSON RPC response for the "getInflationRate" message
 */
const GetInflationRateResult = superstruct.type({
  total: superstruct.number(),
  validator: superstruct.number(),
  foundation: superstruct.number(),
  epoch: superstruct.number()
});

/**
 * Information about the current epoch
 */

const GetEpochInfoResult = superstruct.type({
  epoch: superstruct.number(),
  slotIndex: superstruct.number(),
  slotsInEpoch: superstruct.number(),
  absoluteSlot: superstruct.number(),
  blockHeight: superstruct.optional(superstruct.number()),
  transactionCount: superstruct.optional(superstruct.number())
});
const GetEpochScheduleResult = superstruct.type({
  slotsPerEpoch: superstruct.number(),
  leaderScheduleSlotOffset: superstruct.number(),
  warmup: superstruct.boolean(),
  firstNormalEpoch: superstruct.number(),
  firstNormalSlot: superstruct.number()
});

/**
 * Leader schedule
 * (see https://docs.solana.com/terminology#leader-schedule)
 */

const GetLeaderScheduleResult = superstruct.record(superstruct.string(), superstruct.array(superstruct.number()));

/**
 * Transaction error or null
 */
const TransactionErrorResult = superstruct.nullable(superstruct.union([superstruct.type({}), superstruct.string()]));

/**
 * Signature status for a transaction
 */
const SignatureStatusResult = superstruct.type({
  err: TransactionErrorResult
});

/**
 * Transaction signature received notification
 */
const SignatureReceivedResult = superstruct.literal('receivedSignature');

/**
 * Version info for a node
 */

const VersionResult = superstruct.type({
  'solana-core': superstruct.string(),
  'feature-set': superstruct.optional(superstruct.number())
});
const ParsedInstructionStruct = superstruct.type({
  program: superstruct.string(),
  programId: PublicKeyFromString,
  parsed: superstruct.unknown()
});
const PartiallyDecodedInstructionStruct = superstruct.type({
  programId: PublicKeyFromString,
  accounts: superstruct.array(PublicKeyFromString),
  data: superstruct.string()
});
const SimulatedTransactionResponseStruct = jsonRpcResultAndContext(superstruct.type({
  err: superstruct.nullable(superstruct.union([superstruct.type({}), superstruct.string()])),
  logs: superstruct.nullable(superstruct.array(superstruct.string())),
  accounts: superstruct.optional(superstruct.nullable(superstruct.array(superstruct.nullable(superstruct.type({
    executable: superstruct.boolean(),
    owner: superstruct.string(),
    lamports: superstruct.number(),
    data: superstruct.array(superstruct.string()),
    rentEpoch: superstruct.optional(superstruct.number())
  }))))),
  unitsConsumed: superstruct.optional(superstruct.number()),
  returnData: superstruct.optional(superstruct.nullable(superstruct.type({
    programId: superstruct.string(),
    data: superstruct.tuple([superstruct.string(), superstruct.literal('base64')])
  }))),
  innerInstructions: superstruct.optional(superstruct.nullable(superstruct.array(superstruct.type({
    index: superstruct.number(),
    instructions: superstruct.array(superstruct.union([ParsedInstructionStruct, PartiallyDecodedInstructionStruct]))
  }))))
}));

/**
 * Metadata for a parsed confirmed transaction on the ledger
 *
 * @deprecated Deprecated since RPC v1.8.0. Please use {@link ParsedTransactionMeta} instead.
 */

/**
 * Collection of addresses loaded by a transaction using address table lookups
 */

/**
 * Metadata for a parsed transaction on the ledger
 */

/**
 * Metadata for a confirmed transaction on the ledger
 */

/**
 * A processed transaction from the RPC API
 */

/**
 * A processed transaction from the RPC API
 */

/**
 * A processed transaction message from the RPC API
 */

/**
 * A confirmed transaction on the ledger
 *
 * @deprecated Deprecated since RPC v1.8.0.
 */

/**
 * A partially decoded transaction instruction
 */

/**
 * A parsed transaction message account
 */

/**
 * A parsed transaction instruction
 */

/**
 * A parsed address table lookup
 */

/**
 * A parsed transaction message
 */

/**
 * A parsed transaction
 */

/**
 * A parsed and confirmed transaction on the ledger
 *
 * @deprecated Deprecated since RPC v1.8.0. Please use {@link ParsedTransactionWithMeta} instead.
 */

/**
 * A parsed transaction on the ledger with meta
 */

/**
 * A processed block fetched from the RPC API
 */

/**
 * A processed block fetched from the RPC API where the `transactionDetails` mode is `accounts`
 */

/**
 * A processed block fetched from the RPC API where the `transactionDetails` mode is `none`
 */

/**
 * A block with parsed transactions
 */

/**
 * A block with parsed transactions where the `transactionDetails` mode is `accounts`
 */

/**
 * A block with parsed transactions where the `transactionDetails` mode is `none`
 */

/**
 * A processed block fetched from the RPC API
 */

/**
 * A processed block fetched from the RPC API where the `transactionDetails` mode is `accounts`
 */

/**
 * A processed block fetched from the RPC API where the `transactionDetails` mode is `none`
 */

/**
 * A confirmed block on the ledger
 *
 * @deprecated Deprecated since RPC v1.8.0.
 */

/**
 * A Block on the ledger with signatures only
 */

/**
 * recent block production information
 */

/**
 * Expected JSON RPC response for the "getBlockProduction" message
 */
const BlockProductionResponseStruct = jsonRpcResultAndContext(superstruct.type({
  byIdentity: superstruct.record(superstruct.string(), superstruct.array(superstruct.number())),
  range: superstruct.type({
    firstSlot: superstruct.number(),
    lastSlot: superstruct.number()
  })
}));

/**
 * A performance sample
 */

function createRpcClient(url, httpHeaders, customFetch, fetchMiddleware, disableRetryOnRateLimit, httpAgent) {
  const fetch = customFetch ? customFetch : fetchImpl;
  let agent;
  {
    if (httpAgent != null) {
      console.warn('You have supplied an `httpAgent` when creating a `Connection` in a browser environment.' + 'It has been ignored; `httpAgent` is only used in Node environments.');
    }
  }
  let fetchWithMiddleware;
  if (fetchMiddleware) {
    fetchWithMiddleware = async (info, init) => {
      const modifiedFetchArgs = await new Promise((resolve, reject) => {
        try {
          fetchMiddleware(info, init, (modifiedInfo, modifiedInit) => resolve([modifiedInfo, modifiedInit]));
        } catch (error) {
          reject(error);
        }
      });
      return await fetch(...modifiedFetchArgs);
    };
  }
  const clientBrowser = new RpcClient__default.default(async (request, callback) => {
    const options = {
      method: 'POST',
      body: request,
      agent,
      headers: Object.assign({
        'Content-Type': 'application/json'
      }, httpHeaders || {}, COMMON_HTTP_HEADERS)
    };
    try {
      let too_many_requests_retries = 5;
      let res;
      let waitTime = 500;
      for (;;) {
        if (fetchWithMiddleware) {
          res = await fetchWithMiddleware(url, options);
        } else {
          res = await fetch(url, options);
        }
        if (res.status !== 429 /* Too many requests */) {
          break;
        }
        if (disableRetryOnRateLimit === true) {
          break;
        }
        too_many_requests_retries -= 1;
        if (too_many_requests_retries === 0) {
          break;
        }
        console.error(`Server responded with ${res.status} ${res.statusText}.  Retrying after ${waitTime}ms delay...`);
        await sleep(waitTime);
        waitTime *= 2;
      }
      const text = await res.text();
      if (res.ok) {
        callback(null, text);
      } else {
        callback(new Error(`${res.status} ${res.statusText}: ${text}`));
      }
    } catch (err) {
      if (err instanceof Error) callback(err);
    }
  }, {});
  return clientBrowser;
}
function createRpcRequest(client) {
  return (method, args) => {
    return new Promise((resolve, reject) => {
      client.request(method, args, (err, response) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(response);
      });
    });
  };
}
function createRpcBatchRequest(client) {
  return requests => {
    return new Promise((resolve, reject) => {
      // Do nothing if requests is empty
      if (requests.length === 0) resolve([]);
      const batch = requests.map(params => {
        return client.request(params.methodName, params.args);
      });
      client.request(batch, (err, response) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(response);
      });
    });
  };
}

/**
 * Expected JSON RPC response for the "getInflationGovernor" message
 */
const GetInflationGovernorRpcResult = jsonRpcResult(GetInflationGovernorResult);

/**
 * Expected JSON RPC response for the "getInflationRate" message
 */
const GetInflationRateRpcResult = jsonRpcResult(GetInflationRateResult);

/**
 * Expected JSON RPC response for the "getRecentPrioritizationFees" message
 */
const GetRecentPrioritizationFeesRpcResult = jsonRpcResult(GetRecentPrioritizationFeesResult);

/**
 * Expected JSON RPC response for the "getEpochInfo" message
 */
const GetEpochInfoRpcResult = jsonRpcResult(GetEpochInfoResult);

/**
 * Expected JSON RPC response for the "getEpochSchedule" message
 */
const GetEpochScheduleRpcResult = jsonRpcResult(GetEpochScheduleResult);

/**
 * Expected JSON RPC response for the "getLeaderSchedule" message
 */
const GetLeaderScheduleRpcResult = jsonRpcResult(GetLeaderScheduleResult);

/**
 * Expected JSON RPC response for the "minimumLedgerSlot" and "getFirstAvailableBlock" messages
 */
const SlotRpcResult = jsonRpcResult(superstruct.number());

/**
 * Supply
 */

/**
 * Expected JSON RPC response for the "getSupply" message
 */
const GetSupplyRpcResult = jsonRpcResultAndContext(superstruct.type({
  total: superstruct.number(),
  circulating: superstruct.number(),
  nonCirculating: superstruct.number(),
  nonCirculatingAccounts: superstruct.array(PublicKeyFromString)
}));

/**
 * Token amount object which returns a token amount in different formats
 * for various client use cases.
 */

/**
 * Expected JSON RPC structure for token amounts
 */
const TokenAmountResult = superstruct.type({
  amount: superstruct.string(),
  uiAmount: superstruct.nullable(superstruct.number()),
  decimals: superstruct.number(),
  uiAmountString: superstruct.optional(superstruct.string())
});

/**
 * Token address and balance.
 */

/**
 * Expected JSON RPC response for the "getTokenLargestAccounts" message
 */
const GetTokenLargestAccountsResult = jsonRpcResultAndContext(superstruct.array(superstruct.type({
  address: PublicKeyFromString,
  amount: superstruct.string(),
  uiAmount: superstruct.nullable(superstruct.number()),
  decimals: superstruct.number(),
  uiAmountString: superstruct.optional(superstruct.string())
})));

/**
 * Expected JSON RPC response for the "getTokenAccountsByOwner" message
 */
const GetTokenAccountsByOwner = jsonRpcResultAndContext(superstruct.array(superstruct.type({
  pubkey: PublicKeyFromString,
  account: superstruct.type({
    executable: superstruct.boolean(),
    owner: PublicKeyFromString,
    lamports: superstruct.number(),
    data: BufferFromRawAccountData,
    rentEpoch: superstruct.number()
  })
})));
const ParsedAccountDataResult = superstruct.type({
  program: superstruct.string(),
  parsed: superstruct.unknown(),
  space: superstruct.number()
});

/**
 * Expected JSON RPC response for the "getTokenAccountsByOwner" message with parsed data
 */
const GetParsedTokenAccountsByOwner = jsonRpcResultAndContext(superstruct.array(superstruct.type({
  pubkey: PublicKeyFromString,
  account: superstruct.type({
    executable: superstruct.boolean(),
    owner: PublicKeyFromString,
    lamports: superstruct.number(),
    data: ParsedAccountDataResult,
    rentEpoch: superstruct.number()
  })
})));

/**
 * Pair of an account address and its balance
 */

/**
 * Expected JSON RPC response for the "getLargestAccounts" message
 */
const GetLargestAccountsRpcResult = jsonRpcResultAndContext(superstruct.array(superstruct.type({
  lamports: superstruct.number(),
  address: PublicKeyFromString
})));

/**
 * @internal
 */
const AccountInfoResult = superstruct.type({
  executable: superstruct.boolean(),
  owner: PublicKeyFromString,
  lamports: superstruct.number(),
  data: BufferFromRawAccountData,
  rentEpoch: superstruct.number()
});

/**
 * @internal
 */
const KeyedAccountInfoResult = superstruct.type({
  pubkey: PublicKeyFromString,
  account: AccountInfoResult
});
const ParsedOrRawAccountData = superstruct.coerce(superstruct.union([superstruct.instance(buffer.Buffer), ParsedAccountDataResult]), superstruct.union([RawAccountDataResult, ParsedAccountDataResult]), value => {
  if (Array.isArray(value)) {
    return superstruct.create(value, BufferFromRawAccountData);
  } else {
    return value;
  }
});

/**
 * @internal
 */
const ParsedAccountInfoResult = superstruct.type({
  executable: superstruct.boolean(),
  owner: PublicKeyFromString,
  lamports: superstruct.number(),
  data: ParsedOrRawAccountData,
  rentEpoch: superstruct.number()
});
const KeyedParsedAccountInfoResult = superstruct.type({
  pubkey: PublicKeyFromString,
  account: ParsedAccountInfoResult
});

/**
 * @internal
 */
const StakeActivationResult = superstruct.type({
  state: superstruct.union([superstruct.literal('active'), superstruct.literal('inactive'), superstruct.literal('activating'), superstruct.literal('deactivating')]),
  active: superstruct.number(),
  inactive: superstruct.number()
});

/**
 * Expected JSON RPC response for the "getConfirmedSignaturesForAddress2" message
 */

const GetConfirmedSignaturesForAddress2RpcResult = jsonRpcResult(superstruct.array(superstruct.type({
  signature: superstruct.string(),
  slot: superstruct.number(),
  err: TransactionErrorResult,
  memo: superstruct.nullable(superstruct.string()),
  blockTime: superstruct.optional(superstruct.nullable(superstruct.number()))
})));

/**
 * Expected JSON RPC response for the "getSignaturesForAddress" message
 */
const GetSignaturesForAddressRpcResult = jsonRpcResult(superstruct.array(superstruct.type({
  signature: superstruct.string(),
  slot: superstruct.number(),
  err: TransactionErrorResult,
  memo: superstruct.nullable(superstruct.string()),
  blockTime: superstruct.optional(superstruct.nullable(superstruct.number()))
})));

/***
 * Expected JSON RPC response for the "accountNotification" message
 */
const AccountNotificationResult = superstruct.type({
  subscription: superstruct.number(),
  result: notificationResultAndContext(AccountInfoResult)
});

/**
 * @internal
 */
const ProgramAccountInfoResult = superstruct.type({
  pubkey: PublicKeyFromString,
  account: AccountInfoResult
});

/***
 * Expected JSON RPC response for the "programNotification" message
 */
const ProgramAccountNotificationResult = superstruct.type({
  subscription: superstruct.number(),
  result: notificationResultAndContext(ProgramAccountInfoResult)
});

/**
 * @internal
 */
const SlotInfoResult = superstruct.type({
  parent: superstruct.number(),
  slot: superstruct.number(),
  root: superstruct.number()
});

/**
 * Expected JSON RPC response for the "slotNotification" message
 */
const SlotNotificationResult = superstruct.type({
  subscription: superstruct.number(),
  result: SlotInfoResult
});

/**
 * Slot updates which can be used for tracking the live progress of a cluster.
 * - `"firstShredReceived"`: connected node received the first shred of a block.
 * Indicates that a new block that is being produced.
 * - `"completed"`: connected node has received all shreds of a block. Indicates
 * a block was recently produced.
 * - `"optimisticConfirmation"`: block was optimistically confirmed by the
 * cluster. It is not guaranteed that an optimistic confirmation notification
 * will be sent for every finalized blocks.
 * - `"root"`: the connected node rooted this block.
 * - `"createdBank"`: the connected node has started validating this block.
 * - `"frozen"`: the connected node has validated this block.
 * - `"dead"`: the connected node failed to validate this block.
 */

/**
 * @internal
 */
const SlotUpdateResult = superstruct.union([superstruct.type({
  type: superstruct.union([superstruct.literal('firstShredReceived'), superstruct.literal('completed'), superstruct.literal('optimisticConfirmation'), superstruct.literal('root')]),
  slot: superstruct.number(),
  timestamp: superstruct.number()
}), superstruct.type({
  type: superstruct.literal('createdBank'),
  parent: superstruct.number(),
  slot: superstruct.number(),
  timestamp: superstruct.number()
}), superstruct.type({
  type: superstruct.literal('frozen'),
  slot: superstruct.number(),
  timestamp: superstruct.number(),
  stats: superstruct.type({
    numTransactionEntries: superstruct.number(),
    numSuccessfulTransactions: superstruct.number(),
    numFailedTransactions: superstruct.number(),
    maxTransactionsPerEntry: superstruct.number()
  })
}), superstruct.type({
  type: superstruct.literal('dead'),
  slot: superstruct.number(),
  timestamp: superstruct.number(),
  err: superstruct.string()
})]);

/**
 * Expected JSON RPC response for the "slotsUpdatesNotification" message
 */
const SlotUpdateNotificationResult = superstruct.type({
  subscription: superstruct.number(),
  result: SlotUpdateResult
});

/**
 * Expected JSON RPC response for the "signatureNotification" message
 */
const SignatureNotificationResult = superstruct.type({
  subscription: superstruct.number(),
  result: notificationResultAndContext(superstruct.union([SignatureStatusResult, SignatureReceivedResult]))
});

/**
 * Expected JSON RPC response for the "rootNotification" message
 */
const RootNotificationResult = superstruct.type({
  subscription: superstruct.number(),
  result: superstruct.number()
});
const ContactInfoResult = superstruct.type({
  pubkey: superstruct.string(),
  gossip: superstruct.nullable(superstruct.string()),
  tpu: superstruct.nullable(superstruct.string()),
  rpc: superstruct.nullable(superstruct.string()),
  version: superstruct.nullable(superstruct.string())
});
const VoteAccountInfoResult = superstruct.type({
  votePubkey: superstruct.string(),
  nodePubkey: superstruct.string(),
  activatedStake: superstruct.number(),
  epochVoteAccount: superstruct.boolean(),
  epochCredits: superstruct.array(superstruct.tuple([superstruct.number(), superstruct.number(), superstruct.number()])),
  commission: superstruct.number(),
  lastVote: superstruct.number(),
  rootSlot: superstruct.nullable(superstruct.number())
});

/**
 * Expected JSON RPC response for the "getVoteAccounts" message
 */
const GetVoteAccounts = jsonRpcResult(superstruct.type({
  current: superstruct.array(VoteAccountInfoResult),
  delinquent: superstruct.array(VoteAccountInfoResult)
}));
const ConfirmationStatus = superstruct.union([superstruct.literal('processed'), superstruct.literal('confirmed'), superstruct.literal('finalized')]);
const SignatureStatusResponse = superstruct.type({
  slot: superstruct.number(),
  confirmations: superstruct.nullable(superstruct.number()),
  err: TransactionErrorResult,
  confirmationStatus: superstruct.optional(ConfirmationStatus)
});

/**
 * Expected JSON RPC response for the "getSignatureStatuses" message
 */
const GetSignatureStatusesRpcResult = jsonRpcResultAndContext(superstruct.array(superstruct.nullable(SignatureStatusResponse)));

/**
 * Expected JSON RPC response for the "getMinimumBalanceForRentExemption" message
 */
const GetMinimumBalanceForRentExemptionRpcResult = jsonRpcResult(superstruct.number());
const AddressTableLookupStruct = superstruct.type({
  accountKey: PublicKeyFromString,
  writableIndexes: superstruct.array(superstruct.number()),
  readonlyIndexes: superstruct.array(superstruct.number())
});
const ConfirmedTransactionResult = superstruct.type({
  signatures: superstruct.array(superstruct.string()),
  message: superstruct.type({
    accountKeys: superstruct.array(superstruct.string()),
    header: superstruct.type({
      numRequiredSignatures: superstruct.number(),
      numReadonlySignedAccounts: superstruct.number(),
      numReadonlyUnsignedAccounts: superstruct.number()
    }),
    instructions: superstruct.array(superstruct.type({
      accounts: superstruct.array(superstruct.number()),
      data: superstruct.string(),
      programIdIndex: superstruct.number()
    })),
    recentBlockhash: superstruct.string(),
    addressTableLookups: superstruct.optional(superstruct.array(AddressTableLookupStruct))
  })
});
const AnnotatedAccountKey = superstruct.type({
  pubkey: PublicKeyFromString,
  signer: superstruct.boolean(),
  writable: superstruct.boolean(),
  source: superstruct.optional(superstruct.union([superstruct.literal('transaction'), superstruct.literal('lookupTable')]))
});
const ConfirmedTransactionAccountsModeResult = superstruct.type({
  accountKeys: superstruct.array(AnnotatedAccountKey),
  signatures: superstruct.array(superstruct.string())
});
const ParsedInstructionResult = superstruct.type({
  parsed: superstruct.unknown(),
  program: superstruct.string(),
  programId: PublicKeyFromString
});
const RawInstructionResult = superstruct.type({
  accounts: superstruct.array(PublicKeyFromString),
  data: superstruct.string(),
  programId: PublicKeyFromString
});
const InstructionResult = superstruct.union([RawInstructionResult, ParsedInstructionResult]);
const UnknownInstructionResult = superstruct.union([superstruct.type({
  parsed: superstruct.unknown(),
  program: superstruct.string(),
  programId: superstruct.string()
}), superstruct.type({
  accounts: superstruct.array(superstruct.string()),
  data: superstruct.string(),
  programId: superstruct.string()
})]);
const ParsedOrRawInstruction = superstruct.coerce(InstructionResult, UnknownInstructionResult, value => {
  if ('accounts' in value) {
    return superstruct.create(value, RawInstructionResult);
  } else {
    return superstruct.create(value, ParsedInstructionResult);
  }
});

/**
 * @internal
 */
const ParsedConfirmedTransactionResult = superstruct.type({
  signatures: superstruct.array(superstruct.string()),
  message: superstruct.type({
    accountKeys: superstruct.array(AnnotatedAccountKey),
    instructions: superstruct.array(ParsedOrRawInstruction),
    recentBlockhash: superstruct.string(),
    addressTableLookups: superstruct.optional(superstruct.nullable(superstruct.array(AddressTableLookupStruct)))
  })
});
const TokenBalanceResult = superstruct.type({
  accountIndex: superstruct.number(),
  mint: superstruct.string(),
  owner: superstruct.optional(superstruct.string()),
  programId: superstruct.optional(superstruct.string()),
  uiTokenAmount: TokenAmountResult
});
const LoadedAddressesResult = superstruct.type({
  writable: superstruct.array(PublicKeyFromString),
  readonly: superstruct.array(PublicKeyFromString)
});

/**
 * @internal
 */
const ConfirmedTransactionMetaResult = superstruct.type({
  err: TransactionErrorResult,
  fee: superstruct.number(),
  innerInstructions: superstruct.optional(superstruct.nullable(superstruct.array(superstruct.type({
    index: superstruct.number(),
    instructions: superstruct.array(superstruct.type({
      accounts: superstruct.array(superstruct.number()),
      data: superstruct.string(),
      programIdIndex: superstruct.number()
    }))
  })))),
  preBalances: superstruct.array(superstruct.number()),
  postBalances: superstruct.array(superstruct.number()),
  logMessages: superstruct.optional(superstruct.nullable(superstruct.array(superstruct.string()))),
  preTokenBalances: superstruct.optional(superstruct.nullable(superstruct.array(TokenBalanceResult))),
  postTokenBalances: superstruct.optional(superstruct.nullable(superstruct.array(TokenBalanceResult))),
  loadedAddresses: superstruct.optional(LoadedAddressesResult),
  computeUnitsConsumed: superstruct.optional(superstruct.number()),
  costUnits: superstruct.optional(superstruct.number())
});

/**
 * @internal
 */
const ParsedConfirmedTransactionMetaResult = superstruct.type({
  err: TransactionErrorResult,
  fee: superstruct.number(),
  innerInstructions: superstruct.optional(superstruct.nullable(superstruct.array(superstruct.type({
    index: superstruct.number(),
    instructions: superstruct.array(ParsedOrRawInstruction)
  })))),
  preBalances: superstruct.array(superstruct.number()),
  postBalances: superstruct.array(superstruct.number()),
  logMessages: superstruct.optional(superstruct.nullable(superstruct.array(superstruct.string()))),
  preTokenBalances: superstruct.optional(superstruct.nullable(superstruct.array(TokenBalanceResult))),
  postTokenBalances: superstruct.optional(superstruct.nullable(superstruct.array(TokenBalanceResult))),
  loadedAddresses: superstruct.optional(LoadedAddressesResult),
  computeUnitsConsumed: superstruct.optional(superstruct.number()),
  costUnits: superstruct.optional(superstruct.number())
});
const TransactionVersionStruct = superstruct.union([superstruct.literal(0), superstruct.literal('legacy')]);

/** @internal */
const RewardsResult = superstruct.type({
  pubkey: superstruct.string(),
  lamports: superstruct.number(),
  postBalance: superstruct.nullable(superstruct.number()),
  rewardType: superstruct.nullable(superstruct.string()),
  commission: superstruct.optional(superstruct.nullable(superstruct.number()))
});

/**
 * Expected JSON RPC response for the "getBlock" message
 */
const GetBlockRpcResult = jsonRpcResult(superstruct.nullable(superstruct.type({
  blockhash: superstruct.string(),
  previousBlockhash: superstruct.string(),
  parentSlot: superstruct.number(),
  transactions: superstruct.array(superstruct.type({
    transaction: ConfirmedTransactionResult,
    meta: superstruct.nullable(ConfirmedTransactionMetaResult),
    version: superstruct.optional(TransactionVersionStruct)
  })),
  rewards: superstruct.optional(superstruct.array(RewardsResult)),
  blockTime: superstruct.nullable(superstruct.number()),
  blockHeight: superstruct.nullable(superstruct.number())
})));

/**
 * Expected JSON RPC response for the "getBlock" message when `transactionDetails` is `none`
 */
const GetNoneModeBlockRpcResult = jsonRpcResult(superstruct.nullable(superstruct.type({
  blockhash: superstruct.string(),
  previousBlockhash: superstruct.string(),
  parentSlot: superstruct.number(),
  rewards: superstruct.optional(superstruct.array(RewardsResult)),
  blockTime: superstruct.nullable(superstruct.number()),
  blockHeight: superstruct.nullable(superstruct.number())
})));

/**
 * Expected JSON RPC response for the "getBlock" message when `transactionDetails` is `accounts`
 */
const GetAccountsModeBlockRpcResult = jsonRpcResult(superstruct.nullable(superstruct.type({
  blockhash: superstruct.string(),
  previousBlockhash: superstruct.string(),
  parentSlot: superstruct.number(),
  transactions: superstruct.array(superstruct.type({
    transaction: ConfirmedTransactionAccountsModeResult,
    meta: superstruct.nullable(ConfirmedTransactionMetaResult),
    version: superstruct.optional(TransactionVersionStruct)
  })),
  rewards: superstruct.optional(superstruct.array(RewardsResult)),
  blockTime: superstruct.nullable(superstruct.number()),
  blockHeight: superstruct.nullable(superstruct.number())
})));

/**
 * Expected parsed JSON RPC response for the "getBlock" message
 */
const GetParsedBlockRpcResult = jsonRpcResult(superstruct.nullable(superstruct.type({
  blockhash: superstruct.string(),
  previousBlockhash: superstruct.string(),
  parentSlot: superstruct.number(),
  transactions: superstruct.array(superstruct.type({
    transaction: ParsedConfirmedTransactionResult,
    meta: superstruct.nullable(ParsedConfirmedTransactionMetaResult),
    version: superstruct.optional(TransactionVersionStruct)
  })),
  rewards: superstruct.optional(superstruct.array(RewardsResult)),
  blockTime: superstruct.nullable(superstruct.number()),
  blockHeight: superstruct.nullable(superstruct.number())
})));

/**
 * Expected parsed JSON RPC response for the "getBlock" message  when `transactionDetails` is `accounts`
 */
const GetParsedAccountsModeBlockRpcResult = jsonRpcResult(superstruct.nullable(superstruct.type({
  blockhash: superstruct.string(),
  previousBlockhash: superstruct.string(),
  parentSlot: superstruct.number(),
  transactions: superstruct.array(superstruct.type({
    transaction: ConfirmedTransactionAccountsModeResult,
    meta: superstruct.nullable(ParsedConfirmedTransactionMetaResult),
    version: superstruct.optional(TransactionVersionStruct)
  })),
  rewards: superstruct.optional(superstruct.array(RewardsResult)),
  blockTime: superstruct.nullable(superstruct.number()),
  blockHeight: superstruct.nullable(superstruct.number())
})));

/**
 * Expected parsed JSON RPC response for the "getBlock" message  when `transactionDetails` is `none`
 */
const GetParsedNoneModeBlockRpcResult = jsonRpcResult(superstruct.nullable(superstruct.type({
  blockhash: superstruct.string(),
  previousBlockhash: superstruct.string(),
  parentSlot: superstruct.number(),
  rewards: superstruct.optional(superstruct.array(RewardsResult)),
  blockTime: superstruct.nullable(superstruct.number()),
  blockHeight: superstruct.nullable(superstruct.number())
})));

/**
 * Expected JSON RPC response for the "getConfirmedBlock" message
 *
 * @deprecated Deprecated since RPC v1.8.0. Please use {@link GetBlockRpcResult} instead.
 */
const GetConfirmedBlockRpcResult = jsonRpcResult(superstruct.nullable(superstruct.type({
  blockhash: superstruct.string(),
  previousBlockhash: superstruct.string(),
  parentSlot: superstruct.number(),
  transactions: superstruct.array(superstruct.type({
    transaction: ConfirmedTransactionResult,
    meta: superstruct.nullable(ConfirmedTransactionMetaResult)
  })),
  rewards: superstruct.optional(superstruct.array(RewardsResult)),
  blockTime: superstruct.nullable(superstruct.number())
})));

/**
 * Expected JSON RPC response for the "getBlock" message
 */
const GetBlockSignaturesRpcResult = jsonRpcResult(superstruct.nullable(superstruct.type({
  blockhash: superstruct.string(),
  previousBlockhash: superstruct.string(),
  parentSlot: superstruct.number(),
  signatures: superstruct.array(superstruct.string()),
  blockTime: superstruct.nullable(superstruct.number())
})));

/**
 * Expected JSON RPC response for the "getTransaction" message
 */
const GetTransactionRpcResult = jsonRpcResult(superstruct.nullable(superstruct.type({
  slot: superstruct.number(),
  meta: superstruct.nullable(ConfirmedTransactionMetaResult),
  blockTime: superstruct.optional(superstruct.nullable(superstruct.number())),
  transaction: ConfirmedTransactionResult,
  version: superstruct.optional(TransactionVersionStruct)
})));

/**
 * Expected parsed JSON RPC response for the "getTransaction" message
 */
const GetParsedTransactionRpcResult = jsonRpcResult(superstruct.nullable(superstruct.type({
  slot: superstruct.number(),
  transaction: ParsedConfirmedTransactionResult,
  meta: superstruct.nullable(ParsedConfirmedTransactionMetaResult),
  blockTime: superstruct.optional(superstruct.nullable(superstruct.number())),
  version: superstruct.optional(TransactionVersionStruct)
})));

/**
 * Expected JSON RPC response for the "getLatestBlockhash" message
 */
const GetLatestBlockhashRpcResult = jsonRpcResultAndContext(superstruct.type({
  blockhash: superstruct.string(),
  lastValidBlockHeight: superstruct.number()
}));

/**
 * Expected JSON RPC response for the "isBlockhashValid" message
 */
const IsBlockhashValidRpcResult = jsonRpcResultAndContext(superstruct.boolean());
const PerfSampleResult = superstruct.type({
  slot: superstruct.number(),
  numTransactions: superstruct.number(),
  numSlots: superstruct.number(),
  samplePeriodSecs: superstruct.number()
});

/*
 * Expected JSON RPC response for "getRecentPerformanceSamples" message
 */
const GetRecentPerformanceSamplesRpcResult = jsonRpcResult(superstruct.array(PerfSampleResult));

/**
 * Expected JSON RPC response for the "getFeeCalculatorForBlockhash" message
 */
const GetFeeCalculatorRpcResult = jsonRpcResultAndContext(superstruct.nullable(superstruct.type({
  feeCalculator: superstruct.type({
    lamportsPerSignature: superstruct.number()
  })
})));

/**
 * Expected JSON RPC response for the "requestAirdrop" message
 */
const RequestAirdropRpcResult = jsonRpcResult(superstruct.string());

/**
 * Expected JSON RPC response for the "sendTransaction" message
 */
const SendTransactionRpcResult = jsonRpcResult(superstruct.string());

/**
 * Information about the latest slot being processed by a node
 */

/**
 * Parsed account data
 */

/**
 * Stake Activation data
 */

/**
 * Data slice argument for getProgramAccounts
 */

/**
 * Memory comparison filter for getProgramAccounts
 */

/**
 * Data size comparison filter for getProgramAccounts
 */

/**
 * A filter object for getProgramAccounts
 */

/**
 * Configuration object for getProgramAccounts requests
 */

/**
 * Configuration object for getParsedProgramAccounts
 */

/**
 * Configuration object for getMultipleAccounts
 */

/**
 * Configuration object for `getStakeActivation`
 */

/**
 * Configuration object for `getStakeActivation`
 */

/**
 * Configuration object for `getStakeActivation`
 */

/**
 * Configuration object for `getNonce`
 */

/**
 * Configuration object for `getNonceAndContext`
 */

/**
 * Information describing an account
 */

/**
 * Account information identified by pubkey
 */

/**
 * Callback function for account change notifications
 */

/**
 * Callback function for program account change notifications
 */

/**
 * Callback function for slot change notifications
 */

/**
 * Callback function for slot update notifications
 */

/**
 * Callback function for signature status notifications
 */

/**
 * Signature status notification with transaction result
 */

/**
 * Signature received notification
 */

/**
 * Callback function for signature notifications
 */

/**
 * Signature subscription options
 */

/**
 * Callback function for root change notifications
 */

/**
 * @internal
 */
const LogsResult = superstruct.type({
  err: TransactionErrorResult,
  logs: superstruct.array(superstruct.string()),
  signature: superstruct.string()
});

/**
 * Logs result.
 */

/**
 * Expected JSON RPC response for the "logsNotification" message.
 */
const LogsNotificationResult = superstruct.type({
  result: notificationResultAndContext(LogsResult),
  subscription: superstruct.number()
});

/**
 * Filter for log subscriptions.
 */

/**
 * Callback function for log notifications.
 */

/**
 * Signature result
 */

/**
 * Transaction error
 */

/**
 * Transaction confirmation status
 * <pre>
 *   'processed': Transaction landed in a block which has reached 1 confirmation by the connected node
 *   'confirmed': Transaction landed in a block which has reached 1 confirmation by the cluster
 *   'finalized': Transaction landed in a block which has been finalized by the cluster
 * </pre>
 */

/**
 * Signature status
 */

/**
 * A confirmed signature with its status
 */

/**
 * An object defining headers to be passed to the RPC server
 */

/**
 * The type of the JavaScript `fetch()` API
 */

/**
 * A callback used to augment the outgoing HTTP request
 */

/**
 * Configuration for instantiating a Connection
 */

/** @internal */
const COMMON_HTTP_HEADERS = {
  'solana-client': `js/${"1.0.0-maintenance"}`
};

/**
 * A connection to a fullnode JSON RPC endpoint
 */
class Connection {
  /**
   * Establish a JSON RPC connection
   *
   * @param endpoint URL to the fullnode JSON RPC endpoint
   * @param commitmentOrConfig optional default commitment level or optional ConnectionConfig configuration object
   */
  constructor(endpoint, _commitmentOrConfig) {
    /** @internal */
    this._commitment = void 0;
    /** @internal */
    this._confirmTransactionInitialTimeout = void 0;
    /** @internal */
    this._rpcEndpoint = void 0;
    /** @internal */
    this._rpcWsEndpoint = void 0;
    /** @internal */
    this._rpcClient = void 0;
    /** @internal */
    this._rpcRequest = void 0;
    /** @internal */
    this._rpcBatchRequest = void 0;
    /** @internal */
    this._rpcWebSocket = void 0;
    /** @internal */
    this._rpcWebSocketConnected = false;
    /** @internal */
    this._rpcWebSocketHeartbeat = null;
    /** @internal */
    this._rpcWebSocketIdleTimeout = null;
    /** @internal
     * A number that we increment every time an active connection closes.
     * Used to determine whether the same socket connection that was open
     * when an async operation started is the same one that's active when
     * its continuation fires.
     *
     */
    this._rpcWebSocketGeneration = 0;
    /** @internal */
    this._disableBlockhashCaching = false;
    /** @internal */
    this._pollingBlockhash = false;
    /** @internal */
    this._blockhashInfo = {
      latestBlockhash: null,
      lastFetch: 0,
      transactionSignatures: [],
      simulatedSignatures: []
    };
    /** @internal */
    this._nextClientSubscriptionId = 0;
    /** @internal */
    this._subscriptionDisposeFunctionsByClientSubscriptionId = {};
    /** @internal */
    this._subscriptionHashByClientSubscriptionId = {};
    /** @internal */
    this._subscriptionStateChangeCallbacksByHash = {};
    /** @internal */
    this._subscriptionCallbacksByServerSubscriptionId = {};
    /** @internal */
    this._subscriptionsByHash = {};
    /**
     * Special case.
     * After a signature is processed, RPCs automatically dispose of the
     * subscription on the server side. We need to track which of these
     * subscriptions have been disposed in such a way, so that we know
     * whether the client is dealing with a not-yet-processed signature
     * (in which case we must tear down the server subscription) or an
     * already-processed signature (in which case the client can simply
     * clear out the subscription locally without telling the server).
     *
     * NOTE: There is a proposal to eliminate this special case, here:
     * https://github.com/solana-labs/solana/issues/18892
     */
    /** @internal */
    this._subscriptionsAutoDisposedByRpc = new Set();
    /*
     * Returns the current block height of the node
     */
    this.getBlockHeight = (() => {
      const requestPromises = {};
      return async commitmentOrConfig => {
        const {
          commitment,
          config
        } = extractCommitmentFromConfig(commitmentOrConfig);
        const args = this._buildArgs([], commitment, undefined /* encoding */, config);
        const requestHash = fastStableStringify(args);
        requestPromises[requestHash] = requestPromises[requestHash] ?? (async () => {
          try {
            const unsafeRes = await this._rpcRequest('getBlockHeight', args);
            const res = superstruct.create(unsafeRes, jsonRpcResult(superstruct.number()));
            if ('error' in res) {
              throw new SolanaJSONRPCError(res.error, 'failed to get block height information');
            }
            return res.result;
          } finally {
            delete requestPromises[requestHash];
          }
        })();
        return await requestPromises[requestHash];
      };
    })();
    let wsEndpoint;
    let httpHeaders;
    let fetch;
    let fetchMiddleware;
    let disableRetryOnRateLimit;
    let httpAgent;
    if (_commitmentOrConfig && typeof _commitmentOrConfig === 'string') {
      this._commitment = _commitmentOrConfig;
    } else if (_commitmentOrConfig) {
      this._commitment = _commitmentOrConfig.commitment;
      this._confirmTransactionInitialTimeout = _commitmentOrConfig.confirmTransactionInitialTimeout;
      wsEndpoint = _commitmentOrConfig.wsEndpoint;
      httpHeaders = _commitmentOrConfig.httpHeaders;
      fetch = _commitmentOrConfig.fetch;
      fetchMiddleware = _commitmentOrConfig.fetchMiddleware;
      disableRetryOnRateLimit = _commitmentOrConfig.disableRetryOnRateLimit;
      httpAgent = _commitmentOrConfig.httpAgent;
    }
    this._rpcEndpoint = assertEndpointUrl(endpoint);
    this._rpcWsEndpoint = wsEndpoint || makeWebsocketUrl(endpoint);
    this._rpcClient = createRpcClient(endpoint, httpHeaders, fetch, fetchMiddleware, disableRetryOnRateLimit, httpAgent);
    this._rpcRequest = createRpcRequest(this._rpcClient);
    this._rpcBatchRequest = createRpcBatchRequest(this._rpcClient);
    this._rpcWebSocket = new RpcWebSocketClient(this._rpcWsEndpoint, {
      autoconnect: false,
      max_reconnects: Infinity
    });
    this._rpcWebSocket.on('open', this._wsOnOpen.bind(this));
    this._rpcWebSocket.on('error', this._wsOnError.bind(this));
    this._rpcWebSocket.on('close', this._wsOnClose.bind(this));
    this._rpcWebSocket.on('accountNotification', this._wsOnAccountNotification.bind(this));
    this._rpcWebSocket.on('programNotification', this._wsOnProgramAccountNotification.bind(this));
    this._rpcWebSocket.on('slotNotification', this._wsOnSlotNotification.bind(this));
    this._rpcWebSocket.on('slotsUpdatesNotification', this._wsOnSlotUpdatesNotification.bind(this));
    this._rpcWebSocket.on('signatureNotification', this._wsOnSignatureNotification.bind(this));
    this._rpcWebSocket.on('rootNotification', this._wsOnRootNotification.bind(this));
    this._rpcWebSocket.on('logsNotification', this._wsOnLogsNotification.bind(this));
  }

  /**
   * The default commitment used for requests
   */
  get commitment() {
    return this._commitment;
  }

  /**
   * The RPC endpoint
   */
  get rpcEndpoint() {
    return this._rpcEndpoint;
  }

  /**
   * Fetch the balance for the specified public key, return with context
   */
  async getBalanceAndContext(publicKey, commitmentOrConfig) {
    /** @internal */
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([publicKey.toBase58()], commitment, undefined /* encoding */, config);
    const unsafeRes = await this._rpcRequest('getBalance', args);
    const res = superstruct.create(unsafeRes, jsonRpcResultAndContext(superstruct.number()));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get balance for ${publicKey.toBase58()}`);
    }
    return res.result;
  }

  /**
   * Fetch the balance for the specified public key
   */
  async getBalance(publicKey, commitmentOrConfig) {
    return await this.getBalanceAndContext(publicKey, commitmentOrConfig).then(x => x.value).catch(e => {
      throw new Error('failed to get balance of account ' + publicKey.toBase58() + ': ' + e);
    });
  }

  /**
   * Fetch the estimated production time of a block
   */
  async getBlockTime(slot) {
    const unsafeRes = await this._rpcRequest('getBlockTime', [slot]);
    const res = superstruct.create(unsafeRes, jsonRpcResult(superstruct.nullable(superstruct.number())));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get block time for slot ${slot}`);
    }
    return res.result;
  }

  /**
   * Fetch the lowest slot that the node has information about in its ledger.
   * This value may increase over time if the node is configured to purge older ledger data
   */
  async getMinimumLedgerSlot() {
    const unsafeRes = await this._rpcRequest('minimumLedgerSlot', []);
    const res = superstruct.create(unsafeRes, jsonRpcResult(superstruct.number()));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get minimum ledger slot');
    }
    return res.result;
  }

  /**
   * Fetch the slot of the lowest confirmed block that has not been purged from the ledger
   */
  async getFirstAvailableBlock() {
    const unsafeRes = await this._rpcRequest('getFirstAvailableBlock', []);
    const res = superstruct.create(unsafeRes, SlotRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get first available block');
    }
    return res.result;
  }

  /**
   * Fetch information about the current supply
   */
  async getSupply(config) {
    let configArg = {};
    if (typeof config === 'string') {
      configArg = {
        commitment: config
      };
    } else if (config) {
      configArg = {
        ...config,
        commitment: config && config.commitment || this.commitment
      };
    } else {
      configArg = {
        commitment: this.commitment
      };
    }
    const unsafeRes = await this._rpcRequest('getSupply', [configArg]);
    const res = superstruct.create(unsafeRes, GetSupplyRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get supply');
    }
    return res.result;
  }

  /**
   * Fetch the current supply of a token mint
   */
  async getTokenSupply(tokenMintAddress, commitment) {
    const args = this._buildArgs([tokenMintAddress.toBase58()], commitment);
    const unsafeRes = await this._rpcRequest('getTokenSupply', args);
    const res = superstruct.create(unsafeRes, jsonRpcResultAndContext(TokenAmountResult));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get token supply');
    }
    return res.result;
  }

  /**
   * Fetch the current balance of a token account
   */
  async getTokenAccountBalance(tokenAddress, commitment) {
    const args = this._buildArgs([tokenAddress.toBase58()], commitment);
    const unsafeRes = await this._rpcRequest('getTokenAccountBalance', args);
    const res = superstruct.create(unsafeRes, jsonRpcResultAndContext(TokenAmountResult));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get token account balance');
    }
    return res.result;
  }

  /**
   * Fetch all the token accounts owned by the specified account
   *
   * @return {Promise<RpcResponseAndContext<GetProgramAccountsResponse>}
   */
  async getTokenAccountsByOwner(ownerAddress, filter, commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    let _args = [ownerAddress.toBase58()];
    if ('mint' in filter) {
      _args.push({
        mint: filter.mint.toBase58()
      });
    } else {
      _args.push({
        programId: filter.programId.toBase58()
      });
    }
    const args = this._buildArgs(_args, commitment, 'base64', config);
    const unsafeRes = await this._rpcRequest('getTokenAccountsByOwner', args);
    const res = superstruct.create(unsafeRes, GetTokenAccountsByOwner);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get token accounts owned by account ${ownerAddress.toBase58()}`);
    }
    return res.result;
  }

  /**
   * Fetch parsed token accounts owned by the specified account
   *
   * @return {Promise<RpcResponseAndContext<Array<{pubkey: PublicKey, account: AccountInfo<ParsedAccountData>}>>>}
   */
  async getParsedTokenAccountsByOwner(ownerAddress, filter, commitment) {
    let _args = [ownerAddress.toBase58()];
    if ('mint' in filter) {
      _args.push({
        mint: filter.mint.toBase58()
      });
    } else {
      _args.push({
        programId: filter.programId.toBase58()
      });
    }
    const args = this._buildArgs(_args, commitment, 'jsonParsed');
    const unsafeRes = await this._rpcRequest('getTokenAccountsByOwner', args);
    const res = superstruct.create(unsafeRes, GetParsedTokenAccountsByOwner);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get token accounts owned by account ${ownerAddress.toBase58()}`);
    }
    return res.result;
  }

  /**
   * Fetch the 20 largest accounts with their current balances
   */
  async getLargestAccounts(config) {
    const arg = {
      ...config,
      commitment: config && config.commitment || this.commitment
    };
    const args = arg.filter || arg.commitment ? [arg] : [];
    const unsafeRes = await this._rpcRequest('getLargestAccounts', args);
    const res = superstruct.create(unsafeRes, GetLargestAccountsRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get largest accounts');
    }
    return res.result;
  }

  /**
   * Fetch the 20 largest token accounts with their current balances
   * for a given mint.
   */
  async getTokenLargestAccounts(mintAddress, commitment) {
    const args = this._buildArgs([mintAddress.toBase58()], commitment);
    const unsafeRes = await this._rpcRequest('getTokenLargestAccounts', args);
    const res = superstruct.create(unsafeRes, GetTokenLargestAccountsResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get token largest accounts');
    }
    return res.result;
  }

  /**
   * Fetch all the account info for the specified public key, return with context
   */
  async getAccountInfoAndContext(publicKey, commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([publicKey.toBase58()], commitment, 'base64', config);
    const unsafeRes = await this._rpcRequest('getAccountInfo', args);
    const res = superstruct.create(unsafeRes, jsonRpcResultAndContext(superstruct.nullable(AccountInfoResult)));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get info about account ${publicKey.toBase58()}`);
    }
    return res.result;
  }

  /**
   * Fetch parsed account info for the specified public key
   */
  async getParsedAccountInfo(publicKey, commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([publicKey.toBase58()], commitment, 'jsonParsed', config);
    const unsafeRes = await this._rpcRequest('getAccountInfo', args);
    const res = superstruct.create(unsafeRes, jsonRpcResultAndContext(superstruct.nullable(ParsedAccountInfoResult)));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get info about account ${publicKey.toBase58()}`);
    }
    return res.result;
  }

  /**
   * Fetch all the account info for the specified public key
   */
  async getAccountInfo(publicKey, commitmentOrConfig) {
    try {
      const res = await this.getAccountInfoAndContext(publicKey, commitmentOrConfig);
      return res.value;
    } catch (e) {
      throw new Error('failed to get info about account ' + publicKey.toBase58() + ': ' + e);
    }
  }

  /**
   * Fetch all the account info for multiple accounts specified by an array of public keys, return with context
   */
  async getMultipleParsedAccounts(publicKeys, rawConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(rawConfig);
    const keys = publicKeys.map(key => key.toBase58());
    const args = this._buildArgs([keys], commitment, 'jsonParsed', config);
    const unsafeRes = await this._rpcRequest('getMultipleAccounts', args);
    const res = superstruct.create(unsafeRes, jsonRpcResultAndContext(superstruct.array(superstruct.nullable(ParsedAccountInfoResult))));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get info for accounts ${keys}`);
    }
    return res.result;
  }

  /**
   * Fetch all the account info for multiple accounts specified by an array of public keys, return with context
   */
  async getMultipleAccountsInfoAndContext(publicKeys, commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const keys = publicKeys.map(key => key.toBase58());
    const args = this._buildArgs([keys], commitment, 'base64', config);
    const unsafeRes = await this._rpcRequest('getMultipleAccounts', args);
    const res = superstruct.create(unsafeRes, jsonRpcResultAndContext(superstruct.array(superstruct.nullable(AccountInfoResult))));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get info for accounts ${keys}`);
    }
    return res.result;
  }

  /**
   * Fetch all the account info for multiple accounts specified by an array of public keys
   */
  async getMultipleAccountsInfo(publicKeys, commitmentOrConfig) {
    const res = await this.getMultipleAccountsInfoAndContext(publicKeys, commitmentOrConfig);
    return res.value;
  }

  /**
   * Returns epoch activation information for a stake account that has been delegated
   *
   * @deprecated Deprecated since RPC v1.18; will be removed in a future version.
   */
  async getStakeActivation(publicKey, commitmentOrConfig, epoch) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([publicKey.toBase58()], commitment, undefined /* encoding */, {
      ...config,
      epoch: epoch != null ? epoch : config?.epoch
    });
    const unsafeRes = await this._rpcRequest('getStakeActivation', args);
    const res = superstruct.create(unsafeRes, jsonRpcResult(StakeActivationResult));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get Stake Activation ${publicKey.toBase58()}`);
    }
    return res.result;
  }

  /**
   * Fetch all the accounts owned by the specified program id
   *
   * @return {Promise<Array<{pubkey: PublicKey, account: AccountInfo<Buffer>}>>}
   */

  // eslint-disable-next-line no-dupe-class-members

  // eslint-disable-next-line no-dupe-class-members
  async getProgramAccounts(programId, configOrCommitment) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(configOrCommitment);
    const {
      encoding,
      ...configWithoutEncoding
    } = config || {};
    const args = this._buildArgs([programId.toBase58()], commitment, encoding || 'base64', {
      ...configWithoutEncoding,
      ...(configWithoutEncoding.filters ? {
        filters: applyDefaultMemcmpEncodingToFilters(configWithoutEncoding.filters)
      } : null)
    });
    const unsafeRes = await this._rpcRequest('getProgramAccounts', args);
    const baseSchema = superstruct.array(KeyedAccountInfoResult);
    const res = configWithoutEncoding.withContext === true ? superstruct.create(unsafeRes, jsonRpcResultAndContext(baseSchema)) : superstruct.create(unsafeRes, jsonRpcResult(baseSchema));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get accounts owned by program ${programId.toBase58()}`);
    }
    return res.result;
  }

  /**
   * Fetch and parse all the accounts owned by the specified program id
   *
   * @return {Promise<Array<{pubkey: PublicKey, account: AccountInfo<Buffer | ParsedAccountData>}>>}
   */
  async getParsedProgramAccounts(programId, configOrCommitment) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(configOrCommitment);
    const args = this._buildArgs([programId.toBase58()], commitment, 'jsonParsed', config);
    const unsafeRes = await this._rpcRequest('getProgramAccounts', args);
    const res = superstruct.create(unsafeRes, jsonRpcResult(superstruct.array(KeyedParsedAccountInfoResult)));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get accounts owned by program ${programId.toBase58()}`);
    }
    return res.result;
  }

  /** @deprecated Instead, call `confirmTransaction` and pass in {@link TransactionConfirmationStrategy} */
  // eslint-disable-next-line no-dupe-class-members

  // eslint-disable-next-line no-dupe-class-members
  async confirmTransaction(strategy, commitment) {
    let rawSignature;
    if (typeof strategy == 'string') {
      rawSignature = strategy;
    } else {
      const config = strategy;
      if (config.abortSignal?.aborted) {
        return Promise.reject(config.abortSignal.reason);
      }
      rawSignature = config.signature;
    }
    let decodedSignature;
    try {
      decodedSignature = bs58__default.default.decode(rawSignature);
    } catch (err) {
      throw new Error('signature must be base58 encoded: ' + rawSignature);
    }
    assert(decodedSignature.length === 64, 'signature has invalid length');
    if (typeof strategy === 'string') {
      return await this.confirmTransactionUsingLegacyTimeoutStrategy({
        commitment: commitment || this.commitment,
        signature: rawSignature
      });
    } else if ('lastValidBlockHeight' in strategy) {
      return await this.confirmTransactionUsingBlockHeightExceedanceStrategy({
        commitment: commitment || this.commitment,
        strategy
      });
    } else {
      return await this.confirmTransactionUsingDurableNonceStrategy({
        commitment: commitment || this.commitment,
        strategy
      });
    }
  }
  getCancellationPromise(signal) {
    return new Promise((_, reject) => {
      if (signal == null) {
        return;
      }
      if (signal.aborted) {
        reject(signal.reason);
      } else {
        signal.addEventListener('abort', () => {
          reject(signal.reason);
        });
      }
    });
  }
  getTransactionConfirmationPromise({
    commitment,
    signature
  }) {
    let signatureSubscriptionId;
    let disposeSignatureSubscriptionStateChangeObserver;
    let done = false;
    const confirmationPromise = new Promise((resolve, reject) => {
      try {
        signatureSubscriptionId = this.onSignature(signature, (result, context) => {
          signatureSubscriptionId = undefined;
          const response = {
            context,
            value: result
          };
          resolve({
            __type: TransactionStatus.PROCESSED,
            response
          });
        }, commitment);
        const subscriptionSetupPromise = new Promise(resolveSubscriptionSetup => {
          if (signatureSubscriptionId == null) {
            resolveSubscriptionSetup();
          } else {
            disposeSignatureSubscriptionStateChangeObserver = this._onSubscriptionStateChange(signatureSubscriptionId, nextState => {
              if (nextState === 'subscribed') {
                resolveSubscriptionSetup();
              }
            });
          }
        });
        (async () => {
          await subscriptionSetupPromise;
          if (done) return;
          const response = await this.getSignatureStatus(signature);
          if (done) return;
          if (response == null) {
            return;
          }
          const {
            context,
            value
          } = response;
          if (value == null) {
            return;
          }
          if (value?.err) {
            reject(value.err);
          } else {
            switch (commitment) {
              case 'confirmed':
              case 'single':
              case 'singleGossip':
                {
                  if (value.confirmationStatus === 'processed') {
                    return;
                  }
                  break;
                }
              case 'finalized':
              case 'max':
              case 'root':
                {
                  if (value.confirmationStatus === 'processed' || value.confirmationStatus === 'confirmed') {
                    return;
                  }
                  break;
                }
              // exhaust enums to ensure full coverage
              case 'processed':
              case 'recent':
            }
            done = true;
            resolve({
              __type: TransactionStatus.PROCESSED,
              response: {
                context,
                value
              }
            });
          }
        })();
      } catch (err) {
        reject(err);
      }
    });
    const abortConfirmation = () => {
      if (disposeSignatureSubscriptionStateChangeObserver) {
        disposeSignatureSubscriptionStateChangeObserver();
        disposeSignatureSubscriptionStateChangeObserver = undefined;
      }
      if (signatureSubscriptionId != null) {
        this.removeSignatureListener(signatureSubscriptionId);
        signatureSubscriptionId = undefined;
      }
    };
    return {
      abortConfirmation,
      confirmationPromise
    };
  }
  async confirmTransactionUsingBlockHeightExceedanceStrategy({
    commitment,
    strategy: {
      abortSignal,
      lastValidBlockHeight,
      signature
    }
  }) {
    let done = false;
    const expiryPromise = new Promise(resolve => {
      const checkBlockHeight = async () => {
        try {
          const blockHeight = await this.getBlockHeight(commitment);
          return blockHeight;
        } catch (_e) {
          return -1;
        }
      };
      (async () => {
        let currentBlockHeight = await checkBlockHeight();
        if (done) return;
        while (currentBlockHeight <= lastValidBlockHeight) {
          await sleep(1000);
          if (done) return;
          currentBlockHeight = await checkBlockHeight();
          if (done) return;
        }
        resolve({
          __type: TransactionStatus.BLOCKHEIGHT_EXCEEDED
        });
      })();
    });
    const {
      abortConfirmation,
      confirmationPromise
    } = this.getTransactionConfirmationPromise({
      commitment,
      signature
    });
    const cancellationPromise = this.getCancellationPromise(abortSignal);
    let result;
    try {
      const outcome = await Promise.race([cancellationPromise, confirmationPromise, expiryPromise]);
      if (outcome.__type === TransactionStatus.PROCESSED) {
        result = outcome.response;
      } else {
        throw new TransactionExpiredBlockheightExceededError(signature);
      }
    } finally {
      done = true;
      abortConfirmation();
    }
    return result;
  }
  async confirmTransactionUsingDurableNonceStrategy({
    commitment,
    strategy: {
      abortSignal,
      minContextSlot,
      nonceAccountPubkey,
      nonceValue,
      signature
    }
  }) {
    let done = false;
    const expiryPromise = new Promise(resolve => {
      let currentNonceValue = nonceValue;
      let lastCheckedSlot = null;
      const getCurrentNonceValue = async () => {
        try {
          const {
            context,
            value: nonceAccount
          } = await this.getNonceAndContext(nonceAccountPubkey, {
            commitment,
            minContextSlot
          });
          lastCheckedSlot = context.slot;
          return nonceAccount?.nonce;
        } catch (e) {
          // If for whatever reason we can't reach/read the nonce
          // account, just keep using the last-known value.
          return currentNonceValue;
        }
      };
      (async () => {
        currentNonceValue = await getCurrentNonceValue();
        if (done) return;
        while (true // eslint-disable-line no-constant-condition
        ) {
          if (nonceValue !== currentNonceValue) {
            resolve({
              __type: TransactionStatus.NONCE_INVALID,
              slotInWhichNonceDidAdvance: lastCheckedSlot
            });
            return;
          }
          await sleep(2000);
          if (done) return;
          currentNonceValue = await getCurrentNonceValue();
          if (done) return;
        }
      })();
    });
    const {
      abortConfirmation,
      confirmationPromise
    } = this.getTransactionConfirmationPromise({
      commitment,
      signature
    });
    const cancellationPromise = this.getCancellationPromise(abortSignal);
    let result;
    try {
      const outcome = await Promise.race([cancellationPromise, confirmationPromise, expiryPromise]);
      if (outcome.__type === TransactionStatus.PROCESSED) {
        result = outcome.response;
      } else {
        // Double check that the transaction is indeed unconfirmed.
        let signatureStatus;
        while (true // eslint-disable-line no-constant-condition
        ) {
          const status = await this.getSignatureStatus(signature);
          if (status == null) {
            break;
          }
          if (status.context.slot < (outcome.slotInWhichNonceDidAdvance ?? minContextSlot)) {
            await sleep(400);
            continue;
          }
          signatureStatus = status;
          break;
        }
        if (signatureStatus?.value) {
          const commitmentForStatus = commitment || 'finalized';
          const {
            confirmationStatus
          } = signatureStatus.value;
          switch (commitmentForStatus) {
            case 'processed':
            case 'recent':
              if (confirmationStatus !== 'processed' && confirmationStatus !== 'confirmed' && confirmationStatus !== 'finalized') {
                throw new TransactionExpiredNonceInvalidError(signature);
              }
              break;
            case 'confirmed':
            case 'single':
            case 'singleGossip':
              if (confirmationStatus !== 'confirmed' && confirmationStatus !== 'finalized') {
                throw new TransactionExpiredNonceInvalidError(signature);
              }
              break;
            case 'finalized':
            case 'max':
            case 'root':
              if (confirmationStatus !== 'finalized') {
                throw new TransactionExpiredNonceInvalidError(signature);
              }
              break;
            default:
              // Exhaustive switch.
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              (_ => {})(commitmentForStatus);
          }
          result = {
            context: signatureStatus.context,
            value: {
              err: signatureStatus.value.err
            }
          };
        } else {
          throw new TransactionExpiredNonceInvalidError(signature);
        }
      }
    } finally {
      done = true;
      abortConfirmation();
    }
    return result;
  }
  async confirmTransactionUsingLegacyTimeoutStrategy({
    commitment,
    signature
  }) {
    let timeoutId;
    const expiryPromise = new Promise(resolve => {
      let timeoutMs = this._confirmTransactionInitialTimeout || 60 * 1000;
      switch (commitment) {
        case 'processed':
        case 'recent':
        case 'single':
        case 'confirmed':
        case 'singleGossip':
          {
            timeoutMs = this._confirmTransactionInitialTimeout || 30 * 1000;
            break;
          }
      }
      timeoutId = setTimeout(() => resolve({
        __type: TransactionStatus.TIMED_OUT,
        timeoutMs
      }), timeoutMs);
    });
    const {
      abortConfirmation,
      confirmationPromise
    } = this.getTransactionConfirmationPromise({
      commitment,
      signature
    });
    let result;
    try {
      const outcome = await Promise.race([confirmationPromise, expiryPromise]);
      if (outcome.__type === TransactionStatus.PROCESSED) {
        result = outcome.response;
      } else {
        throw new TransactionExpiredTimeoutError(signature, outcome.timeoutMs / 1000);
      }
    } finally {
      clearTimeout(timeoutId);
      abortConfirmation();
    }
    return result;
  }

  /**
   * Return the list of nodes that are currently participating in the cluster
   */
  async getClusterNodes() {
    const unsafeRes = await this._rpcRequest('getClusterNodes', []);
    const res = superstruct.create(unsafeRes, jsonRpcResult(superstruct.array(ContactInfoResult)));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get cluster nodes');
    }
    return res.result;
  }

  /**
   * Return the list of nodes that are currently participating in the cluster
   */
  async getVoteAccounts(commitment) {
    const args = this._buildArgs([], commitment);
    const unsafeRes = await this._rpcRequest('getVoteAccounts', args);
    const res = superstruct.create(unsafeRes, GetVoteAccounts);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get vote accounts');
    }
    return res.result;
  }

  /**
   * Fetch the current slot that the node is processing
   */
  async getSlot(commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([], commitment, undefined /* encoding */, config);
    const unsafeRes = await this._rpcRequest('getSlot', args);
    const res = superstruct.create(unsafeRes, jsonRpcResult(superstruct.number()));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get slot');
    }
    return res.result;
  }

  /**
   * Fetch the current slot leader of the cluster
   */
  async getSlotLeader(commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([], commitment, undefined /* encoding */, config);
    const unsafeRes = await this._rpcRequest('getSlotLeader', args);
    const res = superstruct.create(unsafeRes, jsonRpcResult(superstruct.string()));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get slot leader');
    }
    return res.result;
  }

  /**
   * Fetch `limit` number of slot leaders starting from `startSlot`
   *
   * @param startSlot fetch slot leaders starting from this slot
   * @param limit number of slot leaders to return
   */
  async getSlotLeaders(startSlot, limit) {
    const args = [startSlot, limit];
    const unsafeRes = await this._rpcRequest('getSlotLeaders', args);
    const res = superstruct.create(unsafeRes, jsonRpcResult(superstruct.array(PublicKeyFromString)));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get slot leaders');
    }
    return res.result;
  }

  /**
   * Fetch the current status of a signature
   */
  async getSignatureStatus(signature, config) {
    const {
      context,
      value: values
    } = await this.getSignatureStatuses([signature], config);
    assert(values.length === 1);
    const value = values[0];
    return {
      context,
      value
    };
  }

  /**
   * Fetch the current statuses of a batch of signatures
   */
  async getSignatureStatuses(signatures, config) {
    const params = [signatures];
    if (config) {
      params.push(config);
    }
    const unsafeRes = await this._rpcRequest('getSignatureStatuses', params);
    const res = superstruct.create(unsafeRes, GetSignatureStatusesRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get signature status');
    }
    return res.result;
  }

  /**
   * Fetch the current transaction count of the cluster
   */
  async getTransactionCount(commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([], commitment, undefined /* encoding */, config);
    const unsafeRes = await this._rpcRequest('getTransactionCount', args);
    const res = superstruct.create(unsafeRes, jsonRpcResult(superstruct.number()));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get transaction count');
    }
    return res.result;
  }

  /**
   * Fetch the current total currency supply of the cluster in lamports
   *
   * @deprecated Deprecated since RPC v1.2.8. Please use {@link getSupply} instead.
   */
  async getTotalSupply(commitment) {
    const result = await this.getSupply({
      commitment,
      excludeNonCirculatingAccountsList: true
    });
    return result.value.total;
  }

  /**
   * Fetch the cluster InflationGovernor parameters
   */
  async getInflationGovernor(commitment) {
    const args = this._buildArgs([], commitment);
    const unsafeRes = await this._rpcRequest('getInflationGovernor', args);
    const res = superstruct.create(unsafeRes, GetInflationGovernorRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get inflation');
    }
    return res.result;
  }

  /**
   * Fetch the inflation reward for a list of addresses for an epoch
   */
  async getInflationReward(addresses, epoch, commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([addresses.map(pubkey => pubkey.toBase58())], commitment, undefined /* encoding */, {
      ...config,
      epoch: epoch != null ? epoch : config?.epoch
    });
    const unsafeRes = await this._rpcRequest('getInflationReward', args);
    const res = superstruct.create(unsafeRes, GetInflationRewardResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get inflation reward');
    }
    return res.result;
  }

  /**
   * Fetch the specific inflation values for the current epoch
   */
  async getInflationRate() {
    const unsafeRes = await this._rpcRequest('getInflationRate', []);
    const res = superstruct.create(unsafeRes, GetInflationRateRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get inflation rate');
    }
    return res.result;
  }

  /**
   * Fetch the Epoch Info parameters
   */
  async getEpochInfo(commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([], commitment, undefined /* encoding */, config);
    const unsafeRes = await this._rpcRequest('getEpochInfo', args);
    const res = superstruct.create(unsafeRes, GetEpochInfoRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get epoch info');
    }
    return res.result;
  }

  /**
   * Fetch the Epoch Schedule parameters
   */
  async getEpochSchedule() {
    const unsafeRes = await this._rpcRequest('getEpochSchedule', []);
    const res = superstruct.create(unsafeRes, GetEpochScheduleRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get epoch schedule');
    }
    const epochSchedule = res.result;
    return new EpochSchedule(epochSchedule.slotsPerEpoch, epochSchedule.leaderScheduleSlotOffset, epochSchedule.warmup, epochSchedule.firstNormalEpoch, epochSchedule.firstNormalSlot);
  }

  /**
   * Fetch the leader schedule for the current epoch
   * @return {Promise<RpcResponseAndContext<LeaderSchedule>>}
   */
  async getLeaderSchedule() {
    const unsafeRes = await this._rpcRequest('getLeaderSchedule', []);
    const res = superstruct.create(unsafeRes, GetLeaderScheduleRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get leader schedule');
    }
    return res.result;
  }

  /**
   * Fetch the minimum balance needed to exempt an account of `dataLength`
   * size from rent
   */
  async getMinimumBalanceForRentExemption(dataLength, commitment) {
    const args = this._buildArgs([dataLength], commitment);
    const unsafeRes = await this._rpcRequest('getMinimumBalanceForRentExemption', args);
    const res = superstruct.create(unsafeRes, GetMinimumBalanceForRentExemptionRpcResult);
    if ('error' in res) {
      console.warn('Unable to fetch minimum balance for rent exemption');
      return 0;
    }
    return res.result;
  }

  /**
   * Fetch a recent blockhash from the cluster, return with context
   * @return {Promise<RpcResponseAndContext<{blockhash: Blockhash, feeCalculator: FeeCalculator}>>}
   *
   * @deprecated Deprecated since RPC v1.9.0. Please use {@link getLatestBlockhash} instead.
   */
  async getRecentBlockhashAndContext(commitment) {
    const {
      context,
      value: {
        blockhash
      }
    } = await this.getLatestBlockhashAndContext(commitment);
    const feeCalculator = {
      get lamportsPerSignature() {
        throw new Error('The capability to fetch `lamportsPerSignature` using the `getRecentBlockhash` API is ' + 'no longer offered by the network. Use the `getFeeForMessage` API to obtain the fee ' + 'for a given message.');
      },
      toJSON() {
        return {};
      }
    };
    return {
      context,
      value: {
        blockhash,
        feeCalculator
      }
    };
  }

  /**
   * Fetch recent performance samples
   * @return {Promise<Array<PerfSample>>}
   */
  async getRecentPerformanceSamples(limit) {
    const unsafeRes = await this._rpcRequest('getRecentPerformanceSamples', limit ? [limit] : []);
    const res = superstruct.create(unsafeRes, GetRecentPerformanceSamplesRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get recent performance samples');
    }
    return res.result;
  }

  /**
   * Fetch the fee calculator for a recent blockhash from the cluster, return with context
   *
   * @deprecated Deprecated since RPC v1.9.0. Please use {@link getFeeForMessage} instead.
   */
  async getFeeCalculatorForBlockhash(blockhash, commitment) {
    const args = this._buildArgs([blockhash], commitment);
    const unsafeRes = await this._rpcRequest('getFeeCalculatorForBlockhash', args);
    const res = superstruct.create(unsafeRes, GetFeeCalculatorRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get fee calculator');
    }
    const {
      context,
      value
    } = res.result;
    return {
      context,
      value: value !== null ? value.feeCalculator : null
    };
  }

  /**
   * Fetch the fee for a message from the cluster, return with context
   */
  async getFeeForMessage(message, commitment) {
    const wireMessage = toBuffer(message.serialize()).toString('base64');
    const args = this._buildArgs([wireMessage], commitment);
    const unsafeRes = await this._rpcRequest('getFeeForMessage', args);
    const res = superstruct.create(unsafeRes, jsonRpcResultAndContext(superstruct.nullable(superstruct.number())));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get fee for message');
    }
    if (res.result === null) {
      throw new Error('invalid blockhash');
    }
    return res.result;
  }

  /**
   * Fetch a list of prioritization fees from recent blocks.
   */
  async getRecentPrioritizationFees(config) {
    const accounts = config?.lockedWritableAccounts?.map(key => key.toBase58());
    const args = accounts?.length ? [accounts] : [];
    const unsafeRes = await this._rpcRequest('getRecentPrioritizationFees', args);
    const res = superstruct.create(unsafeRes, GetRecentPrioritizationFeesRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get recent prioritization fees');
    }
    return res.result;
  }
  /**
   * Fetch a recent blockhash from the cluster
   * @return {Promise<{blockhash: Blockhash, feeCalculator: FeeCalculator}>}
   *
   * @deprecated Deprecated since RPC v1.8.0. Please use {@link getLatestBlockhash} instead.
   */
  async getRecentBlockhash(commitment) {
    try {
      const res = await this.getRecentBlockhashAndContext(commitment);
      return res.value;
    } catch (e) {
      throw new Error('failed to get recent blockhash: ' + e);
    }
  }

  /**
   * Fetch the latest blockhash from the cluster
   * @return {Promise<BlockhashWithExpiryBlockHeight>}
   */
  async getLatestBlockhash(commitmentOrConfig) {
    try {
      const res = await this.getLatestBlockhashAndContext(commitmentOrConfig);
      return res.value;
    } catch (e) {
      throw new Error('failed to get recent blockhash: ' + e);
    }
  }

  /**
   * Fetch the latest blockhash from the cluster
   * @return {Promise<BlockhashWithExpiryBlockHeight>}
   */
  async getLatestBlockhashAndContext(commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([], commitment, undefined /* encoding */, config);
    const unsafeRes = await this._rpcRequest('getLatestBlockhash', args);
    const res = superstruct.create(unsafeRes, GetLatestBlockhashRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get latest blockhash');
    }
    return res.result;
  }

  /**
   * Returns whether a blockhash is still valid or not
   */
  async isBlockhashValid(blockhash, rawConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(rawConfig);
    const args = this._buildArgs([blockhash], commitment, undefined /* encoding */, config);
    const unsafeRes = await this._rpcRequest('isBlockhashValid', args);
    const res = superstruct.create(unsafeRes, IsBlockhashValidRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to determine if the blockhash `' + blockhash + '`is valid');
    }
    return res.result;
  }

  /**
   * Fetch the node version
   */
  async getVersion() {
    const unsafeRes = await this._rpcRequest('getVersion', []);
    const res = superstruct.create(unsafeRes, jsonRpcResult(VersionResult));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get version');
    }
    return res.result;
  }

  /**
   * Fetch the genesis hash
   */
  async getGenesisHash() {
    const unsafeRes = await this._rpcRequest('getGenesisHash', []);
    const res = superstruct.create(unsafeRes, jsonRpcResult(superstruct.string()));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get genesis hash');
    }
    return res.result;
  }

  /**
   * Fetch a processed block from the cluster.
   *
   * @deprecated Instead, call `getBlock` using a `GetVersionedBlockConfig` by
   * setting the `maxSupportedTransactionVersion` property.
   */

  /**
   * @deprecated Instead, call `getBlock` using a `GetVersionedBlockConfig` by
   * setting the `maxSupportedTransactionVersion` property.
   */
  // eslint-disable-next-line no-dupe-class-members

  /**
   * @deprecated Instead, call `getBlock` using a `GetVersionedBlockConfig` by
   * setting the `maxSupportedTransactionVersion` property.
   */
  // eslint-disable-next-line no-dupe-class-members

  /**
   * Fetch a processed block from the cluster.
   */
  // eslint-disable-next-line no-dupe-class-members

  // eslint-disable-next-line no-dupe-class-members

  // eslint-disable-next-line no-dupe-class-members

  /**
   * Fetch a processed block from the cluster.
   */
  // eslint-disable-next-line no-dupe-class-members
  async getBlock(slot, rawConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(rawConfig);
    const args = this._buildArgsAtLeastConfirmed([slot], commitment, undefined /* encoding */, config);
    const unsafeRes = await this._rpcRequest('getBlock', args);
    try {
      switch (config?.transactionDetails) {
        case 'accounts':
          {
            const res = superstruct.create(unsafeRes, GetAccountsModeBlockRpcResult);
            if ('error' in res) {
              throw res.error;
            }
            return res.result;
          }
        case 'none':
          {
            const res = superstruct.create(unsafeRes, GetNoneModeBlockRpcResult);
            if ('error' in res) {
              throw res.error;
            }
            return res.result;
          }
        default:
          {
            const res = superstruct.create(unsafeRes, GetBlockRpcResult);
            if ('error' in res) {
              throw res.error;
            }
            const {
              result
            } = res;
            return result ? {
              ...result,
              transactions: result.transactions.map(({
                transaction,
                meta,
                version
              }) => ({
                meta,
                transaction: {
                  ...transaction,
                  message: versionedMessageFromResponse(version, transaction.message)
                },
                version
              }))
            } : null;
          }
      }
    } catch (e) {
      throw new SolanaJSONRPCError(e, 'failed to get confirmed block');
    }
  }

  /**
   * Fetch parsed transaction details for a confirmed or finalized block
   */

  // eslint-disable-next-line no-dupe-class-members

  // eslint-disable-next-line no-dupe-class-members

  // eslint-disable-next-line no-dupe-class-members
  async getParsedBlock(slot, rawConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(rawConfig);
    const args = this._buildArgsAtLeastConfirmed([slot], commitment, 'jsonParsed', config);
    const unsafeRes = await this._rpcRequest('getBlock', args);
    try {
      switch (config?.transactionDetails) {
        case 'accounts':
          {
            const res = superstruct.create(unsafeRes, GetParsedAccountsModeBlockRpcResult);
            if ('error' in res) {
              throw res.error;
            }
            return res.result;
          }
        case 'none':
          {
            const res = superstruct.create(unsafeRes, GetParsedNoneModeBlockRpcResult);
            if ('error' in res) {
              throw res.error;
            }
            return res.result;
          }
        default:
          {
            const res = superstruct.create(unsafeRes, GetParsedBlockRpcResult);
            if ('error' in res) {
              throw res.error;
            }
            return res.result;
          }
      }
    } catch (e) {
      throw new SolanaJSONRPCError(e, 'failed to get block');
    }
  }
  /*
   * Returns recent block production information from the current or previous epoch
   */
  async getBlockProduction(configOrCommitment) {
    let extra;
    let commitment;
    if (typeof configOrCommitment === 'string') {
      commitment = configOrCommitment;
    } else if (configOrCommitment) {
      const {
        commitment: c,
        ...rest
      } = configOrCommitment;
      commitment = c;
      extra = rest;
    }
    const args = this._buildArgs([], commitment, 'base64', extra);
    const unsafeRes = await this._rpcRequest('getBlockProduction', args);
    const res = superstruct.create(unsafeRes, BlockProductionResponseStruct);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get block production information');
    }
    return res.result;
  }

  /**
   * Fetch a confirmed or finalized transaction from the cluster.
   *
   * @deprecated Instead, call `getTransaction` using a
   * `GetVersionedTransactionConfig` by setting the
   * `maxSupportedTransactionVersion` property.
   */

  /**
   * Fetch a confirmed or finalized transaction from the cluster.
   */
  // eslint-disable-next-line no-dupe-class-members

  /**
   * Fetch a confirmed or finalized transaction from the cluster.
   */
  // eslint-disable-next-line no-dupe-class-members
  async getTransaction(signature, rawConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(rawConfig);
    const args = this._buildArgsAtLeastConfirmed([signature], commitment, undefined /* encoding */, config);
    const unsafeRes = await this._rpcRequest('getTransaction', args);
    const res = superstruct.create(unsafeRes, GetTransactionRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get transaction');
    }
    const result = res.result;
    if (!result) return result;
    return {
      ...result,
      transaction: {
        ...result.transaction,
        message: versionedMessageFromResponse(result.version, result.transaction.message)
      }
    };
  }

  /**
   * Fetch parsed transaction details for a confirmed or finalized transaction
   */
  async getParsedTransaction(signature, commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgsAtLeastConfirmed([signature], commitment, 'jsonParsed', config);
    const unsafeRes = await this._rpcRequest('getTransaction', args);
    const res = superstruct.create(unsafeRes, GetParsedTransactionRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get transaction');
    }
    return res.result;
  }

  /**
   * Fetch parsed transaction details for a batch of confirmed transactions
   */
  async getParsedTransactions(signatures, commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const batch = signatures.map(signature => {
      const args = this._buildArgsAtLeastConfirmed([signature], commitment, 'jsonParsed', config);
      return {
        methodName: 'getTransaction',
        args
      };
    });
    const unsafeRes = await this._rpcBatchRequest(batch);
    const res = unsafeRes.map(unsafeRes => {
      const res = superstruct.create(unsafeRes, GetParsedTransactionRpcResult);
      if ('error' in res) {
        throw new SolanaJSONRPCError(res.error, 'failed to get transactions');
      }
      return res.result;
    });
    return res;
  }

  /**
   * Fetch transaction details for a batch of confirmed transactions.
   * Similar to {@link getParsedTransactions} but returns a {@link TransactionResponse}.
   *
   * @deprecated Instead, call `getTransactions` using a
   * `GetVersionedTransactionConfig` by setting the
   * `maxSupportedTransactionVersion` property.
   */

  /**
   * Fetch transaction details for a batch of confirmed transactions.
   * Similar to {@link getParsedTransactions} but returns a {@link
   * VersionedTransactionResponse}.
   */
  // eslint-disable-next-line no-dupe-class-members

  /**
   * Fetch transaction details for a batch of confirmed transactions.
   * Similar to {@link getParsedTransactions} but returns a {@link
   * VersionedTransactionResponse}.
   */
  // eslint-disable-next-line no-dupe-class-members
  async getTransactions(signatures, commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const batch = signatures.map(signature => {
      const args = this._buildArgsAtLeastConfirmed([signature], commitment, undefined /* encoding */, config);
      return {
        methodName: 'getTransaction',
        args
      };
    });
    const unsafeRes = await this._rpcBatchRequest(batch);
    const res = unsafeRes.map(unsafeRes => {
      const res = superstruct.create(unsafeRes, GetTransactionRpcResult);
      if ('error' in res) {
        throw new SolanaJSONRPCError(res.error, 'failed to get transactions');
      }
      const result = res.result;
      if (!result) return result;
      return {
        ...result,
        transaction: {
          ...result.transaction,
          message: versionedMessageFromResponse(result.version, result.transaction.message)
        }
      };
    });
    return res;
  }

  /**
   * Fetch a list of Transactions and transaction statuses from the cluster
   * for a confirmed block.
   *
   * @deprecated Deprecated since RPC v1.7.0. Please use {@link getBlock} instead.
   */
  async getConfirmedBlock(slot, commitment) {
    const args = this._buildArgsAtLeastConfirmed([slot], commitment);
    const unsafeRes = await this._rpcRequest('getBlock', args);
    const res = superstruct.create(unsafeRes, GetConfirmedBlockRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get confirmed block');
    }
    const result = res.result;
    if (!result) {
      throw new Error('Confirmed block ' + slot + ' not found');
    }
    const block = {
      ...result,
      transactions: result.transactions.map(({
        transaction,
        meta
      }) => {
        const message = new Message(transaction.message);
        return {
          meta,
          transaction: {
            ...transaction,
            message
          }
        };
      })
    };
    return {
      ...block,
      transactions: block.transactions.map(({
        transaction,
        meta
      }) => {
        return {
          meta,
          transaction: Transaction.populate(transaction.message, transaction.signatures)
        };
      })
    };
  }

  /**
   * Fetch confirmed blocks between two slots
   */
  async getBlocks(startSlot, endSlot, commitment) {
    const args = this._buildArgsAtLeastConfirmed(endSlot !== undefined ? [startSlot, endSlot] : [startSlot], commitment);
    const unsafeRes = await this._rpcRequest('getBlocks', args);
    const res = superstruct.create(unsafeRes, jsonRpcResult(superstruct.array(superstruct.number())));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get blocks');
    }
    return res.result;
  }

  /**
   * Fetch a list of Signatures from the cluster for a block, excluding rewards
   */
  async getBlockSignatures(slot, commitment) {
    const args = this._buildArgsAtLeastConfirmed([slot], commitment, undefined, {
      transactionDetails: 'signatures',
      rewards: false
    });
    const unsafeRes = await this._rpcRequest('getBlock', args);
    const res = superstruct.create(unsafeRes, GetBlockSignaturesRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get block');
    }
    const result = res.result;
    if (!result) {
      throw new Error('Block ' + slot + ' not found');
    }
    return result;
  }

  /**
   * Fetch a list of Signatures from the cluster for a confirmed block, excluding rewards
   *
   * @deprecated Deprecated since RPC v1.7.0. Please use {@link getBlockSignatures} instead.
   */
  async getConfirmedBlockSignatures(slot, commitment) {
    const args = this._buildArgsAtLeastConfirmed([slot], commitment, undefined, {
      transactionDetails: 'signatures',
      rewards: false
    });
    const unsafeRes = await this._rpcRequest('getBlock', args);
    const res = superstruct.create(unsafeRes, GetBlockSignaturesRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get confirmed block');
    }
    const result = res.result;
    if (!result) {
      throw new Error('Confirmed block ' + slot + ' not found');
    }
    return result;
  }

  /**
   * Fetch a transaction details for a confirmed transaction
   *
   * @deprecated Deprecated since RPC v1.7.0. Please use {@link getTransaction} instead.
   */
  async getConfirmedTransaction(signature, commitment) {
    const args = this._buildArgsAtLeastConfirmed([signature], commitment);
    const unsafeRes = await this._rpcRequest('getTransaction', args);
    const res = superstruct.create(unsafeRes, GetTransactionRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get transaction');
    }
    const result = res.result;
    if (!result) return result;
    const message = new Message(result.transaction.message);
    const signatures = result.transaction.signatures;
    return {
      ...result,
      transaction: Transaction.populate(message, signatures)
    };
  }

  /**
   * Fetch parsed transaction details for a confirmed transaction
   *
   * @deprecated Deprecated since RPC v1.7.0. Please use {@link getParsedTransaction} instead.
   */
  async getParsedConfirmedTransaction(signature, commitment) {
    const args = this._buildArgsAtLeastConfirmed([signature], commitment, 'jsonParsed');
    const unsafeRes = await this._rpcRequest('getTransaction', args);
    const res = superstruct.create(unsafeRes, GetParsedTransactionRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get confirmed transaction');
    }
    return res.result;
  }

  /**
   * Fetch parsed transaction details for a batch of confirmed transactions
   *
   * @deprecated Deprecated since RPC v1.7.0. Please use {@link getParsedTransactions} instead.
   */
  async getParsedConfirmedTransactions(signatures, commitment) {
    const batch = signatures.map(signature => {
      const args = this._buildArgsAtLeastConfirmed([signature], commitment, 'jsonParsed');
      return {
        methodName: 'getTransaction',
        args
      };
    });
    const unsafeRes = await this._rpcBatchRequest(batch);
    const res = unsafeRes.map(unsafeRes => {
      const res = superstruct.create(unsafeRes, GetParsedTransactionRpcResult);
      if ('error' in res) {
        throw new SolanaJSONRPCError(res.error, 'failed to get confirmed transactions');
      }
      return res.result;
    });
    return res;
  }

  /**
   * Fetch a list of all the confirmed signatures for transactions involving an address
   * within a specified slot range. Max range allowed is 10,000 slots.
   *
   * @deprecated Deprecated since RPC v1.3. Please use {@link getConfirmedSignaturesForAddress2} instead.
   *
   * @param address queried address
   * @param startSlot start slot, inclusive
   * @param endSlot end slot, inclusive
   */
  async getConfirmedSignaturesForAddress(address, startSlot, endSlot) {
    let options = {};
    let firstAvailableBlock = await this.getFirstAvailableBlock();
    while (!('until' in options)) {
      startSlot--;
      if (startSlot <= 0 || startSlot < firstAvailableBlock) {
        break;
      }
      try {
        const block = await this.getConfirmedBlockSignatures(startSlot, 'finalized');
        if (block.signatures.length > 0) {
          options.until = block.signatures[block.signatures.length - 1].toString();
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('skipped')) {
          continue;
        } else {
          throw err;
        }
      }
    }
    let highestConfirmedRoot = await this.getSlot('finalized');
    while (!('before' in options)) {
      endSlot++;
      if (endSlot > highestConfirmedRoot) {
        break;
      }
      try {
        const block = await this.getConfirmedBlockSignatures(endSlot);
        if (block.signatures.length > 0) {
          options.before = block.signatures[block.signatures.length - 1].toString();
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('skipped')) {
          continue;
        } else {
          throw err;
        }
      }
    }
    const confirmedSignatureInfo = await this.getConfirmedSignaturesForAddress2(address, options);
    return confirmedSignatureInfo.map(info => info.signature);
  }

  /**
   * Returns confirmed signatures for transactions involving an
   * address backwards in time from the provided signature or most recent confirmed block
   *
   * @deprecated Deprecated since RPC v1.7.0. Please use {@link getSignaturesForAddress} instead.
   */
  async getConfirmedSignaturesForAddress2(address, options, commitment) {
    const args = this._buildArgsAtLeastConfirmed([address.toBase58()], commitment, undefined, options);
    const unsafeRes = await this._rpcRequest('getConfirmedSignaturesForAddress2', args);
    const res = superstruct.create(unsafeRes, GetConfirmedSignaturesForAddress2RpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get confirmed signatures for address');
    }
    return res.result;
  }

  /**
   * Returns confirmed signatures for transactions involving an
   * address backwards in time from the provided signature or most recent confirmed block
   *
   *
   * @param address queried address
   * @param options
   */
  async getSignaturesForAddress(address, options, commitment) {
    const args = this._buildArgsAtLeastConfirmed([address.toBase58()], commitment, undefined, options);
    const unsafeRes = await this._rpcRequest('getSignaturesForAddress', args);
    const res = superstruct.create(unsafeRes, GetSignaturesForAddressRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, 'failed to get signatures for address');
    }
    return res.result;
  }
  async getAddressLookupTable(accountKey, config) {
    const {
      context,
      value: accountInfo
    } = await this.getAccountInfoAndContext(accountKey, config);
    let value = null;
    if (accountInfo !== null) {
      value = new AddressLookupTableAccount({
        key: accountKey,
        state: AddressLookupTableAccount.deserialize(accountInfo.data)
      });
    }
    return {
      context,
      value
    };
  }

  /**
   * Fetch the contents of a Nonce account from the cluster, return with context
   */
  async getNonceAndContext(nonceAccount, commitmentOrConfig) {
    const {
      context,
      value: accountInfo
    } = await this.getAccountInfoAndContext(nonceAccount, commitmentOrConfig);
    let value = null;
    if (accountInfo !== null) {
      value = NonceAccount.fromAccountData(accountInfo.data);
    }
    return {
      context,
      value
    };
  }

  /**
   * Fetch the contents of a Nonce account from the cluster
   */
  async getNonce(nonceAccount, commitmentOrConfig) {
    return await this.getNonceAndContext(nonceAccount, commitmentOrConfig).then(x => x.value).catch(e => {
      throw new Error('failed to get nonce for account ' + nonceAccount.toBase58() + ': ' + e);
    });
  }

  /**
   * Request an allocation of lamports to the specified address
   *
   * ```typescript
   * import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
   *
   * (async () => {
   *   const connection = new Connection("https://api.testnet.solana.com", "confirmed");
   *   const myAddress = new PublicKey("2nr1bHFT86W9tGnyvmYW4vcHKsQB3sVQfnddasz4kExM");
   *   const signature = await connection.requestAirdrop(myAddress, LAMPORTS_PER_SOL);
   *   await connection.confirmTransaction(signature);
   * })();
   * ```
   */
  async requestAirdrop(to, lamports) {
    const unsafeRes = await this._rpcRequest('requestAirdrop', [to.toBase58(), lamports]);
    const res = superstruct.create(unsafeRes, RequestAirdropRpcResult);
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, `airdrop to ${to.toBase58()} failed`);
    }
    return res.result;
  }

  /**
   * @internal
   */
  async _blockhashWithExpiryBlockHeight(disableCache) {
    if (!disableCache) {
      // Wait for polling to finish
      while (this._pollingBlockhash) {
        await sleep(100);
      }
      const timeSinceFetch = Date.now() - this._blockhashInfo.lastFetch;
      const expired = timeSinceFetch >= BLOCKHASH_CACHE_TIMEOUT_MS;
      if (this._blockhashInfo.latestBlockhash !== null && !expired) {
        return this._blockhashInfo.latestBlockhash;
      }
    }
    return await this._pollNewBlockhash();
  }

  /**
   * @internal
   */
  async _pollNewBlockhash() {
    this._pollingBlockhash = true;
    try {
      const startTime = Date.now();
      const cachedLatestBlockhash = this._blockhashInfo.latestBlockhash;
      const cachedBlockhash = cachedLatestBlockhash ? cachedLatestBlockhash.blockhash : null;
      for (let i = 0; i < 50; i++) {
        const latestBlockhash = await this.getLatestBlockhash('finalized');
        if (cachedBlockhash !== latestBlockhash.blockhash) {
          this._blockhashInfo = {
            latestBlockhash,
            lastFetch: Date.now(),
            transactionSignatures: [],
            simulatedSignatures: []
          };
          return latestBlockhash;
        }

        // Sleep for approximately half a slot
        await sleep(MS_PER_SLOT / 2);
      }
      throw new Error(`Unable to obtain a new blockhash after ${Date.now() - startTime}ms`);
    } finally {
      this._pollingBlockhash = false;
    }
  }

  /**
   * get the stake minimum delegation
   */
  async getStakeMinimumDelegation(config) {
    const {
      commitment,
      config: configArg
    } = extractCommitmentFromConfig(config);
    const args = this._buildArgs([], commitment, 'base64', configArg);
    const unsafeRes = await this._rpcRequest('getStakeMinimumDelegation', args);
    const res = superstruct.create(unsafeRes, jsonRpcResultAndContext(superstruct.number()));
    if ('error' in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get stake minimum delegation`);
    }
    return res.result;
  }

  /**
   * Simulate a transaction
   *
   * @deprecated Instead, call {@link simulateTransaction} with {@link
   * VersionedTransaction} and {@link SimulateTransactionConfig} parameters
   */

  /**
   * Simulate a transaction
   */
  // eslint-disable-next-line no-dupe-class-members

  /**
   * Simulate a transaction
   */
  // eslint-disable-next-line no-dupe-class-members
  async simulateTransaction(transactionOrMessage, configOrSigners, includeAccounts) {
    if ('message' in transactionOrMessage) {
      const versionedTx = transactionOrMessage;
      const wireTransaction = versionedTx.serialize();
      const encodedTransaction = buffer.Buffer.from(wireTransaction).toString('base64');
      if (Array.isArray(configOrSigners) || includeAccounts !== undefined) {
        throw new Error('Invalid arguments');
      }
      const config = configOrSigners || {};
      config.encoding = 'base64';
      if (!('commitment' in config)) {
        config.commitment = this.commitment;
      }
      if (configOrSigners && typeof configOrSigners === 'object' && 'innerInstructions' in configOrSigners) {
        config.innerInstructions = configOrSigners.innerInstructions;
      }
      const args = [encodedTransaction, config];
      const unsafeRes = await this._rpcRequest('simulateTransaction', args);
      const res = superstruct.create(unsafeRes, SimulatedTransactionResponseStruct);
      if ('error' in res) {
        throw new Error('failed to simulate transaction: ' + res.error.message);
      }
      return res.result;
    }
    let transaction;
    if (transactionOrMessage instanceof Transaction) {
      let originalTx = transactionOrMessage;
      transaction = new Transaction();
      transaction.feePayer = originalTx.feePayer;
      transaction.instructions = transactionOrMessage.instructions;
      transaction.nonceInfo = originalTx.nonceInfo;
      transaction.signatures = originalTx.signatures;
    } else {
      transaction = Transaction.populate(transactionOrMessage);
      // HACK: this function relies on mutating the populated transaction
      transaction._message = transaction._json = undefined;
    }
    if (configOrSigners !== undefined && !Array.isArray(configOrSigners)) {
      throw new Error('Invalid arguments');
    }
    const signers = configOrSigners;
    if (transaction.nonceInfo && signers) {
      transaction.sign(...signers);
    } else {
      let disableCache = this._disableBlockhashCaching;
      for (;;) {
        const latestBlockhash = await this._blockhashWithExpiryBlockHeight(disableCache);
        transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
        transaction.recentBlockhash = latestBlockhash.blockhash;
        if (!signers) break;
        transaction.sign(...signers);
        if (!transaction.signature) {
          throw new Error('!signature'); // should never happen
        }
        const signature = transaction.signature.toString('base64');
        if (!this._blockhashInfo.simulatedSignatures.includes(signature) && !this._blockhashInfo.transactionSignatures.includes(signature)) {
          // The signature of this transaction has not been seen before with the
          // current recentBlockhash, all done. Let's break
          this._blockhashInfo.simulatedSignatures.push(signature);
          break;
        } else {
          // This transaction would be treated as duplicate (its derived signature
          // matched to one of already recorded signatures).
          // So, we must fetch a new blockhash for a different signature by disabling
          // our cache not to wait for the cache expiration (BLOCKHASH_CACHE_TIMEOUT_MS).
          disableCache = true;
        }
      }
    }
    const message = transaction._compile();
    const signData = message.serialize();
    const wireTransaction = transaction._serialize(signData);
    const encodedTransaction = wireTransaction.toString('base64');
    const config = {
      encoding: 'base64',
      commitment: this.commitment
    };
    if (includeAccounts) {
      const addresses = (Array.isArray(includeAccounts) ? includeAccounts : message.nonProgramIds()).map(key => key.toBase58());
      config['accounts'] = {
        encoding: 'base64',
        addresses
      };
    }
    if (signers) {
      config.sigVerify = true;
    }
    if (configOrSigners && typeof configOrSigners === 'object' && 'innerInstructions' in configOrSigners) {
      config.innerInstructions = configOrSigners.innerInstructions;
    }
    const args = [encodedTransaction, config];
    const unsafeRes = await this._rpcRequest('simulateTransaction', args);
    const res = superstruct.create(unsafeRes, SimulatedTransactionResponseStruct);
    if ('error' in res) {
      let logs;
      if ('data' in res.error) {
        logs = res.error.data.logs;
        if (logs && Array.isArray(logs)) {
          const traceIndent = '\n    ';
          const logTrace = traceIndent + logs.join(traceIndent);
          console.error(res.error.message, logTrace);
        }
      }
      throw new SendTransactionError({
        action: 'simulate',
        signature: '',
        transactionMessage: res.error.message,
        logs: logs
      });
    }
    return res.result;
  }

  /**
   * Sign and send a transaction
   *
   * @deprecated Instead, call {@link sendTransaction} with a {@link
   * VersionedTransaction}
   */

  /**
   * Send a signed transaction
   */
  // eslint-disable-next-line no-dupe-class-members

  /**
   * Sign and send a transaction
   */
  // eslint-disable-next-line no-dupe-class-members
  async sendTransaction(transaction, signersOrOptions, options) {
    if ('version' in transaction) {
      if (signersOrOptions && Array.isArray(signersOrOptions)) {
        throw new Error('Invalid arguments');
      }
      const wireTransaction = transaction.serialize();
      return await this.sendRawTransaction(wireTransaction, signersOrOptions);
    }
    if (signersOrOptions === undefined || !Array.isArray(signersOrOptions)) {
      throw new Error('Invalid arguments');
    }
    const signers = signersOrOptions;
    if (transaction.nonceInfo) {
      transaction.sign(...signers);
    } else {
      let disableCache = this._disableBlockhashCaching;
      for (;;) {
        const latestBlockhash = await this._blockhashWithExpiryBlockHeight(disableCache);
        transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.sign(...signers);
        if (!transaction.signature) {
          throw new Error('!signature'); // should never happen
        }
        const signature = transaction.signature.toString('base64');
        if (!this._blockhashInfo.transactionSignatures.includes(signature)) {
          // The signature of this transaction has not been seen before with the
          // current recentBlockhash, all done. Let's break
          this._blockhashInfo.transactionSignatures.push(signature);
          break;
        } else {
          // This transaction would be treated as duplicate (its derived signature
          // matched to one of already recorded signatures).
          // So, we must fetch a new blockhash for a different signature by disabling
          // our cache not to wait for the cache expiration (BLOCKHASH_CACHE_TIMEOUT_MS).
          disableCache = true;
        }
      }
    }
    const wireTransaction = transaction.serialize();
    return await this.sendRawTransaction(wireTransaction, options);
  }

  /**
   * Send a transaction that has already been signed and serialized into the
   * wire format
   */
  async sendRawTransaction(rawTransaction, options) {
    const encodedTransaction = toBuffer(rawTransaction).toString('base64');
    const result = await this.sendEncodedTransaction(encodedTransaction, options);
    return result;
  }

  /**
   * Send a transaction that has already been signed, serialized into the
   * wire format, and encoded as a base64 string
   */
  async sendEncodedTransaction(encodedTransaction, options) {
    const config = {
      encoding: 'base64'
    };
    const skipPreflight = options && options.skipPreflight;
    const preflightCommitment = skipPreflight === true ? 'processed' // FIXME Remove when https://github.com/anza-xyz/agave/pull/483 is deployed.
    : options && options.preflightCommitment || this.commitment;
    if (options && options.maxRetries != null) {
      config.maxRetries = options.maxRetries;
    }
    if (options && options.minContextSlot != null) {
      config.minContextSlot = options.minContextSlot;
    }
    if (skipPreflight) {
      config.skipPreflight = skipPreflight;
    }
    if (preflightCommitment) {
      config.preflightCommitment = preflightCommitment;
    }
    const args = [encodedTransaction, config];
    const unsafeRes = await this._rpcRequest('sendTransaction', args);
    const res = superstruct.create(unsafeRes, SendTransactionRpcResult);
    if ('error' in res) {
      let logs = undefined;
      if ('data' in res.error) {
        logs = res.error.data.logs;
      }
      throw new SendTransactionError({
        action: skipPreflight ? 'send' : 'simulate',
        signature: '',
        transactionMessage: res.error.message,
        logs: logs
      });
    }
    return res.result;
  }

  /**
   * @internal
   */
  _wsOnOpen() {
    this._rpcWebSocketConnected = true;
    this._rpcWebSocketHeartbeat = setInterval(() => {
      // Ping server every 5s to prevent idle timeouts
      (async () => {
        try {
          await this._rpcWebSocket.notify('ping');
          // eslint-disable-next-line no-empty
        } catch {}
      })();
    }, 5000);
    this._updateSubscriptions();
  }

  /**
   * @internal
   */
  _wsOnError(err) {
    this._rpcWebSocketConnected = false;
    console.error('ws error:', err.message);
  }

  /**
   * @internal
   */
  _wsOnClose(code) {
    this._rpcWebSocketConnected = false;
    this._rpcWebSocketGeneration = (this._rpcWebSocketGeneration + 1) % Number.MAX_SAFE_INTEGER;
    if (this._rpcWebSocketIdleTimeout) {
      clearTimeout(this._rpcWebSocketIdleTimeout);
      this._rpcWebSocketIdleTimeout = null;
    }
    if (this._rpcWebSocketHeartbeat) {
      clearInterval(this._rpcWebSocketHeartbeat);
      this._rpcWebSocketHeartbeat = null;
    }
    if (code === 1000) {
      // explicit close, check if any subscriptions have been made since close
      this._updateSubscriptions();
      return;
    }

    // implicit close, prepare subscriptions for auto-reconnect
    this._subscriptionCallbacksByServerSubscriptionId = {};
    Object.entries(this._subscriptionsByHash).forEach(([hash, subscription]) => {
      this._setSubscription(hash, {
        ...subscription,
        state: 'pending'
      });
    });
  }

  /**
   * @internal
   */
  _setSubscription(hash, nextSubscription) {
    const prevState = this._subscriptionsByHash[hash]?.state;
    this._subscriptionsByHash[hash] = nextSubscription;
    if (prevState !== nextSubscription.state) {
      const stateChangeCallbacks = this._subscriptionStateChangeCallbacksByHash[hash];
      if (stateChangeCallbacks) {
        stateChangeCallbacks.forEach(cb => {
          try {
            cb(nextSubscription.state);
            // eslint-disable-next-line no-empty
          } catch {}
        });
      }
    }
  }

  /**
   * @internal
   */
  _onSubscriptionStateChange(clientSubscriptionId, callback) {
    const hash = this._subscriptionHashByClientSubscriptionId[clientSubscriptionId];
    if (hash == null) {
      return () => {};
    }
    const stateChangeCallbacks = this._subscriptionStateChangeCallbacksByHash[hash] ||= new Set();
    stateChangeCallbacks.add(callback);
    return () => {
      stateChangeCallbacks.delete(callback);
      if (stateChangeCallbacks.size === 0) {
        delete this._subscriptionStateChangeCallbacksByHash[hash];
      }
    };
  }

  /**
   * @internal
   */
  async _updateSubscriptions() {
    if (Object.keys(this._subscriptionsByHash).length === 0) {
      if (this._rpcWebSocketConnected) {
        this._rpcWebSocketConnected = false;
        this._rpcWebSocketIdleTimeout = setTimeout(() => {
          this._rpcWebSocketIdleTimeout = null;
          try {
            this._rpcWebSocket.close();
          } catch (err) {
            // swallow error if socket has already been closed.
            if (err instanceof Error) {
              console.log(`Error when closing socket connection: ${err.message}`);
            }
          }
        }, 500);
      }
      return;
    }
    if (this._rpcWebSocketIdleTimeout !== null) {
      clearTimeout(this._rpcWebSocketIdleTimeout);
      this._rpcWebSocketIdleTimeout = null;
      this._rpcWebSocketConnected = true;
    }
    if (!this._rpcWebSocketConnected) {
      this._rpcWebSocket.connect();
      return;
    }
    const activeWebSocketGeneration = this._rpcWebSocketGeneration;
    const isCurrentConnectionStillActive = () => {
      return activeWebSocketGeneration === this._rpcWebSocketGeneration;
    };
    await Promise.all(
    // Don't be tempted to change this to `Object.entries`. We call
    // `_updateSubscriptions` recursively when processing the state,
    // so it's important that we look up the *current* version of
    // each subscription, every time we process a hash.
    Object.keys(this._subscriptionsByHash).map(async hash => {
      const subscription = this._subscriptionsByHash[hash];
      if (subscription === undefined) {
        // This entry has since been deleted. Skip.
        return;
      }
      switch (subscription.state) {
        case 'pending':
        case 'unsubscribed':
          if (subscription.callbacks.size === 0) {
            /**
             * You can end up here when:
             *
             * - a subscription has recently unsubscribed
             *   without having new callbacks added to it
             *   while the unsubscribe was in flight, or
             * - when a pending subscription has its
             *   listeners removed before a request was
             *   sent to the server.
             *
             * Being that nobody is interested in this
             * subscription any longer, delete it.
             */
            delete this._subscriptionsByHash[hash];
            if (subscription.state === 'unsubscribed') {
              delete this._subscriptionCallbacksByServerSubscriptionId[subscription.serverSubscriptionId];
            }
            await this._updateSubscriptions();
            return;
          }
          await (async () => {
            const {
              args,
              method
            } = subscription;
            try {
              this._setSubscription(hash, {
                ...subscription,
                state: 'subscribing'
              });
              const serverSubscriptionId = await this._rpcWebSocket.call(method, args);
              this._setSubscription(hash, {
                ...subscription,
                serverSubscriptionId,
                state: 'subscribed'
              });
              this._subscriptionCallbacksByServerSubscriptionId[serverSubscriptionId] = subscription.callbacks;
              await this._updateSubscriptions();
            } catch (e) {
              console.error(`Received ${e instanceof Error ? '' : 'JSON-RPC '}error calling \`${method}\``, {
                args,
                error: e
              });
              if (!isCurrentConnectionStillActive()) {
                return;
              }
              // TODO: Maybe add an 'errored' state or a retry limit?
              this._setSubscription(hash, {
                ...subscription,
                state: 'pending'
              });
              await this._updateSubscriptions();
            }
          })();
          break;
        case 'subscribed':
          if (subscription.callbacks.size === 0) {
            // By the time we successfully set up a subscription
            // with the server, the client stopped caring about it.
            // Tear it down now.
            await (async () => {
              const {
                serverSubscriptionId,
                unsubscribeMethod
              } = subscription;
              if (this._subscriptionsAutoDisposedByRpc.has(serverSubscriptionId)) {
                /**
                 * Special case.
                 * If we're dealing with a subscription that has been auto-
                 * disposed by the RPC, then we can skip the RPC call to
                 * tear down the subscription here.
                 *
                 * NOTE: There is a proposal to eliminate this special case, here:
                 * https://github.com/solana-labs/solana/issues/18892
                 */
                this._subscriptionsAutoDisposedByRpc.delete(serverSubscriptionId);
              } else {
                this._setSubscription(hash, {
                  ...subscription,
                  state: 'unsubscribing'
                });
                this._setSubscription(hash, {
                  ...subscription,
                  state: 'unsubscribing'
                });
                try {
                  await this._rpcWebSocket.call(unsubscribeMethod, [serverSubscriptionId]);
                } catch (e) {
                  if (e instanceof Error) {
                    console.error(`${unsubscribeMethod} error:`, e.message);
                  }
                  if (!isCurrentConnectionStillActive()) {
                    return;
                  }
                  // TODO: Maybe add an 'errored' state or a retry limit?
                  this._setSubscription(hash, {
                    ...subscription,
                    state: 'subscribed'
                  });
                  await this._updateSubscriptions();
                  return;
                }
              }
              this._setSubscription(hash, {
                ...subscription,
                state: 'unsubscribed'
              });
              await this._updateSubscriptions();
            })();
          }
          break;
      }
    }));
  }

  /**
   * @internal
   */
  _handleServerNotification(serverSubscriptionId, callbackArgs) {
    const callbacks = this._subscriptionCallbacksByServerSubscriptionId[serverSubscriptionId];
    if (callbacks === undefined) {
      return;
    }
    callbacks.forEach(cb => {
      try {
        cb(
        // I failed to find a way to convince TypeScript that `cb` is of type
        // `TCallback` which is certainly compatible with `Parameters<TCallback>`.
        // See https://github.com/microsoft/TypeScript/issues/47615
        // @ts-ignore
        ...callbackArgs);
      } catch (e) {
        console.error(e);
      }
    });
  }

  /**
   * @internal
   */
  _wsOnAccountNotification(notification) {
    const {
      result,
      subscription
    } = superstruct.create(notification, AccountNotificationResult);
    this._handleServerNotification(subscription, [result.value, result.context]);
  }

  /**
   * @internal
   */
  _makeSubscription(subscriptionConfig,
  /**
   * When preparing `args` for a call to `_makeSubscription`, be sure
   * to carefully apply a default `commitment` property, if necessary.
   *
   * - If the user supplied a `commitment` use that.
   * - Otherwise, if the `Connection::commitment` is set, use that.
   * - Otherwise, set it to the RPC server default: `finalized`.
   *
   * This is extremely important to ensure that these two fundamentally
   * identical subscriptions produce the same identifying hash:
   *
   * - A subscription made without specifying a commitment.
   * - A subscription made where the commitment specified is the same
   *   as the default applied to the subscription above.
   *
   * Example; these two subscriptions must produce the same hash:
   *
   * - An `accountSubscribe` subscription for `'PUBKEY'`
   * - An `accountSubscribe` subscription for `'PUBKEY'` with commitment
   *   `'finalized'`.
   *
   * See the 'making a subscription with defaulted params omitted' test
   * in `connection-subscriptions.ts` for more.
   */
  args) {
    const clientSubscriptionId = this._nextClientSubscriptionId++;
    const hash = fastStableStringify([subscriptionConfig.method, args]);
    const existingSubscription = this._subscriptionsByHash[hash];
    if (existingSubscription === undefined) {
      this._subscriptionsByHash[hash] = {
        ...subscriptionConfig,
        args,
        callbacks: new Set([subscriptionConfig.callback]),
        state: 'pending'
      };
    } else {
      existingSubscription.callbacks.add(subscriptionConfig.callback);
    }
    this._subscriptionHashByClientSubscriptionId[clientSubscriptionId] = hash;
    this._subscriptionDisposeFunctionsByClientSubscriptionId[clientSubscriptionId] = async () => {
      delete this._subscriptionDisposeFunctionsByClientSubscriptionId[clientSubscriptionId];
      delete this._subscriptionHashByClientSubscriptionId[clientSubscriptionId];
      const subscription = this._subscriptionsByHash[hash];
      assert(subscription !== undefined, `Could not find a \`Subscription\` when tearing down client subscription #${clientSubscriptionId}`);
      subscription.callbacks.delete(subscriptionConfig.callback);
      await this._updateSubscriptions();
    };
    this._updateSubscriptions();
    return clientSubscriptionId;
  }

  /**
   * Register a callback to be invoked whenever the specified account changes
   *
   * @param publicKey Public key of the account to monitor
   * @param callback Function to invoke whenever the account is changed
   * @param config
   * @return subscription id
   */

  /** @deprecated Instead, pass in an {@link AccountSubscriptionConfig} */
  // eslint-disable-next-line no-dupe-class-members

  // eslint-disable-next-line no-dupe-class-members
  onAccountChange(publicKey, callback, commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([publicKey.toBase58()], commitment || this._commitment || 'finalized',
    // Apply connection/server default.
    'base64', config);
    return this._makeSubscription({
      callback,
      method: 'accountSubscribe',
      unsubscribeMethod: 'accountUnsubscribe'
    }, args);
  }

  /**
   * Deregister an account notification callback
   *
   * @param clientSubscriptionId client subscription id to deregister
   */
  async removeAccountChangeListener(clientSubscriptionId) {
    await this._unsubscribeClientSubscription(clientSubscriptionId, 'account change');
  }

  /**
   * @internal
   */
  _wsOnProgramAccountNotification(notification) {
    const {
      result,
      subscription
    } = superstruct.create(notification, ProgramAccountNotificationResult);
    this._handleServerNotification(subscription, [{
      accountId: result.value.pubkey,
      accountInfo: result.value.account
    }, result.context]);
  }

  /**
   * Register a callback to be invoked whenever accounts owned by the
   * specified program change
   *
   * @param programId Public key of the program to monitor
   * @param callback Function to invoke whenever the account is changed
   * @param config
   * @return subscription id
   */

  /** @deprecated Instead, pass in a {@link ProgramAccountSubscriptionConfig} */
  // eslint-disable-next-line no-dupe-class-members

  // eslint-disable-next-line no-dupe-class-members
  onProgramAccountChange(programId, callback, commitmentOrConfig, maybeFilters) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([programId.toBase58()], commitment || this._commitment || 'finalized',
    // Apply connection/server default.
    'base64' /* encoding */, config ? config : maybeFilters ? {
      filters: applyDefaultMemcmpEncodingToFilters(maybeFilters)
    } : undefined /* extra */);
    return this._makeSubscription({
      callback,
      method: 'programSubscribe',
      unsubscribeMethod: 'programUnsubscribe'
    }, args);
  }

  /**
   * Deregister an account notification callback
   *
   * @param clientSubscriptionId client subscription id to deregister
   */
  async removeProgramAccountChangeListener(clientSubscriptionId) {
    await this._unsubscribeClientSubscription(clientSubscriptionId, 'program account change');
  }

  /**
   * Registers a callback to be invoked whenever logs are emitted.
   */
  onLogs(filter, callback, commitment) {
    const args = this._buildArgs([typeof filter === 'object' ? {
      mentions: [filter.toString()]
    } : filter], commitment || this._commitment || 'finalized' // Apply connection/server default.
    );
    return this._makeSubscription({
      callback,
      method: 'logsSubscribe',
      unsubscribeMethod: 'logsUnsubscribe'
    }, args);
  }

  /**
   * Deregister a logs callback.
   *
   * @param clientSubscriptionId client subscription id to deregister.
   */
  async removeOnLogsListener(clientSubscriptionId) {
    await this._unsubscribeClientSubscription(clientSubscriptionId, 'logs');
  }

  /**
   * @internal
   */
  _wsOnLogsNotification(notification) {
    const {
      result,
      subscription
    } = superstruct.create(notification, LogsNotificationResult);
    this._handleServerNotification(subscription, [result.value, result.context]);
  }

  /**
   * @internal
   */
  _wsOnSlotNotification(notification) {
    const {
      result,
      subscription
    } = superstruct.create(notification, SlotNotificationResult);
    this._handleServerNotification(subscription, [result]);
  }

  /**
   * Register a callback to be invoked upon slot changes
   *
   * @param callback Function to invoke whenever the slot changes
   * @return subscription id
   */
  onSlotChange(callback) {
    return this._makeSubscription({
      callback,
      method: 'slotSubscribe',
      unsubscribeMethod: 'slotUnsubscribe'
    }, [] /* args */);
  }

  /**
   * Deregister a slot notification callback
   *
   * @param clientSubscriptionId client subscription id to deregister
   */
  async removeSlotChangeListener(clientSubscriptionId) {
    await this._unsubscribeClientSubscription(clientSubscriptionId, 'slot change');
  }

  /**
   * @internal
   */
  _wsOnSlotUpdatesNotification(notification) {
    const {
      result,
      subscription
    } = superstruct.create(notification, SlotUpdateNotificationResult);
    this._handleServerNotification(subscription, [result]);
  }

  /**
   * Register a callback to be invoked upon slot updates. {@link SlotUpdate}'s
   * may be useful to track live progress of a cluster.
   *
   * @param callback Function to invoke whenever the slot updates
   * @return subscription id
   */
  onSlotUpdate(callback) {
    return this._makeSubscription({
      callback,
      method: 'slotsUpdatesSubscribe',
      unsubscribeMethod: 'slotsUpdatesUnsubscribe'
    }, [] /* args */);
  }

  /**
   * Deregister a slot update notification callback
   *
   * @param clientSubscriptionId client subscription id to deregister
   */
  async removeSlotUpdateListener(clientSubscriptionId) {
    await this._unsubscribeClientSubscription(clientSubscriptionId, 'slot update');
  }

  /**
   * @internal
   */

  async _unsubscribeClientSubscription(clientSubscriptionId, subscriptionName) {
    const dispose = this._subscriptionDisposeFunctionsByClientSubscriptionId[clientSubscriptionId];
    if (dispose) {
      await dispose();
    } else {
      console.warn('Ignored unsubscribe request because an active subscription with id ' + `\`${clientSubscriptionId}\` for '${subscriptionName}' events ` + 'could not be found.');
    }
  }
  _buildArgs(args, override, encoding, extra) {
    const commitment = override || this._commitment;
    if (commitment || encoding || extra) {
      let options = {};
      if (encoding) {
        options.encoding = encoding;
      }
      if (commitment) {
        options.commitment = commitment;
      }
      if (extra) {
        options = Object.assign(options, extra);
      }
      args.push(options);
    }
    return args;
  }

  /**
   * @internal
   */
  _buildArgsAtLeastConfirmed(args, override, encoding, extra) {
    const commitment = override || this._commitment;
    if (commitment && !['confirmed', 'finalized'].includes(commitment)) {
      throw new Error('Using Connection with default commitment: `' + this._commitment + '`, but method requires at least `confirmed`');
    }
    return this._buildArgs(args, override, encoding, extra);
  }

  /**
   * @internal
   */
  _wsOnSignatureNotification(notification) {
    const {
      result,
      subscription
    } = superstruct.create(notification, SignatureNotificationResult);
    if (result.value !== 'receivedSignature') {
      /**
       * Special case.
       * After a signature is processed, RPCs automatically dispose of the
       * subscription on the server side. We need to track which of these
       * subscriptions have been disposed in such a way, so that we know
       * whether the client is dealing with a not-yet-processed signature
       * (in which case we must tear down the server subscription) or an
       * already-processed signature (in which case the client can simply
       * clear out the subscription locally without telling the server).
       *
       * NOTE: There is a proposal to eliminate this special case, here:
       * https://github.com/solana-labs/solana/issues/18892
       */
      this._subscriptionsAutoDisposedByRpc.add(subscription);
    }
    this._handleServerNotification(subscription, result.value === 'receivedSignature' ? [{
      type: 'received'
    }, result.context] : [{
      type: 'status',
      result: result.value
    }, result.context]);
  }

  /**
   * Register a callback to be invoked upon signature updates
   *
   * @param signature Transaction signature string in base 58
   * @param callback Function to invoke on signature notifications
   * @param commitment Specify the commitment level signature must reach before notification
   * @return subscription id
   */
  onSignature(signature, callback, commitment) {
    const args = this._buildArgs([signature], commitment || this._commitment || 'finalized' // Apply connection/server default.
    );
    const clientSubscriptionId = this._makeSubscription({
      callback: (notification, context) => {
        if (notification.type === 'status') {
          callback(notification.result, context);
          // Signatures subscriptions are auto-removed by the RPC service
          // so no need to explicitly send an unsubscribe message.
          try {
            this.removeSignatureListener(clientSubscriptionId);
            // eslint-disable-next-line no-empty
          } catch (_err) {
            // Already removed.
          }
        }
      },
      method: 'signatureSubscribe',
      unsubscribeMethod: 'signatureUnsubscribe'
    }, args);
    return clientSubscriptionId;
  }

  /**
   * Register a callback to be invoked when a transaction is
   * received and/or processed.
   *
   * @param signature Transaction signature string in base 58
   * @param callback Function to invoke on signature notifications
   * @param options Enable received notifications and set the commitment
   *   level that signature must reach before notification
   * @return subscription id
   */
  onSignatureWithOptions(signature, callback, options) {
    const {
      commitment,
      ...extra
    } = {
      ...options,
      commitment: options && options.commitment || this._commitment || 'finalized' // Apply connection/server default.
    };
    const args = this._buildArgs([signature], commitment, undefined /* encoding */, extra);
    const clientSubscriptionId = this._makeSubscription({
      callback: (notification, context) => {
        callback(notification, context);
        // Signatures subscriptions are auto-removed by the RPC service
        // so no need to explicitly send an unsubscribe message.
        try {
          this.removeSignatureListener(clientSubscriptionId);
          // eslint-disable-next-line no-empty
        } catch (_err) {
          // Already removed.
        }
      },
      method: 'signatureSubscribe',
      unsubscribeMethod: 'signatureUnsubscribe'
    }, args);
    return clientSubscriptionId;
  }

  /**
   * Deregister a signature notification callback
   *
   * @param clientSubscriptionId client subscription id to deregister
   */
  async removeSignatureListener(clientSubscriptionId) {
    await this._unsubscribeClientSubscription(clientSubscriptionId, 'signature result');
  }

  /**
   * @internal
   */
  _wsOnRootNotification(notification) {
    const {
      result,
      subscription
    } = superstruct.create(notification, RootNotificationResult);
    this._handleServerNotification(subscription, [result]);
  }

  /**
   * Register a callback to be invoked upon root changes
   *
   * @param callback Function to invoke whenever the root changes
   * @return subscription id
   */
  onRootChange(callback) {
    return this._makeSubscription({
      callback,
      method: 'rootSubscribe',
      unsubscribeMethod: 'rootUnsubscribe'
    }, [] /* args */);
  }

  /**
   * Deregister a root notification callback
   *
   * @param clientSubscriptionId client subscription id to deregister
   */
  async removeRootChangeListener(clientSubscriptionId) {
    await this._unsubscribeClientSubscription(clientSubscriptionId, 'root change');
  }
}

/**
 * Keypair signer interface
 */

/**
 * An account keypair used for signing transactions.
 */
class Keypair {
  /**
   * Create a new keypair instance.
   * Generate random keypair if no {@link Ed25519Keypair} is provided.
   *
   * @param {Ed25519Keypair} keypair ed25519 keypair
   */
  constructor(keypair) {
    this._keypair = void 0;
    this._keypair = keypair ?? generateKeypair();
  }

  /**
   * Generate a new random keypair
   *
   * @returns {Keypair} Keypair
   */
  static generate() {
    return new Keypair(generateKeypair());
  }

  /**
   * Create a keypair from a raw secret key byte array.
   *
   * This method should only be used to recreate a keypair from a previously
   * generated secret key. Generating keypairs from a random seed should be done
   * with the {@link Keypair.fromSeed} method.
   *
   * @throws error if the provided secret key is invalid and validation is not skipped.
   *
   * @param secretKey secret key byte array
   * @param options skip secret key validation
   *
   * @returns {Keypair} Keypair
   */
  static fromSecretKey(secretKey, options) {
    if (secretKey.byteLength !== 64) {
      throw new Error('bad secret key size');
    }
    const publicKey = secretKey.slice(32, 64);
    if (!options || !options.skipValidation) {
      const privateScalar = secretKey.slice(0, 32);
      const computedPublicKey = getPublicKey(privateScalar);
      for (let ii = 0; ii < 32; ii++) {
        if (publicKey[ii] !== computedPublicKey[ii]) {
          throw new Error('provided secretKey is invalid');
        }
      }
    }
    return new Keypair({
      publicKey,
      secretKey
    });
  }

  /**
   * Generate a keypair from a 32 byte seed.
   *
   * @param seed seed byte array
   *
   * @returns {Keypair} Keypair
   */
  static fromSeed(seed) {
    const publicKey = getPublicKey(seed);
    const secretKey = new Uint8Array(64);
    secretKey.set(seed);
    secretKey.set(publicKey, 32);
    return new Keypair({
      publicKey,
      secretKey
    });
  }

  /**
   * The public key for this keypair
   *
   * @returns {PublicKey} PublicKey
   */
  get publicKey() {
    return new PublicKey(this._keypair.publicKey);
  }

  /**
   * The raw secret key for this keypair
   * @returns {Uint8Array} Secret key in an array of Uint8 bytes
   */
  get secretKey() {
    return new Uint8Array(this._keypair.secretKey);
  }
}

/**
 * An enumeration of valid LookupTableInstructionType's
 */

/**
 * An enumeration of valid address lookup table InstructionType's
 * @internal
 */
const LOOKUP_TABLE_INSTRUCTION_LAYOUTS = Object.freeze({
  CreateLookupTable: {
    index: 0,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), u64('recentSlot'), BufferLayout__namespace.u8('bumpSeed')])
  },
  FreezeLookupTable: {
    index: 1,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction')])
  },
  ExtendLookupTable: {
    index: 2,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), u64(), BufferLayout__namespace.seq(publicKey(), BufferLayout__namespace.offset(BufferLayout__namespace.u32(), -8), 'addresses')])
  },
  DeactivateLookupTable: {
    index: 3,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction')])
  },
  CloseLookupTable: {
    index: 4,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction')])
  }
});
class AddressLookupTableInstruction {
  /**
   * @internal
   */
  constructor() {}
  static decodeInstructionType(instruction) {
    this.checkProgramId(instruction.programId);
    const instructionTypeLayout = BufferLayout__namespace.u32('instruction');
    const index = instructionTypeLayout.decode(instruction.data);
    let type;
    for (const [layoutType, layout] of Object.entries(LOOKUP_TABLE_INSTRUCTION_LAYOUTS)) {
      if (layout.index == index) {
        type = layoutType;
        break;
      }
    }
    if (!type) {
      throw new Error('Invalid Instruction. Should be a LookupTable Instruction');
    }
    return type;
  }
  static decodeCreateLookupTable(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeysLength(instruction.keys, 4);
    const {
      recentSlot
    } = decodeData$1(LOOKUP_TABLE_INSTRUCTION_LAYOUTS.CreateLookupTable, instruction.data);
    return {
      authority: instruction.keys[1].pubkey,
      payer: instruction.keys[2].pubkey,
      recentSlot: Number(recentSlot)
    };
  }
  static decodeExtendLookupTable(instruction) {
    this.checkProgramId(instruction.programId);
    if (instruction.keys.length < 2) {
      throw new Error(`invalid instruction; found ${instruction.keys.length} keys, expected at least 2`);
    }
    const {
      addresses
    } = decodeData$1(LOOKUP_TABLE_INSTRUCTION_LAYOUTS.ExtendLookupTable, instruction.data);
    return {
      lookupTable: instruction.keys[0].pubkey,
      authority: instruction.keys[1].pubkey,
      payer: instruction.keys.length > 2 ? instruction.keys[2].pubkey : undefined,
      addresses: addresses.map(buffer => new PublicKey(buffer))
    };
  }
  static decodeCloseLookupTable(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeysLength(instruction.keys, 3);
    return {
      lookupTable: instruction.keys[0].pubkey,
      authority: instruction.keys[1].pubkey,
      recipient: instruction.keys[2].pubkey
    };
  }
  static decodeFreezeLookupTable(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeysLength(instruction.keys, 2);
    return {
      lookupTable: instruction.keys[0].pubkey,
      authority: instruction.keys[1].pubkey
    };
  }
  static decodeDeactivateLookupTable(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeysLength(instruction.keys, 2);
    return {
      lookupTable: instruction.keys[0].pubkey,
      authority: instruction.keys[1].pubkey
    };
  }

  /**
   * @internal
   */
  static checkProgramId(programId) {
    if (!programId.equals(AddressLookupTableProgram.programId)) {
      throw new Error('invalid instruction; programId is not AddressLookupTable Program');
    }
  }
  /**
   * @internal
   */
  static checkKeysLength(keys, expectedLength) {
    if (keys.length < expectedLength) {
      throw new Error(`invalid instruction; found ${keys.length} keys, expected at least ${expectedLength}`);
    }
  }
}
class AddressLookupTableProgram {
  /**
   * @internal
   */
  constructor() {}
  static createLookupTable(params) {
    const [lookupTableAddress, bumpSeed] = PublicKey.findProgramAddressSync([params.authority.toBuffer(), codecsNumbers.getU64Encoder().encode(params.recentSlot)], this.programId);
    const type = LOOKUP_TABLE_INSTRUCTION_LAYOUTS.CreateLookupTable;
    const data = encodeData(type, {
      recentSlot: BigInt(params.recentSlot),
      bumpSeed: bumpSeed
    });
    const keys = [{
      pubkey: lookupTableAddress,
      isSigner: false,
      isWritable: true
    }, {
      pubkey: params.authority,
      isSigner: true,
      isWritable: false
    }, {
      pubkey: params.payer,
      isSigner: true,
      isWritable: true
    }, {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false
    }];
    return [new TransactionInstruction({
      programId: this.programId,
      keys: keys,
      data: data
    }), lookupTableAddress];
  }
  static freezeLookupTable(params) {
    const type = LOOKUP_TABLE_INSTRUCTION_LAYOUTS.FreezeLookupTable;
    const data = encodeData(type);
    const keys = [{
      pubkey: params.lookupTable,
      isSigner: false,
      isWritable: true
    }, {
      pubkey: params.authority,
      isSigner: true,
      isWritable: false
    }];
    return new TransactionInstruction({
      programId: this.programId,
      keys: keys,
      data: data
    });
  }
  static extendLookupTable(params) {
    const type = LOOKUP_TABLE_INSTRUCTION_LAYOUTS.ExtendLookupTable;
    const data = encodeData(type, {
      addresses: params.addresses.map(addr => addr.toBytes())
    });
    const keys = [{
      pubkey: params.lookupTable,
      isSigner: false,
      isWritable: true
    }, {
      pubkey: params.authority,
      isSigner: true,
      isWritable: false
    }];
    if (params.payer) {
      keys.push({
        pubkey: params.payer,
        isSigner: true,
        isWritable: true
      }, {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false
      });
    }
    return new TransactionInstruction({
      programId: this.programId,
      keys: keys,
      data: data
    });
  }
  static deactivateLookupTable(params) {
    const type = LOOKUP_TABLE_INSTRUCTION_LAYOUTS.DeactivateLookupTable;
    const data = encodeData(type);
    const keys = [{
      pubkey: params.lookupTable,
      isSigner: false,
      isWritable: true
    }, {
      pubkey: params.authority,
      isSigner: true,
      isWritable: false
    }];
    return new TransactionInstruction({
      programId: this.programId,
      keys: keys,
      data: data
    });
  }
  static closeLookupTable(params) {
    const type = LOOKUP_TABLE_INSTRUCTION_LAYOUTS.CloseLookupTable;
    const data = encodeData(type);
    const keys = [{
      pubkey: params.lookupTable,
      isSigner: false,
      isWritable: true
    }, {
      pubkey: params.authority,
      isSigner: true,
      isWritable: false
    }, {
      pubkey: params.recipient,
      isSigner: false,
      isWritable: true
    }];
    return new TransactionInstruction({
      programId: this.programId,
      keys: keys,
      data: data
    });
  }
}
AddressLookupTableProgram.programId = new PublicKey('AddressLookupTab1e1111111111111111111111111');

/**
 * Compute Budget Instruction class
 */
class ComputeBudgetInstruction {
  /**
   * @internal
   */
  constructor() {}

  /**
   * Decode a compute budget instruction and retrieve the instruction type.
   */
  static decodeInstructionType(instruction) {
    this.checkProgramId(instruction.programId);
    const instructionTypeLayout = BufferLayout__namespace.u8('instruction');
    const typeIndex = instructionTypeLayout.decode(instruction.data);
    let type;
    for (const [ixType, layout] of Object.entries(COMPUTE_BUDGET_INSTRUCTION_LAYOUTS)) {
      if (layout.index == typeIndex) {
        type = ixType;
        break;
      }
    }
    if (!type) {
      throw new Error('Instruction type incorrect; not a ComputeBudgetInstruction');
    }
    return type;
  }

  /**
   * Decode request units compute budget instruction and retrieve the instruction params.
   */
  static decodeRequestUnits(instruction) {
    this.checkProgramId(instruction.programId);
    const {
      units,
      additionalFee
    } = decodeData$1(COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.RequestUnits, instruction.data);
    return {
      units,
      additionalFee
    };
  }

  /**
   * Decode request heap frame compute budget instruction and retrieve the instruction params.
   */
  static decodeRequestHeapFrame(instruction) {
    this.checkProgramId(instruction.programId);
    const {
      bytes
    } = decodeData$1(COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.RequestHeapFrame, instruction.data);
    return {
      bytes
    };
  }

  /**
   * Decode set compute unit limit compute budget instruction and retrieve the instruction params.
   */
  static decodeSetComputeUnitLimit(instruction) {
    this.checkProgramId(instruction.programId);
    const {
      units
    } = decodeData$1(COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.SetComputeUnitLimit, instruction.data);
    return {
      units
    };
  }

  /**
   * Decode set compute unit price compute budget instruction and retrieve the instruction params.
   */
  static decodeSetComputeUnitPrice(instruction) {
    this.checkProgramId(instruction.programId);
    const {
      microLamports
    } = decodeData$1(COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.SetComputeUnitPrice, instruction.data);
    return {
      microLamports
    };
  }

  /**
   * @internal
   */
  static checkProgramId(programId) {
    if (!programId.equals(ComputeBudgetProgram.programId)) {
      throw new Error('invalid instruction; programId is not ComputeBudgetProgram');
    }
  }
}

/**
 * An enumeration of valid ComputeBudgetInstructionType's
 */

/**
 * Request units instruction params
 */

/**
 * Request heap frame instruction params
 */

/**
 * Set compute unit limit instruction params
 */

/**
 * Set compute unit price instruction params
 */

/**
 * An enumeration of valid ComputeBudget InstructionType's
 * @internal
 */
const COMPUTE_BUDGET_INSTRUCTION_LAYOUTS = Object.freeze({
  RequestUnits: {
    index: 0,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u8('instruction'), BufferLayout__namespace.u32('units'), BufferLayout__namespace.u32('additionalFee')])
  },
  RequestHeapFrame: {
    index: 1,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u8('instruction'), BufferLayout__namespace.u32('bytes')])
  },
  SetComputeUnitLimit: {
    index: 2,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u8('instruction'), BufferLayout__namespace.u32('units')])
  },
  SetComputeUnitPrice: {
    index: 3,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u8('instruction'), u64('microLamports')])
  }
});

/**
 * Factory class for transaction instructions to interact with the Compute Budget program
 */
class ComputeBudgetProgram {
  /**
   * @internal
   */
  constructor() {}

  /**
   * Public key that identifies the Compute Budget program
   */

  /**
   * @deprecated Instead, call {@link setComputeUnitLimit} and/or {@link setComputeUnitPrice}
   */
  static requestUnits(params) {
    const type = COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.RequestUnits;
    const data = encodeData(type, params);
    return new TransactionInstruction({
      keys: [],
      programId: this.programId,
      data
    });
  }
  static requestHeapFrame(params) {
    const type = COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.RequestHeapFrame;
    const data = encodeData(type, params);
    return new TransactionInstruction({
      keys: [],
      programId: this.programId,
      data
    });
  }
  static setComputeUnitLimit(params) {
    const type = COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.SetComputeUnitLimit;
    const data = encodeData(type, params);
    return new TransactionInstruction({
      keys: [],
      programId: this.programId,
      data
    });
  }
  static setComputeUnitPrice(params) {
    const type = COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.SetComputeUnitPrice;
    const data = encodeData(type, {
      microLamports: BigInt(params.microLamports)
    });
    return new TransactionInstruction({
      keys: [],
      programId: this.programId,
      data
    });
  }
}
ComputeBudgetProgram.programId = new PublicKey('ComputeBudget111111111111111111111111111111');

const PRIVATE_KEY_BYTES$1 = 64;
const PUBLIC_KEY_BYTES$1 = 32;
const SIGNATURE_BYTES = 64;

/**
 * Params for creating an ed25519 instruction using a public key
 */

/**
 * Params for creating an ed25519 instruction using a private key
 */

const ED25519_INSTRUCTION_LAYOUT = BufferLayout__namespace.struct([BufferLayout__namespace.u8('numSignatures'), BufferLayout__namespace.u8('padding'), BufferLayout__namespace.u16('signatureOffset'), BufferLayout__namespace.u16('signatureInstructionIndex'), BufferLayout__namespace.u16('publicKeyOffset'), BufferLayout__namespace.u16('publicKeyInstructionIndex'), BufferLayout__namespace.u16('messageDataOffset'), BufferLayout__namespace.u16('messageDataSize'), BufferLayout__namespace.u16('messageInstructionIndex')]);
class Ed25519Program {
  /**
   * @internal
   */
  constructor() {}

  /**
   * Public key that identifies the ed25519 program
   */

  /**
   * Create an ed25519 instruction with a public key and signature. The
   * public key must be a buffer that is 32 bytes long, and the signature
   * must be a buffer of 64 bytes.
   */
  static createInstructionWithPublicKey(params) {
    const {
      publicKey,
      message,
      signature,
      instructionIndex
    } = params;
    assert(publicKey.length === PUBLIC_KEY_BYTES$1, `Public Key must be ${PUBLIC_KEY_BYTES$1} bytes but received ${publicKey.length} bytes`);
    assert(signature.length === SIGNATURE_BYTES, `Signature must be ${SIGNATURE_BYTES} bytes but received ${signature.length} bytes`);
    const publicKeyOffset = ED25519_INSTRUCTION_LAYOUT.span;
    const signatureOffset = publicKeyOffset + publicKey.length;
    const messageDataOffset = signatureOffset + signature.length;
    const numSignatures = 1;
    const instructionData = buffer.Buffer.alloc(messageDataOffset + message.length);
    const index = instructionIndex == null ? 0xffff // An index of `u16::MAX` makes it default to the current instruction.
    : instructionIndex;
    ED25519_INSTRUCTION_LAYOUT.encode({
      numSignatures,
      padding: 0,
      signatureOffset,
      signatureInstructionIndex: index,
      publicKeyOffset,
      publicKeyInstructionIndex: index,
      messageDataOffset,
      messageDataSize: message.length,
      messageInstructionIndex: index
    }, instructionData);
    instructionData.fill(publicKey, publicKeyOffset);
    instructionData.fill(signature, signatureOffset);
    instructionData.fill(message, messageDataOffset);
    return new TransactionInstruction({
      keys: [],
      programId: Ed25519Program.programId,
      data: instructionData
    });
  }

  /**
   * Create an ed25519 instruction with a private key. The private key
   * must be a buffer that is 64 bytes long.
   */
  static createInstructionWithPrivateKey(params) {
    const {
      privateKey,
      message,
      instructionIndex
    } = params;
    assert(privateKey.length === PRIVATE_KEY_BYTES$1, `Private key must be ${PRIVATE_KEY_BYTES$1} bytes but received ${privateKey.length} bytes`);
    try {
      const keypair = Keypair.fromSecretKey(privateKey);
      const publicKey = keypair.publicKey.toBytes();
      const signature = sign(message, keypair.secretKey);
      return this.createInstructionWithPublicKey({
        publicKey,
        message,
        signature,
        instructionIndex
      });
    } catch (error) {
      throw new Error(`Error creating instruction; ${error}`);
    }
  }
}
Ed25519Program.programId = new PublicKey('Ed25519SigVerify111111111111111111111111111');

const ecdsaSign = (msgHash, privKey) => {
  const signature = secp256k1.secp256k1.sign(msgHash, privKey);
  return [signature.toCompactRawBytes(), signature.recovery];
};
secp256k1.secp256k1.utils.isValidPrivateKey;
const publicKeyCreate = secp256k1.secp256k1.getPublicKey;

const PRIVATE_KEY_BYTES = 32;
const ETHEREUM_ADDRESS_BYTES = 20;
const PUBLIC_KEY_BYTES = 64;
const SIGNATURE_OFFSETS_SERIALIZED_SIZE = 11;

/**
 * Params for creating an secp256k1 instruction using a public key
 */

/**
 * Params for creating an secp256k1 instruction using an Ethereum address
 */

/**
 * Params for creating an secp256k1 instruction using a private key
 */

const SECP256K1_INSTRUCTION_LAYOUT = BufferLayout__namespace.struct([BufferLayout__namespace.u8('numSignatures'), BufferLayout__namespace.u16('signatureOffset'), BufferLayout__namespace.u8('signatureInstructionIndex'), BufferLayout__namespace.u16('ethAddressOffset'), BufferLayout__namespace.u8('ethAddressInstructionIndex'), BufferLayout__namespace.u16('messageDataOffset'), BufferLayout__namespace.u16('messageDataSize'), BufferLayout__namespace.u8('messageInstructionIndex'), BufferLayout__namespace.blob(20, 'ethAddress'), BufferLayout__namespace.blob(64, 'signature'), BufferLayout__namespace.u8('recoveryId')]);
class Secp256k1Program {
  /**
   * @internal
   */
  constructor() {}

  /**
   * Public key that identifies the secp256k1 program
   */

  /**
   * Construct an Ethereum address from a secp256k1 public key buffer.
   * @param {Buffer} publicKey a 64 byte secp256k1 public key buffer
   */
  static publicKeyToEthAddress(publicKey) {
    assert(publicKey.length === PUBLIC_KEY_BYTES, `Public key must be ${PUBLIC_KEY_BYTES} bytes but received ${publicKey.length} bytes`);
    try {
      return buffer.Buffer.from(sha3.keccak_256(toBuffer(publicKey))).slice(-ETHEREUM_ADDRESS_BYTES);
    } catch (error) {
      throw new Error(`Error constructing Ethereum address: ${error}`);
    }
  }

  /**
   * Create an secp256k1 instruction with a public key. The public key
   * must be a buffer that is 64 bytes long.
   */
  static createInstructionWithPublicKey(params) {
    const {
      publicKey,
      message,
      signature,
      recoveryId,
      instructionIndex
    } = params;
    return Secp256k1Program.createInstructionWithEthAddress({
      ethAddress: Secp256k1Program.publicKeyToEthAddress(publicKey),
      message,
      signature,
      recoveryId,
      instructionIndex
    });
  }

  /**
   * Create an secp256k1 instruction with an Ethereum address. The address
   * must be a hex string or a buffer that is 20 bytes long.
   */
  static createInstructionWithEthAddress(params) {
    const {
      ethAddress: rawAddress,
      message,
      signature,
      recoveryId,
      instructionIndex = 0
    } = params;
    let ethAddress;
    if (typeof rawAddress === 'string') {
      if (rawAddress.startsWith('0x')) {
        ethAddress = buffer.Buffer.from(rawAddress.substr(2), 'hex');
      } else {
        ethAddress = buffer.Buffer.from(rawAddress, 'hex');
      }
    } else {
      ethAddress = rawAddress;
    }
    assert(ethAddress.length === ETHEREUM_ADDRESS_BYTES, `Address must be ${ETHEREUM_ADDRESS_BYTES} bytes but received ${ethAddress.length} bytes`);
    const dataStart = 1 + SIGNATURE_OFFSETS_SERIALIZED_SIZE;
    const ethAddressOffset = dataStart;
    const signatureOffset = dataStart + ethAddress.length;
    const messageDataOffset = signatureOffset + signature.length + 1;
    const numSignatures = 1;
    const instructionData = buffer.Buffer.alloc(SECP256K1_INSTRUCTION_LAYOUT.span + message.length);
    SECP256K1_INSTRUCTION_LAYOUT.encode({
      numSignatures,
      signatureOffset,
      signatureInstructionIndex: instructionIndex,
      ethAddressOffset,
      ethAddressInstructionIndex: instructionIndex,
      messageDataOffset,
      messageDataSize: message.length,
      messageInstructionIndex: instructionIndex,
      signature: toBuffer(signature),
      ethAddress: toBuffer(ethAddress),
      recoveryId
    }, instructionData);
    instructionData.fill(toBuffer(message), SECP256K1_INSTRUCTION_LAYOUT.span);
    return new TransactionInstruction({
      keys: [],
      programId: Secp256k1Program.programId,
      data: instructionData
    });
  }

  /**
   * Create an secp256k1 instruction with a private key. The private key
   * must be a buffer that is 32 bytes long.
   */
  static createInstructionWithPrivateKey(params) {
    const {
      privateKey: pkey,
      message,
      instructionIndex
    } = params;
    assert(pkey.length === PRIVATE_KEY_BYTES, `Private key must be ${PRIVATE_KEY_BYTES} bytes but received ${pkey.length} bytes`);
    try {
      const privateKey = toBuffer(pkey);
      const publicKey = publicKeyCreate(privateKey, false /* isCompressed */).slice(1); // throw away leading byte
      const messageHash = buffer.Buffer.from(sha3.keccak_256(toBuffer(message)));
      const [signature, recoveryId] = ecdsaSign(messageHash, privateKey);
      return this.createInstructionWithPublicKey({
        publicKey,
        message,
        signature,
        recoveryId,
        instructionIndex
      });
    } catch (error) {
      throw new Error(`Error creating instruction; ${error}`);
    }
  }
}
Secp256k1Program.programId = new PublicKey('KeccakSecp256k11111111111111111111111111111');

var _Lockup;

/**
 * Address of the stake config account which configures the rate
 * of stake warmup and cooldown as well as the slashing penalty.
 */
const STAKE_CONFIG_ID = new PublicKey('StakeConfig11111111111111111111111111111111');

/**
 * Stake account authority info
 */
class Authorized {
  /**
   * Create a new Authorized object
   * @param staker the stake authority
   * @param withdrawer the withdraw authority
   */
  constructor(staker, withdrawer) {
    /** stake authority */
    this.staker = void 0;
    /** withdraw authority */
    this.withdrawer = void 0;
    this.staker = staker;
    this.withdrawer = withdrawer;
  }
}
/**
 * Stake account lockup info
 */
class Lockup {
  /**
   * Create a new Lockup object
   */
  constructor(unixTimestamp, epoch, custodian) {
    /** Unix timestamp of lockup expiration */
    this.unixTimestamp = void 0;
    /** Epoch of lockup expiration */
    this.epoch = void 0;
    /** Lockup custodian authority */
    this.custodian = void 0;
    this.unixTimestamp = unixTimestamp;
    this.epoch = epoch;
    this.custodian = custodian;
  }

  /**
   * Default, inactive Lockup value
   */
}
_Lockup = Lockup;
Lockup.default = new _Lockup(0, 0, PublicKey.default);
/**
 * Create stake account transaction params
 */
/**
 * Create stake account with seed transaction params
 */
/**
 * Initialize stake instruction params
 */
/**
 * Delegate stake instruction params
 */
/**
 * Authorize stake instruction params
 */
/**
 * Authorize stake instruction params using a derived key
 */
/**
 * Split stake instruction params
 */
/**
 * Split with seed transaction params
 */
/**
 * Withdraw stake instruction params
 */
/**
 * Deactivate stake instruction params
 */
/**
 * Merge stake instruction params
 */
/**
 * Stake Instruction class
 */
class StakeInstruction {
  /**
   * @internal
   */
  constructor() {}

  /**
   * Decode a stake instruction and retrieve the instruction type.
   */
  static decodeInstructionType(instruction) {
    this.checkProgramId(instruction.programId);
    const instructionTypeLayout = BufferLayout__namespace.u32('instruction');
    const typeIndex = instructionTypeLayout.decode(instruction.data);
    let type;
    for (const [ixType, layout] of Object.entries(STAKE_INSTRUCTION_LAYOUTS)) {
      if (layout.index == typeIndex) {
        type = ixType;
        break;
      }
    }
    if (!type) {
      throw new Error('Instruction type incorrect; not a StakeInstruction');
    }
    return type;
  }

  /**
   * Decode a initialize stake instruction and retrieve the instruction params.
   */
  static decodeInitialize(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 2);
    const {
      authorized,
      lockup
    } = decodeData$1(STAKE_INSTRUCTION_LAYOUTS.Initialize, instruction.data);
    return {
      stakePubkey: instruction.keys[0].pubkey,
      authorized: new Authorized(new PublicKey(authorized.staker), new PublicKey(authorized.withdrawer)),
      lockup: new Lockup(lockup.unixTimestamp, lockup.epoch, new PublicKey(lockup.custodian))
    };
  }

  /**
   * Decode a delegate stake instruction and retrieve the instruction params.
   */
  static decodeDelegate(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 6);
    decodeData$1(STAKE_INSTRUCTION_LAYOUTS.Delegate, instruction.data);
    return {
      stakePubkey: instruction.keys[0].pubkey,
      votePubkey: instruction.keys[1].pubkey,
      authorizedPubkey: instruction.keys[5].pubkey
    };
  }

  /**
   * Decode an authorize stake instruction and retrieve the instruction params.
   */
  static decodeAuthorize(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 3);
    const {
      newAuthorized,
      stakeAuthorizationType
    } = decodeData$1(STAKE_INSTRUCTION_LAYOUTS.Authorize, instruction.data);
    const o = {
      stakePubkey: instruction.keys[0].pubkey,
      authorizedPubkey: instruction.keys[2].pubkey,
      newAuthorizedPubkey: new PublicKey(newAuthorized),
      stakeAuthorizationType: {
        index: stakeAuthorizationType
      }
    };
    if (instruction.keys.length > 3) {
      o.custodianPubkey = instruction.keys[3].pubkey;
    }
    return o;
  }

  /**
   * Decode an authorize-with-seed stake instruction and retrieve the instruction params.
   */
  static decodeAuthorizeWithSeed(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 2);
    const {
      newAuthorized,
      stakeAuthorizationType,
      authoritySeed,
      authorityOwner
    } = decodeData$1(STAKE_INSTRUCTION_LAYOUTS.AuthorizeWithSeed, instruction.data);
    const o = {
      stakePubkey: instruction.keys[0].pubkey,
      authorityBase: instruction.keys[1].pubkey,
      authoritySeed: authoritySeed,
      authorityOwner: new PublicKey(authorityOwner),
      newAuthorizedPubkey: new PublicKey(newAuthorized),
      stakeAuthorizationType: {
        index: stakeAuthorizationType
      }
    };
    if (instruction.keys.length > 3) {
      o.custodianPubkey = instruction.keys[3].pubkey;
    }
    return o;
  }

  /**
   * Decode a split stake instruction and retrieve the instruction params.
   */
  static decodeSplit(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 3);
    const {
      lamports
    } = decodeData$1(STAKE_INSTRUCTION_LAYOUTS.Split, instruction.data);
    return {
      stakePubkey: instruction.keys[0].pubkey,
      splitStakePubkey: instruction.keys[1].pubkey,
      authorizedPubkey: instruction.keys[2].pubkey,
      lamports
    };
  }

  /**
   * Decode a merge stake instruction and retrieve the instruction params.
   */
  static decodeMerge(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 3);
    decodeData$1(STAKE_INSTRUCTION_LAYOUTS.Merge, instruction.data);
    return {
      stakePubkey: instruction.keys[0].pubkey,
      sourceStakePubKey: instruction.keys[1].pubkey,
      authorizedPubkey: instruction.keys[4].pubkey
    };
  }

  /**
   * Decode a withdraw stake instruction and retrieve the instruction params.
   */
  static decodeWithdraw(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 5);
    const {
      lamports
    } = decodeData$1(STAKE_INSTRUCTION_LAYOUTS.Withdraw, instruction.data);
    const o = {
      stakePubkey: instruction.keys[0].pubkey,
      toPubkey: instruction.keys[1].pubkey,
      authorizedPubkey: instruction.keys[4].pubkey,
      lamports
    };
    if (instruction.keys.length > 5) {
      o.custodianPubkey = instruction.keys[5].pubkey;
    }
    return o;
  }

  /**
   * Decode a deactivate stake instruction and retrieve the instruction params.
   */
  static decodeDeactivate(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 3);
    decodeData$1(STAKE_INSTRUCTION_LAYOUTS.Deactivate, instruction.data);
    return {
      stakePubkey: instruction.keys[0].pubkey,
      authorizedPubkey: instruction.keys[2].pubkey
    };
  }

  /**
   * @internal
   */
  static checkProgramId(programId) {
    if (!programId.equals(StakeProgram.programId)) {
      throw new Error('invalid instruction; programId is not StakeProgram');
    }
  }

  /**
   * @internal
   */
  static checkKeyLength(keys, expectedLength) {
    if (keys.length < expectedLength) {
      throw new Error(`invalid instruction; found ${keys.length} keys, expected at least ${expectedLength}`);
    }
  }
}

/**
 * An enumeration of valid StakeInstructionType's
 */

/**
 * An enumeration of valid stake InstructionType's
 * @internal
 */
const STAKE_INSTRUCTION_LAYOUTS = Object.freeze({
  Initialize: {
    index: 0,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), authorized(), lockup()])
  },
  Authorize: {
    index: 1,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), publicKey('newAuthorized'), BufferLayout__namespace.u32('stakeAuthorizationType')])
  },
  Delegate: {
    index: 2,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction')])
  },
  Split: {
    index: 3,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), BufferLayout__namespace.ns64('lamports')])
  },
  Withdraw: {
    index: 4,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), BufferLayout__namespace.ns64('lamports')])
  },
  Deactivate: {
    index: 5,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction')])
  },
  Merge: {
    index: 7,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction')])
  },
  AuthorizeWithSeed: {
    index: 8,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), publicKey('newAuthorized'), BufferLayout__namespace.u32('stakeAuthorizationType'), rustString('authoritySeed'), publicKey('authorityOwner')])
  }
});

/**
 * Stake authorization type
 */

/**
 * An enumeration of valid StakeAuthorizationLayout's
 */
const StakeAuthorizationLayout = Object.freeze({
  Staker: {
    index: 0
  },
  Withdrawer: {
    index: 1
  }
});

/**
 * Factory class for transactions to interact with the Stake program
 */
class StakeProgram {
  /**
   * @internal
   */
  constructor() {}

  /**
   * Public key that identifies the Stake program
   */

  /**
   * Generate an Initialize instruction to add to a Stake Create transaction
   */
  static initialize(params) {
    const {
      stakePubkey,
      authorized,
      lockup: maybeLockup
    } = params;
    const lockup = maybeLockup || Lockup.default;
    const type = STAKE_INSTRUCTION_LAYOUTS.Initialize;
    const data = encodeData(type, {
      authorized: {
        staker: toBuffer(authorized.staker.toBuffer()),
        withdrawer: toBuffer(authorized.withdrawer.toBuffer())
      },
      lockup: {
        unixTimestamp: lockup.unixTimestamp,
        epoch: lockup.epoch,
        custodian: toBuffer(lockup.custodian.toBuffer())
      }
    });
    const instructionData = {
      keys: [{
        pubkey: stakePubkey,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false
      }],
      programId: this.programId,
      data
    };
    return new TransactionInstruction(instructionData);
  }

  /**
   * Generate a Transaction that creates a new Stake account at
   *   an address generated with `from`, a seed, and the Stake programId
   */
  static createAccountWithSeed(params) {
    const transaction = new Transaction();
    transaction.add(SystemProgram.createAccountWithSeed({
      fromPubkey: params.fromPubkey,
      newAccountPubkey: params.stakePubkey,
      basePubkey: params.basePubkey,
      seed: params.seed,
      lamports: params.lamports,
      space: this.space,
      programId: this.programId
    }));
    const {
      stakePubkey,
      authorized,
      lockup
    } = params;
    return transaction.add(this.initialize({
      stakePubkey,
      authorized,
      lockup
    }));
  }

  /**
   * Generate a Transaction that creates a new Stake account
   */
  static createAccount(params) {
    const transaction = new Transaction();
    transaction.add(SystemProgram.createAccount({
      fromPubkey: params.fromPubkey,
      newAccountPubkey: params.stakePubkey,
      lamports: params.lamports,
      space: this.space,
      programId: this.programId
    }));
    const {
      stakePubkey,
      authorized,
      lockup
    } = params;
    return transaction.add(this.initialize({
      stakePubkey,
      authorized,
      lockup
    }));
  }

  /**
   * Generate a Transaction that delegates Stake tokens to a validator
   * Vote PublicKey. This transaction can also be used to redelegate Stake
   * to a new validator Vote PublicKey.
   */
  static delegate(params) {
    const {
      stakePubkey,
      authorizedPubkey,
      votePubkey
    } = params;
    const type = STAKE_INSTRUCTION_LAYOUTS.Delegate;
    const data = encodeData(type);
    return new Transaction().add({
      keys: [{
        pubkey: stakePubkey,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: votePubkey,
        isSigner: false,
        isWritable: false
      }, {
        pubkey: SYSVAR_CLOCK_PUBKEY,
        isSigner: false,
        isWritable: false
      }, {
        pubkey: SYSVAR_STAKE_HISTORY_PUBKEY,
        isSigner: false,
        isWritable: false
      }, {
        pubkey: STAKE_CONFIG_ID,
        isSigner: false,
        isWritable: false
      }, {
        pubkey: authorizedPubkey,
        isSigner: true,
        isWritable: false
      }],
      programId: this.programId,
      data
    });
  }

  /**
   * Generate a Transaction that authorizes a new PublicKey as Staker
   * or Withdrawer on the Stake account.
   */
  static authorize(params) {
    const {
      stakePubkey,
      authorizedPubkey,
      newAuthorizedPubkey,
      stakeAuthorizationType,
      custodianPubkey
    } = params;
    const type = STAKE_INSTRUCTION_LAYOUTS.Authorize;
    const data = encodeData(type, {
      newAuthorized: toBuffer(newAuthorizedPubkey.toBuffer()),
      stakeAuthorizationType: stakeAuthorizationType.index
    });
    const keys = [{
      pubkey: stakePubkey,
      isSigner: false,
      isWritable: true
    }, {
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: true
    }, {
      pubkey: authorizedPubkey,
      isSigner: true,
      isWritable: false
    }];
    if (custodianPubkey) {
      keys.push({
        pubkey: custodianPubkey,
        isSigner: true,
        isWritable: false
      });
    }
    return new Transaction().add({
      keys,
      programId: this.programId,
      data
    });
  }

  /**
   * Generate a Transaction that authorizes a new PublicKey as Staker
   * or Withdrawer on the Stake account.
   */
  static authorizeWithSeed(params) {
    const {
      stakePubkey,
      authorityBase,
      authoritySeed,
      authorityOwner,
      newAuthorizedPubkey,
      stakeAuthorizationType,
      custodianPubkey
    } = params;
    const type = STAKE_INSTRUCTION_LAYOUTS.AuthorizeWithSeed;
    const data = encodeData(type, {
      newAuthorized: toBuffer(newAuthorizedPubkey.toBuffer()),
      stakeAuthorizationType: stakeAuthorizationType.index,
      authoritySeed: authoritySeed,
      authorityOwner: toBuffer(authorityOwner.toBuffer())
    });
    const keys = [{
      pubkey: stakePubkey,
      isSigner: false,
      isWritable: true
    }, {
      pubkey: authorityBase,
      isSigner: true,
      isWritable: false
    }, {
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false
    }];
    if (custodianPubkey) {
      keys.push({
        pubkey: custodianPubkey,
        isSigner: true,
        isWritable: false
      });
    }
    return new Transaction().add({
      keys,
      programId: this.programId,
      data
    });
  }

  /**
   * @internal
   */
  static splitInstruction(params) {
    const {
      stakePubkey,
      authorizedPubkey,
      splitStakePubkey,
      lamports
    } = params;
    const type = STAKE_INSTRUCTION_LAYOUTS.Split;
    const data = encodeData(type, {
      lamports
    });
    return new TransactionInstruction({
      keys: [{
        pubkey: stakePubkey,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: splitStakePubkey,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: authorizedPubkey,
        isSigner: true,
        isWritable: false
      }],
      programId: this.programId,
      data
    });
  }

  /**
   * Generate a Transaction that splits Stake tokens into another stake account
   */
  static split(params,
  // Compute the cost of allocating the new stake account in lamports
  rentExemptReserve) {
    const transaction = new Transaction();
    transaction.add(SystemProgram.createAccount({
      fromPubkey: params.authorizedPubkey,
      newAccountPubkey: params.splitStakePubkey,
      lamports: rentExemptReserve,
      space: this.space,
      programId: this.programId
    }));
    return transaction.add(this.splitInstruction(params));
  }

  /**
   * Generate a Transaction that splits Stake tokens into another account
   * derived from a base public key and seed
   */
  static splitWithSeed(params,
  // If this stake account is new, compute the cost of allocating it in lamports
  rentExemptReserve) {
    const {
      stakePubkey,
      authorizedPubkey,
      splitStakePubkey,
      basePubkey,
      seed,
      lamports
    } = params;
    const transaction = new Transaction();
    transaction.add(SystemProgram.allocate({
      accountPubkey: splitStakePubkey,
      basePubkey,
      seed,
      space: this.space,
      programId: this.programId
    }));
    if (rentExemptReserve && rentExemptReserve > 0) {
      transaction.add(SystemProgram.transfer({
        fromPubkey: params.authorizedPubkey,
        toPubkey: splitStakePubkey,
        lamports: rentExemptReserve
      }));
    }
    return transaction.add(this.splitInstruction({
      stakePubkey,
      authorizedPubkey,
      splitStakePubkey,
      lamports
    }));
  }

  /**
   * Generate a Transaction that merges Stake accounts.
   */
  static merge(params) {
    const {
      stakePubkey,
      sourceStakePubKey,
      authorizedPubkey
    } = params;
    const type = STAKE_INSTRUCTION_LAYOUTS.Merge;
    const data = encodeData(type);
    return new Transaction().add({
      keys: [{
        pubkey: stakePubkey,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: sourceStakePubKey,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: SYSVAR_CLOCK_PUBKEY,
        isSigner: false,
        isWritable: false
      }, {
        pubkey: SYSVAR_STAKE_HISTORY_PUBKEY,
        isSigner: false,
        isWritable: false
      }, {
        pubkey: authorizedPubkey,
        isSigner: true,
        isWritable: false
      }],
      programId: this.programId,
      data
    });
  }

  /**
   * Generate a Transaction that withdraws deactivated Stake tokens.
   */
  static withdraw(params) {
    const {
      stakePubkey,
      authorizedPubkey,
      toPubkey,
      lamports,
      custodianPubkey
    } = params;
    const type = STAKE_INSTRUCTION_LAYOUTS.Withdraw;
    const data = encodeData(type, {
      lamports
    });
    const keys = [{
      pubkey: stakePubkey,
      isSigner: false,
      isWritable: true
    }, {
      pubkey: toPubkey,
      isSigner: false,
      isWritable: true
    }, {
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false
    }, {
      pubkey: SYSVAR_STAKE_HISTORY_PUBKEY,
      isSigner: false,
      isWritable: false
    }, {
      pubkey: authorizedPubkey,
      isSigner: true,
      isWritable: false
    }];
    if (custodianPubkey) {
      keys.push({
        pubkey: custodianPubkey,
        isSigner: true,
        isWritable: false
      });
    }
    return new Transaction().add({
      keys,
      programId: this.programId,
      data
    });
  }

  /**
   * Generate a Transaction that deactivates Stake tokens.
   */
  static deactivate(params) {
    const {
      stakePubkey,
      authorizedPubkey
    } = params;
    const type = STAKE_INSTRUCTION_LAYOUTS.Deactivate;
    const data = encodeData(type);
    return new Transaction().add({
      keys: [{
        pubkey: stakePubkey,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: SYSVAR_CLOCK_PUBKEY,
        isSigner: false,
        isWritable: false
      }, {
        pubkey: authorizedPubkey,
        isSigner: true,
        isWritable: false
      }],
      programId: this.programId,
      data
    });
  }
}
StakeProgram.programId = new PublicKey('Stake11111111111111111111111111111111111111');
/**
 * Max space of a Stake account
 *
 * This is generated from the solana-stake-program StakeState struct as
 * `StakeStateV2::size_of()`:
 * https://docs.rs/solana-stake-program/latest/solana_stake_program/stake_state/enum.StakeStateV2.html
 */
StakeProgram.space = 200;

/**
 * Vote account info
 */
class VoteInit {
  /** [0, 100] */

  constructor(nodePubkey, authorizedVoter, authorizedWithdrawer, commission) {
    this.nodePubkey = void 0;
    this.authorizedVoter = void 0;
    this.authorizedWithdrawer = void 0;
    this.commission = void 0;
    this.nodePubkey = nodePubkey;
    this.authorizedVoter = authorizedVoter;
    this.authorizedWithdrawer = authorizedWithdrawer;
    this.commission = commission;
  }
}

/**
 * Create vote account transaction params
 */

/**
 * InitializeAccount instruction params
 */

/**
 * Authorize instruction params
 */

/**
 * AuthorizeWithSeed instruction params
 */

/**
 * Withdraw from vote account transaction params
 */

/**
 * Update validator identity (node pubkey) vote account instruction params.
 */

/**
 * Vote Instruction class
 */
class VoteInstruction {
  /**
   * @internal
   */
  constructor() {}

  /**
   * Decode a vote instruction and retrieve the instruction type.
   */
  static decodeInstructionType(instruction) {
    this.checkProgramId(instruction.programId);
    const instructionTypeLayout = BufferLayout__namespace.u32('instruction');
    const typeIndex = instructionTypeLayout.decode(instruction.data);
    let type;
    for (const [ixType, layout] of Object.entries(VOTE_INSTRUCTION_LAYOUTS)) {
      if (layout.index == typeIndex) {
        type = ixType;
        break;
      }
    }
    if (!type) {
      throw new Error('Instruction type incorrect; not a VoteInstruction');
    }
    return type;
  }

  /**
   * Decode an initialize vote instruction and retrieve the instruction params.
   */
  static decodeInitializeAccount(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 4);
    const {
      voteInit
    } = decodeData$1(VOTE_INSTRUCTION_LAYOUTS.InitializeAccount, instruction.data);
    return {
      votePubkey: instruction.keys[0].pubkey,
      nodePubkey: instruction.keys[3].pubkey,
      voteInit: new VoteInit(new PublicKey(voteInit.nodePubkey), new PublicKey(voteInit.authorizedVoter), new PublicKey(voteInit.authorizedWithdrawer), voteInit.commission)
    };
  }

  /**
   * Decode an authorize instruction and retrieve the instruction params.
   */
  static decodeAuthorize(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 3);
    const {
      newAuthorized,
      voteAuthorizationType
    } = decodeData$1(VOTE_INSTRUCTION_LAYOUTS.Authorize, instruction.data);
    return {
      votePubkey: instruction.keys[0].pubkey,
      authorizedPubkey: instruction.keys[2].pubkey,
      newAuthorizedPubkey: new PublicKey(newAuthorized),
      voteAuthorizationType: {
        index: voteAuthorizationType
      }
    };
  }

  /**
   * Decode an authorize instruction and retrieve the instruction params.
   */
  static decodeAuthorizeWithSeed(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 3);
    const {
      voteAuthorizeWithSeedArgs: {
        currentAuthorityDerivedKeyOwnerPubkey,
        currentAuthorityDerivedKeySeed,
        newAuthorized,
        voteAuthorizationType
      }
    } = decodeData$1(VOTE_INSTRUCTION_LAYOUTS.AuthorizeWithSeed, instruction.data);
    return {
      currentAuthorityDerivedKeyBasePubkey: instruction.keys[2].pubkey,
      currentAuthorityDerivedKeyOwnerPubkey: new PublicKey(currentAuthorityDerivedKeyOwnerPubkey),
      currentAuthorityDerivedKeySeed: currentAuthorityDerivedKeySeed,
      newAuthorizedPubkey: new PublicKey(newAuthorized),
      voteAuthorizationType: {
        index: voteAuthorizationType
      },
      votePubkey: instruction.keys[0].pubkey
    };
  }

  /**
   * Decode a withdraw instruction and retrieve the instruction params.
   */
  static decodeWithdraw(instruction) {
    this.checkProgramId(instruction.programId);
    this.checkKeyLength(instruction.keys, 3);
    const {
      lamports
    } = decodeData$1(VOTE_INSTRUCTION_LAYOUTS.Withdraw, instruction.data);
    return {
      votePubkey: instruction.keys[0].pubkey,
      authorizedWithdrawerPubkey: instruction.keys[2].pubkey,
      lamports,
      toPubkey: instruction.keys[1].pubkey
    };
  }

  /**
   * @internal
   */
  static checkProgramId(programId) {
    if (!programId.equals(VoteProgram.programId)) {
      throw new Error('invalid instruction; programId is not VoteProgram');
    }
  }

  /**
   * @internal
   */
  static checkKeyLength(keys, expectedLength) {
    if (keys.length < expectedLength) {
      throw new Error(`invalid instruction; found ${keys.length} keys, expected at least ${expectedLength}`);
    }
  }
}

/**
 * An enumeration of valid VoteInstructionType's
 */

/** @internal */

const VOTE_INSTRUCTION_LAYOUTS = Object.freeze({
  InitializeAccount: {
    index: 0,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), voteInit()])
  },
  Authorize: {
    index: 1,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), publicKey('newAuthorized'), BufferLayout__namespace.u32('voteAuthorizationType')])
  },
  Withdraw: {
    index: 3,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), BufferLayout__namespace.ns64('lamports')])
  },
  UpdateValidatorIdentity: {
    index: 4,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction')])
  },
  AuthorizeWithSeed: {
    index: 10,
    layout: BufferLayout__namespace.struct([BufferLayout__namespace.u32('instruction'), voteAuthorizeWithSeedArgs()])
  }
});

/**
 * VoteAuthorize type
 */

/**
 * An enumeration of valid VoteAuthorization layouts.
 */
const VoteAuthorizationLayout = Object.freeze({
  Voter: {
    index: 0
  },
  Withdrawer: {
    index: 1
  }
});

/**
 * Factory class for transactions to interact with the Vote program
 */
class VoteProgram {
  /**
   * @internal
   */
  constructor() {}

  /**
   * Public key that identifies the Vote program
   */

  /**
   * Generate an Initialize instruction.
   */
  static initializeAccount(params) {
    const {
      votePubkey,
      nodePubkey,
      voteInit
    } = params;
    const type = VOTE_INSTRUCTION_LAYOUTS.InitializeAccount;
    const data = encodeData(type, {
      voteInit: {
        nodePubkey: toBuffer(voteInit.nodePubkey.toBuffer()),
        authorizedVoter: toBuffer(voteInit.authorizedVoter.toBuffer()),
        authorizedWithdrawer: toBuffer(voteInit.authorizedWithdrawer.toBuffer()),
        commission: voteInit.commission
      }
    });
    const instructionData = {
      keys: [{
        pubkey: votePubkey,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false
      }, {
        pubkey: SYSVAR_CLOCK_PUBKEY,
        isSigner: false,
        isWritable: false
      }, {
        pubkey: nodePubkey,
        isSigner: true,
        isWritable: false
      }],
      programId: this.programId,
      data
    };
    return new TransactionInstruction(instructionData);
  }

  /**
   * Generate a transaction that creates a new Vote account.
   */
  static createAccount(params) {
    const transaction = new Transaction();
    transaction.add(SystemProgram.createAccount({
      fromPubkey: params.fromPubkey,
      newAccountPubkey: params.votePubkey,
      lamports: params.lamports,
      space: this.space,
      programId: this.programId
    }));
    return transaction.add(this.initializeAccount({
      votePubkey: params.votePubkey,
      nodePubkey: params.voteInit.nodePubkey,
      voteInit: params.voteInit
    }));
  }

  /**
   * Generate a transaction that authorizes a new Voter or Withdrawer on the Vote account.
   */
  static authorize(params) {
    const {
      votePubkey,
      authorizedPubkey,
      newAuthorizedPubkey,
      voteAuthorizationType
    } = params;
    const type = VOTE_INSTRUCTION_LAYOUTS.Authorize;
    const data = encodeData(type, {
      newAuthorized: toBuffer(newAuthorizedPubkey.toBuffer()),
      voteAuthorizationType: voteAuthorizationType.index
    });
    const keys = [{
      pubkey: votePubkey,
      isSigner: false,
      isWritable: true
    }, {
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false
    }, {
      pubkey: authorizedPubkey,
      isSigner: true,
      isWritable: false
    }];
    return new Transaction().add({
      keys,
      programId: this.programId,
      data
    });
  }

  /**
   * Generate a transaction that authorizes a new Voter or Withdrawer on the Vote account
   * where the current Voter or Withdrawer authority is a derived key.
   */
  static authorizeWithSeed(params) {
    const {
      currentAuthorityDerivedKeyBasePubkey,
      currentAuthorityDerivedKeyOwnerPubkey,
      currentAuthorityDerivedKeySeed,
      newAuthorizedPubkey,
      voteAuthorizationType,
      votePubkey
    } = params;
    const type = VOTE_INSTRUCTION_LAYOUTS.AuthorizeWithSeed;
    const data = encodeData(type, {
      voteAuthorizeWithSeedArgs: {
        currentAuthorityDerivedKeyOwnerPubkey: toBuffer(currentAuthorityDerivedKeyOwnerPubkey.toBuffer()),
        currentAuthorityDerivedKeySeed: currentAuthorityDerivedKeySeed,
        newAuthorized: toBuffer(newAuthorizedPubkey.toBuffer()),
        voteAuthorizationType: voteAuthorizationType.index
      }
    });
    const keys = [{
      pubkey: votePubkey,
      isSigner: false,
      isWritable: true
    }, {
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false
    }, {
      pubkey: currentAuthorityDerivedKeyBasePubkey,
      isSigner: true,
      isWritable: false
    }];
    return new Transaction().add({
      keys,
      programId: this.programId,
      data
    });
  }

  /**
   * Generate a transaction to withdraw from a Vote account.
   */
  static withdraw(params) {
    const {
      votePubkey,
      authorizedWithdrawerPubkey,
      lamports,
      toPubkey
    } = params;
    const type = VOTE_INSTRUCTION_LAYOUTS.Withdraw;
    const data = encodeData(type, {
      lamports
    });
    const keys = [{
      pubkey: votePubkey,
      isSigner: false,
      isWritable: true
    }, {
      pubkey: toPubkey,
      isSigner: false,
      isWritable: true
    }, {
      pubkey: authorizedWithdrawerPubkey,
      isSigner: true,
      isWritable: false
    }];
    return new Transaction().add({
      keys,
      programId: this.programId,
      data
    });
  }

  /**
   * Generate a transaction to withdraw safely from a Vote account.
   *
   * This function was created as a safeguard for vote accounts running validators, `safeWithdraw`
   * checks that the withdraw amount will not exceed the specified balance while leaving enough left
   * to cover rent. If you wish to close the vote account by withdrawing the full amount, call the
   * `withdraw` method directly.
   */
  static safeWithdraw(params, currentVoteAccountBalance, rentExemptMinimum) {
    if (params.lamports > currentVoteAccountBalance - rentExemptMinimum) {
      throw new Error('Withdraw will leave vote account with insufficient funds.');
    }
    return VoteProgram.withdraw(params);
  }

  /**
   * Generate a transaction to update the validator identity (node pubkey) of a Vote account.
   */
  static updateValidatorIdentity(params) {
    const {
      votePubkey,
      authorizedWithdrawerPubkey,
      nodePubkey
    } = params;
    const type = VOTE_INSTRUCTION_LAYOUTS.UpdateValidatorIdentity;
    const data = encodeData(type);
    const keys = [{
      pubkey: votePubkey,
      isSigner: false,
      isWritable: true
    }, {
      pubkey: nodePubkey,
      isSigner: true,
      isWritable: false
    }, {
      pubkey: authorizedWithdrawerPubkey,
      isSigner: true,
      isWritable: false
    }];
    return new Transaction().add({
      keys,
      programId: this.programId,
      data
    });
  }
}
VoteProgram.programId = new PublicKey('Vote111111111111111111111111111111111111111');
/**
 * Max space of a Vote account
 *
 * This is generated from the solana-vote-program VoteState struct as
 * `VoteState::size_of()`:
 * https://docs.rs/solana-vote-program/1.9.5/solana_vote_program/vote_state/struct.VoteState.html#method.size_of
 *
 * KEEP IN SYNC WITH `VoteState::size_of()` in https://github.com/solana-labs/solana/blob/a474cb24b9238f5edcc982f65c0b37d4a1046f7e/sdk/program/src/vote/state/mod.rs#L340-L342
 */
VoteProgram.space = 3762;

const VALIDATOR_INFO_KEY = new PublicKey('Va1idator1nfo111111111111111111111111111111');

/**
 * @internal
 */

/**
 * Info used to identity validators.
 */

const InfoString = superstruct.type({
  name: superstruct.string(),
  website: superstruct.optional(superstruct.string()),
  details: superstruct.optional(superstruct.string()),
  iconUrl: superstruct.optional(superstruct.string()),
  keybaseUsername: superstruct.optional(superstruct.string())
});

/**
 * ValidatorInfo class
 */
class ValidatorInfo {
  /**
   * Construct a valid ValidatorInfo
   *
   * @param key validator public key
   * @param info validator information
   */
  constructor(key, info) {
    /**
     * validator public key
     */
    this.key = void 0;
    /**
     * validator information
     */
    this.info = void 0;
    this.key = key;
    this.info = info;
  }

  /**
   * Deserialize ValidatorInfo from the config account data. Exactly two config
   * keys are required in the data.
   *
   * @param buffer config account data
   * @return null if info was not found
   */
  static fromConfigData(buffer$1) {
    let byteArray = [...buffer$1];
    const configKeyCount = decodeLength(byteArray);
    if (configKeyCount !== 2) return null;
    const configKeys = [];
    for (let i = 0; i < 2; i++) {
      const publicKey = new PublicKey(guardedSplice(byteArray, 0, PUBLIC_KEY_LENGTH));
      const isSigner = guardedShift(byteArray) === 1;
      configKeys.push({
        publicKey,
        isSigner
      });
    }
    if (configKeys[0].publicKey.equals(VALIDATOR_INFO_KEY)) {
      if (configKeys[1].isSigner) {
        const rawInfo = rustString().decode(buffer.Buffer.from(byteArray));
        const info = JSON.parse(rawInfo);
        superstruct.assert(info, InfoString);
        return new ValidatorInfo(configKeys[1].publicKey, info);
      }
    }
    return null;
  }
}

const VOTE_PROGRAM_ID = new PublicKey('Vote111111111111111111111111111111111111111');

/**
 * History of how many credits earned by the end of each epoch
 */

/**
 * See https://github.com/solana-labs/solana/blob/8a12ed029cfa38d4a45400916c2463fb82bbec8c/programs/vote_api/src/vote_state.rs#L68-L88
 *
 * @internal
 */
const VoteAccountLayout = BufferLayout__namespace.struct([publicKey('nodePubkey'), publicKey('authorizedWithdrawer'), BufferLayout__namespace.u8('commission'), BufferLayout__namespace.nu64(),
// votes.length
BufferLayout__namespace.seq(BufferLayout__namespace.struct([BufferLayout__namespace.nu64('slot'), BufferLayout__namespace.u32('confirmationCount')]), BufferLayout__namespace.offset(BufferLayout__namespace.u32(), -8), 'votes'), BufferLayout__namespace.u8('rootSlotValid'), BufferLayout__namespace.nu64('rootSlot'), BufferLayout__namespace.nu64(),
// authorizedVoters.length
BufferLayout__namespace.seq(BufferLayout__namespace.struct([BufferLayout__namespace.nu64('epoch'), publicKey('authorizedVoter')]), BufferLayout__namespace.offset(BufferLayout__namespace.u32(), -8), 'authorizedVoters'), BufferLayout__namespace.struct([BufferLayout__namespace.seq(BufferLayout__namespace.struct([publicKey('authorizedPubkey'), BufferLayout__namespace.nu64('epochOfLastAuthorizedSwitch'), BufferLayout__namespace.nu64('targetEpoch')]), 32, 'buf'), BufferLayout__namespace.nu64('idx'), BufferLayout__namespace.u8('isEmpty')], 'priorVoters'), BufferLayout__namespace.nu64(),
// epochCredits.length
BufferLayout__namespace.seq(BufferLayout__namespace.struct([BufferLayout__namespace.nu64('epoch'), BufferLayout__namespace.nu64('credits'), BufferLayout__namespace.nu64('prevCredits')]), BufferLayout__namespace.offset(BufferLayout__namespace.u32(), -8), 'epochCredits'), BufferLayout__namespace.struct([BufferLayout__namespace.nu64('slot'), BufferLayout__namespace.nu64('timestamp')], 'lastTimestamp')]);
/**
 * VoteAccount class
 */
class VoteAccount {
  /**
   * @internal
   */
  constructor(args) {
    this.nodePubkey = void 0;
    this.authorizedWithdrawer = void 0;
    this.commission = void 0;
    this.rootSlot = void 0;
    this.votes = void 0;
    this.authorizedVoters = void 0;
    this.priorVoters = void 0;
    this.epochCredits = void 0;
    this.lastTimestamp = void 0;
    this.nodePubkey = args.nodePubkey;
    this.authorizedWithdrawer = args.authorizedWithdrawer;
    this.commission = args.commission;
    this.rootSlot = args.rootSlot;
    this.votes = args.votes;
    this.authorizedVoters = args.authorizedVoters;
    this.priorVoters = args.priorVoters;
    this.epochCredits = args.epochCredits;
    this.lastTimestamp = args.lastTimestamp;
  }

  /**
   * Deserialize VoteAccount from the account data.
   *
   * @param buffer account data
   * @return VoteAccount
   */
  static fromAccountData(buffer) {
    const versionOffset = 4;
    const va = VoteAccountLayout.decode(toBuffer(buffer), versionOffset);
    let rootSlot = va.rootSlot;
    if (!va.rootSlotValid) {
      rootSlot = null;
    }
    return new VoteAccount({
      nodePubkey: new PublicKey(va.nodePubkey),
      authorizedWithdrawer: new PublicKey(va.authorizedWithdrawer),
      commission: va.commission,
      votes: va.votes,
      rootSlot,
      authorizedVoters: va.authorizedVoters.map(parseAuthorizedVoter),
      priorVoters: getPriorVoters(va.priorVoters),
      epochCredits: va.epochCredits,
      lastTimestamp: va.lastTimestamp
    });
  }
}
function parseAuthorizedVoter({
  authorizedVoter,
  epoch
}) {
  return {
    epoch,
    authorizedVoter: new PublicKey(authorizedVoter)
  };
}
function parsePriorVoters({
  authorizedPubkey,
  epochOfLastAuthorizedSwitch,
  targetEpoch
}) {
  return {
    authorizedPubkey: new PublicKey(authorizedPubkey),
    epochOfLastAuthorizedSwitch,
    targetEpoch
  };
}
function getPriorVoters({
  buf,
  idx,
  isEmpty
}) {
  if (isEmpty) {
    return [];
  }
  return [...buf.slice(idx + 1).map(parsePriorVoters), ...buf.slice(0, idx).map(parsePriorVoters)];
}

const endpoint = {
  http: {
    devnet: 'http://api.devnet.solana.com',
    testnet: 'http://api.testnet.solana.com',
    'mainnet-beta': 'http://api.mainnet-beta.solana.com/'
  },
  https: {
    devnet: 'https://api.devnet.solana.com',
    testnet: 'https://api.testnet.solana.com',
    'mainnet-beta': 'https://api.mainnet-beta.solana.com/'
  }
};
/**
 * Retrieves the RPC API URL for the specified cluster
 * @param {Cluster} [cluster="devnet"] - The cluster name of the RPC API URL to use. Possible options: 'devnet' | 'testnet' | 'mainnet-beta'
 * @param {boolean} [tls="http"] - Use TLS when connecting to cluster.
 *
 * @returns {string} URL string of the RPC endpoint
 */
function clusterApiUrl(cluster, tls) {
  const key = tls === false ? 'http' : 'https';
  if (!cluster) {
    return endpoint[key]['devnet'];
  }
  const url = endpoint[key][cluster];
  if (!url) {
    throw new Error(`Unknown ${key} cluster: ${cluster}`);
  }
  return url;
}

/**
 * Send and confirm a raw transaction
 *
 * If `commitment` option is not specified, defaults to 'max' commitment.
 *
 * @param {Connection} connection
 * @param {Buffer} rawTransaction
 * @param {TransactionConfirmationStrategy} confirmationStrategy
 * @param {ConfirmOptions} [options]
 * @returns {Promise<TransactionSignature>}
 */

/**
 * @deprecated Calling `sendAndConfirmRawTransaction()` without a `confirmationStrategy`
 * is no longer supported and will be removed in a future version.
 */
// eslint-disable-next-line no-redeclare

// eslint-disable-next-line no-redeclare
async function sendAndConfirmRawTransaction(connection, rawTransaction, confirmationStrategyOrConfirmOptions, maybeConfirmOptions) {
  let confirmationStrategy;
  let options;
  if (confirmationStrategyOrConfirmOptions && Object.prototype.hasOwnProperty.call(confirmationStrategyOrConfirmOptions, 'lastValidBlockHeight')) {
    confirmationStrategy = confirmationStrategyOrConfirmOptions;
    options = maybeConfirmOptions;
  } else if (confirmationStrategyOrConfirmOptions && Object.prototype.hasOwnProperty.call(confirmationStrategyOrConfirmOptions, 'nonceValue')) {
    confirmationStrategy = confirmationStrategyOrConfirmOptions;
    options = maybeConfirmOptions;
  } else {
    options = confirmationStrategyOrConfirmOptions;
  }
  const sendOptions = options && {
    skipPreflight: options.skipPreflight,
    preflightCommitment: options.preflightCommitment || options.commitment,
    minContextSlot: options.minContextSlot
  };
  const signature = await connection.sendRawTransaction(rawTransaction, sendOptions);
  const commitment = options && options.commitment;
  const confirmationPromise = confirmationStrategy ? connection.confirmTransaction(confirmationStrategy, commitment) : connection.confirmTransaction(signature, commitment);
  const status = (await confirmationPromise).value;
  if (status.err) {
    if (signature != null) {
      throw new SendTransactionError({
        action: sendOptions?.skipPreflight ? 'send' : 'simulate',
        signature: signature,
        transactionMessage: `Status: (${JSON.stringify(status)})`
      });
    }
    throw new Error(`Raw transaction ${signature} failed (${JSON.stringify(status)})`);
  }
  return signature;
}

/**
 * There are 1-billion lamports in one SOL
 */
const LAMPORTS_PER_SOL = 1000000000;

exports.Account = Account;
exports.AddressLookupTableAccount = AddressLookupTableAccount;
exports.AddressLookupTableInstruction = AddressLookupTableInstruction;
exports.AddressLookupTableProgram = AddressLookupTableProgram;
exports.Authorized = Authorized;
exports.BLOCKHASH_CACHE_TIMEOUT_MS = BLOCKHASH_CACHE_TIMEOUT_MS;
exports.BPF_LOADER_DEPRECATED_PROGRAM_ID = BPF_LOADER_DEPRECATED_PROGRAM_ID;
exports.BPF_LOADER_PROGRAM_ID = BPF_LOADER_PROGRAM_ID;
exports.BpfLoader = BpfLoader;
exports.COMPUTE_BUDGET_INSTRUCTION_LAYOUTS = COMPUTE_BUDGET_INSTRUCTION_LAYOUTS;
exports.ComputeBudgetInstruction = ComputeBudgetInstruction;
exports.ComputeBudgetProgram = ComputeBudgetProgram;
exports.Connection = Connection;
exports.Ed25519Program = Ed25519Program;
exports.Enum = Enum;
exports.EpochSchedule = EpochSchedule;
exports.FeeCalculatorLayout = FeeCalculatorLayout;
exports.Keypair = Keypair;
exports.LAMPORTS_PER_SOL = LAMPORTS_PER_SOL;
exports.LOOKUP_TABLE_INSTRUCTION_LAYOUTS = LOOKUP_TABLE_INSTRUCTION_LAYOUTS;
exports.Loader = Loader;
exports.Lockup = Lockup;
exports.MAX_SEED_LENGTH = MAX_SEED_LENGTH;
exports.Message = Message;
exports.MessageAccountKeys = MessageAccountKeys;
exports.MessageV0 = MessageV0;
exports.NONCE_ACCOUNT_LENGTH = NONCE_ACCOUNT_LENGTH;
exports.NonceAccount = NonceAccount;
exports.PACKET_DATA_SIZE = PACKET_DATA_SIZE;
exports.PUBLIC_KEY_LENGTH = PUBLIC_KEY_LENGTH;
exports.PublicKey = PublicKey;
exports.SIGNATURE_LENGTH_IN_BYTES = SIGNATURE_LENGTH_IN_BYTES;
exports.SOLANA_SCHEMA = SOLANA_SCHEMA;
exports.STAKE_CONFIG_ID = STAKE_CONFIG_ID;
exports.STAKE_INSTRUCTION_LAYOUTS = STAKE_INSTRUCTION_LAYOUTS;
exports.SYSTEM_INSTRUCTION_LAYOUTS = SYSTEM_INSTRUCTION_LAYOUTS;
exports.SYSVAR_CLOCK_PUBKEY = SYSVAR_CLOCK_PUBKEY;
exports.SYSVAR_EPOCH_SCHEDULE_PUBKEY = SYSVAR_EPOCH_SCHEDULE_PUBKEY;
exports.SYSVAR_INSTRUCTIONS_PUBKEY = SYSVAR_INSTRUCTIONS_PUBKEY;
exports.SYSVAR_RECENT_BLOCKHASHES_PUBKEY = SYSVAR_RECENT_BLOCKHASHES_PUBKEY;
exports.SYSVAR_RENT_PUBKEY = SYSVAR_RENT_PUBKEY;
exports.SYSVAR_REWARDS_PUBKEY = SYSVAR_REWARDS_PUBKEY;
exports.SYSVAR_SLOT_HASHES_PUBKEY = SYSVAR_SLOT_HASHES_PUBKEY;
exports.SYSVAR_SLOT_HISTORY_PUBKEY = SYSVAR_SLOT_HISTORY_PUBKEY;
exports.SYSVAR_STAKE_HISTORY_PUBKEY = SYSVAR_STAKE_HISTORY_PUBKEY;
exports.Secp256k1Program = Secp256k1Program;
exports.SendTransactionError = SendTransactionError;
exports.SolanaJSONRPCError = SolanaJSONRPCError;
exports.SolanaJSONRPCErrorCode = SolanaJSONRPCErrorCode;
exports.StakeAuthorizationLayout = StakeAuthorizationLayout;
exports.StakeInstruction = StakeInstruction;
exports.StakeProgram = StakeProgram;
exports.Struct = Struct;
exports.SystemInstruction = SystemInstruction;
exports.SystemProgram = SystemProgram;
exports.Transaction = Transaction;
exports.TransactionExpiredBlockheightExceededError = TransactionExpiredBlockheightExceededError;
exports.TransactionExpiredNonceInvalidError = TransactionExpiredNonceInvalidError;
exports.TransactionExpiredTimeoutError = TransactionExpiredTimeoutError;
exports.TransactionInstruction = TransactionInstruction;
exports.TransactionMessage = TransactionMessage;
exports.TransactionStatus = TransactionStatus;
exports.VALIDATOR_INFO_KEY = VALIDATOR_INFO_KEY;
exports.VERSION_PREFIX_MASK = VERSION_PREFIX_MASK;
exports.VOTE_PROGRAM_ID = VOTE_PROGRAM_ID;
exports.ValidatorInfo = ValidatorInfo;
exports.VersionedMessage = VersionedMessage;
exports.VersionedTransaction = VersionedTransaction;
exports.VoteAccount = VoteAccount;
exports.VoteAuthorizationLayout = VoteAuthorizationLayout;
exports.VoteInit = VoteInit;
exports.VoteInstruction = VoteInstruction;
exports.VoteProgram = VoteProgram;
exports.clusterApiUrl = clusterApiUrl;
exports.sendAndConfirmRawTransaction = sendAndConfirmRawTransaction;
exports.sendAndConfirmTransaction = sendAndConfirmTransaction;
//# sourceMappingURL=index.native.js.map
