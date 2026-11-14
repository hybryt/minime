// Converte o Real-ESRGAN compacto (SRVGGNetCompact, .pth do PyTorch) pro formato do ncnn (.param + .bin).
// Uso: node scripts/convert-compact.mjs <entrada.pth> <saida-sem-extensao> [--truncar]
//   ex.: node scripts/convert-compact.mjs realesr-general-x4v3.pth vendor/upscale-models/realesr-general-x4v3
// Sem dependências: abre o zip do .pth, roda um mini-interpretador de pickle e escreve a rede com os mesmos
// tipos de camada, nomes e parâmetros da conversão oficial do realesr-animevideov3 (pesos da convolução em fp16).
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

// ---------- zip (o .pth do PyTorch 1.6+ é um zip) ----------
function readZip(buf) {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error('Esse .pth não é zip (formato antigo do PyTorch, não suportado).');
  const files = new Map();
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = buf.readUInt16LE(eocd + 10); n > 0; n--) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Zip corrompido.');
    const method = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20), off = buf.readUInt32LE(p + 42);
    const nlen = buf.readUInt16LE(p + 28), skip = nlen + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
    if (size === 0xffffffff || off === 0xffffffff) throw new Error('Zip64 não suportado.');
    const name = buf.toString('utf8', p + 46, p + 46 + nlen);
    // Os tamanhos ficam só no diretório central (o PyTorch grava o cabeçalho local com tamanho 0).
    const start = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28);
    const raw = buf.subarray(start, start + size);
    files.set(name, () => (method === 0 ? raw : method === 8 ? inflateRawSync(raw) : null));
    p += 46 + skip;
  }
  return files;
}

// ---------- pickle (só os opcodes que o torch.save usa) ----------
function unpickle(d, persistentLoad) {
  const stack = [], marks = [], memo = new Map();
  const popMark = () => stack.splice(marks.pop());
  const str = (n, enc = 'utf8') => { const s = d.toString(enc, i, i + n); i += n; return s; };
  const line = () => { const e = d.indexOf(10, i); const s = d.toString('latin1', i, e); i = e + 1; return s; };
  const call = (fn, args) => {
    switch (fn.global) {
      case 'collections.OrderedDict': return new Map();
      case 'torch._utils._rebuild_tensor_v2': { const [storage, offset, size, stride] = args; return { storage, offset, size, stride }; }
      case 'torch._utils._rebuild_parameter': return args[0];
      default: return { global: fn.global, args }; // qualquer outra coisa: guarda e segue
    }
  };
  let i = 0;
  for (;;) {
    const op = d[i++];
    switch (op) {
      case 0x80: i++; break;                                              // PROTO
      case 0x95: i += 8; break;                                           // FRAME
      case 0x2e: return stack.pop();                                      // STOP
      case 0x28: marks.push(stack.length); break;                         // MARK
      case 0x7d: stack.push(new Map()); break;                            // EMPTY_DICT
      case 0x5d: case 0x29: stack.push([]); break;                        // EMPTY_LIST, EMPTY_TUPLE
      case 0x4e: stack.push(null); break;                                 // NONE
      case 0x88: stack.push(true); break;                                 // NEWTRUE
      case 0x89: stack.push(false); break;                                // NEWFALSE
      case 0x4b: stack.push(d[i]); i += 1; break;                         // BININT1
      case 0x4d: stack.push(d.readUInt16LE(i)); i += 2; break;            // BININT2
      case 0x4a: stack.push(d.readInt32LE(i)); i += 4; break;             // BININT
      case 0x8a: { const n = d[i++]; stack.push(n ? Number(d.readIntLE(i, Math.min(n, 6))) : 0); i += n; break; } // LONG1
      case 0x47: stack.push(d.readDoubleBE(i)); i += 8; break;            // BINFLOAT
      case 0x58: { const n = d.readUInt32LE(i); i += 4; stack.push(str(n)); break; }            // BINUNICODE
      case 0x8c: { const n = d[i++]; stack.push(str(n)); break; }                               // SHORT_BINUNICODE
      case 0x54: { const n = d.readUInt32LE(i); i += 4; stack.push(str(n, 'latin1')); break; }  // BINSTRING
      case 0x55: { const n = d[i++]; stack.push(str(n, 'latin1')); break; }                     // SHORT_BINSTRING
      case 0x63: { const mod = line(); stack.push({ global: `${mod}.${line()}` }); break; }     // GLOBAL
      case 0x93: { const name = stack.pop(); stack.push({ global: `${stack.pop()}.${name}` }); break; } // STACK_GLOBAL
      case 0x71: memo.set(d[i++], stack.at(-1)); break;                   // BINPUT
      case 0x72: memo.set(d.readUInt32LE(i), stack.at(-1)); i += 4; break; // LONG_BINPUT
      case 0x94: memo.set(memo.size, stack.at(-1)); break;                // MEMOIZE
      case 0x68: stack.push(memo.get(d[i++])); break;                     // BINGET
      case 0x6a: stack.push(memo.get(d.readUInt32LE(i))); i += 4; break;  // LONG_BINGET
      case 0x85: stack.push([stack.pop()]); break;                        // TUPLE1
      case 0x86: stack.push(stack.splice(-2)); break;                     // TUPLE2
      case 0x87: stack.push(stack.splice(-3)); break;                     // TUPLE3
      case 0x74: stack.push(popMark()); break;                            // TUPLE
      case 0x61: { const v = stack.pop(); stack.at(-1).push(v); break; }  // APPEND
      case 0x65: { const vs = popMark(); stack.at(-1).push(...vs); break; } // APPENDS
      case 0x73: { const v = stack.pop(), k = stack.pop(); stack.at(-1).set(k, v); break; } // SETITEM
      case 0x75: { const kv = popMark(); for (let j = 0; j < kv.length; j += 2) stack.at(-1).set(kv[j], kv[j + 1]); break; } // SETITEMS
      case 0x51: stack.push(persistentLoad(stack.pop())); break;          // BINPERSID
      case 0x52: case 0x81: { const args = stack.pop(); stack.push(call(stack.pop(), args)); break; } // REDUCE, NEWOBJ
      case 0x62: stack.pop(); break;                                      // BUILD (ex.: _metadata do state_dict, não precisa)
      default: throw new Error(`pickle: opcode 0x${op?.toString(16)} não suportado (posição ${i - 1}).`);
    }
  }
}

