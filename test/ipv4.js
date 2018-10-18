/* global describe */
/* global it */
/* eslint-disable no-unused-expressions */
/* eslint-disable prefer-arrow-callback */

const process = require('process');

process.env.DEBUG = true;

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const { expect } = chai;

const { IPv4 } = require('../index.js');

describe('Test IPv4', function testIPv4() {
  it('Test CIDR parser 1', () => {
    const addr = new IPv4('192.168.1.20/24');
    expect(addr.address).to.equal(0xc0a80114);
    expect(addr.netmask).to.equal(0xffffff00);
  });

  it('Test CIDR parser 2', () => {
    const addr = new IPv4('192.168.1.20/255.255.255.0');
    expect(addr.address).to.equal(0xc0a80114);
    expect(addr.netmask).to.equal(0xffffff00);
  });

  it('Test CIDR parser 3', () => {
    const addr = new IPv4('192.168.1.20');
    expect(addr.address).to.equal(0xc0a80114);
    expect(addr.netmask).to.equal(0xffffffff);
  });

  it('Test broadcast', () => {
    const addr = new IPv4('192.168.1.20/255.255.255.0');
    expect(addr.broadcast).to.equal(0xc0a801ff);
  });

  it('Test network', () => {
    const addr = new IPv4('192.168.1.20/255.255.255.0');
    expect(addr.network).to.equal(0xc0a80100);
  });

  it('Test isInSubnet method', () => {
    const addr = new IPv4('192.168.1.20/255.255.255.0');
    const r1 = addr.isInSubnet('192.168.1.254');
    const r2 = addr.isInSubnet('192.168.1.1');
    const r3 = addr.isInSubnet('192.168.1.100');
    const r4 = addr.isInSubnet('192.168.2.50');
    expect(r1).to.be.true;
    expect(r2).to.be.true;
    expect(r3).to.be.true;
    expect(r4).to.be.false;
  });

  it('Test to string method', () => {
    const addr = new IPv4('192.168.1.20/255.255.255.0');
    expect(`${addr}`).to.equal('192.168.1.20/255.255.255.0');
    expect(addr.toString('netprefix')).to.equal('192.168.1.20/24');
    expect(addr.toString(false)).to.equal('192.168.1.20');
  });
});
