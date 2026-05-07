
// ----------------------------------------------------
// Shortcuts:
// Cmd/Ctrl + H  -> Help
// Cmd/Ctrl + ,  -> Settings
// Cmd/Ctrl + S  -> Share Code
// ----------------------------------------------------

'Hello World!';

new Array(10).fill(0).map((_, i) => '#'.repeat(i + 1));

2n ** 42n;

'Number Factorization:'
const { factorsBI } = require('@gkucmierz/utils') /* @2.0.4 */;
factorsBI(2n ** 81n + 1n);

const exp = 136279841;
const mPrime52 = 2n ** BigInt(exp) - 1n;
console.log(`Number of digits biggest known prime number: ${(mPrime52 + '').length}`);

'Lucas-Lehmer Primality Test (Mersenne Primes):'
import { lucasLehmerBI } from '@gkucmierz/utils' /* @2.0.7 */;
const isPrime = lucasLehmerBI(127, true);
console.log(`Is M127 prime? ${isPrime}`);