// ---------- fp16 ----------
// Padrão: arredonda pro par mais próximo (erro máx. de meio ulp). Com --truncar, corta os bits e zera
// subnormais, igual ao float32_to_float16 do ncnn: reproduz bit a bit os .bin oficiais.
const TRUNCAR = process.argv.includes('--truncar');
const f32 = new Float32Array(1), u32 = new Uint32Array(f32.buffer);
function toHalf(v) {
  f32[0] = v; const x = u32[0], sign = (x >>> 16) & 0x8000, e = (x >>> 23) & 0xff, m = x & 0x7fffff;
  if (e === 0xff) return sign | 0x7c00 | (m ? 0x200 : 0);
  const ne = e - 127 + 15;
  if (ne >= 31) return sign | 0x7c00;
  if (TRUNCAR) return ne <= 0 ? sign : sign | (ne << 10) | (m >>> 13);
  if (ne <= 0) {
    if (ne < -10) return sign;
    const mm = m | 0x800000, sh = 14 - ne, half = 1 << (sh - 1);
    let r = mm >>> sh; const rest = mm & ((1 << sh) - 1);
    if (rest > half || (rest === half && (r & 1))) r++;
    return sign | r;
  }
  let r = (ne << 10) | (m >>> 13); const rest = m & 0x1fff;
  if (rest > 0x1000 || (rest === 0x1000 && (r & 1))) r++;
  return sign | r; // o "carry" do arredondamento sobe o expoente sozinho
}
function fromHalf(h) {
  const s = h & 0x8000 ? -1 : 1, e = (h >> 10) & 0x1f, m = h & 0x3ff;
  if (e === 0) return s * m * 2 ** -24;
  if (e === 31) return m ? NaN : s * Infinity;
  return s * (1 + m / 1024) * 2 ** (e - 15);
}

// ---------- leitura do .pth ----------
function loadStateDict(file) {
  const zip = readZip(readFileSync(file));
  const pkl = [...zip.keys()].find((k) => k.endsWith('/data.pkl') || k === 'data.pkl');
  if (!pkl) throw new Error('data.pkl não encontrado no .pth.');
  const root = pkl.slice(0, -'data.pkl'.length);
  const top = unpickle(zip.get(pkl)(), (pid) => {
    const [kind, type, key] = pid; // ('storage', torch.FloatStorage, chave, local, numel)
    if (kind !== 'storage') throw new Error(`persistent_load desconhecido: ${kind}`);
    return { dtype: type.global.split('.').pop(), bytes: zip.get(`${root}data/${key}`)() };
  });
  const sd = top.get('params_ema') ?? top.get('params') ?? top;
  const tensor = (t) => {
    const n = t.size.reduce((a, b) => a * b, 1);
    let want = 1; // só aceita tensor contíguo (é o caso desses arquivos)
    for (let k = t.size.length - 1; k >= 0; k--) { if (t.size[k] > 1 && t.stride[k] !== want) throw new Error('Tensor não contíguo.'); want *= t.size[k]; }
    const { dtype, bytes } = t.storage, out = new Float32Array(n);
    if (dtype === 'FloatStorage') for (let k = 0; k < n; k++) out[k] = bytes.readFloatLE((t.offset + k) * 4);
    else if (dtype === 'HalfStorage') for (let k = 0; k < n; k++) out[k] = fromHalf(bytes.readUInt16LE((t.offset + k) * 2));
    else throw new Error(`Tipo de tensor não suportado: ${dtype}`);
    return { size: t.size, data: out };
  };
  return new Map([...sd].filter(([, v]) => v && v.storage).map(([k, v]) => [k, tensor(v)]));
}

