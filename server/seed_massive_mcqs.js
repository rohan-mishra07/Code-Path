/**
 * seed_massive_mcqs.js
 * ---------------------------------------------------------------------------
 * Adds a dedicated "JavaScript + Web" track with 20 high-yield interview MCQs
 * to the CodePath question bank.
 *
 * Run with:  node seed_massive_mcqs.js
 *
 * Idempotent: uses ON CONFLICT (slug) DO UPDATE on problems and
 * ON CONFLICT (problem_id, option_key) DO UPDATE on mcq_options,
 * so it is safe to re-run at any time.
 * ---------------------------------------------------------------------------
 */

import pool from './db.js';
import dotenv from 'dotenv';

dotenv.config();

// ---------------------------------------------------------------------------
// Question Bank
// ---------------------------------------------------------------------------

const questions = [

  // =========================================================================
  // TOPIC: Event Loop
  // =========================================================================

  {
    title: 'Event Loop: Microtask vs Macrotask Output Order',
    slug: 'js-event-loop-microtask-macrotask',
    track: 'JavaScript + Web',
    topic: 'Event Loop',
    difficulty: 'hard',
    description: `What is the output of the following code?

\`\`\`js
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

queueMicrotask(() => console.log('4'));

console.log('5');
\`\`\``,
    options: [
      { key: 'A', text: '1, 2, 3, 4, 5', correct: false },
      { key: 'B', text: '1, 5, 2, 3, 4', correct: false },
      { key: 'C', text: '1, 5, 3, 4, 2', correct: true },
      { key: 'D', text: '1, 5, 4, 3, 2', correct: false },
    ],
    explanation: `Correct answer: 1, 5, 3, 4, 2

Execution order:
1. Synchronous code runs first -> logs 1 then 5.
2. The microtask queue is drained BEFORE the next macrotask:
   - Promise.resolve().then() queues a microtask -> logs 3.
   - queueMicrotask() also queues a microtask -> logs 4.
3. setTimeout callback is a macrotask and runs last -> logs 2.

Key rule: Synchronous -> Microtasks (Promises + queueMicrotask) -> Macrotasks (setTimeout/setInterval).`,
  },

  {
    title: 'Event Loop: Nested Promise Execution Order',
    slug: 'js-event-loop-nested-promise-order',
    track: 'JavaScript + Web',
    topic: 'Event Loop',
    difficulty: 'hard',
    description: `What does this snippet print?

\`\`\`js
Promise.resolve()
  .then(() => {
    console.log('A');
    return Promise.resolve('B');
  })
  .then((v) => console.log(v));

Promise.resolve().then(() => console.log('C'));
\`\`\``,
    options: [
      { key: 'A', text: 'A, B, C', correct: false },
      { key: 'B', text: 'A, C, B', correct: true },
      { key: 'C', text: 'C, A, B', correct: false },
      { key: 'D', text: 'A, B, C simultaneously', correct: false },
    ],
    explanation: `Answer: A, C, B

When a .then() callback returns a thenable (another Promise), the JS engine must schedule an extra microtask tick to "unwrap" it. This adds a two-microtask delay before the next .then handler in the chain runs.

- Tick 1: 'A' is logged, a new Promise is returned. Resolving that thenable costs 2 extra microtask ticks.
- Tick 2: The second chain's .then runs -> logs 'C'.
- Ticks 3 and 4: The returned Promise.resolve('B') is finally unwrapped -> 'B' is logged.

Rule: Returning a Promise.resolve() inside .then() adds latency compared to returning a plain value.`,
  },

  {
    title: 'Event Loop: queueMicrotask API',
    slug: 'js-event-loop-queue-microtask',
    track: 'JavaScript + Web',
    topic: 'Event Loop',
    difficulty: 'medium',
    description: `What is the primary use case for \`queueMicrotask(fn)\` over \`Promise.resolve().then(fn)\`?`,
    options: [
      { key: 'A', text: 'queueMicrotask runs in the macrotask queue, making it slower but more stable.', correct: false },
      { key: 'B', text: 'queueMicrotask provides a cleaner, allocation-free way to schedule a microtask without creating an intermediate Promise object.', correct: true },
      { key: 'C', text: 'queueMicrotask can only be called from inside a Promise handler.', correct: false },
      { key: 'D', text: 'queueMicrotask pauses the current task until the microtask completes.', correct: false },
    ],
    explanation: `Answer: B

Both queueMicrotask(fn) and Promise.resolve().then(fn) schedule fn in the microtask queue, so they run before the next macrotask.

The difference is ergonomics and efficiency:
- Promise.resolve().then(fn) allocates a Promise object as an intermediate step.
- queueMicrotask(fn) is a direct, lightweight API with no extra allocation — ideal for library authors or performance-sensitive code.

Both are still microtasks and will run before any setTimeout(fn, 0) callbacks.`,
  },

  {
    title: 'Event Loop: setTimeout(fn, 0) Ordering',
    slug: 'js-event-loop-settimeout-zero',
    track: 'JavaScript + Web',
    topic: 'Event Loop',
    difficulty: 'easy',
    description: `Why does \`setTimeout(fn, 0)\` not guarantee immediate execution?`,
    options: [
      { key: 'A', text: 'Because setTimeout has a minimum delay of 100ms in all browsers.', correct: false },
      { key: 'B', text: 'Because the callback is pushed to the macrotask queue and only runs after the current synchronous code and all microtasks have completed.', correct: true },
      { key: 'C', text: 'Because setTimeout(fn, 0) is the same as requestAnimationFrame.', correct: false },
      { key: 'D', text: 'Because the event loop processes callbacks in LIFO order.', correct: false },
    ],
    explanation: `Answer: B

setTimeout(fn, 0) schedules fn as a macrotask. Even with a 0ms delay, it will not run until:
1. The current synchronous execution stack is empty.
2. ALL pending microtasks (Promises, queueMicrotask) have been drained.

The HTML spec specifies a minimum delay of 4ms in some nested timeout contexts, but the key point is that macrotasks always yield to microtasks first.

Practical use of setTimeout(fn, 0): defer work to allow the browser to repaint or handle user events, or to break out of the current synchronous call stack.`,
  },

  // =========================================================================
  // TOPIC: Closures & Scope
  // =========================================================================

  {
    title: 'Closures: var vs let in a Loop',
    slug: 'js-closure-var-loop-classic',
    track: 'JavaScript + Web',
    topic: 'Closures & Scope',
    difficulty: 'medium',
    description: `What does the following code print?

\`\`\`js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
\`\`\``,
    options: [
      { key: 'A', text: '0, 1, 2', correct: false },
      { key: 'B', text: '3, 3, 3', correct: true },
      { key: 'C', text: '0, 0, 0', correct: false },
      { key: 'D', text: 'undefined, undefined, undefined', correct: false },
    ],
    explanation: `Answer: B — 3, 3, 3

var is function-scoped (or globally scoped here), so all three closures capture the SAME variable i. By the time the setTimeout callbacks fire (after the loop finishes), i has been incremented to 3.

Fix with let (block-scoped, creates a new binding per iteration):
  for (let i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 0); // prints 0, 1, 2
  }

Or use an IIFE to capture the value per iteration:
  for (var i = 0; i < 3; i++) {
    ((j) => setTimeout(() => console.log(j), 0))(i);
  }`,
  },

  {
    title: 'Closures: IIFE Counter Pattern',
    slug: 'js-closure-iife-counter',
    track: 'JavaScript + Web',
    topic: 'Closures & Scope',
    difficulty: 'medium',
    description: `What is the final value printed?

\`\`\`js
const counter = (() => {
  let count = 0;
  return {
    increment: () => ++count,
    decrement: () => --count,
    value: () => count,
  };
})();

counter.increment();
counter.increment();
counter.decrement();
console.log(counter.value());
\`\`\``,
    options: [
      { key: 'A', text: '0', correct: false },
      { key: 'B', text: '1', correct: true },
      { key: 'C', text: '2', correct: false },
      { key: 'D', text: 'undefined', correct: false },
    ],
    explanation: `Answer: B — 1

This is the classic Module Pattern using an IIFE. The immediately-invoked function creates a private count variable and returns an object whose methods close over it.

- increment() twice -> count = 2
- decrement() once  -> count = 1
- value() returns 1

The outer code cannot access count directly — it is truly private. This pattern predates ES6 classes and is the foundation of encapsulation in JavaScript.`,
  },

  {
    title: 'Closures: Lexical Scope Lookup Chain',
    slug: 'js-closure-lexical-scope-chain',
    track: 'JavaScript + Web',
    topic: 'Closures & Scope',
    difficulty: 'easy',
    description: `What is logged?

\`\`\`js
let x = 'global';

function outer() {
  let x = 'outer';
  function inner() {
    console.log(x);
  }
  inner();
}

outer();
\`\`\``,
    options: [
      { key: 'A', text: 'global', correct: false },
      { key: 'B', text: 'outer', correct: true },
      { key: 'C', text: 'undefined', correct: false },
      { key: 'D', text: 'ReferenceError', correct: false },
    ],
    explanation: `Answer: B — 'outer'

JavaScript uses lexical (static) scoping: a function's scope is determined by where it is DEFINED in the source code, not where it is called.

When inner looks up x, it walks the scope chain:
1. Own scope -> no x.
2. outer's scope -> finds x = 'outer' (stops here).
3. Would check global next, but already found it.

This is why the output is 'outer' and not 'global'.`,
  },

  // =========================================================================
  // TOPIC: Prototype & Inheritance
  // =========================================================================

  {
    title: 'Prototype Chain: Property Lookup Order',
    slug: 'js-prototype-chain-lookup',
    track: 'JavaScript + Web',
    topic: 'Prototype & Inheritance',
    difficulty: 'medium',
    description: `What does this code output?

\`\`\`js
function Animal(name) { this.name = name; }
Animal.prototype.speak = function () {
  return this.name + ' makes a noise.';
};

function Dog(name) { Animal.call(this, name); }
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

const d = new Dog('Rex');
console.log(d.speak());
console.log(d instanceof Dog);
console.log(d instanceof Animal);
\`\`\``,
    options: [
      { key: 'A', text: '"Rex makes a noise.", true, false', correct: false },
      { key: 'B', text: 'TypeError: d.speak is not a function', correct: false },
      { key: 'C', text: '"Rex makes a noise.", true, true', correct: true },
      { key: 'D', text: '"Rex makes a noise.", false, true', correct: false },
    ],
    explanation: `Answer: C — "Rex makes a noise.", true, true

- Dog.prototype = Object.create(Animal.prototype) sets up the chain so Dog.prototype.__proto__ === Animal.prototype.
- When d.speak() is called, JS walks: own props -> Dog.prototype -> Animal.prototype -> finds speak.
- instanceof checks the prototype chain: d instanceof Dog -> true (Dog.prototype is in the chain), d instanceof Animal -> also true (Animal.prototype is further up the chain).
- Restoring Dog.prototype.constructor = Dog ensures d.constructor === Dog, which is good practice.`,
  },

  {
    title: 'Prototype: Object.create() vs new Keyword',
    slug: 'js-prototype-object-create-vs-new',
    track: 'JavaScript + Web',
    topic: 'Prototype & Inheritance',
    difficulty: 'medium',
    description: `Which statement about \`Object.create(proto)\` is correct?`,
    options: [
      { key: 'A', text: 'It calls the constructor function of proto.', correct: false },
      { key: 'B', text: 'It creates a new object whose [[Prototype]] is set to proto, without calling any constructor.', correct: true },
      { key: 'C', text: 'It is identical to new proto() in every way.', correct: false },
      { key: 'D', text: 'It copies all enumerable own properties of proto into the new object.', correct: false },
    ],
    explanation: `Answer: B

Object.create(proto) creates a brand-new object and sets its internal [[Prototype]] slot (__proto__) to proto. No constructor function is invoked.

new Fn() does four things:
1. Creates a new object.
2. Sets its [[Prototype]] to Fn.prototype.
3. Executes Fn with 'this' bound to the new object.
4. Returns the object (unless the constructor explicitly returns another object).

Object.create(null) creates an object with NO prototype at all — useful for pure hash-maps without inherited keys like toString.`,
  },

  {
    title: 'Prototype: ES6 Classes Are Syntactic Sugar',
    slug: 'js-prototype-class-under-the-hood',
    track: 'JavaScript + Web',
    topic: 'Prototype & Inheritance',
    difficulty: 'easy',
    description: `Given the ES6 class:

\`\`\`js
class Foo {
  greet() { return 'hello'; }
}
const f = new Foo();
\`\`\`

Which expression evaluates to \`true\`?`,
    options: [
      { key: 'A', text: 'typeof Foo === "object"', correct: false },
      { key: 'B', text: 'f.greet === Foo.greet', correct: false },
      { key: 'C', text: 'f.greet === Foo.prototype.greet', correct: true },
      { key: 'D', text: 'Foo.prototype === f', correct: false },
    ],
    explanation: `Answer: C — f.greet === Foo.prototype.greet

ES6 class is syntactic sugar over the prototype system. Methods defined inside a class body are placed on Foo.prototype, not on each instance.

So f.greet is looked up via the prototype chain and resolves to Foo.prototype.greet — they are the SAME function reference.

typeof Foo is "function" (classes are just special constructor functions). Foo.greet would be a STATIC method (not defined here, so it would be undefined).`,
  },

  {
    title: 'Prototype: hasOwnProperty vs in Operator',
    slug: 'js-prototype-hasownproperty-vs-in',
    track: 'JavaScript + Web',
    topic: 'Prototype & Inheritance',
    difficulty: 'easy',
    description: `What is the difference between \`'toString' in obj\` and \`obj.hasOwnProperty('toString')\`?`,
    options: [
      { key: 'A', text: 'They are identical; both check only own properties.', correct: false },
      { key: 'B', text: "'in' checks own AND inherited properties; hasOwnProperty checks only own properties.", correct: true },
      { key: 'C', text: "'in' is deprecated; use hasOwnProperty exclusively.", correct: false },
      { key: 'D', text: "hasOwnProperty checks own AND inherited; 'in' checks only own.", correct: false },
    ],
    explanation: `Answer: B

  const obj = {};
  'toString' in obj            // true  — inherited from Object.prototype
  obj.hasOwnProperty('toString') // false — not an own property

The 'in' operator traverses the entire prototype chain. hasOwnProperty (or the modern Object.hasOwn(obj, key) from ES2022) only checks the object's own properties.

Tip: Prefer Object.hasOwn(obj, key) over obj.hasOwnProperty(key) because:
1. It works on objects created with Object.create(null) which have no hasOwnProperty method.
2. It guards against shadowing if someone does obj.hasOwnProperty = () => false.`,
  },

  // =========================================================================
  // TOPIC: Execution Context & 'this'
  // =========================================================================

  {
    title: "Execution Context: Arrow Function and 'this'",
    slug: 'js-this-arrow-vs-regular',
    track: 'JavaScript + Web',
    topic: "Execution Context & 'this'",
    difficulty: 'medium',
    description: `What is logged?

\`\`\`js
const obj = {
  name: 'Alice',
  greet: function () {
    const inner = () => console.log(this.name);
    inner();
  },
};

obj.greet();
\`\`\``,
    options: [
      { key: 'A', text: 'undefined', correct: false },
      { key: 'B', text: 'Alice', correct: true },
      { key: 'C', text: 'TypeError', correct: false },
      { key: 'D', text: 'null', correct: false },
    ],
    explanation: `Answer: B — 'Alice'

Arrow functions do NOT have their own 'this'. They capture 'this' from the enclosing lexical scope at definition time.

Here, inner is defined inside greet. When obj.greet() is called, 'this' inside greet is obj. The arrow function captures that same obj as 'this', so this.name === 'Alice'.

If inner were a regular function, 'this' would be undefined (strict mode) or the global object (sloppy mode), since it is called without a receiver.`,
  },

  {
    title: 'Execution Context: call, apply, and bind Differences',
    slug: 'js-this-call-apply-bind',
    track: 'JavaScript + Web',
    topic: "Execution Context & 'this'",
    difficulty: 'medium',
    description: `Which statement correctly distinguishes \`call\`, \`apply\`, and \`bind\`?`,
    options: [
      { key: 'A', text: 'bind() invokes the function immediately; call() and apply() return a new bound function.', correct: false },
      { key: 'B', text: 'call() and apply() both invoke immediately; call() takes individual args, apply() takes an array; bind() returns a new function without invoking it.', correct: true },
      { key: 'C', text: 'All three invoke the function immediately with the given this context.', correct: false },
      { key: 'D', text: 'apply() is deprecated in ES6 and should be replaced with the spread operator.', correct: false },
    ],
    explanation: `Answer: B

Method                | Invokes immediately? | Arguments
fn.call(ctx, a, b)   | Yes                  | Individual args
fn.apply(ctx, [a,b]) | Yes                  | Array of args
fn.bind(ctx, a)      | No (returns new fn)  | Partial application

bind is used for partial application and deferred execution:
  const boundFn = fn.bind(ctx, arg1); // does not run yet
  boundFn(arg2);                       // runs now with ctx + arg1 + arg2

Arrow functions ignore all three methods — their 'this' is always lexical and cannot be overridden.`,
  },

  {
    title: "Execution Context: 'this' in Strict Mode",
    slug: 'js-this-strict-mode-undefined',
    track: 'JavaScript + Web',
    topic: "Execution Context & 'this'",
    difficulty: 'easy',
    description: `What is the value of \`this\` inside a regular function called without a receiver in strict mode?

\`\`\`js
'use strict';
function show() {
  console.log(this);
}
show();
\`\`\``,
    options: [
      { key: 'A', text: 'window (or global)', correct: false },
      { key: 'B', text: '{} (empty object)', correct: false },
      { key: 'C', text: 'undefined', correct: true },
      { key: 'D', text: 'null', correct: false },
    ],
    explanation: `Answer: C — undefined

In sloppy mode, calling a function without a receiver causes 'this' to default to the global object (window in browsers, global in Node).

In strict mode ('use strict'), that default binding is disabled — 'this' stays undefined when a function is called without an explicit receiver.

This prevents accidental global pollution and is one of the main safety benefits of strict mode. ES6 modules are always in strict mode.`,
  },

  // =========================================================================
  // TOPIC: Asynchronous JS
  // =========================================================================

  {
    title: 'Async JS: async/await Error Handling with try/catch',
    slug: 'js-async-await-error-handling',
    track: 'JavaScript + Web',
    topic: 'Asynchronous JS',
    difficulty: 'medium',
    description: `What is logged?

\`\`\`js
async function fetchData() {
  throw new Error('Network failure');
}

fetchData()
  .then(data => console.log(data))
  .catch(err => console.log('Caught:', err.message));
\`\`\``,
    options: [
      { key: 'A', text: 'The program crashes with an unhandled exception.', correct: false },
      { key: 'B', text: 'The .then() handler is called with undefined.', correct: false },
      { key: 'C', text: 'Caught: Network failure', correct: true },
      { key: 'D', text: 'Nothing is logged; the error is silently swallowed.', correct: false },
    ],
    explanation: `Answer: C — "Caught: Network failure"

An async function always returns a Promise. Throwing inside an async function is equivalent to calling Promise.reject(error) — the returned Promise rejects with that error.

The .catch() handler receives the rejection and logs the message.

Equivalently with try/catch inside an async function:
  async function main() {
    try {
      const data = await fetchData();
    } catch (err) {
      console.log('Caught:', err.message);
    }
  }

Best practice: Always attach .catch() or wrap await calls in try/catch to prevent unhandled promise rejections.`,
  },

  {
    title: 'Async JS: Promise.all vs allSettled vs race',
    slug: 'js-async-promise-combinators',
    track: 'JavaScript + Web',
    topic: 'Asynchronous JS',
    difficulty: 'hard',
    description: `You need to fetch data from 3 APIs. If any one fails, you still want the results of the others. Which combinator should you use?`,
    options: [
      { key: 'A', text: 'Promise.all() — it runs all in parallel and rejects fast on first failure.', correct: false },
      { key: 'B', text: 'Promise.race() — it resolves or rejects with the first settled promise.', correct: false },
      { key: 'C', text: 'Promise.allSettled() — it waits for all to settle and gives individual status/value for each.', correct: true },
      { key: 'D', text: 'Promise.any() — it resolves as soon as any one succeeds.', correct: false },
    ],
    explanation: `Answer: C — Promise.allSettled()

Combinator             | Behavior on failure
Promise.all()          | Short-circuits and REJECTS on first rejection — remaining results lost
Promise.allSettled()   | Waits for ALL to settle; returns array of {status, value/reason}
Promise.race()         | Resolves/rejects with the FIRST settled (fulfilled or rejected)
Promise.any()          | Resolves with first FULFILLED; rejects only if ALL reject (AggregateError)

Example:
  const results = await Promise.allSettled([api1(), api2(), api3()]);
  results.forEach(r => {
    if (r.status === 'fulfilled') console.log('OK:', r.value);
    else console.log('Failed:', r.reason);
  });`,
  },

  {
    title: 'Async JS: Sequential vs Parallel Awaits',
    slug: 'js-async-sequential-vs-parallel',
    track: 'JavaScript + Web',
    topic: 'Asynchronous JS',
    difficulty: 'medium',
    description: `Both snippets make two API calls. What is the key performance difference?

\`\`\`js
// Snippet A
const a = await fetch('/api/users');
const b = await fetch('/api/posts');

// Snippet B
const [a, b] = await Promise.all([fetch('/api/users'), fetch('/api/posts')]);
\`\`\``,
    options: [
      { key: 'A', text: 'They are functionally identical in terms of performance.', correct: false },
      { key: 'B', text: 'Snippet A runs the fetches sequentially (total time = tA + tB); Snippet B runs them in parallel (total time = max(tA, tB)).', correct: true },
      { key: 'C', text: 'Snippet B can only be used inside a class method.', correct: false },
      { key: 'D', text: 'Snippet A is faster because it avoids the overhead of Promise.all.', correct: false },
    ],
    explanation: `Answer: B

In Snippet A, the second await does not start until the first has resolved — the fetches are SEQUENTIAL. If each takes 500ms, total wait is ~1000ms.

In Snippet B, both fetches are initiated SIMULTANEOUSLY before any awaiting happens. Promise.all waits for both to settle in parallel. Total wait is approximately max(500, 500) = ~500ms.

Rule: Start all independent async operations before awaiting them. Use Promise.all (or create promises first) for concurrent execution.`,
  },

  {
    title: 'Async JS: Promise.any() and AggregateError',
    slug: 'js-async-promise-any',
    track: 'JavaScript + Web',
    topic: 'Asynchronous JS',
    difficulty: 'hard',
    description: `What does \`Promise.any()\` return when all provided promises reject?

\`\`\`js
Promise.any([
  Promise.reject('err1'),
  Promise.reject('err2'),
  Promise.reject('err3'),
]).catch(e => console.log(e.constructor.name, e.errors));
\`\`\``,
    options: [
      { key: 'A', text: 'It resolves with undefined.', correct: false },
      { key: 'B', text: 'It rejects with only the first rejection reason.', correct: false },
      { key: 'C', text: 'AggregateError ["err1", "err2", "err3"]', correct: true },
      { key: 'D', text: 'It throws a TypeError immediately.', correct: false },
    ],
    explanation: `Answer: C — AggregateError ["err1", "err2", "err3"]

Promise.any() (ES2021) is the "optimistic" combinator: it resolves as soon as ANY one promise fulfills. It only rejects when ALL promises reject, and in that case it rejects with an AggregateError — a special error subclass that bundles all individual rejection reasons in its .errors array.

Combinator summary:
all        | Resolves when all fulfill | Rejects when any rejects (first reason)
allSettled | Resolves when all settle  | Never rejects
race       | Resolves/rejects when any settles first
any        | Resolves when any fulfills | Rejects when ALL reject (AggregateError)`,
  },

  // =========================================================================
  // TOPIC: V8 Engine & Memory
  // =========================================================================

  {
    title: 'V8 & Memory: WeakMap and Garbage Collection',
    slug: 'js-memory-weakmap-gc',
    track: 'JavaScript + Web',
    topic: 'V8 Engine & Memory',
    difficulty: 'hard',
    description: `Why is \`WeakMap\` preferable to \`Map\` for associating metadata with DOM nodes that may be garbage-collected?`,
    options: [
      { key: 'A', text: 'WeakMap is faster because it uses a hash table while Map uses a linked list.', correct: false },
      { key: 'B', text: 'WeakMap holds weak references to its keys, allowing them to be garbage-collected when no other references exist; Map holds strong references, preventing GC.', correct: true },
      { key: 'C', text: 'WeakMap supports primitive keys whereas Map does not.', correct: false },
      { key: 'D', text: 'WeakMap is iterable and supports .forEach(), making it more convenient.', correct: false },
    ],
    explanation: `Answer: B

Map holds STRONG references to its keys. Even if all other code stops referencing a DOM node, the Map keeps it alive — causing a memory leak.

WeakMap holds WEAK references to keys (must be objects). When the DOM node is removed and no other strong reference exists, the GC can collect it. The WeakMap entry is also automatically removed.

  const meta = new WeakMap();
  let el = document.getElementById('btn');
  meta.set(el, { clicks: 0 });
  el = null; // The element can now be GC'd; WeakMap entry cleaned up automatically

Limitations of WeakMap: Not iterable, no .size, no .forEach. Use Map when you need iteration; use WeakMap for private or associated data tied to object lifetime.`,
  },

  {
    title: 'V8 & Memory: Mark-and-Sweep Garbage Collection',
    slug: 'js-memory-mark-and-sweep',
    track: 'JavaScript + Web',
    topic: 'V8 Engine & Memory',
    difficulty: 'medium',
    description: `How does the **mark-and-sweep** algorithm determine which objects to garbage-collect?`,
    options: [
      { key: 'A', text: 'It counts references to each object; when the count drops to zero, the object is freed.', correct: false },
      { key: 'B', text: 'It starts from GC roots (global object, call stack), marks all reachable objects, then sweeps (frees) everything unmarked.', correct: true },
      { key: 'C', text: 'It frees objects immediately after the function that created them returns.', correct: false },
      { key: 'D', text: 'It periodically duplicates the heap and discards the old copy.', correct: false },
    ],
    explanation: `Answer: B

Modern JS engines (including V8) use mark-and-sweep with generational refinements:

1. Mark phase: Start from GC roots (global scope, active call frames, closures). Traverse all reachable references recursively and MARK each object as "alive."
2. Sweep phase: Scan the entire heap; any UNMARKED object is freed.

Option A describes reference counting — the older algorithm. Its weakness is cyclic references (A -> B -> A keeps both counts above zero even with no external references). Mark-and-sweep handles cycles correctly.

V8 additionally uses generational GC (young/old heap) and incremental/concurrent marking to minimize pause times.`,
  },

  {
    title: 'V8 & Memory: Common JavaScript Memory Leaks',
    slug: 'js-memory-common-leaks',
    track: 'JavaScript + Web',
    topic: 'V8 Engine & Memory',
    difficulty: 'medium',
    description: `Which of the following is a common cause of **memory leaks** in JavaScript web applications?`,
    options: [
      { key: 'A', text: 'Using const instead of let for object declarations.', correct: false },
      { key: 'B', text: 'Attaching event listeners to DOM elements that are later removed without detaching those listeners.', correct: true },
      { key: 'C', text: 'Using arrow functions inside classes.', correct: false },
      { key: 'D', text: 'Declaring variables with var in strict mode.', correct: false },
    ],
    explanation: `Answer: B

A detached DOM node (removed from the document) would normally be eligible for GC. However, if an event listener (or any closure) still holds a reference to it, the GC cannot collect it — causing a memory leak.

Common memory leak sources:
1. Forgotten event listeners — use removeEventListener or AbortController to clean up.
2. Closures over large objects — the closure keeps the entire scope chain alive.
3. Global variables — act as permanent GC roots.
4. Detached DOM trees — stored in JS variables after removal from the document.
5. setInterval without clearInterval — the callback and everything it closes over stays alive.

Debugging: Use Chrome DevTools -> Memory -> Heap Snapshot to identify detached DOM trees.`,
  },

];

