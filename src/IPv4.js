/* eslint-disable no-bitwise */
const _ = require('underscore');

const ADDRESS = 0x0;
const NETMASK = 0xffffffff;

const privateData = new WeakMap();
function pd(obj) {
  return privateData.get(obj);
}

function toNumber(num) {
  const snum = `${num}`;
  let radix = 10;
  if (snum.indexOf('0x') === 0) radix = 16;
  if (snum.indexOf('0') === 0 && snum.length > 1) radix = 8;
  const intval = parseInt(num, radix);
  return intval;
}

function fromUBytes(...bytes) {
  let num = 0;
  for (let n = 0; n < bytes.length; n += 1) {
    const b = toNumber(bytes[n]);
    num |= ((b & 0xff) << (8 * n)) >>> 0;
  }
  num >>>= 0;
  return num;
}

function toUBytes(intval, nbytes = 4) {
  const bytes = [];
  for (let n = 0; n < nbytes; n += 1) {
    const b = (intval >>> (8 * n)) & 0xff;
    bytes.push(b);
  }
  return bytes;
}

class IPv4 {
  constructor(cidr) {
    privateData.set(this, {
      address: ADDRESS,
      netmask: NETMASK,
      netprefix: 32
    });

    if (cidr) {
      this.address = cidr;
    }
  }

  isInSubnet(addr) {
    const addr4 = addr instanceof IPv4 ? addr : new IPv4(addr);
    const [min, max] = this.getNetRange();
    return addr4.address >= min && addr4.address <= max;
  }

  getNetRange() {
    const { network, broadcast } = this;
    let min = null;
    let max = null;
    if (network && broadcast) {
      min = network + 1;
      max = broadcast - 1;
    }
    return [min, max];
  }

  toString(type = 'netmask') {
    const { saddress, snetmask, netprefix } = this;
    if (type === 'netmask') {
      return `${saddress}/${snetmask}`;
    }
    if (type === 'netprefix') {
      return `${saddress}/${netprefix}`;
    }
    return saddress;
  }

  set address(addr) {
    let address = null;
    let netmask = null;
    const { netprefix: prevMask } = this;
    if (_.isNumber(addr)) {
      address = toNumber(addr) & NETMASK;
    } else {
      const re = /(\d+)\.(\d+)\.(\d+)\.(\d+)(\/(\S*))?/im;
      const saddr = `${addr}`;
      const match = saddr.match(re);
      if (match) {
        const [, p1, p2, p3, p4, , newMask] = match;
        address = fromUBytes(p4, p3, p2, p1);
        _.extend(pd(this), { address });
        if (newMask) {
          netmask = newMask;
        }
      }
    }

    let wrongAddress = false;
    if (_.isNull(address)) {
      wrongAddress = true;
      address = ADDRESS;
    }
    _.extend(pd(this), { address });
    this.netmask = netmask || prevMask || 32;
    if (wrongAddress) {
      throw new TypeError(`Wrong IP address ${addr}`);
    }
  }

  set netmask(m) {
    let netmask = null;
    if (`${m}`.indexOf('.') < 0 && !Number.isNaN(m)) {
      const nbit = toNumber(m);
      if (nbit >= 0 && nbit <= 32) {
        netmask = (NETMASK << (32 - nbit)) >>> 0;
      }
    } else {
      const re = /(\d+)\.(\d+)\.(\d+)\.(\d+)/im;
      const sm = `${m}`;
      const match = sm.match(re);
      if (match) {
        const [, p1, p2, p3, p4] = match;
        netmask = fromUBytes(p4, p3, p2, p1);
      }
    }

    let wrongMask = false;
    if (_.isNull(netmask)) {
      wrongMask = true;
      netmask = NETMASK;
    }
    let netprefix;
    for (netprefix = 32; netprefix >= 0; netprefix -= 1) {
      if ((netmask >>> (32 - netprefix)) & 0x1) {
        break;
      }
    }
    _.extend(pd(this), { netmask, netprefix });
    if (wrongMask) {
      throw new TypeError(`Wrong netmask ${m}`);
    }
  }

  get address() {
    const { address } = pd(this);
    return address;
  }

  get saddress() {
    const { address } = this;
    return toUBytes(address)
      .reverse()
      .join('.');
  }

  get netmask() {
    const { netmask } = pd(this);
    return netmask;
  }

  get snetmask() {
    const { netmask } = this;
    return toUBytes(netmask)
      .reverse()
      .join('.');
  }

  get netprefix() {
    const { netprefix } = pd(this);
    return netprefix;
  }

  get network() {
    const { address, netmask } = this;
    const network = !_.isNull(address) && !_.isNull(netmask) ? (address & netmask) >>> 0 : null; // eslint-disable-line
    return network;
  }

  get snetwork() {
    const { network } = this;
    return toUBytes(network)
      .reverse()
      .join('.');
  }

  get broadcast() {
    const { netmask, network } = this;
    const broadcast = !_.isNull(netmask) && !_.isNull(network) ? (network | ~netmask) >>> 0 : null;
    return broadcast;
  }

  get sbroadcast() {
    const { broadcast } = this;
    return toUBytes(broadcast)
      .reverse()
      .join('.');
  }
}

module.exports = IPv4;
