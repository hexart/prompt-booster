// apps/web/src/env.js
import { Buffer } from 'buffer';
import process from 'process';

globalThis.Buffer = globalThis.Buffer || Buffer;
globalThis.global = globalThis.global || globalThis;
globalThis.process = globalThis.process || process;