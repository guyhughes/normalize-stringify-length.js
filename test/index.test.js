"use strict";

/* eslint-env mocha */
const mod = require("../index"),
  normalizedJSONStringify = mod.default,
  closingObjectToken = mod.closingObjectToken,
  expect = require("chai").expect;

describe("normalizedJSONStringify", function() {
  it("errors without maxLength option set", function() {
    const obj = {};
    const fn = () => normalizedJSONStringify(obj);
    expect(fn).to.throw();
  });
  it("errors with maxLength option set below 1", function() {
    const obj = {};
    const fn = () => normalizedJSONStringify(obj, { maxLength: 0 });
    expect(fn).to.throw();
  });
  it("throws on too many properties", function() {
    const obj = {};
    for (let i = 0; i < 6; ++i) {
      obj[i] = "" + i;
    }
    const fn = () => normalizedJSONStringify(obj, {
      maxProperties: 5,
      maxLength: 10000
    });
    expect(fn).to.throw(/not exceed/);
  });
  it("maxProperties is optional", function() {
    const obj = {};
    for (let i = 0; i < 6; ++i) {
      obj[i] = "" + i;
    }
    const ret = normalizedJSONStringify(obj, { maxLength: 10000 });
    expect(ret).to.equal(JSON.stringify(obj));
    const fn = () => JSON.parse(ret);
    expect(fn).not.throw;
  });

  it("can parse and truncate an object with one long string property", function() {
    const obj = { one: "hello world" };
    const expected = '{"one":"hello"}';
    const ret = normalizedJSONStringify(obj, {
      maxProperties: 1,
      maxLength: expected.length
    });
    expect(ret).to.equal(expected);
    expect(ret.length).to.equal(expected.length);
    const fn = () => JSON.parse(ret);
    expect(fn).not.throw;
  });
  it("truncates an object with one long string property", function() {
    const obj = { one: "hello world" };
    const expected = '{"one":"hello"}';
    const ret = normalizedJSONStringify(obj, {
      maxProperties: 1,
      maxLength: expected.length
    });
    expect(ret).to.equal(expected);
    expect(ret.length).to.equal(expected.length);
    const fn = () => JSON.parse(ret);
    expect(fn).not.throw;
  });

  it("truncates an object with two long string properties", function() {
    const obj = {
      one: "hello world",
      two: "hello mommy"
    };
    const expected = '{"one":"hello","two":"hello"}'; // the first key-value pair has one less data char because of the
    const ret = normalizedJSONStringify(obj, {
      maxProperties: 2,
      maxLength: expected.length
    });
    expect(ret).to.equal(expected);
    expect(ret.length).to.equal(expected.length);
    const fn = () => JSON.parse(ret);
    expect(fn).not.throw;
  });
  it("drops a property completely if its key exceeds normalized expected length", function() {
    const obj = {
      one: "hello world",
      two: "hello mommy",
      tri: "hello dad",
      fourssssssssssssssssssssssssss: "hello son"
    };
    const expected = '{"one":"hello","two":"hello","tri":"hello"}';
    const ret = normalizedJSONStringify(obj, {
      maxProperties: 4,
      maxLength: 15 * 4
    });
    expect(ret).to.equal(expected);
    expect(ret.length).to.equal(expected.length);
    const fn = () => JSON.parse(ret);
    expect(fn).not.throw;
  });
  it("handles four long string properties", function() {
    const obj = {
      one: "hello world",
      two: "hello mommy",
      tri: "hello dad",
      far: "hello son"
    };
    const expected = '{"one":"hello","two":"hello","tri":"hello","far":"hello"}';
    const ret = normalizedJSONStringify(obj, {
      maxProperties: 4,
      maxLength: expected.length
    });
    expect(ret).to.equal(expected);
    expect(ret.length).to.equal(expected.length);
    const fn = () => JSON.parse(ret);
    expect(fn).not.throw;
  });
  it("handles nested objects with one property, stripping over length nested properties", function() {
    const obj = { one: "hello world", two: "hello mommy", tri: "hello dad", far: { hi: "what is your life" } };
    const expected = '{"one":"hello","two":"hello","tri":"hello","far":{}}';
    const ret = normalizedJSONStringify(obj, {
      maxProperties: 4,
      maxLength: 60
    });
    expect(ret).to.equal(expected);
    expect(ret.length).to.equal(expected.length);
    const fn = () => JSON.parse(ret);
    expect(fn).not.throw;
  });
  it("handles nested objects with one property", function() {
    const val = "hello world";
    const obj = { one: val, two: val, tri: { hi: val }, far: val };
    const expected = JSON.stringify(obj);
    const ret = normalizedJSONStringify(obj, {
      maxProperties: 4,
      maxLength: expected.length
    });
    expect(ret).to.equal(expected);
    expect(ret.length).to.equal(expected.length);
    const fn = () => JSON.parse(ret);
    expect(fn).not.throw;
  });
  it("handles nested objects with multiple properties", function() {
    const val = "hello world";
    const obj = { one: val, two: val, tri: { hi: val, bye: val, sup: val }, far: val };
    const expected = JSON.stringify(obj);
    const ret = normalizedJSONStringify(obj, {
      maxProperties: 4,
      maxLength: expected.length
    });
    expect(ret).to.equal(expected);
    expect(ret.length).to.equal(expected.length);
    const fn = () => JSON.parse(ret);
    expect(fn).not.throw;
  });
  it("handles mid-string quotes", function() {
    const obj = {
      son: "sup? momz, how u bin?",
      beyonce: 'what you mean "sup?"?!'
    };
    const expected = JSON.stringify(obj);
    const ret = normalizedJSONStringify(obj, {
      maxProperties: 4,
      maxLength: expected.length
    });
    expect(ret).to.equal(expected);
    expect(ret.length).to.equal(expected.length);
    const fn = () => JSON.parse(ret);
    expect(fn).not.throw;
  });
  it("can truncate despite mid-string quotes", function() {
    const obj = {
      son: "sup? momz, how, u bin?",
      beyonce: 'what, you, mean ",sup?",?!',
      jayz: "yo, be nice to mah son, his name is Sir, yo.",
      sir: 'i"m not stewie griffin", i know what you",re saying and when i use violence it"s real, fam'
    };
    const expected = '{"son":"sup? momz","beyonce":"what,","jayz":"yo, be n","sir":"i\\"m not "}';
    const ret = normalizedJSONStringify(obj, { maxProperties: 4, maxLength: 19 * 4 });
    expect(ret).to.equal(expected);
    const fn = () => JSON.parse(ret);
    expect(fn).not.throw;
  });
  it("handles pre-value parts of exactly valueEnd - strlen(EMPTY_VALUE) + 2", function() {
    const obj = { key: "value" };
    const expected = '{"key":"v"}';
    const ret = normalizedJSONStringify(obj, { maxProperties: 1, maxLength: 11 });
    expect(ret).to.equal(expected);
    const fn = () => JSON.parse(ret);
    expect(fn).not.throw;
  });
  it("handles pre-value parts of exactly valueEnd - strlen(EMPTY_VALUE) + 1", function() {
    const obj = { key: "value" };
    const expected = '{"key":""}';
    const ret = normalizedJSONStringify(obj, { maxProperties: 1, maxLength: 10 });
    expect(ret).to.equal(expected);
    const fn = () => JSON.parse(ret);
    expect(fn).not.throw;
  });
  it("handles pre-value parts of exactly valueEnd - strlen(EMPTY_VALUE)", function() {
    const obj = { key: "value" };
    const expected = "{}";
    const ret = normalizedJSONStringify(obj, { maxProperties: 1, maxLength: 9 });
    expect(ret).to.equal(expected);
    const fn = () => JSON.parse(ret);
    expect(fn).not.throw;
  });
  it("handles pre-value parts of exactly valueEnd - strlen(EMPTY_VALUE) - 1", function() {
    const obj = { key: "value" };
    const expected = "{}";
    const ret = normalizedJSONStringify(obj, { maxProperties: 1, maxLength: 9 });
    expect(ret).to.equal(expected);
    const fn = () => JSON.parse(ret);
    expect(fn).not.throw;
  });
  it("works with a maxLength of 2", function() {
    const obj = { key: "value" };
    const expected = "{}";
    const ret = normalizedJSONStringify(obj, { maxProperties: 1, maxLength: 2 });
    expect(ret).to.equal(expected);
    const fn = () => JSON.parse(ret);
    expect(fn).not.throw;
  });
  it("handles non-string properties", function() {
    const obj = { key: 123, yek: "value" };
    const expected = '{"key":123,"yek":"v"}';
    const ret = normalizedJSONStringify(obj, { maxProperties: 2, maxLength: expected.length });
    expect(ret).to.equal(expected);
    const fn = () => JSON.parse(ret);
    expect(fn).not.throw;
  });
  it("handles large quantities of non-string properties", function() {
    const obj = { key: 123456, yek: "value", abc: 456789, def: 9876, ghi: "hello", jkl: "whatassadasd", mno: 3456 };
    const expected = '{"key":123,"yek":"v","abc":456,"def":987,"ghi":"h","jkl":"w","mno":345}';
    const ret = normalizedJSONStringify(obj, { maxLength: expected.length });
    expect(ret).to.equal(expected);
    const fn = () => JSON.parse(ret);
    expect(fn).not.throw;
  });
});

describe("closingObjectToken", function() {
  it("throws on invalid char", function() {
    const fn = () => closingObjectToken("(");
    expect(fn).throw;
  });
  it("`[` => `]`", function() {
    expect(closingObjectToken("[")).equal("]");
  });
  it("`{` => `}`", function() {
    expect(closingObjectToken("{")).equal("}");
  });
});
