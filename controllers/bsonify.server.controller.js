/* eslint-disable no-underscore-dangle */
const mongodb = require('mongodb');

// JSHint warning suppression
// eslint-disable-next-line
const escapable = /[\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
let gap;
let indent;
const meta = { // table of character substitutions
  '\b': '\\b',
  '\t': '\\t',
  '\n': '\\n',
  '\f': '\\f',
  '\r': '\\r',
  '"': '\\"',
  '\\': '\\\\',
};
let rep;

function quote(string) {
  escapable.lastIndex = 0;
  return escapable.test(string) ? `"${string.replace(escapable, (a) => {
    const c = meta[a];
    return typeof c === 'string'
      ? c
      : `\\u${(`0000${a.charCodeAt(0).toString(16)}`).slice(-4)}`;
  })}"` : `"${string}"`;
}

function str(key, holder) {
  let i; // The loop counter.
  let k; // The member key.
  let v; // The member value.
  let length;
  const mind = gap;
  let partial;
  let value = holder[key];

  if (value instanceof mongodb.ObjectID) {
    return `ObjectId("${value}")`;
  } if (value instanceof mongodb.Timestamp) {
    return `Timestamp(${value.high_}, ${value.low_})`;
  } if (value instanceof Date) {
    return `ISODate("${value.toJSON()}")`;
  } if (value instanceof mongodb.DBRef) {
    if (value.db === '') {
      return `DBRef("${value.namespace}", "${value.oid}")`;
    }
    return `DBRef("${value.namespace}", "${value.oid}", "${value.db}")`;
  } if (value instanceof mongodb.Code) {
    return `Code("${value.code}")`;
  } if (value instanceof mongodb.MinKey) {
    return 'MinKey()';
  } if (value instanceof mongodb.MaxKey) {
    return 'MaxKey()';
  } if (value instanceof mongodb.Symbol) {
    return `Symbol("${value}")`;
  }

  if (value && typeof value === 'object' && typeof value.toJSON === 'function') {
    value = value.toJSON(key);
  }

  if (typeof rep === 'function') {
    value = rep.call(holder, key, value);
  }

  switch (typeof value) {
    case 'string':
      return quote(value);

    case 'number':
      return Number.isFinite(value) ? String(value) : 'null';

    case 'boolean':
    case 'null':
      return String(value);
    case 'object': {
      if (!value) {
        return 'null';
      }
      gap += indent;
      partial = [];
      if (Object.prototype.toString.apply(value) === '[object Array]') {
        length = value.length;
        for (i = 0; i < length; i += 1) {
          partial[i] = str(i, value) || 'null';
        }

        if (partial.length === 0) {
          v = '[]';
        } else if (gap) {
          v = `[\n${gap}${partial.join(`,\n${gap}`)}\n${mind}]`;
        } else {
          v = `[${partial.join(',')}]`;
        }
        gap = mind;
        return v;
      }
      if (rep && typeof rep === 'object') {
        length = rep.length;
        for (i = 0; i < length; i += 1) {
          if (typeof rep[i] === 'string') {
            k = rep[i];
            v = str(k, value);
            if (v) {
              partial.push(quote(k) + (gap ? ': ' : ':') + v);
            }
          }
        }
      } else {
        Object.keys(value).forEach((kk) => {
          if (Object.prototype.hasOwnProperty.call(value, kk)) {
            v = str(kk, value);
            if (v) {
              partial.push(quote(kk) + (gap ? ': ' : ':') + v);
            }
          }
        });
      }

      if (partial.length === 0) {
        v = '{}';
      } else if (gap) {
        v = `{\n${gap}${partial.join(`,\n${gap}`)}\n${mind}}`;
      } else {
        v = `{${partial.join(',')}}`;
      }
      gap = mind;
      return v;
    }
    default:
      return false;
  }
}

exports.stringify = function stringify(value, replacer, space) {
  let i;
  gap = '';
  indent = '';
  if (typeof space === 'number') {
    for (i = 0; i < space; i += 1) {
      indent += ' ';
    }
  } else if (typeof space === 'string') {
    indent = space;
  }

  rep = replacer;
  if (replacer && typeof replacer !== 'function'
        && (typeof replacer !== 'object'
            || typeof replacer.length !== 'number')) {
    throw new Error('JSON.stringify');
  }
  return str('', { '': value });
};