// ---------------------------------------------------------------------------
// DB Seeding Logic
// ---------------------------------------------------------------------------

async function seedJavaScriptTrack() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('\n🚀  Seeding JavaScript + Web MCQ track...\n');

    let inserted = 0;
    let updated = 0;

    for (const q of questions) {
      // 1. Upsert the problem row (ON CONFLICT on slug)
      const problemResult = await client.query(
        `INSERT INTO problems
           (title, slug, description, difficulty, problem_type, topic, explanation)
         VALUES ($1, $2, $3, $4, 'mcq', $5, $6)
         ON CONFLICT (slug) DO UPDATE SET
           title       = EXCLUDED.title,
           description = EXCLUDED.description,
           difficulty  = EXCLUDED.difficulty,
           topic       = EXCLUDED.topic,
           explanation = EXCLUDED.explanation
         RETURNING id, (xmax = 0) AS is_insert;`,
        [q.title, q.slug, q.description, q.difficulty, q.topic, q.explanation]
      );

      const { id: problemId, is_insert } = problemResult.rows[0];
      if (is_insert) inserted++; else updated++;

      // 2. Replace options: delete existing rows then re-insert.
      //    (mcq_options has no unique constraint on (problem_id, option_key),
      //     so we use DELETE + INSERT — still fully idempotent.)
      await client.query(
        `DELETE FROM mcq_options WHERE problem_id = $1;`,
        [problemId]
      );
      for (const opt of q.options) {
        await client.query(
          `INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct)
           VALUES ($1, $2, $3, $4);`,
          [problemId, opt.key, opt.text, opt.correct]
        );
      }

      const status = is_insert ? '✅ inserted' : '🔄 updated';
      console.log(`  ${status}  [${q.difficulty.padEnd(6)}] ${q.title}`);
    }

    await client.query('COMMIT');

    console.log('\n──────────────────────────────────────────────────────');
    console.log(`✔  Done!  ${inserted} inserted, ${updated} updated.`);
    console.log(`   Total: ${questions.length} JavaScript + Web MCQs seeded.`);
    console.log('──────────────────────────────────────────────────────\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌  Seed failed — transaction rolled back:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedJavaScriptTrack().catch((err) => {
  console.error(err);
  process.exit(1);
});