// ---------- rede ncnn ----------
function convert(sd) {
  // body.0 = conv(3→nf), body.1 = PReLU, ... , último body = conv(nf → 3·escala²). Tudo 3x3, com bias.
  const ids = [...new Set([...sd.keys()].map((k) => k.match(/^body\.(\d+)\.weight$/)?.[1]).filter(Boolean).map(Number))].sort((a, b) => a - b);
  if (!ids.length || ids.some((id, k) => id !== k)) throw new Error('Não parece um SRVGGNetCompact (faltam chaves body.N.weight).');
  const layers = ids.map((id) => ({ w: sd.get(`body.${id}.weight`), b: sd.get(`body.${id}.bias`) }));
  layers.forEach((l, k) => {
    const conv = k % 2 === 0;
    if (conv ? l.w.size.length !== 4 || l.w.size[2] !== 3 || l.w.size[3] !== 3 || !l.b : l.w.size.length !== 1)
      throw new Error(`body.${k} não tem a forma esperada (${conv ? 'conv 3x3 com bias' : 'PReLU'}).`);
  });
  if (layers.length % 2 === 0) throw new Error('A rede deveria terminar numa convolução.');
  const inCh = layers[0].w.size[1], outLast = layers.at(-1).w.size[0];
  const scale = Math.round(Math.sqrt(outLast / inCh));
  if (inCh !== 3 || scale * scale * inCh !== outLast) throw new Error(`Saída da última conv (${outLast}) não fecha com 3·escala².`);

  // Mesmos nomes da conversão oficial (vindos do ONNX): blobs numerados a partir de 1 + nº de parâmetros.
  const nConv = (layers.length + 1) / 2, nPrelu = nConv - 1, base = 1 + nConv * 2 + nPrelu;
  const row = (type, name, ins, outs, params = '') => `${type.padEnd(24)} ${name.padEnd(24)} ${ins.length} ${outs.length} ${[...ins, ...outs].join(' ')}${params}`;
  const exp = (v) => v.toExponential(6).replace(/e([+-])(\d)$/, 'e$10$2'); // 4.000000e+00, igual ao printf
  const rows = [
    row('Input', 'input.1', [], ['data']),
    row('Split', 'splitncnn_input0', ['data'], ['input.1_splitncnn_0', 'input.1_splitncnn_1']),
  ];
  const bins = [];
  let prev = 'input.1_splitncnn_1';
  layers.forEach((l, k) => {
    const j = k >> 1, out = String(base + 3 * j + (k % 2 ? 2 : 0));
    if (k % 2 === 0) {
      const [o, , kh] = l.w.size, n = l.w.data.length;
      rows.push(row('Convolution', `Conv_${k}`, [prev], [out], ` 0=${o} 1=${kh} 4=1 5=1 6=${n}`));
      // Peso em fp16 com a marca 0x01306B47 (o ncnn detecta sozinho); bias em fp32, sem marca.
      const w = Buffer.alloc(4 + ((n * 2 + 3) & ~3));
      w.writeUInt32LE(0x01306b47, 0);
      for (let q = 0; q < n; q++) w.writeUInt16LE(toHalf(l.w.data[q]), 4 + q * 2);
      bins.push(w, Buffer.from(l.b.data.buffer));
    } else {
      rows.push(row('PReLU', `PRelu_${k}`, [prev], [out], ` 0=${l.w.data.length}`));
      bins.push(Buffer.from(l.w.data.buffer));
    }
    prev = out;
  });
  const k = layers.length, ps = String(+prev + 1), up = String(+ps + 5);
  rows.push(
    row('PixelShuffle', `DepthToSpace_${k}`, [prev], [ps], ` 0=${scale}`),
    row('Interp', `Resize_${k + 2}`, ['input.1_splitncnn_0'], [up], ` 0=1 1=${exp(scale)} 2=${exp(scale)}`), // vizinho mais próximo
    row('BinaryOp', `Add_${k + 3}`, [ps, up], ['output']), // 0=0: soma
  );
  const param = `7767517\n${rows.length} ${rows.length + 1}\n${rows.join('\n')}\n`;
  return { param, bin: Buffer.concat(bins), nConv, scale, feat: layers[0].w.size[0] };
}

const [input, prefix] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!input || !prefix) {
  console.error('Uso: node scripts/convert-compact.mjs <entrada.pth> <saida-sem-extensao> [--truncar]');
  process.exit(1);
}
const { param, bin, nConv, scale, feat } = convert(loadStateDict(input));
writeFileSync(`${prefix}.param`, param);
writeFileSync(`${prefix}.bin`, bin);
console.log(`Pronto: ${prefix}.param/.bin (${nConv} convoluções de ${feat} canais, escala ${scale}x, ${(bin.length / 1e6).toFixed(2)} MB)`);
