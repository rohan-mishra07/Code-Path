/**
 * generate_questions.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Standalone Node CLI that seeds 100 high-yield placement MCQs into PostgreSQL.
 *
 * 5 tracks × 20 questions each:
 *   1. Java + DSA
 *   2. JavaScript + Web
 *   3. C++ + DSA
 *   4. Python + DSA
 *   5. Core CS Fundamentals
 *
 * Run:   node generate_questions.js
 * Flags: --track <name>   seed a single track only
 *        --dry-run        print questions without inserting
 *
 * Idempotent: ON CONFLICT (slug) DO UPDATE on problems;
 *             DELETE + INSERT per problem on mcq_options.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import pool from './db.js';
import dotenv from 'dotenv';
dotenv.config();

// ─── ANSI helpers ─────────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  dim:   '\x1b[2m',
  green: '\x1b[32m',
  cyan:  '\x1b[36m',
  yellow:'\x1b[33m',
  red:   '\x1b[31m',
  blue:  '\x1b[34m',
  magenta: '\x1b[35m',
};
const log  = (msg) => console.log(msg);
const ok   = (msg) => console.log(`  ${C.green}✅${C.reset} ${msg}`);
const upd  = (msg) => console.log(`  ${C.yellow}🔄${C.reset} ${msg}`);
const err  = (msg) => console.error(`  ${C.red}❌${C.reset} ${msg}`);
const head = (msg) => console.log(`\n${C.bold}${C.cyan}${msg}${C.reset}`);
const sep  = ()    => console.log(`${C.dim}${'─'.repeat(62)}${C.reset}`);

// ═════════════════════════════════════════════════════════════════════════════
//  TRACK 1 · Java + DSA  (20 questions)
// ═════════════════════════════════════════════════════════════════════════════
const JAVA_DSA = [
  {
    title: 'Java Collections: HashMap Internal Hashing',
    slug: 'java-hashmap-internal-hashing',
    track: 'Java + DSA',
    topic: 'Java Collections',
    difficulty: 'hard',
    description: `What is the default initial capacity and load factor of \`HashMap\` in Java, and what happens when the load factor threshold is breached?`,
    options: [
      { key: 'A', text: 'Capacity 16, load factor 0.75; the map doubles its capacity and rehashes all entries.', correct: true },
      { key: 'B', text: 'Capacity 10, load factor 0.5; the map grows by 50% and rehashes.', correct: false },
      { key: 'C', text: 'Capacity 16, load factor 1.0; the map doubles only when fully full.', correct: false },
      { key: 'D', text: 'Capacity 32, load factor 0.75; the map grows by 25%.', correct: false },
    ],
    explanation: `Answer: A

HashMap defaults: initial capacity = 16 buckets, load factor = 0.75.

When (size > capacity × loadFactor) = (12 entries in a 16-bucket map), a resize is triggered:
1. A new backing array of capacity × 2 (= 32) is allocated.
2. All existing entries are rehashed into the new array using the updated capacity mask.

In Java 8+, buckets with ≥8 entries are converted from a linked list to a red-black tree (treeification) to cap worst-case lookup at O(log n) instead of O(n).`,
  },
  {
    title: 'Java Collections: ArrayList vs LinkedList Time Complexity',
    slug: 'java-arraylist-vs-linkedlist',
    track: 'Java + DSA',
    topic: 'Java Collections',
    difficulty: 'medium',
    description: `Which operation has different time complexity between \`ArrayList\` and \`LinkedList\`?`,
    options: [
      { key: 'A', text: 'get(index) — O(1) for ArrayList, O(n) for LinkedList.', correct: true },
      { key: 'B', text: 'size() — O(1) for ArrayList, O(n) for LinkedList.', correct: false },
      { key: 'C', text: 'contains(obj) — O(1) for ArrayList, O(n) for LinkedList.', correct: false },
      { key: 'D', text: 'add(obj) at end — O(n) for ArrayList, O(1) for LinkedList.', correct: false },
    ],
    explanation: `Answer: A

ArrayList stores elements in a contiguous array → random access by index is O(1).
LinkedList is a doubly-linked list → reaching index i requires traversal from head (or tail) → O(n).

size() is O(1) for both (cached field). contains() is O(n) for both (linear scan). Amortized add() at the end is O(1) for ArrayList (occasional resize) and O(1) for LinkedList (tail pointer maintained).

Rule: Prefer ArrayList for read-heavy workloads; LinkedList for frequent insertions/deletions at known positions.`,
  },
  {
    title: 'Java Collections: TreeMap Ordering Guarantee',
    slug: 'java-treemap-ordering',
    track: 'Java + DSA',
    topic: 'Java Collections',
    difficulty: 'easy',
    description: `What ordering guarantee does \`TreeMap\` provide, and what data structure backs it?`,
    options: [
      { key: 'A', text: 'Insertion order; backed by a doubly-linked hash table.', correct: false },
      { key: 'B', text: 'Natural (or Comparator-defined) sorted order of keys; backed by a Red-Black tree.', correct: true },
      { key: 'C', text: 'Access order; backed by a min-heap.', correct: false },
      { key: 'D', text: 'Hash order (non-deterministic); backed by an array of buckets.', correct: false },
    ],
    explanation: `Answer: B

TreeMap implements NavigableMap and maintains keys in sorted order (natural ordering via Comparable, or a custom Comparator). It is backed by a self-balancing Red-Black tree.

All basic operations (get, put, remove, containsKey) run in O(log n).

Useful NavigableMap operations unique to TreeMap:
- firstKey() / lastKey()
- headMap(toKey) / tailMap(fromKey)
- floorKey(key) / ceilingKey(key)`,
  },
  {
    title: 'Java Multithreading: synchronized vs ReentrantLock',
    slug: 'java-synchronized-vs-reentrantlock',
    track: 'Java + DSA',
    topic: 'Multithreading',
    difficulty: 'hard',
    description: `Which feature does \`ReentrantLock\` provide that the \`synchronized\` keyword does NOT?`,
    options: [
      { key: 'A', text: 'Mutual exclusion across threads.', correct: false },
      { key: 'B', text: 'Ability to try acquiring the lock without blocking (tryLock()), and interruptible lock acquisition.', correct: true },
      { key: 'C', text: 'Automatic release of the lock when the block exits.', correct: false },
      { key: 'D', text: 'Prevention of data races between threads.', correct: false },
    ],
    explanation: `Answer: B

Both synchronized and ReentrantLock provide mutual exclusion and re-entrancy (the same thread can acquire the lock multiple times).

ReentrantLock extras:
- tryLock() — attempt lock non-blocking; returns false immediately if unavailable.
- tryLock(timeout, unit) — timed wait.
- lockInterruptibly() — the waiting thread can be interrupted.
- Multiple Condition objects (newCondition()) for finer-grained wait/notify.
- Fairness policy (new ReentrantLock(true)) — longest-waiting thread gets lock first.

Drawback: must always unlock() in a finally block; synchronized releases automatically.`,
  },
  {
    title: 'Java Multithreading: volatile Keyword',
    slug: 'java-volatile-keyword',
    track: 'Java + DSA',
    topic: 'Multithreading',
    difficulty: 'medium',
    description: `What does the \`volatile\` keyword guarantee in Java?`,
    options: [
      { key: 'A', text: 'Atomicity of compound operations like increment (i++).', correct: false },
      { key: 'B', text: 'Visibility: writes to a volatile variable are immediately visible to all threads; no CPU-cache stale reads.', correct: true },
      { key: 'C', text: 'That the variable is immutable after initialization.', correct: false },
      { key: 'D', text: 'Mutual exclusion — only one thread can read the variable at a time.', correct: false },
    ],
    explanation: `Answer: B

volatile guarantees the happens-before relationship for visibility: any write to a volatile field happens-before any subsequent read of that same field by any thread. This prevents CPU caches from serving stale values.

What volatile does NOT guarantee:
- Atomicity: i++ is read-modify-write — still a race without synchronization.
- Mutual exclusion: multiple threads can read/write simultaneously.

Use volatile for flags (boolean stop = false;) or single-writer scenarios. Use AtomicInteger / synchronized for compound operations.`,
  },
  {
    title: 'Java JVM: Stack vs Heap Memory',
    slug: 'java-jvm-stack-vs-heap',
    track: 'Java + DSA',
    topic: 'JVM Memory',
    difficulty: 'easy',
    description: `Which statement about JVM Stack and Heap memory is correct?`,
    options: [
      { key: 'A', text: 'Local variables and method call frames live on the Heap; objects live on the Stack.', correct: false },
      { key: 'B', text: 'Each thread has its own Stack (holding frames and local primitives); all objects live on the shared Heap.', correct: true },
      { key: 'C', text: 'Both Stack and Heap are shared across all threads.', correct: false },
      { key: 'D', text: 'Static variables live on the Stack and are garbage collected with each method call.', correct: false },
    ],
    explanation: `Answer: B

JVM Memory layout:
- Stack: per-thread; stores method call frames, local primitive variables, and object references (not the objects themselves). Automatically freed when a method returns. StackOverflowError if exhausted.
- Heap: shared across all threads; stores all object instances and arrays. Managed by the garbage collector.
- Metaspace (Java 8+): stores class metadata, static variables, and interned strings. Replaced PermGen.

Object references are on the Stack; the actual object data is on the Heap.`,
  },
  {
    title: 'Java JVM: Garbage Collection – G1GC',
    slug: 'java-jvm-g1gc',
    track: 'Java + DSA',
    topic: 'JVM Memory',
    difficulty: 'hard',
    description: `What is the primary design goal of the G1 (Garbage First) garbage collector?`,
    options: [
      { key: 'A', text: 'Maximize throughput with no pause-time target.', correct: false },
      { key: 'B', text: 'Predictable, bounded GC pause times by dividing the heap into equal-sized regions and prioritizing collection of regions with the most garbage.', correct: true },
      { key: 'C', text: 'Minimize memory footprint by compacting the heap after every minor GC.', correct: false },
      { key: 'D', text: 'Use a single-threaded stop-the-world collector for simplicity.', correct: false },
    ],
    explanation: `Answer: B

G1GC (default since Java 9) divides the heap into equal-sized regions (~1–32 MB each). Each region is dynamically designated as Eden, Survivor, or Old.

Key design traits:
- Concurrent marking runs alongside the application to identify live objects.
- Mixed collections collect the regions with the highest garbage ratio first ("Garbage First").
- Users set a soft pause-time target (-XX:MaxGCPauseMillis=200); G1 adjusts region count collected per cycle to meet it.

Contrast: Parallel GC maximizes throughput but has unpredictable pauses; ZGC/Shenandoah target sub-millisecond pauses.`,
  },
  {
    title: 'Java OOPs: Abstract Class vs Interface (Java 8+)',
    slug: 'java-abstract-class-vs-interface',
    track: 'Java + DSA',
    topic: 'OOPs',
    difficulty: 'medium',
    description: `In Java 8+, what is a key difference between an \`abstract class\` and an \`interface\`?`,
    options: [
      { key: 'A', text: 'Interfaces cannot have any method bodies; abstract classes can.', correct: false },
      { key: 'B', text: 'A class can extend only one abstract class but implement multiple interfaces.', correct: true },
      { key: 'C', text: 'Abstract classes support default methods; interfaces do not.', correct: false },
      { key: 'D', text: 'Interfaces can have instance fields; abstract classes cannot.', correct: false },
    ],
    explanation: `Answer: B

The single most important distinction remains: Java supports single class inheritance but multiple interface implementation.

Since Java 8, interfaces CAN have:
- default methods (with body) — for backward-compatible API evolution.
- static methods.
- private methods (Java 9+).

Abstract classes CAN have:
- Instance fields (state).
- Constructors.
- Any access modifier on methods.

Choose abstract class when you need shared state or constructor logic; choose interface for pure capability contracts that multiple unrelated classes can implement.`,
  },
  {
    title: 'Java OOPs: Method Overriding Rules',
    slug: 'java-method-overriding-rules',
    track: 'Java + DSA',
    topic: 'OOPs',
    difficulty: 'medium',
    description: `Which rule MUST be followed when overriding a method in Java?`,
    options: [
      { key: 'A', text: 'The overriding method must throw the same checked exceptions as the parent.', correct: false },
      { key: 'B', text: 'The overriding method must have the same name, parameter list, and a return type that is the same or a covariant subtype.', correct: true },
      { key: 'C', text: 'The overriding method must have the same access modifier as the parent.', correct: false },
      { key: 'D', text: 'The overriding method must be marked with @Override annotation.', correct: false },
    ],
    explanation: `Answer: B

Override rules:
✅ Same method name.
✅ Same parameter list (signature).
✅ Return type: same or covariant (a subtype of the parent's return type) — e.g., parent returns Animal, child can return Dog.
✅ Access: must be same or more permissive (can widen from protected to public, not narrow).
✅ Checked exceptions: can throw fewer/narrower checked exceptions, not new or broader ones.

@Override is highly recommended (it makes the compiler catch mistakes) but is NOT mandatory.

static and private methods cannot be overridden — they are hidden or bound at compile time.`,
  },
  {
    title: 'Java DSA: Binary Search Condition',
    slug: 'java-dsa-binary-search',
    track: 'Java + DSA',
    topic: 'DSA',
    difficulty: 'easy',
    description: `What is the correct loop condition for iterative binary search to avoid infinite loops and off-by-one errors?`,
    options: [
      { key: 'A', text: 'while (low < high)', correct: false },
      { key: 'B', text: 'while (low <= high)', correct: true },
      { key: 'C', text: 'while (low != high)', correct: false },
      { key: 'D', text: 'while (low < high - 1)', correct: false },
    ],
    explanation: `Answer: B — while (low <= high)

Using low <= high means the search space includes a single-element subarray (low == high), which is the terminating base case where that element must be checked.

Using low < high stops one element early — you miss the case where the target is that last element.

Safe midpoint calculation to prevent integer overflow:
  int mid = low + (high - low) / 2;
  // NOT: (low + high) / 2 — can overflow for large int values

Time complexity: O(log n). Space: O(1) iterative, O(log n) recursive (call stack).`,
  },
  {
    title: 'Java DSA: Quick Sort Worst Case',
    slug: 'java-dsa-quicksort-worst-case',
    track: 'Java + DSA',
    topic: 'DSA',
    difficulty: 'medium',
    description: `When does QuickSort degrade to O(n²) time complexity?`,
    options: [
      { key: 'A', text: 'When the array is randomly shuffled.', correct: false },
      { key: 'B', text: 'When the pivot consistently chosen is the largest or smallest element (e.g., sorted or reverse-sorted arrays with first/last element pivot).', correct: true },
      { key: 'C', text: 'When all elements are equal.', correct: false },
      { key: 'D', text: 'When the array size exceeds 1 million elements.', correct: false },
    ],
    explanation: `Answer: B

QuickSort's worst case is O(n²) when the pivot creates maximally unbalanced partitions — one side has 0 elements, the other has n-1. This happens when sorting an already-sorted (or reverse-sorted) array with a naive first/last element pivot.

Mitigation strategies:
- Median-of-three pivot (choose median of first, middle, last elements).
- Random pivot selection.
- Three-way partitioning (Dutch National Flag) for arrays with many duplicates.

Java's Arrays.sort() uses Dual-Pivot Quicksort for primitives (O(n log n) in practice) and TimSort (merge sort hybrid) for objects.`,
  },
  {
    title: 'Java DSA: HashMap vs HashSet',
    slug: 'java-dsa-hashmap-vs-hashset',
    track: 'Java + DSA',
    topic: 'DSA',
    difficulty: 'easy',
    description: `How is \`HashSet\` internally implemented in Java?`,
    options: [
      { key: 'A', text: 'As a LinkedList of unique elements.', correct: false },
      { key: 'B', text: 'As a HashMap where each element is stored as a key and a dummy constant object (PRESENT) is the value.', correct: true },
      { key: 'C', text: 'As a sorted TreeMap for O(log n) lookups.', correct: false },
      { key: 'D', text: 'As a BitSet for compact memory storage.', correct: false },
    ],
    explanation: `Answer: B

HashSet<E> is backed by a HashMap<E, Object> where the value is always a static dummy object:
  private static final Object PRESENT = new Object();

When you call set.add(x), it calls map.put(x, PRESENT). contains(x) calls map.containsKey(x).

This means HashSet inherits all HashMap properties:
- O(1) average add/remove/contains.
- No guaranteed iteration order.
- Allows null (one null element).
- Not thread-safe (use Collections.synchronizedSet or CopyOnWriteArraySet for concurrency).`,
  },
  {
    title: 'Java Multithreading: Deadlock Conditions',
    slug: 'java-deadlock-conditions',
    track: 'Java + DSA',
    topic: 'Multithreading',
    difficulty: 'hard',
    description: `Which set of conditions must ALL be simultaneously true for a deadlock to occur?`,
    options: [
      { key: 'A', text: 'Mutual exclusion, Hold and wait, No preemption, Circular wait.', correct: true },
      { key: 'B', text: 'Race condition, Starvation, Priority inversion.', correct: false },
      { key: 'C', text: 'Shared memory, Multiple threads, Synchronized methods.', correct: false },
      { key: 'D', text: 'Lock ordering, Busy waiting, Thread priority.', correct: false },
    ],
    explanation: `Answer: A — Coffman Conditions (1971)

All four must hold simultaneously for deadlock:
1. Mutual exclusion: resources cannot be shared simultaneously.
2. Hold and wait: a thread holds at least one resource while waiting for more.
3. No preemption: resources cannot be forcibly taken from a thread.
4. Circular wait: a cycle exists in the resource-allocation graph (T1 waits for T2's resource, T2 waits for T1's resource).

Prevention: break any ONE condition.
- Acquire locks in a consistent global order (breaks circular wait).
- Use tryLock() with timeout (breaks hold-and-wait or no-preemption).`,
  },
  {
    title: 'Java JVM: String Pool Interning',
    slug: 'java-string-pool-interning',
    track: 'Java + DSA',
    topic: 'JVM Memory',
    difficulty: 'medium',
    description: `What does the following code print?

\`\`\`java
String a = "hello";
String b = "hello";
String c = new String("hello");
System.out.println(a == b);
System.out.println(a == c);
System.out.println(a == c.intern());
\`\`\``,
    options: [
      { key: 'A', text: 'true, true, true', correct: false },
      { key: 'B', text: 'true, false, true', correct: true },
      { key: 'C', text: 'false, false, false', correct: false },
      { key: 'D', text: 'true, false, false', correct: false },
    ],
    explanation: `Answer: B — true, false, true

String literals are interned automatically in the String Pool (Metaspace in Java 8+):
- a and b both point to the same pooled "hello" object → a == b is true.
- new String("hello") always creates a new Heap object outside the pool → a == c is false.
- c.intern() returns the pooled reference → a == c.intern() is true.

Always compare String content with .equals(), not ==.
== checks reference identity; .equals() checks character-by-character value equality.`,
  },
  {
    title: 'Java OOPs: Polymorphism — Dynamic Dispatch',
    slug: 'java-polymorphism-dynamic-dispatch',
    track: 'Java + DSA',
    topic: 'OOPs',
    difficulty: 'medium',
    description: `What is printed?

\`\`\`java
class Animal { String sound() { return "..."; } }
class Dog extends Animal { String sound() { return "Woof"; } }

Animal a = new Dog();
System.out.println(a.sound());
\`\`\``,
    options: [
      { key: 'A', text: '...', correct: false },
      { key: 'B', text: 'Woof', correct: true },
      { key: 'C', text: 'Compilation error', correct: false },
      { key: 'D', text: 'Runtime error', correct: false },
    ],
    explanation: `Answer: B — "Woof"

This is runtime polymorphism (dynamic method dispatch). Java resolves virtual method calls based on the actual runtime type of the object, not the declared reference type.

a is declared as Animal but actually holds a Dog instance. When a.sound() is called, the JVM uses the vtable to dispatch to Dog.sound() at runtime.

Contrast with field access — fields are bound at compile time based on the reference type:
  class A { int x = 1; }
  class B extends A { int x = 2; }
  A obj = new B();
  System.out.println(obj.x); // prints 1 (compile-time binding)`,
  },
  {
    title: 'Java DSA: Stack using Two Queues',
    slug: 'java-dsa-stack-two-queues',
    track: 'Java + DSA',
    topic: 'DSA',
    difficulty: 'hard',
    description: `When implementing a Stack using two Queues with O(1) push and O(n) pop, what is the strategy for the pop operation?`,
    options: [
      { key: 'A', text: 'Dequeue all elements from Q1 into Q2 except the last one, return the last one, then swap Q1 and Q2.', correct: true },
      { key: 'B', text: 'Enqueue all elements of Q2 into Q1, then dequeue the front of Q1.', correct: false },
      { key: 'C', text: 'Use a recursive call to remove the tail of Q1 directly.', correct: false },
      { key: 'D', text: 'Use Java\'s PriorityQueue with timestamps as priority to simulate LIFO order.', correct: false },
    ],
    explanation: `Answer: A

Strategy for O(1) push / O(n) pop:
- push(x): simply enqueue x to Q1. O(1).
- pop(): move all but the last element from Q1 to Q2, record the last element as the result, then swap Q1 and Q2 references. O(n).

Alternatively: O(n) push / O(1) pop — on push, enqueue to Q2, then transfer all of Q1 into Q2, then swap. This makes pop just a dequeue of Q1's front.

The tradeoff is which operation you want to be cheap. Interview tip: state the tradeoff explicitly.`,
  },
  {
    title: 'Java Collections: ConcurrentHashMap vs Hashtable',
    slug: 'java-concurrenthashmap-vs-hashtable',
    track: 'Java + DSA',
    topic: 'Java Collections',
    difficulty: 'hard',
    description: `How does \`ConcurrentHashMap\` improve concurrency compared to \`Hashtable\`?`,
    options: [
      { key: 'A', text: 'ConcurrentHashMap has no synchronization and relies on the caller to synchronize.', correct: false },
      { key: 'B', text: 'ConcurrentHashMap uses segment-level (Java 7) or node-level CAS + bin locking (Java 8+) locking, allowing concurrent reads and partial writes without locking the entire map.', correct: true },
      { key: 'C', text: 'ConcurrentHashMap locks the entire map on every read and write, same as Hashtable but with better default capacity.', correct: false },
      { key: 'D', text: 'ConcurrentHashMap stores entries in a sorted order to reduce contention.', correct: false },
    ],
    explanation: `Answer: B

Hashtable: synchronizes every method on the entire object — only one thread can operate at a time. Severe bottleneck.

ConcurrentHashMap (Java 8+): uses a combination of:
- volatile reads for get() — no locking at all for reads.
- CAS (Compare-And-Swap) for inserts into empty bins.
- synchronized on individual bin head nodes only for structural changes.

This allows full concurrent reads and highly concurrent writes (only threads writing to the same bin contend). Default concurrency level is effectively the number of CPUs.

Never use Hashtable in new code — use ConcurrentHashMap or Collections.synchronizedMap().`,
  },
  {
    title: 'Java DSA: Graph BFS vs DFS Use Cases',
    slug: 'java-dsa-bfs-vs-dfs',
    track: 'Java + DSA',
    topic: 'DSA',
    difficulty: 'easy',
    description: `Which algorithm is best suited for finding the shortest path in an unweighted graph?`,
    options: [
      { key: 'A', text: 'DFS — it explores deep paths first and backtracks.', correct: false },
      { key: 'B', text: 'BFS — it explores all neighbors at distance d before moving to d+1, guaranteeing the shortest path.', correct: true },
      { key: 'C', text: 'Dijkstra\'s — it is required even for unweighted graphs.', correct: false },
      { key: 'D', text: 'Bellman-Ford — it handles negative weights and is used for shortest paths.', correct: false },
    ],
    explanation: `Answer: B

BFS (Breadth-First Search) uses a queue and explores all nodes at the current depth before going deeper. In an unweighted graph where each edge has equal cost, the first time BFS reaches a node is guaranteed to be via the shortest path (fewest edges).

DFS may find a path to the target, but it is not guaranteed to be the shortest.

For weighted graphs:
- All positive weights → Dijkstra's (O((V+E) log V) with a min-heap).
- Negative weights (no negative cycles) → Bellman-Ford O(VE).
- All-pairs shortest paths → Floyd-Warshall O(V³).`,
  },
  {
    title: 'Java OOPs: Composition vs Inheritance',
    slug: 'java-composition-vs-inheritance',
    track: 'Java + DSA',
    topic: 'OOPs',
    difficulty: 'medium',
    description: `Why is "Favor Composition over Inheritance" a widely recommended design principle?`,
    options: [
      { key: 'A', text: 'Composition is faster at runtime because method calls are inlined by the JIT.', correct: false },
      { key: 'B', text: 'Composition achieves code reuse without tight coupling; changing a composed class does not break the outer class, and behavior can be changed at runtime.', correct: true },
      { key: 'C', text: 'Inheritance supports multiple parents in Java, making it more flexible than composition.', correct: false },
      { key: 'D', text: 'Composition eliminates the need for interfaces.', correct: false },
    ],
    explanation: `Answer: B

Inheritance creates tight coupling: a subclass depends on parent implementation details. If the parent changes an internal method, it can silently break the subclass (the "fragile base class" problem).

Composition (HAS-A): the outer class delegates to a contained object. Benefits:
- Loose coupling — outer class only depends on the composed class's public API.
- Runtime flexibility — the composed object can be swapped (e.g., dependency injection).
- No restriction on final classes — you can compose final classes but not extend them.

Example: Instead of extending ArrayList to make a custom list, compose an ArrayList inside your class and expose only the needed operations.`,
  },
  {
    title: 'Java JVM: JIT Compilation',
    slug: 'java-jvm-jit-compilation',
    track: 'Java + DSA',
    topic: 'JVM Memory',
    difficulty: 'medium',
    description: `What is the role of the JIT (Just-In-Time) compiler in the JVM?`,
    options: [
      { key: 'A', text: 'It compiles Java source (.java) files into bytecode (.class) files ahead of time.', correct: false },
      { key: 'B', text: 'It identifies frequently executed bytecode ("hot spots") at runtime and compiles them to native machine code, significantly improving performance.', correct: true },
      { key: 'C', text: 'It interprets bytecode line-by-line without producing native code.', correct: false },
      { key: 'D', text: 'It manages garbage collection and heap compaction.', correct: false },
    ],
    explanation: `Answer: B

JVM execution pipeline:
1. javac compiles source → bytecode (.class).
2. JVM initially interprets bytecode (slow but quick to start).
3. The JIT compiler (C1 + C2 in HotSpot) profiles execution and identifies "hot" methods called frequently.
4. Hot methods are compiled to optimized native machine code (stored in the Code Cache).
5. Future calls execute native code directly → orders-of-magnitude faster.

JIT optimizations include inlining, loop unrolling, escape analysis, dead-code elimination.
GraalVM's AOT (native-image) compiles everything ahead of time for instant startup but sacrifices some peak throughput optimizations.`,
  },
];

// ═════════════════════════════════════════════════════════════════════════════
//  TRACK 2 · JavaScript + Web  (20 questions)
// ═════════════════════════════════════════════════════════════════════════════
const JS_WEB = [
  {
    title: 'JS Event Loop: Task Queue Priority',
    slug: 'js-web-task-queue-priority',
    track: 'JavaScript + Web',
    topic: 'Event Loop',
    difficulty: 'hard',
    description: `In what order are these callbacks executed?

\`\`\`js
setTimeout(() => console.log('T'), 0);
requestAnimationFrame(() => console.log('R'));
Promise.resolve().then(() => console.log('P'));
queueMicrotask(() => console.log('M'));
console.log('S');
\`\`\``,
    options: [
      { key: 'A', text: 'S, P, M, T, R', correct: false },
      { key: 'B', text: 'S, P, M, R, T (RAF before setTimeout in most browsers)', correct: true },
      { key: 'C', text: 'S, T, R, P, M', correct: false },
      { key: 'D', text: 'S, M, P, T, R', correct: false },
    ],
    explanation: `Answer: B — S, P, M, R, T

Priority order in browsers:
1. Synchronous code → S.
2. Microtask queue (drained completely): Promise.then → P, then queueMicrotask → M.
3. Rendering callbacks (requestAnimationFrame) → R (browser-specific, before next paint).
4. Macrotask queue (setTimeout) → T.

Note: RAF fires before the browser paints and is generally scheduled before the setTimeout macrotask in most browser implementations, though this is not strictly spec-mandated. In Node.js, RAF does not exist.`,
  },
  {
    title: 'JS Closures: Stale Closure in React',
    slug: 'js-web-stale-closure-react',
    track: 'JavaScript + Web',
    topic: 'Closures',
    difficulty: 'hard',
    description: `In React, why does the following interval always print 0?

\`\`\`js
function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => console.log(count), 1000);
    return () => clearInterval(id);
  }, []); // empty deps
  return <button onClick={() => setCount(c => c + 1)}>+</button>;
}
\`\`\``,
    options: [
      { key: 'A', text: 'setInterval is broken in React.', correct: false },
      { key: 'B', text: 'The closure captures count = 0 at mount time. Because the deps array is empty, the effect never re-runs, so count is always the stale initial value.', correct: true },
      { key: 'C', text: 'useState resets count to 0 on every render.', correct: false },
      { key: 'D', text: 'console.log inside setInterval always receives undefined.', correct: false },
    ],
    explanation: `Answer: B — Stale closure

The effect runs once (empty [] deps). The setInterval callback closes over count = 0 from that first render. Even as state updates cause re-renders, the interval callback never gets a new closure — it always reads the captured 0.

Fix: use a ref to hold the latest value:
  const countRef = useRef(count);
  useEffect(() => { countRef.current = count; });
  useEffect(() => {
    const id = setInterval(() => console.log(countRef.current), 1000);
    return () => clearInterval(id);
  }, []);`,
  },
  {
    title: 'JS DOM: Event Delegation',
    slug: 'js-web-event-delegation',
    track: 'JavaScript + Web',
    topic: 'DOM/Web APIs',
    difficulty: 'medium',
    description: `What is the advantage of event delegation over attaching listeners to individual elements?`,
    options: [
      { key: 'A', text: 'It prevents event propagation entirely.', correct: false },
      { key: 'B', text: 'A single listener on a parent element handles events from all current and future child elements, reducing memory usage and setup time.', correct: true },
      { key: 'C', text: 'It makes events fire in capture phase instead of bubble phase.', correct: false },
      { key: 'D', text: 'It allows multiple handlers on the same element without conflicts.', correct: false },
    ],
    explanation: `Answer: B

Event delegation exploits event bubbling: events fired on a child bubble up through ancestors. By placing one listener on a parent (e.g., a <ul>), you handle clicks on all current and future <li> children.

Benefits:
1. Memory: one listener vs N listeners.
2. Dynamic elements: new children added later are automatically covered.
3. Simpler setup/teardown.

Pattern:
  ul.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') { /* handle */ }
  });

Use e.target to identify the actual element clicked, and e.currentTarget for the delegating parent.`,
  },
  {
    title: 'JS Async: Async Iterator Pattern',
    slug: 'js-web-async-iterator',
    track: 'JavaScript + Web',
    topic: 'Async patterns',
    difficulty: 'hard',
    description: `What does \`for await...of\` iterate over?`,
    options: [
      { key: 'A', text: 'Any object with a [Symbol.iterator] method.', correct: false },
      { key: 'B', text: 'Any object with a [Symbol.asyncIterator] method that returns an async iterator yielding Promises.', correct: true },
      { key: 'C', text: 'Arrays of Promises passed to Promise.all.', correct: false },
      { key: 'D', text: 'Only Node.js readable streams.', correct: false },
    ],
    explanation: `Answer: B

for await...of works with async iterables — objects that implement [Symbol.asyncIterator]. Each iteration awaits the Promise returned by iterator.next().

Example with an async generator:
  async function* paginate(url) {
    let page = 1;
    while (true) {
      const data = await fetch(url + '?page=' + page++).then(r => r.json());
      if (!data.length) return;
      yield data;
    }
  }

  for await (const batch of paginate('/api/items')) {
    console.log(batch);
  }

Node.js readable streams implement asyncIterator, so you can: for await (const chunk of stream) {}.`,
  },
  {
    title: 'JS Prototype: __proto__ vs prototype',
    slug: 'js-web-proto-vs-prototype',
    track: 'JavaScript + Web',
    topic: 'Prototype',
    difficulty: 'medium',
    description: `What is the difference between \`__proto__\` and \`prototype\`?`,
    options: [
      { key: 'A', text: 'They are interchangeable synonyms.', correct: false },
      { key: 'B', text: '__proto__ is the internal [[Prototype]] link on every object instance; prototype is a property of constructor functions used to set up the [[Prototype]] of instances created with new.', correct: true },
      { key: 'C', text: 'prototype is used on all objects; __proto__ only exists on functions.', correct: false },
      { key: 'D', text: '__proto__ is deprecated and replaced by prototype in ES6.', correct: false },
    ],
    explanation: `Answer: B

Every object has an internal [[Prototype]] slot (accessible via __proto__ or Object.getPrototypeOf()). This forms the lookup chain for property access.

Constructor functions have a .prototype property (an object). When you do new Fn(), the newly created object's [[Prototype]] is set to Fn.prototype.

  function Dog() {}
  const d = new Dog();
  d.__proto__ === Dog.prototype        // true
  Object.getPrototypeOf(d) === Dog.prototype // true (preferred)

__proto__ is standardized in ES2015 Annex B but using Object.getPrototypeOf/setPrototypeOf is recommended over __proto__.`,
  },
  {
    title: 'JS Web APIs: localStorage vs sessionStorage vs Cookie',
    slug: 'js-web-storage-types',
    track: 'JavaScript + Web',
    topic: 'DOM/Web APIs',
    difficulty: 'easy',
    description: `Which Web storage mechanism persists data across browser restarts AND is sent to the server with every HTTP request?`,
    options: [
      { key: 'A', text: 'localStorage', correct: false },
      { key: 'B', text: 'sessionStorage', correct: false },
      { key: 'C', text: 'Cookie', correct: true },
      { key: 'D', text: 'IndexedDB', correct: false },
    ],
    explanation: `Answer: C — Cookie

Comparison:
| Feature        | localStorage | sessionStorage | Cookie |
|----------------|-------------|---------------|--------|
| Persists       | Until cleared | Tab lifetime | Expiry date |
| Sent to server | No          | No            | Yes (every request) |
| Capacity       | ~5 MB       | ~5 MB         | ~4 KB |
| JS accessible  | Yes         | Yes           | Yes (unless HttpOnly) |

Cookies with HttpOnly flag are invisible to JavaScript — only sent via HTTP headers, making them secure for session tokens. Use localStorage for client-only non-sensitive data; use HttpOnly cookies for auth tokens.`,
  },
  {
    title: 'JS Closures: Partial Application with bind',
    slug: 'js-web-partial-application-bind',
    track: 'JavaScript + Web',
    topic: 'Closures',
    difficulty: 'medium',
    description: `What does the following output?

\`\`\`js
function multiply(a, b) { return a * b; }
const double = multiply.bind(null, 2);
console.log(double(5));
console.log(double(10));
\`\`\``,
    options: [
      { key: 'A', text: 'NaN, NaN', correct: false },
      { key: 'B', text: '10, 20', correct: true },
      { key: 'C', text: '7, 12', correct: false },
      { key: 'D', text: '2, 2', correct: false },
    ],
    explanation: `Answer: B — 10, 20

bind(null, 2) creates a new function with the first argument (a) permanently fixed to 2. Subsequent calls supply the remaining arguments.

double(5)  → multiply(2, 5)  = 10
double(10) → multiply(2, 10) = 20

null is passed as the this context because multiply doesn't use this. This is partial application (pre-filling some arguments). Currying is a related concept where a function is transformed to accept one argument at a time: f(a)(b).`,
  },
  {
    title: 'JS Async: Generator as Coroutine',
    slug: 'js-web-generator-coroutine',
    track: 'JavaScript + Web',
    topic: 'Async patterns',
    difficulty: 'hard',
    description: `What is printed by the following code?

\`\`\`js
function* gen() {
  const x = yield 1;
  const y = yield x + 2;
  return y * 3;
}
const g = gen();
console.log(g.next());
console.log(g.next(10));
console.log(g.next(5));
\`\`\``,
    options: [
      { key: 'A', text: '{value:1,done:false}, {value:12,done:false}, {value:15,done:true}', correct: true },
      { key: 'B', text: '{value:1,done:false}, {value:3,done:false}, {value:15,done:true}', correct: false },
      { key: 'C', text: '{value:1,done:false}, {value:12,done:false}, {value:5,done:true}', correct: false },
      { key: 'D', text: '{value:undefined,done:false} three times', correct: false },
    ],
    explanation: `Answer: A

Generator execution:
1. g.next() → runs until first yield 1; returns {value:1, done:false}.
2. g.next(10) → resumes; the value 10 is sent IN as the result of yield (x = 10). Runs to yield x+2 = yield 12; returns {value:12, done:false}.
3. g.next(5) → resumes; y = 5. Executes return 5*3 = 15; returns {value:15, done:true}.

Key: the argument to next() after the first call becomes the VALUE of the yield expression inside the generator. The first next() argument is always ignored.`,
  },
  {
    title: 'JS DOM: Virtual DOM Concept',
    slug: 'js-web-virtual-dom',
    track: 'JavaScript + Web',
    topic: 'DOM/Web APIs',
    difficulty: 'medium',
    description: `What problem does the Virtual DOM (used by React) solve?`,
    options: [
      { key: 'A', text: 'It prevents all DOM mutations and makes pages static.', correct: false },
      { key: 'B', text: 'It batches and minimizes expensive real DOM mutations by first computing diffs on a lightweight in-memory tree representation.', correct: true },
      { key: 'C', text: 'It replaces the browser DOM entirely with a canvas-based rendering engine.', correct: false },
      { key: 'D', text: 'It pre-renders HTML on the server and sends it to the client.', correct: false },
    ],
    explanation: `Answer: B

Direct DOM manipulation is expensive (causes reflows/repaints). React's Virtual DOM:
1. Maintains a lightweight JS object tree mirroring the real DOM.
2. On state change, renders a NEW virtual tree.
3. Diffs the old and new virtual trees ("reconciliation") using a heuristic O(n) algorithm.
4. Applies ONLY the minimal set of real DOM mutations needed.

React Fiber (React 16+) makes reconciliation interruptible, enabling concurrent rendering and prioritized updates. Svelte and Solid.js achieve similar performance by compiling away the virtual DOM entirely.`,
  },
  {
    title: 'JS Prototype: Mixin Pattern',
    slug: 'js-web-mixin-pattern',
    track: 'JavaScript + Web',
    topic: 'Prototype',
    difficulty: 'medium',
    description: `What is the purpose of the mixin pattern in JavaScript?`,
    options: [
      { key: 'A', text: 'To create deep copies of objects for immutability.', correct: false },
      { key: 'B', text: 'To compose reusable behaviors into a class without using inheritance, working around single-class-extension limits.', correct: true },
      { key: 'C', text: 'To serialize objects to JSON and back.', correct: false },
      { key: 'D', text: 'To freeze an object and prevent property additions.', correct: false },
    ],
    explanation: `Answer: B

JavaScript only allows extending one class. Mixins let you compose behaviors from multiple sources:

  const Serializable = (Base) => class extends Base {
    serialize() { return JSON.stringify(this); }
  };
  const Validatable = (Base) => class extends Base {
    validate() { return !!this.name; }
  };

  class User extends Serializable(Validatable(EventEmitter)) {
    constructor(name) { super(); this.name = name; }
  }

Or simpler object-based mixins via Object.assign(Target.prototype, mixinObj).

Mixins are the functional equivalent of multiple inheritance without the diamond problem.`,
  },
  {
    title: 'JS Web Performance: Debounce vs Throttle',
    slug: 'js-web-debounce-vs-throttle',
    track: 'JavaScript + Web',
    topic: 'DOM/Web APIs',
    difficulty: 'medium',
    description: `What is the difference between debounce and throttle?`,
    options: [
      { key: 'A', text: 'Debounce fires at most once per interval; throttle delays the first call.', correct: false },
      { key: 'B', text: 'Debounce postpones execution until after a quiet period; throttle ensures execution at most once per time interval regardless of call frequency.', correct: true },
      { key: 'C', text: 'They are identical — both rate-limit function calls.', correct: false },
      { key: 'D', text: 'Throttle is only for network requests; debounce is only for UI events.', correct: false },
    ],
    explanation: `Answer: B

Debounce: "wait until calls stop." Resets a timer on every call; executes only after the calls cease for a defined delay.
- Use case: search-as-you-type (only fetch after user stops typing for 300ms).

Throttle: "execute at most once per interval." First call fires immediately; subsequent calls within the window are ignored.
- Use case: scroll event handlers, resize listeners (process at most once per 100ms).

Quick memory aid:
- Debounce → trailing edge (after silence).
- Throttle → leading edge (first call, then cooldown).`,
  },
  {
    title: 'JS Async: AbortController for Fetch Cancellation',
    slug: 'js-web-abort-controller',
    track: 'JavaScript + Web',
    topic: 'Async patterns',
    difficulty: 'medium',
    description: `How do you cancel an in-flight \`fetch()\` request in modern JavaScript?`,
    options: [
      { key: 'A', text: 'Call fetch.cancel() on the returned Promise.', correct: false },
      { key: 'B', text: 'Use AbortController: pass its signal to fetch; call controller.abort() to cancel.', correct: true },
      { key: 'C', text: 'Set a timeout with setTimeout and ignore the response.', correct: false },
      { key: 'D', text: 'Reject the fetch Promise manually with Promise.reject().', correct: false },
    ],
    explanation: `Answer: B

  const controller = new AbortController();
  const { signal } = controller;

  fetch('/api/data', { signal })
    .then(res => res.json())
    .catch(err => {
      if (err.name === 'AbortError') console.log('Fetch cancelled');
    });

  // Cancel after 5 seconds
  setTimeout(() => controller.abort(), 5000);

AbortController works with fetch, EventListener (addEventListener(type, fn, { signal })), and any API that accepts AbortSignal. AbortSignal.timeout(ms) (Node 17.3+, modern browsers) creates a signal that auto-aborts after a delay.`,
  },
  {
    title: 'JS Event Loop: Microtask Starvation',
    slug: 'js-web-microtask-starvation',
    track: 'JavaScript + Web',
    topic: 'Event Loop',
    difficulty: 'hard',
    description: `What happens if microtasks schedule new microtasks indefinitely?`,
    options: [
      { key: 'A', text: 'The browser automatically interleaves macrotasks to prevent freezing.', correct: false },
      { key: 'B', text: 'The microtask queue is drained completely before the next macrotask, causing the page to freeze (microtask starvation of the event loop).', correct: true },
      { key: 'C', text: 'After 1000 microtasks, the engine automatically yields to the event loop.', correct: false },
      { key: 'D', text: 'New microtasks are queued after the next macrotask.', correct: false },
    ],
    explanation: `Answer: B

The event loop guarantees to drain the entire microtask queue before processing the next macrotask. If each microtask queues another microtask, the queue never empties → the render step and macrotasks are starved → the UI freezes.

  function flood() {
    Promise.resolve().then(flood); // infinite microtask chain
  }
  flood(); // page becomes unresponsive

This is similar to an infinite synchronous loop but using the microtask queue. Use setTimeout for breaking long work into chunks — it yields to the event loop between chunks (e.g., scheduler.postTask or requestIdleCallback for low-priority work).`,
  },
  {
    title: 'JS DOM: Shadow DOM and Web Components',
    slug: 'js-web-shadow-dom',
    track: 'JavaScript + Web',
    topic: 'DOM/Web APIs',
    difficulty: 'hard',
    description: `What is the primary benefit of Shadow DOM in Web Components?`,
    options: [
      { key: 'A', text: 'It makes elements invisible to screen readers, improving accessibility.', correct: false },
      { key: 'B', text: 'It provides style and DOM encapsulation — CSS inside the shadow root does not leak out, and external CSS does not bleed in.', correct: true },
      { key: 'C', text: 'It renders components server-side automatically.', correct: false },
      { key: 'D', text: 'It enables faster rendering by bypassing the layout engine.', correct: false },
    ],
    explanation: `Answer: B

Shadow DOM creates a separate, encapsulated DOM subtree (shadow root) attached to a host element:
  const shadow = element.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<style>p { color: red; }</style><p>Hello</p>';

Encapsulation:
- Styles defined inside the shadow root apply only within it.
- Global CSS (body, .btn) does not affect shadow DOM elements.
- Shadow DOM elements are not accessible via document.querySelector — use element.shadowRoot.querySelector.

This solves CSS global namespace collisions in large apps. Frameworks like React and Vue achieve similar isolation via CSS modules or scoped styles, without native Shadow DOM.`,
  },
  {
    title: 'JS Closures: Module Pattern for Encapsulation',
    slug: 'js-web-module-pattern',
    track: 'JavaScript + Web',
    topic: 'Closures',
    difficulty: 'medium',
    description: `In ES Modules, what is the difference between a named export and a default export?`,
    options: [
      { key: 'A', text: 'Named exports can only export functions; default exports can export anything.', correct: false },
      { key: 'B', text: 'A module can have multiple named exports but only one default export; named exports must be imported with the exact exported name (or aliased with "as").', correct: true },
      { key: 'C', text: 'Default exports are tree-shakeable; named exports are not.', correct: false },
      { key: 'D', text: 'Named exports are deprecated in favor of default exports in ES2022.', correct: false },
    ],
    explanation: `Answer: B

Named exports:
  export const PI = 3.14;
  export function add(a, b) { return a + b; }
  // import: import { PI, add } from './math.js';
  // alias:  import { add as sum } from './math.js';

Default export (one per module):
  export default class Calculator { ... }
  // import: import Calculator from './Calculator.js'; (any name)

Tree shaking (dead code elimination by bundlers like Webpack/Rollup) works with BOTH named and default exports, as long as the module is side-effect-free. Named exports are generally preferred for libraries because they give bundlers more information for tree shaking.`,
  },
  {
    title: 'JS Prototype: Symbol.iterator and Custom Iterables',
    slug: 'js-web-symbol-iterator',
    track: 'JavaScript + Web',
    topic: 'Prototype',
    difficulty: 'hard',
    description: `How do you make a custom object work with \`for...of\` loops?`,
    options: [
      { key: 'A', text: 'Extend the Array class.', correct: false },
      { key: 'B', text: 'Implement the [Symbol.iterator]() method that returns an object with a next() method returning {value, done}.', correct: true },
      { key: 'C', text: 'Add a forEach() method to the object.', correct: false },
      { key: 'D', text: 'Use Object.defineProperty to make properties enumerable.', correct: false },
    ],
    explanation: `Answer: B

Any object with [Symbol.iterator]() is iterable and works with for...of, spread (...), destructuring, and Array.from().

  const range = {
    from: 1, to: 5,
    [Symbol.iterator]() {
      let current = this.from;
      const last = this.to;
      return {
        next() {
          return current <= last
            ? { value: current++, done: false }
            : { value: undefined, done: true };
        }
      };
    }
  };
  for (const n of range) console.log(n); // 1 2 3 4 5

Built-in iterables: Array, String, Map, Set, NodeList, arguments, TypedArrays.`,
  },
  {
    title: 'JS Async: Promise.race for Timeouts',
    slug: 'js-web-promise-race-timeout',
    track: 'JavaScript + Web',
    topic: 'Async patterns',
    difficulty: 'medium',
    description: `How do you implement a fetch with a timeout using \`Promise.race\`?`,
    options: [
      { key: 'A', text: 'Pass a timeout option directly to fetch().', correct: false },
      { key: 'B', text: 'Race the fetch Promise against a rejection Promise that rejects after the timeout duration.', correct: true },
      { key: 'C', text: 'Wrap the fetch in a try/catch and set a time limit with Date.now().', correct: false },
      { key: 'D', text: 'Use XMLHttpRequest which has a built-in timeout property.', correct: false },
    ],
    explanation: `Answer: B

  function fetchWithTimeout(url, ms) {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), ms)
    );
    return Promise.race([fetch(url), timeout]);
  }

  fetchWithTimeout('/api/data', 3000)
    .then(res => res.json())
    .catch(err => console.error(err.message));

Promise.race returns the first settled promise (fulfilled or rejected). If the timeout rejects first, the overall promise rejects. Note: the fetch still runs in the background — use AbortController to actually cancel the network request for resource cleanup.`,
  },
  {
    title: 'JS Event Loop: process.nextTick vs Promise in Node.js',
    slug: 'js-web-nexttick-vs-promise-node',
    track: 'JavaScript + Web',
    topic: 'Event Loop',
    difficulty: 'hard',
    description: `In Node.js, which runs first: \`process.nextTick(cb)\` or \`Promise.resolve().then(cb)\`?`,
    options: [
      { key: 'A', text: 'They run in the same queue and order is non-deterministic.', correct: false },
      { key: 'B', text: 'process.nextTick runs first — it has its own queue that is drained before the Promise microtask queue.', correct: true },
      { key: 'C', text: 'Promise microtask runs first — nextTick is a macrotask.', correct: false },
      { key: 'D', text: 'process.nextTick is a macrotask like setTimeout.', correct: false },
    ],
    explanation: `Answer: B

Node.js has TWO microtask-priority queues (processed before I/O macrotasks):
1. nextTick queue — drained completely first.
2. Promise microtask queue — drained next.

  Promise.resolve().then(() => console.log('Promise'));
  process.nextTick(() => console.log('nextTick'));
  // Output: nextTick, Promise

This Node.js-specific ordering is a historical design decision. process.nextTick is useful for scheduling callbacks that should run before I/O events but can lead to I/O starvation if overused (recursive nextTick calls block the event loop).`,
  },
  {
    title: 'JS Web Security: XSS Prevention',
    slug: 'js-web-xss-prevention',
    track: 'JavaScript + Web',
    topic: 'DOM/Web APIs',
    difficulty: 'medium',
    description: `Which approach effectively prevents Cross-Site Scripting (XSS) when displaying user-generated content in the DOM?`,
    options: [
      { key: 'A', text: 'Using innerHTML to insert content, but only from trusted users.', correct: false },
      { key: 'B', text: 'Using textContent/innerText for plain text, and sanitizing HTML with a library like DOMPurify before using innerHTML.', correct: true },
      { key: 'C', text: 'Encoding content in Base64 before inserting into the DOM.', correct: false },
      { key: 'D', text: 'Wrapping all content in a <pre> tag.', correct: false },
    ],
    explanation: `Answer: B

XSS (Cross-Site Scripting) occurs when attacker-controlled HTML/JS is injected into a page. innerHTML parses and executes script tags and event handlers.

Safe approaches:
- textContent / innerText: treats input as plain text, no HTML parsing — always safe for text.
- DOMPurify.sanitize(html): strips dangerous tags/attributes while preserving safe HTML.
- Content Security Policy (CSP) header: blocks inline scripts even if injected.
- React's JSX: escapes values in {} by default — dangerouslySetInnerHTML is the escape hatch.

Never trust user input; always sanitize or encode before DOM insertion.`,
  },
  {
    title: 'JS Closures: Temporal Dead Zone',
    slug: 'js-web-temporal-dead-zone',
    track: 'JavaScript + Web',
    topic: 'Closures',
    difficulty: 'medium',
    description: `What is the Temporal Dead Zone (TDZ) in JavaScript?`,
    options: [
      { key: 'A', text: 'The time between the browser receiving JS and the first script execution.', correct: false },
      { key: 'B', text: 'The region from the start of a block scope to the let/const declaration where accessing the variable throws a ReferenceError.', correct: true },
      { key: 'C', text: 'A period where setTimeout callbacks are blocked from running.', correct: false },
      { key: 'D', text: 'The gap between Promise creation and its resolution.', correct: false },
    ],
    explanation: `Answer: B

let and const are hoisted to the top of their block scope but are NOT initialized until the declaration is reached. The TDZ is the gap between the start of the scope and the declaration.

  {
    console.log(x); // ReferenceError: Cannot access 'x' before initialization
    let x = 5;
  }

Contrast with var: var is hoisted AND initialized to undefined, so accessing it before declaration gives undefined (not an error).

TDZ exists to catch programming bugs — accessing a variable before it is logically initialized is almost always a mistake.`,
  },
];

// ═════════════════════════════════════════════════════════════════════════════
//  TRACK 3 · C++ + DSA  (20 questions)
// ═════════════════════════════════════════════════════════════════════════════
const CPP_DSA = [
  {
    title: 'C++ STL: vector vs deque',
    slug: 'cpp-stl-vector-vs-deque',
    track: 'C++ + DSA',
    topic: 'STL Containers',
    difficulty: 'medium',
    description: `What is a key structural difference between \`std::vector\` and \`std::deque\`?`,
    options: [
      { key: 'A', text: 'vector stores elements in linked nodes; deque uses a contiguous array.', correct: false },
      { key: 'B', text: 'vector uses a single contiguous block; deque uses a sequence of fixed-size chunks, enabling O(1) push_front without reallocation.', correct: true },
      { key: 'C', text: 'deque does not support random access by index.', correct: false },
      { key: 'D', text: 'vector supports push_front in O(1); deque does not.', correct: false },
    ],
    explanation: `Answer: B

std::vector: one contiguous heap allocation. push_back is amortized O(1); push_front is O(n) (shifts all elements).

std::deque (double-ended queue): a map of pointers to fixed-size "chunk" arrays. Enables O(1) push_front AND push_back without moving existing elements. However, cache performance is worse than vector because memory is non-contiguous.

Both support O(1) random access by index. Use deque when you need efficient front insertions/removals; use vector for cache-friendly iteration and random access.`,
  },
  {
    title: 'C++ Pointers: Raw Pointer vs Smart Pointer',
    slug: 'cpp-raw-vs-smart-pointer',
    track: 'C++ + DSA',
    topic: 'Pointers & References',
    difficulty: 'medium',
    description: `What ownership semantics does \`std::unique_ptr\` enforce?`,
    options: [
      { key: 'A', text: 'Shared ownership — multiple unique_ptrs can point to the same object.', correct: false },
      { key: 'B', text: 'Exclusive ownership — only one unique_ptr owns the object; ownership can be transferred (moved) but not copied.', correct: true },
      { key: 'C', text: 'Weak ownership — the pointer does not prevent garbage collection.', correct: false },
      { key: 'D', text: 'No ownership — it behaves exactly like a raw pointer.', correct: false },
    ],
    explanation: `Answer: B

unique_ptr enforces single ownership:
- Copy constructor and copy assignment are DELETED — you cannot copy a unique_ptr.
- Move is allowed: std::move(ptr) transfers ownership; the original ptr becomes nullptr.
- The owned object is automatically deleted when the unique_ptr goes out of scope (RAII).

Contrast:
- shared_ptr: reference-counted shared ownership. Deleted when last shared_ptr is destroyed.
- weak_ptr: non-owning observer of a shared_ptr. Does not affect the reference count. Used to break circular references.

Prefer unique_ptr by default; use shared_ptr only when shared ownership is genuinely needed.`,
  },
  {
    title: 'C++ Memory: Stack vs Heap Allocation',
    slug: 'cpp-stack-vs-heap-allocation',
    track: 'C++ + DSA',
    topic: 'Memory Management',
    difficulty: 'easy',
    description: `What happens to a locally declared object when the function returns in C++?`,
    options: [
      { key: 'A', text: 'It is moved to the heap automatically by the compiler.', correct: false },
      { key: 'B', text: 'Its destructor is called and its memory on the stack is automatically reclaimed.', correct: true },
      { key: 'C', text: 'It persists until the program ends unless explicitly deleted.', correct: false },
      { key: 'D', text: 'The garbage collector frees it asynchronously.', correct: false },
    ],
    explanation: `Answer: B

C++ has no garbage collector. Stack-allocated objects (declared without new) have automatic storage duration: their destructor runs deterministically when the enclosing scope exits, and the stack frame is popped.

RAII (Resource Acquisition Is Initialization) leverages this: file handles, mutex locks, and smart pointers release their resources in destructors — guaranteed even if an exception is thrown.

Heap allocations (new/delete) persist until explicitly freed. Forgetting delete causes memory leaks; double-deleting causes undefined behavior. Smart pointers (unique_ptr, shared_ptr) automate this.`,
  },
  {
    title: 'C++ Move Semantics: rvalue References',
    slug: 'cpp-rvalue-references',
    track: 'C++ + DSA',
    topic: 'Move Semantics',
    difficulty: 'hard',
    description: `What is the purpose of an rvalue reference (\`T&&\`) in C++11?`,
    options: [
      { key: 'A', text: 'To create a constant reference that cannot be modified.', correct: false },
      { key: 'B', text: 'To bind to temporary (rvalue) objects and enable move semantics — transferring resources instead of copying them.', correct: true },
      { key: 'C', text: 'To pass arguments by value with automatic type deduction.', correct: false },
      { key: 'D', text: 'To declare a universal reference that binds to both lvalues and rvalues.', correct: false },
    ],
    explanation: `Answer: B

T&& (rvalue reference) binds to temporaries. Combined with a move constructor / move assignment operator, it enables "stealing" resources (heap memory, file descriptors) from a temporary instead of copying.

  std::vector<int> a = {1, 2, 3};
  std::vector<int> b = std::move(a); // move: O(1) pointer swap, a is empty

Move vs Copy:
- Copy: deep-duplicates all data — O(n).
- Move: transfers ownership of internal buffer — O(1).

std::move casts an lvalue to an rvalue reference, signaling "this object can be pillaged." After a move, the source is in a valid but unspecified state.

Note: T&& in a template (auto&&) is a "forwarding reference" (universal reference) — different from a plain rvalue reference.`,
  },
  {
    title: 'C++ STL: map vs unordered_map',
    slug: 'cpp-map-vs-unordered-map',
    track: 'C++ + DSA',
    topic: 'STL Containers',
    difficulty: 'medium',
    description: `When should you prefer \`std::unordered_map\` over \`std::map\`?`,
    options: [
      { key: 'A', text: 'When you need keys stored in sorted order.', correct: false },
      { key: 'B', text: 'When you need O(1) average-case lookup and insertion and do not require ordered iteration.', correct: true },
      { key: 'C', text: 'When memory usage is the primary concern.', correct: false },
      { key: 'D', text: 'When keys do not have a hash function defined.', correct: false },
    ],
    explanation: `Answer: B

std::map: red-black tree. O(log n) for all operations. Keys always in sorted order. No hash function needed.

std::unordered_map: hash table. O(1) average for insert/lookup/erase; O(n) worst case (all keys in same bucket). No ordering guarantee.

Choose:
- map: when sorted order or range queries (lower_bound) are needed.
- unordered_map: when raw speed matters and keys have a good hash (arithmetic types, std::string).

Custom hash: specialize std::hash<T> or provide a hash functor to unordered_map.`,
  },
  {
    title: 'C++ Memory: RAII Pattern',
    slug: 'cpp-raii-pattern',
    track: 'C++ + DSA',
    topic: 'Memory Management',
    difficulty: 'medium',
    description: `What does RAII (Resource Acquisition Is Initialization) mean in C++?`,
    options: [
      { key: 'A', text: 'All resources must be allocated in global scope at program startup.', correct: false },
      { key: 'B', text: 'Resource lifetime is tied to object lifetime: acquired in the constructor, released in the destructor — ensuring cleanup even on exceptions.', correct: true },
      { key: 'C', text: 'Resources are initialized lazily on first access.', correct: false },
      { key: 'D', text: 'Resources must be explicitly freed before the object goes out of scope.', correct: false },
    ],
    explanation: `Answer: B

RAII is C++'s primary resource management idiom:

  class MutexGuard {
    std::mutex& m;
  public:
    MutexGuard(std::mutex& m) : m(m) { m.lock(); }  // acquire
    ~MutexGuard() { m.unlock(); }                    // release
  };
  void critical() {
    MutexGuard g(mtx); // locked
    // ... exception-safe work ...
  } // g.~MutexGuard() called → unlock guaranteed

Standard RAII wrappers: unique_ptr (heap memory), lock_guard (mutexes), fstream (files), shared_ptr.

RAII makes code exception-safe without try/finally (which C++ lacks).`,
  },
  {
    title: 'C++ DSA: Complexity of std::sort',
    slug: 'cpp-stl-sort-complexity',
    track: 'C++ + DSA',
    topic: 'STL Containers',
    difficulty: 'easy',
    description: `What is the time complexity guarantee of \`std::sort\` in C++?`,
    options: [
      { key: 'A', text: 'O(n²) worst case, O(n log n) average.', correct: false },
      { key: 'B', text: 'O(n log n) worst case — guaranteed by the C++ standard.', correct: true },
      { key: 'C', text: 'O(n) for nearly sorted data.', correct: false },
      { key: 'D', text: 'O(n log² n) due to the merge sort implementation.', correct: false },
    ],
    explanation: `Answer: B

Since C++11, std::sort guarantees O(n log n) worst-case complexity. Most implementations use Introsort: a hybrid of Quicksort, Heapsort, and Insertion sort.

Introsort strategy:
- Begin with Quicksort (fast in practice).
- Monitor recursion depth; if it exceeds 2·log₂(n), switch to Heapsort (O(n log n) worst case, no O(n²) risk).
- For small subarrays (≤ ~16 elements), switch to Insertion sort (low overhead, cache-friendly).

std::stable_sort guarantees O(n log² n) worst case (or O(n log n) with extra memory) and preserves relative order of equal elements.`,
  },
  {
    title: 'C++ Pointers: Pointer Arithmetic',
    slug: 'cpp-pointer-arithmetic',
    track: 'C++ + DSA',
    topic: 'Pointers & References',
    difficulty: 'medium',
    description: `What does \`ptr + 1\` mean when \`ptr\` is a \`int*\` pointing to an array element?`,
    options: [
      { key: 'A', text: 'It adds 1 byte to the memory address.', correct: false },
      { key: 'B', text: 'It advances the pointer by sizeof(int) bytes, pointing to the next int element.', correct: true },
      { key: 'C', text: 'It increments the value pointed to by ptr.', correct: false },
      { key: 'D', text: 'It throws an out-of-bounds exception if the next element does not exist.', correct: false },
    ],
    explanation: `Answer: B

Pointer arithmetic scales by the size of the pointed-to type:
  int arr[] = {10, 20, 30};
  int* p = arr;       // p points to arr[0]
  int* q = p + 1;     // q points to arr[1] (address = p + sizeof(int) = p + 4)
  int* r = p + 2;     // r points to arr[2]

This is why arrays and pointers are interchangeable in C/C++: arr[i] is syntactic sugar for *(arr + i).

C++ does NOT bounds-check pointer arithmetic — going out of array bounds is undefined behavior. Use iterators, std::span (C++20), or range-based for loops for safe traversal.`,
  },
  {
    title: 'C++ Move Semantics: Perfect Forwarding',
    slug: 'cpp-perfect-forwarding',
    track: 'C++ + DSA',
    topic: 'Move Semantics',
    difficulty: 'hard',
    description: `What problem does \`std::forward\` solve in a templated function?`,
    options: [
      { key: 'A', text: 'It converts rvalue references to lvalue references for compatibility.', correct: false },
      { key: 'B', text: 'It preserves the value category (lvalue/rvalue) of an argument when forwarding it to another function, avoiding unnecessary copies.', correct: true },
      { key: 'C', text: 'It automatically detects whether to use std::move or std::copy.', correct: false },
      { key: 'D', text: 'It is an alias for std::move.', correct: false },
    ],
    explanation: `Answer: B

Without perfect forwarding, named parameters are always lvalues inside a function, even if passed as rvalues. std::forward restores the original value category:

  template <typename T>
  void wrapper(T&& arg) {
    target(std::forward<T>(arg)); // lvalue stays lvalue, rvalue stays rvalue
  }

  wrapper(42);          // rvalue → target receives rvalue (enables move)
  wrapper(myVector);    // lvalue → target receives lvalue (copy, not move)

Without std::forward, both calls would pass arg as an lvalue, defeating move semantics. This pattern is used in std::make_unique, std::make_shared, emplace_back, and any factory function.`,
  },
  {
    title: 'C++ DSA: Priority Queue Implementation',
    slug: 'cpp-dsa-priority-queue',
    track: 'C++ + DSA',
    topic: 'STL Containers',
    difficulty: 'medium',
    description: `What data structure backs \`std::priority_queue\` in C++, and what is its default ordering?`,
    options: [
      { key: 'A', text: 'A sorted std::vector; ascending order (min element at top).', correct: false },
      { key: 'B', text: 'A max-heap backed by std::vector; the largest element is at the top.', correct: true },
      { key: 'C', text: 'A red-black tree; sorted in insertion order.', correct: false },
      { key: 'D', text: 'A linked list; FIFO ordering.', correct: false },
    ],
    explanation: `Answer: B

std::priority_queue<T> is a container adapter backed by std::vector<T> using std::make_heap/push_heap/pop_heap (max-heap by default).

  priority_queue<int> pq; // max-heap
  pq.push(3); pq.push(1); pq.push(4);
  pq.top(); // 4

For a min-heap:
  priority_queue<int, vector<int>, greater<int>> minPQ;

Common use cases: Dijkstra's algorithm, K largest elements, merge K sorted lists, task scheduling.

Heap operations: push O(log n), top O(1), pop O(log n).`,
  },
  {
    title: 'C++ Memory: new vs malloc',
    slug: 'cpp-new-vs-malloc',
    track: 'C++ + DSA',
    topic: 'Memory Management',
    difficulty: 'easy',
    description: `What is a critical difference between \`new\` and \`malloc\` in C++?`,
    options: [
      { key: 'A', text: 'malloc is faster; new calls the OS for memory on every call.', correct: false },
      { key: 'B', text: 'new calls the constructor and throws std::bad_alloc on failure; malloc only allocates raw memory and returns nullptr on failure.', correct: true },
      { key: 'C', text: 'They are interchangeable; free() can be used with new.', correct: false },
      { key: 'D', text: 'malloc zero-initializes memory; new does not.', correct: false },
    ],
    explanation: `Answer: B

new vs malloc:
| Feature           | new               | malloc          |
|-------------------|-------------------|-----------------|
| Type safety       | Typed             | Returns void*   |
| Constructor call  | Yes               | No              |
| Failure behavior  | throws bad_alloc  | returns nullptr |
| Deallocation      | delete / delete[] | free()          |

NEVER mix: do not new then free(), or malloc then delete — undefined behavior.
In modern C++: prefer stack allocation, std::vector, or smart pointers. Raw new/delete is a code smell in new code.`,
  },
  {
    title: 'C++ Pointers: Dangling Pointer',
    slug: 'cpp-dangling-pointer',
    track: 'C++ + DSA',
    topic: 'Pointers & References',
    difficulty: 'medium',
    description: `What is a dangling pointer?`,
    options: [
      { key: 'A', text: 'A pointer that has been initialized to nullptr.', correct: false },
      { key: 'B', text: 'A pointer that holds the address of memory that has been freed or gone out of scope, making dereferencing it undefined behavior.', correct: true },
      { key: 'C', text: 'A pointer to a virtual function table.', correct: false },
      { key: 'D', text: 'A pointer that is not aligned to a word boundary.', correct: false },
    ],
    explanation: `Answer: B

Common dangling pointer scenarios:

1. delete then use:
   int* p = new int(5);
   delete p;
   *p = 10; // undefined behavior — dangling

2. Returning address of local variable:
   int* bad() { int x = 5; return &x; } // x is destroyed on return

3. Iterator invalidation: after vector::push_back causes reallocation, old iterators/pointers into the vector are invalid.

Prevention: set pointers to nullptr after delete; use smart pointers (unique_ptr); prefer references and std::span over raw pointers.`,
  },
  {
    title: 'C++ STL: emplace_back vs push_back',
    slug: 'cpp-emplace-vs-push-back',
    track: 'C++ + DSA',
    topic: 'STL Containers',
    difficulty: 'medium',
    description: `Why is \`emplace_back\` generally preferred over \`push_back\` for complex objects?`,
    options: [
      { key: 'A', text: 'emplace_back is thread-safe; push_back is not.', correct: false },
      { key: 'B', text: 'emplace_back constructs the object in-place using forwarded arguments, avoiding a temporary object creation and potential copy/move.', correct: true },
      { key: 'C', text: 'push_back cannot store objects larger than 64 bytes.', correct: false },
      { key: 'D', text: 'emplace_back validates the object before inserting.', correct: false },
    ],
    explanation: `Answer: B

push_back(obj): takes an already-constructed object, then copy- or move-constructs it into the vector's storage. At least one copy or move is needed.

emplace_back(args...): forwards the constructor arguments directly into the vector's allocated memory using placement new. Constructs the object in-place — zero copies or moves.

  vector<pair<int,string>> v;
  v.push_back({1, "hello"});       // creates temp pair, then moves it
  v.emplace_back(1, "hello");      // constructs pair directly in vector — no temp

For trivially constructible types, the difference is negligible. For types with expensive constructors or deleted copy/move, emplace_back may be the only viable option.`,
  },
  {
    title: 'C++ DSA: Dynamic Programming — Overlapping Subproblems',
    slug: 'cpp-dsa-dp-overlapping-subproblems',
    track: 'C++ + DSA',
    topic: 'DSA',
    difficulty: 'medium',
    description: `Which of the following correctly describes the difference between memoization (top-down DP) and tabulation (bottom-up DP)?`,
    options: [
      { key: 'A', text: 'Memoization uses iteration; tabulation uses recursion.', correct: false },
      { key: 'B', text: 'Memoization is recursive with a cache (computes only needed subproblems); tabulation fills a table iteratively (computes all subproblems).', correct: true },
      { key: 'C', text: 'Both have the same space complexity in all cases.', correct: false },
      { key: 'D', text: 'Tabulation cannot solve problems where the recurrence depends on future states.', correct: false },
    ],
    explanation: `Answer: B

Memoization (top-down):
  int fib(int n, unordered_map<int,int>& memo) {
    if (n <= 1) return n;
    if (memo.count(n)) return memo[n];
    return memo[n] = fib(n-1, memo) + fib(n-2, memo);
  }
- Computes only the subproblems actually needed.
- Has function call overhead; risk of stack overflow for deep recursion.

Tabulation (bottom-up):
  vector<int> dp(n+1);
  dp[0]=0; dp[1]=1;
  for (int i=2;i<=n;i++) dp[i]=dp[i-1]+dp[i-2];
- Iterative — no recursion overhead.
- Always fills the entire table even if some entries aren't needed.
- Usually has better cache performance.`,
  },
  {
    title: 'C++ Move Semantics: Rule of Five',
    slug: 'cpp-rule-of-five',
    track: 'C++ + DSA',
    topic: 'Move Semantics',
    difficulty: 'hard',
    description: `The "Rule of Five" in C++11+ states that if a class defines any of these, it should define all five. Which five?`,
    options: [
      { key: 'A', text: 'Constructor, Destructor, Copy constructor, operator==, operator<', correct: false },
      { key: 'B', text: 'Destructor, Copy constructor, Copy assignment, Move constructor, Move assignment.', correct: true },
      { key: 'C', text: 'Constructor, Destructor, Copy constructor, toString, hashCode.', correct: false },
      { key: 'D', text: 'Copy constructor, Move constructor, operator=, operator[], operator().', correct: false },
    ],
    explanation: `Answer: B

The Rule of Five (extending the C++03 Rule of Three):
If your class manages a resource (heap memory, file handle, socket), you must explicitly define:
1. Destructor — frees the resource.
2. Copy constructor — deep-copies the resource.
3. Copy assignment operator — deep-copies (and releases old resource).
4. Move constructor (C++11) — transfers ownership.
5. Move assignment operator (C++11) — transfers ownership (releases old resource).

Failing to define any one allows the compiler to generate a default that may do a shallow copy (double-free) or suppress move operations.

Rule of Zero: prefer wrapping resources in smart pointers/RAII classes so no special functions are needed.`,
  },
  {
    title: 'C++ DSA: Graph Representation — Adjacency List vs Matrix',
    slug: 'cpp-dsa-graph-representation',
    track: 'C++ + DSA',
    topic: 'DSA',
    difficulty: 'easy',
    description: `For a sparse graph with V vertices and E edges (E << V²), which representation is more space-efficient?`,
    options: [
      { key: 'A', text: 'Adjacency matrix — O(V²) space but O(1) edge lookup.', correct: false },
      { key: 'B', text: 'Adjacency list — O(V + E) space, more efficient for sparse graphs.', correct: true },
      { key: 'C', text: 'Both use the same space for sparse graphs.', correct: false },
      { key: 'D', text: 'Edge list — always the most space-efficient regardless of density.', correct: false },
    ],
    explanation: `Answer: B

Adjacency Matrix: V×V boolean/weight matrix. O(V²) space regardless of edges. Edge lookup O(1). Inefficient for sparse graphs.

Adjacency List: vector<vector<int>> or unordered_map<int, vector<int>>. O(V + E) space. Edge lookup O(degree(v)).

  vector<vector<int>> adj(V); // adjacency list
  adj[u].push_back(v);        // add edge u→v

When to use matrix: dense graphs (E ≈ V²), need to check edge existence frequently.
When to use list: sparse graphs (E << V²), BFS/DFS traversals, most competitive programming problems.`,
  },
  {
    title: 'C++ STL: Iterators and Iterator Invalidation',
    slug: 'cpp-iterator-invalidation',
    track: 'C++ + DSA',
    topic: 'STL Containers',
    difficulty: 'hard',
    description: `What happens to a \`std::vector\` iterator after a \`push_back\` that causes reallocation?`,
    options: [
      { key: 'A', text: 'The iterator automatically updates to the new memory location.', correct: false },
      { key: 'B', text: 'The iterator becomes invalid (dangling) — dereferencing or comparing it is undefined behavior.', correct: true },
      { key: 'C', text: 'The iterator throws a std::out_of_range exception when used.', correct: false },
      { key: 'D', text: 'Only iterators pointing past the inserted element are invalidated.', correct: false },
    ],
    explanation: `Answer: B

push_back may trigger reallocation (when size == capacity). The vector allocates a new, larger buffer and moves/copies all elements. The old buffer is freed. Any iterator, pointer, or reference into the old buffer is now a dangling pointer — using it is undefined behavior.

Safe pattern: call reserve() upfront to prevent reallocation:
  v.reserve(100); // pre-allocate, no reallocation for 100 elements

Invalidation rules summary:
- vector: all iterators invalidated on reallocation; insertion in middle invalidates from insertion point onward.
- deque: all iterators invalidated on push_front/push_back.
- list, map, set: iterators remain valid across insertions/deletions (except the erased node).`,
  },
  {
    title: 'C++ Pointers: const Pointer vs Pointer to const',
    slug: 'cpp-const-pointer-vs-pointer-to-const',
    track: 'C++ + DSA',
    topic: 'Pointers & References',
    difficulty: 'medium',
    description: `What is the difference between \`const int* p\` and \`int* const p\`?`,
    options: [
      { key: 'A', text: 'They are identical — both prevent any modification.', correct: false },
      { key: 'B', text: 'const int* p: the pointed-to value cannot be changed (pointer to const); int* const p: the pointer itself cannot be reseated (const pointer).', correct: true },
      { key: 'C', text: 'const int* p prevents reseating; int* const p prevents value modification.', correct: false },
      { key: 'D', text: 'Both declarations are invalid C++.', correct: false },
    ],
    explanation: `Answer: B

Read right-to-left (clockwise/spiral rule):

const int* p   → p is a pointer to const int. *p cannot be changed; p can be reseated.
  (*p = 5);   // ERROR
  p = &other; // OK

int* const p   → p is a const pointer to int. p cannot be reseated; *p can be changed.
  (*p = 5);   // OK
  p = &other; // ERROR

const int* const p → both the pointer and the value are const.

Mnemonic: "const applies to what is on its LEFT (or to the type if nothing is on its left)."`,
  },
  {
    title: 'C++ DSA: Segment Tree Use Case',
    slug: 'cpp-dsa-segment-tree',
    track: 'C++ + DSA',
    topic: 'DSA',
    difficulty: 'hard',
    description: `When is a Segment Tree preferred over a Fenwick Tree (Binary Indexed Tree)?`,
    options: [
      { key: 'A', text: 'When you only need prefix sum queries — Fenwick trees are too complex.', correct: false },
      { key: 'B', text: 'When you need range queries with arbitrary associative functions (min, max, GCD) that are not easily invertible, or need range updates with lazy propagation.', correct: true },
      { key: 'C', text: 'Segment trees use less memory than Fenwick trees.', correct: false },
      { key: 'D', text: 'Fenwick trees cannot handle point updates.', correct: false },
    ],
    explanation: `Answer: B

Fenwick Tree (BIT): O(n) space, O(log n) point update and prefix-query. Ideal for prefix sums and problems where the operation is invertible (sum, XOR). Simpler to implement.

Segment Tree: O(4n) space, O(log n) point or range update, O(log n) range query. Handles any associative operation: sum, min, max, GCD, bitwise AND/OR.

With lazy propagation, segment trees support O(log n) range updates (e.g., add X to all elements in [L, R]).

Use BIT for prefix sums; use Segment Tree when you need range-min/max or non-invertible operations, or lazy range updates.`,
  },
  {
    title: 'C++ STL: Lambda Expressions and std::function',
    slug: 'cpp-lambda-expressions-std-function',
    track: 'C++ + DSA',
    topic: 'STL Containers',
    difficulty: 'medium',
    description: `What is the difference between capturing by value (\`[=]\`) and capturing by reference (\`[&]\`) in a C++ lambda?`,
    options: [
      { key: 'A', text: '[=] captures all local variables by reference; [&] captures by value — making the lambda safe to return.', correct: false },
      { key: 'B', text: '[=] copies all reachable local variables at lambda creation time; [&] holds references to them — dangling if the lambda outlives the scope.', correct: true },
      { key: 'C', text: 'Both are identical; the compiler chooses the most efficient one automatically.', correct: false },
      { key: 'D', text: '[&] is only valid inside member functions; [=] works everywhere.', correct: false },
    ],
    explanation: `Answer: B

Lambda capture modes:
  int x = 10;
  auto byVal = [=]() { return x + 1; };  // x copied at definition — safe after x goes out of scope
  auto byRef = [&]() { return x + 1; };  // x referenced — dangling if x destroyed before lambda call

Best practices:
- Prefer [=] for lambdas stored (e.g., passed to std::thread, stored in std::function) beyond their creation scope.
- Prefer [&] for short-lived lambdas (e.g., std::sort comparator, std::for_each body) where the enclosing scope outlives the lambda.
- Explicit capture [x, &y] — capture x by value and y by reference — is clearest.

std::function<int(int)> can store any callable (lambda, functor, function pointer) with a matching signature, enabling type-erasure.`,
  },
];

// ═════════════════════════════════════════════════════════════════════════════
//  TRACK 4 · Python + DSA  (20 questions)
// ═════════════════════════════════════════════════════════════════════════════
const PYTHON_DSA = [
  {
    title: 'Python CPython: How Python Executes Code',
    slug: 'python-cpython-execution',
    track: 'Python + DSA',
    topic: 'CPython Internals',
    difficulty: 'medium',
    description: `Describe CPython's execution pipeline from source code to execution.`,
    options: [
      { key: 'A', text: 'Source → native machine code (AOT) → executed directly by CPU.', correct: false },
      { key: 'B', text: 'Source → tokens → AST → bytecode (.pyc) → interpreted by PVM (Python Virtual Machine).', correct: true },
      { key: 'C', text: 'Source → JIT-compiled native code on first run, cached thereafter.', correct: false },
      { key: 'D', text: 'Source → LLVM IR → native code via LLVM backend.', correct: false },
    ],
    explanation: `Answer: B

CPython pipeline:
1. Lexer: source text → token stream.
2. Parser: tokens → Abstract Syntax Tree (AST).
3. Compiler: AST → bytecode (stored in .pyc files in __pycache__).
4. PVM: CPython's interpreter loop (ceval.c) executes bytecode instruction-by-instruction.

Inspect bytecode:
  import dis
  def add(a, b): return a + b
  dis.dis(add)

CPython does NOT JIT-compile. PyPy uses a tracing JIT for orders-of-magnitude speedup on CPU-bound loops. Cython and Numba are tools for compiling Python to C or LLVM IR.`,
  },
  {
    title: 'Python GIL: Global Interpreter Lock Impact',
    slug: 'python-gil-impact',
    track: 'Python + DSA',
    topic: 'GIL',
    difficulty: 'hard',
    description: `Why does Python's GIL limit CPU-bound multithreading but NOT I/O-bound multithreading?`,
    options: [
      { key: 'A', text: 'The GIL is released during I/O operations, allowing other threads to run while one thread waits for I/O.', correct: true },
      { key: 'B', text: 'I/O operations are faster and complete before the GIL can be acquired.', correct: false },
      { key: 'C', text: 'Python uses process-level parallelism for I/O automatically.', correct: false },
      { key: 'D', text: 'The GIL only applies to memory allocation, not I/O.', correct: false },
    ],
    explanation: `Answer: A

The GIL is a mutex in CPython that allows only one thread to execute Python bytecode at a time. This prevents data corruption of CPython's reference counts.

For CPU-bound work (number crunching): threads compete for the GIL. Only one runs at a time → no speedup from threads → use multiprocessing.Process instead (separate GIL per process).

For I/O-bound work (network, disk): Python releases the GIL during blocking I/O syscalls (read, recv, etc.). While Thread A waits for a network response, Thread B can run Python code. Threads ARE effective for I/O concurrency.

Python 3.13+ introduces a "no-GIL" build (PEP 703) as an experimental option.`,
  },
  {
    title: 'Python Dict: Dictionary Implementation',
    slug: 'python-dict-implementation',
    track: 'Python + DSA',
    topic: 'Dict/List Optimizations',
    difficulty: 'hard',
    description: `How does CPython's dict maintain insertion order (since Python 3.7)?`,
    options: [
      { key: 'A', text: 'By using a linked list to chain all key-value pairs in insertion order.', correct: false },
      { key: 'B', text: 'By using a compact array of key-value entries plus a sparse hash table of indices into that array.', correct: true },
      { key: 'C', text: 'By sorting keys alphabetically on each insertion.', correct: false },
      { key: 'D', text: 'By delegating to OrderedDict internally.', correct: false },
    ],
    explanation: `Answer: B

Python 3.6+ (CPython) uses a "compact dict" design (PEP 468 formalized in 3.7):

Two structures:
1. Entries array: a dense, compact array of (hash, key, value) tuples in insertion order.
2. Indices table: a sparse hash table mapping hash slots → index into the entries array.

Benefits:
- Insertion order preserved (entries array is append-only).
- 20-25% less memory vs the old fully-sparse hash table.
- O(1) average lookup, insert, delete.

When a dict is full, it resizes (doubles) and rebuilds the indices table. Deleted entries become "dummies" in the indices table.`,
  },
  {
    title: 'Python List: List Comprehension vs map/filter',
    slug: 'python-list-comprehension-vs-map',
    track: 'Python + DSA',
    topic: 'Dict/List Optimizations',
    difficulty: 'easy',
    description: `Why are list comprehensions generally preferred over \`map()\`/\`filter()\` in Python 3?`,
    options: [
      { key: 'A', text: 'List comprehensions are always faster due to SIMD vectorization.', correct: false },
      { key: 'B', text: 'List comprehensions are more readable, Pythonic, and can combine mapping and filtering in a single expression without lambda syntax.', correct: true },
      { key: 'C', text: 'map() and filter() are deprecated in Python 3.', correct: false },
      { key: 'D', text: 'map() creates an eager list; list comprehensions are lazy.', correct: false },
    ],
    explanation: `Answer: B

Python 3 map() and filter() return lazy iterators (not lists). To get a list: list(map(fn, iterable)).

List comprehension equivalent:
  [x * 2 for x in range(10) if x % 2 == 0]
  # vs:
  list(map(lambda x: x*2, filter(lambda x: x%2==0, range(10))))

Comprehension advantages:
- More readable (reads like English: "x*2 for x in ... if ...").
- No lambda needed.
- Slightly faster in CPython for simple operations (optimized bytecode for list comprehension).

For lazy evaluation (streaming large data), generator expressions are preferred: (x*2 for x in ...).`,
  },
  {
    title: 'Python Generators: yield and Lazy Evaluation',
    slug: 'python-generators-yield',
    track: 'Python + DSA',
    topic: 'Generators',
    difficulty: 'medium',
    description: `What is the memory advantage of using a generator over a list for processing a large file?`,
    options: [
      { key: 'A', text: 'Generators compress data in memory using zlib.', correct: false },
      { key: 'B', text: 'Generators produce one item at a time on demand (lazy), holding only one item in memory at once, vs a list that stores all items simultaneously.', correct: true },
      { key: 'C', text: 'Generators use shared memory across threads.', correct: false },
      { key: 'D', text: 'Generators automatically page data to disk when memory is full.', correct: false },
    ],
    explanation: `Answer: B

  def read_large_file(path):
    with open(path) as f:
      for line in f:
        yield line.strip()

  for line in read_large_file('bigfile.txt'):
    process(line)  # only one line in memory at a time

A list comprehension [line.strip() for line in f] would load the ENTIRE file into memory.

Generators are Python's lazy iterators. They pause at each yield, resuming on next(). This enables:
- Processing infinite streams.
- Pipelines: (process(x) for x in read_large_file(path)) chains generators without intermediate lists.
- Memory-efficient data processing (ETL, log parsing).`,
  },
  {
    title: 'Python Decorators: Function Wrapping',
    slug: 'python-decorators-function-wrapping',
    track: 'Python + DSA',
    topic: 'Decorators',
    difficulty: 'medium',
    description: `What does the \`@functools.wraps(func)\` decorator do inside a custom decorator?`,
    options: [
      { key: 'A', text: 'It makes the wrapper function run faster by caching its result.', correct: false },
      { key: 'B', text: 'It copies the wrapped function\'s metadata (__name__, __doc__, __module__) to the wrapper, preserving introspection.', correct: true },
      { key: 'C', text: 'It prevents the wrapper from being called more than once.', correct: false },
      { key: 'D', text: 'It automatically handles exceptions from the wrapped function.', correct: false },
    ],
    explanation: `Answer: B

Without @wraps:
  def my_decorator(func):
    def wrapper(*args, **kwargs):
      return func(*args, **kwargs)
    return wrapper

  @my_decorator
  def greet(): """Says hello."""
  print(greet.__name__)  # 'wrapper' — wrong!
  print(greet.__doc__)   # None — lost!

With @functools.wraps(func):
  def my_decorator(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
      return func(*args, **kwargs)
    return wrapper

  @my_decorator
  def greet(): """Says hello."""
  print(greet.__name__)  # 'greet' — correct
  print(greet.__doc__)   # 'Says hello.' — preserved

Essential for debugging, help(), and tools like pytest that rely on function metadata.`,
  },
  {
    title: 'Python CPython: Reference Counting GC',
    slug: 'python-cpython-reference-counting',
    track: 'Python + DSA',
    topic: 'CPython Internals',
    difficulty: 'medium',
    description: `CPython primarily uses reference counting for garbage collection. What type of memory leak can it NOT handle on its own?`,
    options: [
      { key: 'A', text: 'Objects with a refcount of zero.', correct: false },
      { key: 'B', text: 'Reference cycles (A → B → A), where refcounts never reach zero.', correct: true },
      { key: 'C', text: 'Large objects on the heap.', correct: false },
      { key: 'D', text: 'Global variables that are never deleted.', correct: false },
    ],
    explanation: `Answer: B

CPython maintains a reference count (ob_refcnt) for every object. When it hits 0, the object is immediately freed (deterministic destruction — unlike GC-based languages).

Limitation — cyclic garbage: if A.ref = B and B.ref = A, even when external code drops references to both, each still has refcount ≥ 1 (the cycle). Neither can be freed by reference counting alone.

CPython's cyclic garbage collector (gc module, generational, runs periodically) handles this by detecting cycles and breaking them. You can trigger it with gc.collect().

Implication: __del__ finalizers on objects in cycles may not run promptly. Avoid __del__ on cycle-participating objects.`,
  },
  {
    title: 'Python GIL: multiprocessing vs threading',
    slug: 'python-multiprocessing-vs-threading',
    track: 'Python + DSA',
    topic: 'GIL',
    difficulty: 'medium',
    description: `When should you use \`multiprocessing\` instead of \`threading\` in Python?`,
    options: [
      { key: 'A', text: 'When performing network I/O operations with many connections.', correct: false },
      { key: 'B', text: 'When performing CPU-bound tasks that need true parallelism, since each process has its own GIL.', correct: true },
      { key: 'C', text: 'When you need to share large amounts of mutable state between workers.', correct: false },
      { key: 'D', text: 'When you want lower memory overhead than threads.', correct: false },
    ],
    explanation: `Answer: B

CPython threading: all threads share one GIL. CPU-bound threads take turns holding the GIL → no parallel CPU execution. Threads share memory (easy state sharing, requires synchronization).

multiprocessing: each Process has its own CPython interpreter and GIL. True parallel CPU execution on multi-core machines. Separate memory spaces → no GIL contention, but data sharing requires IPC (Queue, Pipe, Manager, shared memory).

Decision guide:
- I/O-bound (network, disk) → threading or asyncio.
- CPU-bound (number crunching, ML) → multiprocessing or subprocess.
- Avoid GIL entirely → use Cython, NumPy (releases GIL for C extensions), or PyPy.`,
  },
  {
    title: 'Python Decorators: Class-Based Decorators',
    slug: 'python-class-based-decorators',
    track: 'Python + DSA',
    topic: 'Decorators',
    difficulty: 'hard',
    description: `How can a class be used as a decorator?`,
    options: [
      { key: 'A', text: 'By inheriting from the built-in decorator class.', correct: false },
      { key: 'B', text: 'By implementing __call__ so instances are callable; instances can then be used as decorators that wrap functions.', correct: true },
      { key: 'C', text: 'Classes cannot be used as decorators in Python.', correct: false },
      { key: 'D', text: 'By implementing __init__ with a func parameter only.', correct: false },
    ],
    explanation: `Answer: B

A decorator is simply a callable that takes a function and returns a callable. A class with __call__ satisfies this:

  class retry:
    def __init__(self, times):
      self.times = times
    def __call__(self, func):
      @functools.wraps(func)
      def wrapper(*args, **kwargs):
        for attempt in range(self.times):
          try: return func(*args, **kwargs)
          except Exception as e:
            if attempt == self.times - 1: raise
      return wrapper

  @retry(times=3)
  def flaky_api_call(): ...

Class decorators are useful when decorators need state (e.g., call counts, caches) or complex configuration.`,
  },
  {
    title: 'Python List: Dynamic Array Growth',
    slug: 'python-list-dynamic-array',
    track: 'Python + DSA',
    topic: 'Dict/List Optimizations',
    difficulty: 'medium',
    description: `Python's \`list\` is a dynamic array. What happens internally when \`append()\` exceeds the current allocated capacity?`,
    options: [
      { key: 'A', text: 'The list switches to a linked list representation.', correct: false },
      { key: 'B', text: 'A larger buffer (roughly 1.125× growth factor) is allocated, existing elements are copied, and the old buffer is freed.', correct: true },
      { key: 'C', text: 'The list raises a MemoryError.', correct: false },
      { key: 'D', text: 'The list stops accepting new elements until old ones are removed.', correct: false },
    ],
    explanation: `Answer: B

CPython list uses over-allocation with a growth pattern approximately: 0, 4, 8, 16, 25, 35, 46, 58, 72, 88... (roughly proportional to n * 1.125 for larger lists).

This amortizes the O(n) copy cost: although each individual resize is O(n), the amortized cost per append is O(1).

Check allocated capacity:
  import sys
  l = []
  for i in range(20):
    l.append(i)
    print(len(l), sys.getsizeof(l))

Pre-allocate if size is known:
  l = [None] * 1000  # avoids repeated reallocations
  # or use collections.deque for O(1) both ends`,
  },
  {
    title: 'Python DSA: defaultdict and Counter',
    slug: 'python-dsa-defaultdict-counter',
    track: 'Python + DSA',
    topic: 'DSA',
    difficulty: 'easy',
    description: `What is the difference between \`collections.defaultdict(list)\` and a regular \`dict\`?`,
    options: [
      { key: 'A', text: 'defaultdict is faster for all operations.', correct: false },
      { key: 'B', text: 'defaultdict returns a default value (from the factory) when accessing a missing key, instead of raising KeyError.', correct: true },
      { key: 'C', text: 'defaultdict can only store list values.', correct: false },
      { key: 'D', text: 'defaultdict sorts keys automatically.', correct: false },
    ],
    explanation: `Answer: B

  from collections import defaultdict

  # Regular dict
  d = {}
  d['a'].append(1)  # KeyError!

  # defaultdict
  dd = defaultdict(list)
  dd['a'].append(1)  # auto-creates dd['a'] = [] first
  dd['a'].append(2)  # dd == {'a': [1, 2]}

Common factories:
- defaultdict(list)  → missing key returns []
- defaultdict(int)   → missing key returns 0 (great for counting)
- defaultdict(set)   → missing key returns set()

Counter is a specialized dict for counting:
  from collections import Counter
  c = Counter('aabbc')  # Counter({'a': 2, 'b': 2, 'c': 1})
  c.most_common(2)      # [('a', 2), ('b', 2)]`,
  },
  {
    title: 'Python Generators: send() and Two-Way Communication',
    slug: 'python-generators-send',
    track: 'Python + DSA',
    topic: 'Generators',
    difficulty: 'hard',
    description: `What does \`generator.send(value)\` do differently from \`next(generator)\`?`,
    options: [
      { key: 'A', text: 'send() restarts the generator from the beginning with a new argument.', correct: false },
      { key: 'B', text: 'send(value) resumes the generator AND injects value as the result of the current yield expression; next() injects None.', correct: true },
      { key: 'C', text: 'send() is only valid for async generators.', correct: false },
      { key: 'D', text: 'They are identical — send(None) is the same as next().', correct: false },
    ],
    explanation: `Answer: B

send(value) IS the same as next() when value is None (send(None) == next()). But send(value) with a non-None value injects that value as the result of the paused yield expression:

  def accumulator():
    total = 0
    while True:
      x = yield total
      total += x

  g = accumulator()
  next(g)       # prime: runs to first yield, returns 0
  g.send(10)    # x = 10, total = 10, returns 10
  g.send(5)     # x = 5,  total = 15, returns 15

This two-way communication makes generators usable as coroutines. Python's asyncio was originally built on generator-based coroutines (@asyncio.coroutine + yield from) before async/await syntax.`,
  },
  {
    title: 'Python CPython: __slots__ Optimization',
    slug: 'python-cpython-slots',
    track: 'Python + DSA',
    topic: 'CPython Internals',
    difficulty: 'hard',
    description: `What does defining \`__slots__\` in a Python class do?`,
    options: [
      { key: 'A', text: 'It restricts the class to single inheritance.', correct: false },
      { key: 'B', text: 'It replaces the instance __dict__ with a fixed-size array of slot descriptors, reducing memory usage per instance and speeding up attribute access.', correct: true },
      { key: 'C', text: 'It makes all attributes read-only.', correct: false },
      { key: 'D', text: 'It enables multiple dispatch for methods.', correct: false },
    ],
    explanation: `Answer: B

By default, every Python instance has a __dict__ (a hash table) for dynamic attribute storage. This adds ~200 bytes overhead per instance.

  class Point:
    __slots__ = ('x', 'y')
    def __init__(self, x, y):
      self.x = x; self.y = y

With __slots__:
- No __dict__ per instance — attributes stored in a fixed C array (slot descriptors on the class).
- Memory per instance reduced by ~40-50% for simple classes.
- Attribute access slightly faster (no dict lookup).
- Cannot add arbitrary attributes (p.z = 3 raises AttributeError).

Ideal for classes that create millions of instances (e.g., graph nodes, event objects).`,
  },
  {
    title: 'Python DSA: Heapq Module',
    slug: 'python-dsa-heapq',
    track: 'Python + DSA',
    topic: 'DSA',
    difficulty: 'medium',
    description: `Python's \`heapq\` module implements a min-heap. How do you use it to implement a max-heap?`,
    options: [
      { key: 'A', text: 'Call heapq.heapify_max(lst) on the list.', correct: false },
      { key: 'B', text: 'Negate the values before insertion and negate them again on extraction.', correct: true },
      { key: 'C', text: 'Pass reverse=True to heapq.heappush.', correct: false },
      { key: 'D', text: 'Use heapq.nlargest() which internally maintains a max-heap.', correct: false },
    ],
    explanation: `Answer: B

Python's heapq is always a min-heap. Max-heap trick — negate values:

  import heapq
  h = []
  heapq.heappush(h, -10)
  heapq.heappush(h, -5)
  heapq.heappush(h, -20)
  max_val = -heapq.heappop(h)  # 20

For objects, negate the priority key: heapq.heappush(h, (-priority, item)).

Useful heapq functions:
- heapq.nlargest(k, iterable) — k largest elements.
- heapq.nsmallest(k, iterable) — k smallest elements.
- heapq.merge(*iterables) — merge sorted iterables lazily.

heapq operations: push O(log n), pop O(log n), peek h[0] O(1).`,
  },
  {
    title: 'Python Decorators: @property',
    slug: 'python-property-decorator',
    track: 'Python + DSA',
    topic: 'Decorators',
    difficulty: 'easy',
    description: `What does the \`@property\` decorator enable in Python?`,
    options: [
      { key: 'A', text: 'It makes a method static (no self parameter).', correct: false },
      { key: 'B', text: 'It allows a method to be accessed like an attribute (without parentheses), enabling computed properties and controlled attribute access.', correct: true },
      { key: 'C', text: 'It caches the method\'s return value permanently.', correct: false },
      { key: 'D', text: 'It marks the method as abstract.', correct: false },
    ],
    explanation: `Answer: B

  class Circle:
    def __init__(self, radius):
      self._radius = radius

    @property
    def area(self):
      return 3.14 * self._radius ** 2

    @property
    def radius(self): return self._radius

    @radius.setter
    def radius(self, value):
      if value < 0: raise ValueError('Radius must be non-negative')
      self._radius = value

  c = Circle(5)
  print(c.area)    # 78.5 (no parentheses needed)
  c.radius = 10    # calls setter

@property enables the uniform access principle: client code accesses computed values like plain attributes without knowing the implementation. Add validation in setters without changing the public API.`,
  },
  {
    title: 'Python GIL: asyncio vs Threading',
    slug: 'python-asyncio-vs-threading',
    track: 'Python + DSA',
    topic: 'GIL',
    difficulty: 'hard',
    description: `How does Python's \`asyncio\` (async/await) differ from OS threading for I/O concurrency?`,
    options: [
      { key: 'A', text: 'asyncio uses multiple threads; threading uses a single thread with callbacks.', correct: false },
      { key: 'B', text: 'asyncio uses cooperative multitasking in a single thread (coroutines yield at await points); threading uses OS-scheduled preemptive context switches between threads.', correct: true },
      { key: 'C', text: 'They are identical — asyncio is just syntactic sugar over threading.', correct: false },
      { key: 'D', text: 'asyncio is only for CPU-bound tasks; threading is only for I/O.', correct: false },
    ],
    explanation: `Answer: B

asyncio: single-threaded event loop. Coroutines voluntarily yield at each await (cooperative scheduling). No thread switching overhead, no locks needed for shared state within a single event loop. Excellent for high-concurrency I/O (thousands of connections).

threading: OS-scheduled. Threads are preempted between bytecode instructions (GIL check interval). Requires locks for shared mutable state. Context switch overhead is higher. Better for blocking code that cannot be made async (e.g., legacy libraries).

asyncio wins for:
- Many concurrent I/O-bound tasks (web servers, scrapers, WebSocket clients).
- Code that can use async-native libraries (aiohttp, asyncpg).

Threading wins for:
- Integrating with synchronous/blocking libraries.
- Simpler mental model for a small number of concurrent tasks.`,
  },
  {
    title: 'Python DSA: Trie Data Structure',
    slug: 'python-dsa-trie',
    track: 'Python + DSA',
    topic: 'DSA',
    difficulty: 'hard',
    description: `What is the time complexity of searching for a word in a Trie of N words with maximum word length L?`,
    options: [
      { key: 'A', text: 'O(N)', correct: false },
      { key: 'B', text: 'O(L)', correct: true },
      { key: 'C', text: 'O(N * L)', correct: false },
      { key: 'D', text: 'O(log N)', correct: false },
    ],
    explanation: `Answer: B — O(L)

A Trie search traverses one node per character of the query. It is completely independent of the number of words N stored. For a word of length L, the search visits exactly L nodes.

Python Trie:
  class TrieNode:
    def __init__(self):
      self.children = {}
      self.is_end = False

  class Trie:
    def __init__(self): self.root = TrieNode()
    def insert(self, word):
      node = self.root
      for ch in word:
        node = node.children.setdefault(ch, TrieNode())
      node.is_end = True
    def search(self, word):
      node = self.root
      for ch in word: 
        if ch not in node.children: return False
        node = node.children[ch]
      return node.is_end

Use cases: autocomplete, spell-check, IP routing, word search puzzles.`,
  },
  {
    title: 'Python CPython: is vs ==',
    slug: 'python-is-vs-equals',
    track: 'Python + DSA',
    topic: 'CPython Internals',
    difficulty: 'easy',
    description: `What is the difference between \`is\` and \`==\` in Python?`,
    options: [
      { key: 'A', text: 'is compares values; == compares identity.', correct: false },
      { key: 'B', text: 'is checks if two references point to the SAME object in memory (identity); == checks if two objects have EQUAL value (calls __eq__).', correct: true },
      { key: 'C', text: 'They are interchangeable for all types.', correct: false },
      { key: 'D', text: 'is is only valid for primitive types; == works for all types.', correct: false },
    ],
    explanation: `Answer: B

  a = [1, 2, 3]
  b = [1, 2, 3]
  c = a

  a == b   # True  — same values
  a is b   # False — different objects in memory
  a is c   # True  — same object (c is an alias for a)

CPython caches small integers (-5 to 256) and interned strings, so is may return True for these:
  x = 256; y = 256; x is y  # True (cached)
  x = 257; y = 257; x is y  # False (not cached) — implementation detail!

Rule: Use == for value comparison; use is ONLY for singletons like None, True, False:
  if result is None: ...  # correct
  if result == None: ...  # works but style guide (PEP 8) recommends is`,
  },
  {
    title: 'Python CPython: namedtuple vs dataclass',
    slug: 'python-namedtuple-vs-dataclass',
    track: 'Python + DSA',
    topic: 'CPython Internals',
    difficulty: 'medium',
    description: `What is the key difference between \`collections.namedtuple\` and \`@dataclass\` (Python 3.7+)?`,
    options: [
      { key: 'A', text: 'namedtuple instances are mutable; dataclasses are always frozen/immutable.', correct: false },
      { key: 'B', text: 'namedtuple creates immutable tuple subclasses with named fields; dataclass generates a regular mutable class with __init__, __repr__, __eq__ auto-generated, and supports default values, type hints, and optional freezing.', correct: true },
      { key: 'C', text: 'dataclass is deprecated in Python 3.10 in favor of namedtuple.', correct: false },
      { key: 'D', text: 'namedtuple supports inheritance; dataclass does not.', correct: false },
    ],
    explanation: `Answer: B

  from collections import namedtuple
  Point = namedtuple('Point', ['x', 'y'])
  p = Point(1, 2)
  p.x = 3  # AttributeError — immutable!
  p[0]     # 1 — still a tuple, index-accessible

  from dataclasses import dataclass, field
  @dataclass
  class Point:
    x: float
    y: float = 0.0
    tags: list = field(default_factory=list)
  p = Point(1.0)
  p.x = 3.0  # OK — mutable by default

  @dataclass(frozen=True)  # makes it immutable + hashable, like namedtuple

Choose namedtuple for lightweight read-only records with tuple semantics; choose dataclass for richer classes needing mutability, validation, or post-init logic.`,
  },
  {
    title: 'Python: Walrus Operator and Assignment Expressions',
    slug: 'python-walrus-operator',
    track: 'Python + DSA',
    topic: 'CPython Internals',
    difficulty: 'easy',
    description: `What does the walrus operator \`:=\` do in Python 3.8+?`,
    options: [
      { key: 'A', text: 'It is an alternative syntax for dictionary key assignment.', correct: false },
      { key: 'B', text: 'It assigns a value to a variable as part of an expression, allowing the value to be both assigned and used in the same statement.', correct: true },
      { key: 'C', text: 'It is the walrus (deep copy) operator, equivalent to copy.deepcopy().', correct: false },
      { key: 'D', text: 'It is only valid inside lambda expressions.', correct: false },
    ],
    explanation: `Answer: B

The := operator (PEP 572) is called the "assignment expression" or walrus operator because it assigns AND returns a value:

  # Without walrus — reads file twice conceptually:
  while line := f.readline():
    process(line)

  # Filter and reuse computed value:
  results = [y for x in data if (y := expensive(x)) > 0]

  # Avoid redundant regex match call:
  import re
  if m := re.search(r'(\\d+)', text):
    print(m.group(1))

Without :=, you'd need separate assignment statements or call the function twice. Walrus is especially useful in while loops, comprehension filters, and if statements where you want to capture and test a value in one step.`,
  },
];

// ═════════════════════════════════════════════════════════════════════════════
//  TRACK 5 · Core CS Fundamentals  (20 questions)
// ═════════════════════════════════════════════════════════════════════════════
const CORE_CS = [
  {
    title: 'DBMS: ACID Properties',
    slug: 'cs-dbms-acid-properties',
    track: 'Core CS Fundamentals',
    topic: 'DBMS Transactions',
    difficulty: 'easy',
    description: `What does the "I" in ACID stand for, and what does it guarantee?`,
    options: [
      { key: 'A', text: 'Integrity — data must satisfy all schema constraints at all times.', correct: false },
      { key: 'B', text: 'Isolation — concurrent transactions execute as if they were serial; intermediate states are invisible to other transactions.', correct: true },
      { key: 'C', text: 'Immutability — committed data cannot be modified.', correct: false },
      { key: 'D', text: 'Indexing — all frequently queried columns must be indexed.', correct: false },
    ],
    explanation: `Answer: B — Isolation

ACID breakdown:
- Atomicity: all-or-nothing — a transaction fully commits or fully rolls back.
- Consistency: transaction takes the DB from one valid state to another.
- Isolation: concurrent transactions do not see each other's intermediate results.
- Durability: committed data persists even after crashes (written to durable storage).

Isolation levels (weakest to strongest): READ UNCOMMITTED → READ COMMITTED → REPEATABLE READ → SERIALIZABLE. Stronger isolation costs more performance (more locking/MVCC overhead). PostgreSQL defaults to READ COMMITTED; banks may use SERIALIZABLE.`,
  },
  {
    title: 'DBMS: B-Tree Index Internals',
    slug: 'cs-dbms-btree-index',
    track: 'Core CS Fundamentals',
    topic: 'DBMS Indexes',
    difficulty: 'hard',
    description: `Why do databases use B+ Trees (not binary search trees) for indexes?`,
    options: [
      { key: 'A', text: 'B+ Trees require less memory because they do not store keys.', correct: false },
      { key: 'B', text: 'B+ Trees have high fan-out (many keys per node), minimizing disk I/O by keeping tree height low; all values are in leaf nodes linked for efficient range scans.', correct: true },
      { key: 'C', text: 'B+ Trees guarantee O(1) lookup while BSTs are O(log n).', correct: false },
      { key: 'D', text: 'B+ Trees auto-balance on every query, not just insertions.', correct: false },
    ],
    explanation: `Answer: B

Disk I/O is ~1000x slower than RAM access. Tree height determines the number of disk reads for a lookup.

BST: branching factor 2 → height O(log₂ n) → many disk reads for large n.
B+ Tree: branching factor 100–1000 (each node fills a disk page ~4KB) → height O(log₁₀₀₀ n) ≈ 2–4 levels for billions of rows.

B+ Tree properties:
- Internal nodes: only keys (pointers to children) — maximize fan-out.
- Leaf nodes: keys + values (actual data or row pointers), linked together as a doubly-linked list → efficient range scans (SELECT WHERE x BETWEEN 10 AND 100).
- Always balanced: all leaves at same depth.`,
  },
  {
    title: 'DBMS: Isolation Level — Dirty Read',
    slug: 'cs-dbms-dirty-read',
    track: 'Core CS Fundamentals',
    topic: 'DBMS Transactions',
    difficulty: 'medium',
    description: `Which isolation level allows dirty reads?`,
    options: [
      { key: 'A', text: 'READ COMMITTED', correct: false },
      { key: 'B', text: 'REPEATABLE READ', correct: false },
      { key: 'C', text: 'READ UNCOMMITTED', correct: true },
      { key: 'D', text: 'SERIALIZABLE', correct: false },
    ],
    explanation: `Answer: C — READ UNCOMMITTED

A dirty read occurs when Transaction A reads data written by Transaction B, which has not yet committed. If B rolls back, A has read data that never officially existed.

READ UNCOMMITTED: allows dirty reads — lowest isolation, highest concurrency.
READ COMMITTED: prevents dirty reads — only reads committed data. (PostgreSQL default)
REPEATABLE READ: additionally prevents non-repeatable reads — re-reading the same row always returns the same value within a transaction.
SERIALIZABLE: additionally prevents phantom reads — no new rows matching a query's WHERE appear mid-transaction.

Each stronger level adds more locking or MVCC overhead, reducing concurrent throughput.`,
  },
  {
    title: 'DBMS: Index — When NOT to Use',
    slug: 'cs-dbms-index-when-not-to-use',
    track: 'Core CS Fundamentals',
    topic: 'DBMS Indexes',
    difficulty: 'medium',
    description: `When does adding a database index actually HURT performance?`,
    options: [
      { key: 'A', text: 'When the table has more than 1000 rows.', correct: false },
      { key: 'B', text: 'When the column has very low cardinality (e.g., a boolean), or on tables with heavy write workloads, because each write must update all indexes.', correct: true },
      { key: 'C', text: 'When the index is on a primary key column.', correct: false },
      { key: 'D', text: 'When SELECT queries are more frequent than INSERT queries.', correct: false },
    ],
    explanation: `Answer: B

Indexes speed up reads but slow down writes:
- Every INSERT, UPDATE, DELETE must update all applicable indexes (maintain B+ Tree balance).
- High-write tables (event logs, metrics) suffer from index maintenance overhead.

Low cardinality problem: an index on a boolean column (true/false) causes a "full table scan" anyway — the optimizer may choose to skip the index because it would have to fetch half the table's pages.

Useful index: columns with HIGH cardinality (email, user_id), frequently used in WHERE, JOIN, or ORDER BY. A composite index (a, b) helps queries filtering on a alone or (a AND b) but not b alone.`,
  },
  {
    title: 'OS: Process vs Thread',
    slug: 'cs-os-process-vs-thread',
    track: 'Core CS Fundamentals',
    topic: 'OS Scheduling',
    difficulty: 'easy',
    description: `What is the key difference between a process and a thread?`,
    options: [
      { key: 'A', text: 'Threads have their own memory space; processes share memory.', correct: false },
      { key: 'B', text: 'A process has its own isolated address space; threads within a process share the same address space but have independent stacks and CPU register state.', correct: true },
      { key: 'C', text: 'Threads are heavier than processes and take more memory.', correct: false },
      { key: 'D', text: 'A process can only have one thread.', correct: false },
    ],
    explanation: `Answer: B

Process: independent unit of execution with its own virtual address space (code, heap, stack, file descriptors). Inter-process communication (IPC) requires explicit mechanisms (pipes, sockets, shared memory). Crash isolation — one process crashing does not affect others.

Thread: lightweight unit within a process. Shares the process's code, heap, and global variables. Each thread has its own stack, program counter, and registers. Communication is easy (shared memory) but requires synchronization (mutexes, semaphores). Thread creation (~μs) is faster than process creation (~ms).

Context switch: switching between threads within the same process is cheaper than switching between processes (no TLB flush needed for same address space).`,
  },
  {
    title: 'OS: CPU Scheduling — Round Robin',
    slug: 'cs-os-round-robin-scheduling',
    track: 'Core CS Fundamentals',
    topic: 'OS Scheduling',
    difficulty: 'medium',
    description: `What happens in Round Robin scheduling if the time quantum is set too small?`,
    options: [
      { key: 'A', text: 'Processes with higher priority get more CPU time.', correct: false },
      { key: 'B', text: 'Context switching overhead dominates; CPU spends more time switching than doing useful work.', correct: true },
      { key: 'C', text: 'Processes are never preempted and run to completion.', correct: false },
      { key: 'D', text: 'The scheduler falls back to FIFO automatically.', correct: false },
    ],
    explanation: `Answer: B

Round Robin gives each process a fixed time quantum (e.g., 10–100ms) and cycles through them. If a process doesn't finish in its quantum, it is preempted and re-queued.

Too small quantum (e.g., 1ms): extremely high context switch frequency. Saving/restoring CPU state (registers, stack pointer) + TLB/cache effects dominate. CPU utilization for actual work drops significantly.

Too large quantum: degenerates towards FCFS (First Come First Served) — poor responsiveness.

Ideal quantum: ~10–100ms for interactive systems (Linux CFS uses dynamic quantum based on weight). Linux uses the Completely Fair Scheduler (CFS), not pure Round Robin, but RR is the conceptual foundation.`,
  },
  {
    title: 'OS: Virtual Memory — Page Fault',
    slug: 'cs-os-page-fault',
    track: 'Core CS Fundamentals',
    topic: 'OS Virtual Memory',
    difficulty: 'medium',
    description: `What happens during a major page fault?`,
    options: [
      { key: 'A', text: 'The CPU accesses a page that is present in RAM but marked as read-only.', correct: false },
      { key: 'B', text: 'The CPU tries to access a virtual page not mapped in the page table; the OS loads the required page from disk into RAM (swapping).', correct: true },
      { key: 'C', text: 'The CPU generates an exception because the address is within a protected kernel page.', correct: false },
      { key: 'D', text: 'The CPU accesses a page that is in RAM but recently evicted from the TLB cache.', correct: false },
    ],
    explanation: `Answer: B

Page fault types:
- Minor (soft) fault: page is in memory but not mapped in this process's page table (e.g., copy-on-write, mmap). Resolved without disk I/O.
- Major (hard) fault: page is not in RAM — must be loaded from swap space or file on disk. Expensive (~5–10ms disk seek time).

Major page fault sequence:
1. MMU raises page fault exception.
2. OS page fault handler checks page table — finds page is valid but not in RAM.
3. OS selects a victim page to evict (using LRU or Clock algorithm) if RAM is full.
4. OS reads the required page from disk into a free frame.
5. OS updates the page table and TLB.
6. CPU retries the faulting instruction.`,
  },
  {
    title: 'OS: Semaphore vs Mutex',
    slug: 'cs-os-semaphore-vs-mutex',
    track: 'Core CS Fundamentals',
    topic: 'OS Scheduling',
    difficulty: 'medium',
    description: `What is the key difference between a semaphore and a mutex?`,
    options: [
      { key: 'A', text: 'A mutex can be unlocked by any thread; a semaphore can only be released by the thread that acquired it.', correct: false },
      { key: 'B', text: 'A mutex (binary semaphore with ownership) enforces that only the locking thread can unlock it; a semaphore is a signaling mechanism with a counter, usable by any thread.', correct: true },
      { key: 'C', text: 'Semaphores are faster than mutexes because they use busy-waiting.', correct: false },
      { key: 'D', text: 'Mutexes allow multiple threads to access a resource simultaneously.', correct: false },
    ],
    explanation: `Answer: B

Mutex (Mutual Exclusion):
- Binary: locked or unlocked.
- Ownership: only the thread that locked it can unlock it.
- Purpose: protect a critical section (shared resource) from concurrent access.

Semaphore (counting):
- Has a counter N; up to N threads can "acquire" simultaneously.
- No ownership — any thread can signal (V / release) it.
- Purpose: signaling between threads (producer signals consumer), or controlling access to a pool of N resources.

Binary semaphore (N=1) ≈ mutex BUT lacks ownership semantics — a different thread can release it, enabling use for inter-thread signaling patterns where ownership transfer is desired.`,
  },
  {
    title: 'OS: Virtual Memory — TLB',
    slug: 'cs-os-tlb',
    track: 'Core CS Fundamentals',
    topic: 'OS Virtual Memory',
    difficulty: 'hard',
    description: `What is the TLB (Translation Lookaside Buffer) and what happens on a TLB miss?`,
    options: [
      { key: 'A', text: 'TLB is a type of RAM used for page table storage; a miss causes a disk read.', correct: false },
      { key: 'B', text: 'TLB is a CPU-side cache of recent virtual-to-physical page translations; a miss causes a page table walk in RAM to find the mapping.', correct: true },
      { key: 'C', text: 'TLB is software-managed only; hardware never walks the page table.', correct: false },
      { key: 'D', text: 'A TLB miss always triggers a page fault.', correct: false },
    ],
    explanation: `Answer: B

Every memory access requires translating a virtual address to a physical address using the page table (which lives in RAM). Without a cache, every access would need multiple RAM reads (page table levels).

TLB: a small, fully-associative cache (64–1024 entries) on the CPU storing recent (virtual page → physical frame) mappings.

TLB hit: translation found in TLB → single-cycle latency. Covers ~99% of accesses if working set fits.
TLB miss: CPU walks the multi-level page table in RAM (hardware page walker on x86, software handler on MIPS/RISC-V). ~10–100 cycles of penalty.
Page fault: occurs when the page table entry is not present in RAM at all (page not mapped or swapped out). Much more expensive.

Context switches cause TLB flushes (or use ASIDs to avoid flushing).`,
  },
  {
    title: 'Networks: TCP Three-Way Handshake',
    slug: 'cs-networks-tcp-handshake',
    track: 'Core CS Fundamentals',
    topic: 'Computer Networks TCP',
    difficulty: 'easy',
    description: `What are the three steps of the TCP three-way handshake?`,
    options: [
      { key: 'A', text: 'SYN → ACK → FIN', correct: false },
      { key: 'B', text: 'SYN → SYN-ACK → ACK', correct: true },
      { key: 'C', text: 'SYN → ACK → SYN', correct: false },
      { key: 'D', text: 'CONNECT → ACCEPT → ESTABLISHED', correct: false },
    ],
    explanation: `Answer: B — SYN → SYN-ACK → ACK

1. Client → Server: SYN (seq=x) — "I want to connect, my starting sequence number is x."
2. Server → Client: SYN-ACK (seq=y, ack=x+1) — "OK, I acknowledge x+1; my sequence number is y."
3. Client → Server: ACK (ack=y+1) — "I acknowledge y+1; connection established."

After the handshake, both sides have synchronized sequence numbers and the connection is ESTABLISHED.

TCP uses sequence numbers for:
- Ordering out-of-order packets.
- Detecting lost packets (retransmission).
- Flow control (sliding window).

TCP termination uses a four-way FIN handshake: FIN → ACK → FIN → ACK.`,
  },
  {
    title: 'Networks: HTTP/1.1 vs HTTP/2',
    slug: 'cs-networks-http2',
    track: 'Core CS Fundamentals',
    topic: 'Computer Networks TCP',
    difficulty: 'medium',
    description: `What is the primary performance improvement of HTTP/2 over HTTP/1.1?`,
    options: [
      { key: 'A', text: 'HTTP/2 uses UDP instead of TCP for lower latency.', correct: false },
      { key: 'B', text: 'HTTP/2 uses binary framing and multiplexing — multiple requests/responses share one TCP connection concurrently, eliminating head-of-line blocking.', correct: true },
      { key: 'C', text: 'HTTP/2 compresses the request body using gzip automatically.', correct: false },
      { key: 'D', text: 'HTTP/2 requires fewer DNS lookups per session.', correct: false },
    ],
    explanation: `Answer: B

HTTP/1.1 limitations:
- One request per TCP connection at a time (pipelining rarely used due to head-of-line blocking).
- Browsers workaround by opening 6–8 parallel TCP connections per domain — wasteful.
- Plain-text headers (repeated, verbose).

HTTP/2 improvements:
- Binary framing: messages split into binary frames (not text), multiplexed over one TCP connection.
- Stream multiplexing: multiple requests/responses interleaved concurrently — no blocking.
- Header compression (HPACK): reduces header overhead.
- Server push: proactively send resources the client will need.

HTTP/3 (QUIC): moves to UDP-based QUIC transport, eliminating TCP-level head-of-line blocking entirely.`,
  },
  {
    title: 'Networks: DNS Resolution Process',
    slug: 'cs-networks-dns-resolution',
    track: 'Core CS Fundamentals',
    topic: 'Computer Networks DNS',
    difficulty: 'medium',
    description: `What is the correct order of DNS resolution for a first-time query to "www.example.com"?`,
    options: [
      { key: 'A', text: 'Browser cache → Root server → TLD server → Authoritative server.', correct: true },
      { key: 'B', text: 'Root server → TLD server → Browser cache → Authoritative server.', correct: false },
      { key: 'C', text: 'Authoritative server → TLD server → Root server → Browser cache.', correct: false },
      { key: 'D', text: 'ISP cache → Browser cache → TLD server → Root server.', correct: false },
    ],
    explanation: `Answer: A

Full recursive DNS resolution:
1. Browser DNS cache (TTL-controlled in-memory cache).
2. OS DNS cache / /etc/hosts.
3. Recursive resolver (ISP or 8.8.8.8) — checks its own cache.
4. If cache miss: Recursive resolver queries Root Name Server → "I don't know example.com, but here's the .com TLD server."
5. TLD Name Server (.com) → "Here's the authoritative NS for example.com."
6. Authoritative Name Server → returns the A/AAAA record (IP address).
7. Recursive resolver caches the result (per TTL) and returns it to the client.

All steps after step 3 are bypassed if the recursive resolver has a cached answer.`,
  },
  {
    title: 'DBMS: NoSQL vs SQL — CAP Theorem',
    slug: 'cs-dbms-cap-theorem',
    track: 'Core CS Fundamentals',
    topic: 'DBMS Transactions',
    difficulty: 'hard',
    description: `The CAP theorem states a distributed system can guarantee at most two of three properties. Which three?`,
    options: [
      { key: 'A', text: 'Consistency, Availability, Partition tolerance.', correct: true },
      { key: 'B', text: 'Concurrency, Atomicity, Performance.', correct: false },
      { key: 'C', text: 'Consistency, Atomicity, Partition tolerance.', correct: false },
      { key: 'D', text: 'Consistency, Availability, Performance.', correct: false },
    ],
    explanation: `Answer: A — Consistency, Availability, Partition tolerance

CAP Theorem (Brewer, 2000): In a distributed system, network partitions (P) are unavoidable. You must choose between:
- CP (Consistency + Partition tolerance): system returns an error/waits rather than serving stale data during a partition. Examples: HBase, Zookeeper, MongoDB (strong consistency mode).
- AP (Availability + Partition tolerance): system continues serving (possibly stale) data during a partition. Examples: Cassandra, DynamoDB, CouchDB.

"CA" (Consistency + Availability without Partition tolerance) is only achievable in a single-node system where network partitions cannot occur.

Modern systems often use tunable consistency (Cassandra's quorum reads/writes) to trade between C and A depending on the operation.`,
  },
  {
    title: 'Networks: TCP vs UDP',
    slug: 'cs-networks-tcp-vs-udp',
    track: 'Core CS Fundamentals',
    topic: 'Computer Networks TCP',
    difficulty: 'easy',
    description: `Which use case is best suited for UDP over TCP?`,
    options: [
      { key: 'A', text: 'Sending an email with a guaranteed delivery confirmation.', correct: false },
      { key: 'B', text: 'Live video streaming / online gaming where low latency is critical and occasional packet loss is acceptable.', correct: true },
      { key: 'C', text: 'Downloading a large file where every byte must arrive intact.', correct: false },
      { key: 'D', text: 'HTTPS web traffic requiring ordered, reliable delivery.', correct: false },
    ],
    explanation: `Answer: B

TCP: connection-oriented, reliable (ACKs, retransmission), ordered, flow/congestion controlled. Overhead: handshake latency, retransmission delays. Use for HTTP, email, FTP, SSH.

UDP: connectionless, unreliable (no ACKs), unordered, no congestion control. Low overhead, low latency. Use for DNS (fast, small queries), VoIP, video conferencing, online games, live streaming.

In real-time applications, a retransmitted packet for 500ms-old video frame is useless — better to display the next frame. UDP lets the application decide how to handle loss.

HTTP/3 (QUIC) uses UDP but implements reliability and ordering at the application layer, combining UDP's speed with TCP-like guarantees.`,
  },
  {
    title: 'OS: Deadlock vs Livelock vs Starvation',
    slug: 'cs-os-deadlock-livelock-starvation',
    track: 'Core CS Fundamentals',
    topic: 'OS Scheduling',
    difficulty: 'medium',
    description: `What distinguishes a livelock from a deadlock?`,
    options: [
      { key: 'A', text: 'In a livelock, processes are blocked and not executing; in a deadlock, they keep executing.', correct: false },
      { key: 'B', text: 'In a livelock, processes are actively running and changing state, but make no overall progress (responding to each other indefinitely); in a deadlock, processes are blocked, waiting for events that will never occur.', correct: true },
      { key: 'C', text: 'Livelock only occurs in distributed systems; deadlock only in single-machine systems.', correct: false },
      { key: 'D', text: 'Deadlock is always detected automatically by the OS; livelock is not.', correct: false },
    ],
    explanation: `Answer: B

Deadlock: processes are BLOCKED — each waiting for a resource held by another. No progress. No CPU consumption.

Livelock: processes are RUNNING — actively responding to each other but not making useful progress. Like two people in a corridor repeatedly stepping aside in the same direction.

Example (livelock): Thread A tries to acquire Lock1, sees Lock2 is busy, releases Lock1 and retries. Thread B does the same. Both keep releasing and retrying indefinitely.

Starvation: a process is ready to run but is perpetually denied the CPU because higher-priority processes always preempt it. (Not blocked by locks — blocked by scheduler.)

Prevention: randomized backoff (Ethernet CSMA/CD), global lock ordering (deadlock), aging (starvation).`,
  },
  {
    title: 'DBMS: Normalization — 3NF vs BCNF',
    slug: 'cs-dbms-normalization-bcnf',
    track: 'Core CS Fundamentals',
    topic: 'DBMS Transactions',
    difficulty: 'hard',
    description: `A table is in 3NF but NOT in BCNF. What anomaly does BCNF eliminate?`,
    options: [
      { key: 'A', text: 'Repeating groups of columns in a single row.', correct: false },
      { key: 'B', text: 'Partial dependencies — where non-key attributes depend on only part of a composite key.', correct: false },
      { key: 'C', text: 'Functional dependencies where a non-key attribute determines part of the candidate key (non-trivial FD where the determinant is not a superkey).', correct: true },
      { key: 'D', text: 'Multi-valued dependencies between independent attributes.', correct: false },
    ],
    explanation: `Answer: C

Normal forms ladder:
1NF: atomic values, no repeating groups.
2NF: 1NF + no partial dependencies (non-key attribute depends on full composite key, not part of it).
3NF: 2NF + no transitive dependencies (non-key attribute depends on another non-key attribute).
BCNF: stricter than 3NF — for every functional dependency X → Y, X must be a superkey.

The gap between 3NF and BCNF: 3NF allows FDs where the determinant is not a superkey IF the dependent attribute is part of some candidate key. BCNF forbids this.

Trade-off: BCNF decomposition sometimes causes loss of dependency preservation (a dependency cannot be checked with a single table scan). 3NF is often preferred for this reason in practice.`,
  },
  {
    title: 'Networks: HTTPS and TLS Handshake',
    slug: 'cs-networks-tls-handshake',
    track: 'Core CS Fundamentals',
    topic: 'Computer Networks TCP',
    difficulty: 'hard',
    description: `In a TLS 1.3 handshake, what is the purpose of the Diffie-Hellman key exchange?`,
    options: [
      { key: 'A', text: 'To encrypt the server\'s private key for transmission to the client.', correct: false },
      { key: 'B', text: 'To establish a shared session key between client and server over an insecure channel without ever transmitting the key itself.', correct: true },
      { key: 'C', text: 'To verify the server\'s identity using a trusted certificate authority.', correct: false },
      { key: 'D', text: 'To compress HTTP headers for faster data transfer.', correct: false },
    ],
    explanation: `Answer: B

Diffie-Hellman (DH) key exchange (conceptually):
1. Client and server agree on public parameters (prime p, generator g).
2. Client picks secret a, sends g^a mod p.
3. Server picks secret b, sends g^b mod p.
4. Client computes (g^b)^a = g^(ab) mod p.
5. Server computes (g^a)^b = g^(ab) mod p.
Both arrive at the same shared secret without it ever being transmitted.

TLS 1.3 uses ECDHE (Elliptic Curve DH Ephemeral) for Perfect Forward Secrecy (PFS): a new key pair is generated for each session. Even if a server's long-term private key is compromised later, past sessions cannot be decrypted.

Certificate (X.509): provides server authentication (binds the server's public key to its domain via a CA-signed cert). DH provides key exchange; the cert provides authentication.`,
  },
  {
    title: 'OS: Memory Paging vs Segmentation',
    slug: 'cs-os-paging-vs-segmentation',
    track: 'Core CS Fundamentals',
    topic: 'OS Virtual Memory',
    difficulty: 'medium',
    description: `What is the key advantage of paging over segmentation in memory management?`,
    options: [
      { key: 'A', text: 'Paging preserves the logical structure of programs (code, data, stack).', correct: false },
      { key: 'B', text: 'Paging eliminates external fragmentation by using fixed-size pages; memory frames can be allocated anywhere in physical memory.', correct: true },
      { key: 'C', text: 'Paging allows segments to grow dynamically without reallocation.', correct: false },
      { key: 'D', text: 'Paging is simpler to implement than segmentation.', correct: false },
    ],
    explanation: `Answer: B

Segmentation: divides memory into logical variable-size segments (code, data, stack, heap). Problems: external fragmentation — gaps between segments are unusable if too small for a new segment.

Paging: divides both physical memory and virtual address space into fixed-size pages (typically 4KB). Physical frames and virtual pages are the same size, so any frame can hold any page. No external fragmentation. Internal fragmentation: the last page of a process may be partially used.

Modern OSes use segmentation + paging (x86 protected mode): segments provide logical organization, paging handles physical memory allocation.

Huge pages (2MB/1GB): reduce TLB pressure for large working sets (databases, ML workloads).`,
  },
  {
    title: 'DBMS: SQL Query Execution Order',
    slug: 'cs-dbms-sql-execution-order',
    track: 'Core CS Fundamentals',
    topic: 'DBMS Indexes',
    difficulty: 'medium',
    description: `In SQL, what is the logical order of clause evaluation?`,
    options: [
      { key: 'A', text: 'SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY', correct: false },
      { key: 'B', text: 'FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT', correct: true },
      { key: 'C', text: 'FROM → SELECT → WHERE → GROUP BY → ORDER BY → HAVING', correct: false },
      { key: 'D', text: 'SELECT → WHERE → FROM → HAVING → GROUP BY → ORDER BY', correct: false },
    ],
    explanation: `Answer: B

Logical SQL evaluation order (not the order you write it):
1. FROM / JOIN — identify and combine the source tables.
2. WHERE — filter individual rows.
3. GROUP BY — group rows by specified columns.
4. HAVING — filter groups (can use aggregate functions).
5. SELECT — compute the output columns and expressions.
6. DISTINCT — remove duplicates.
7. ORDER BY — sort results.
8. LIMIT / OFFSET — paginate.

Implication: you cannot use a SELECT alias in a WHERE clause (WHERE runs before SELECT). But you CAN use aliases in ORDER BY (ORDER BY runs after SELECT).

This is why: SELECT name, COUNT(*) AS cnt FROM ... WHERE cnt > 5 — FAILS. Use HAVING instead: HAVING COUNT(*) > 5.`,
  },
  {
    title: 'OS: Context Switch — Cost and Mechanisms',
    slug: 'cs-os-context-switch-cost',
    track: 'Core CS Fundamentals',
    topic: 'OS Scheduling',
    difficulty: 'medium',
    description: `What are the main costs of a CPU context switch between two processes?`,
    options: [
      { key: 'A', text: 'Only the time to save and restore CPU registers (~nanoseconds), making it essentially free.', correct: false },
      { key: 'B', text: 'Saving/restoring CPU state (registers, PC, stack pointer), plus indirect costs: TLB flush (invalidating virtual-to-physical mappings) and cache pollution (new process evicts old process cache lines).', correct: true },
      { key: 'C', text: 'The cost is always exactly one clock cycle regardless of process state.', correct: false },
      { key: 'D', text: 'Context switches only occur between processes, never between threads of the same process.', correct: false },
    ],
    explanation: `Answer: B

Context switch components:

1. Direct costs (kernel work):
   - Save current process: registers, PC, stack pointer, FPU state → PCB (Process Control Block).
   - Restore next process: load saved state from its PCB.
   - Typically 1–10 microseconds of pure kernel time.

2. Indirect costs (the expensive part):
   - TLB flush: switching address spaces invalidates all TLB entries (or requires ASID tagging to avoid). Next process gets TLB misses on every memory access until its working set is re-cached.
   - Cache pollution: L1/L2 caches contain old process's data. New process incurs cache misses until its hot data is loaded.
   - These indirect costs can be 10–100x the direct cost for cache-heavy workloads.

Thread context switches (same process) are cheaper: no TLB flush (same address space), though caches are still disrupted.`,
  },
];

// ═════════════════════════════════════════════════════════════════════════════
//  All tracks
// ═════════════════════════════════════════════════════════════════════════════
const ALL_TRACKS = [
  { name: 'Java + DSA',            color: C.yellow,  questions: JAVA_DSA   },
  { name: 'JavaScript + Web',      color: C.cyan,    questions: JS_WEB     },
  { name: 'C++ + DSA',             color: C.blue,    questions: CPP_DSA    },
  { name: 'Python + DSA',          color: C.green,   questions: PYTHON_DSA },
  { name: 'Core CS Fundamentals',  color: C.magenta, questions: CORE_CS    },
];

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function upsertQuestion(client, q) {
  const res = await client.query(
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
  const { id: problemId, is_insert } = res.rows[0];

  // Replace options atomically
  await client.query('DELETE FROM mcq_options WHERE problem_id = $1', [problemId]);
  for (const opt of q.options) {
    await client.query(
      `INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct)
       VALUES ($1, $2, $3, $4)`,
      [problemId, opt.key, opt.text, opt.correct]
    );
  }
  return { problemId, is_insert };
}

// ─── Per-track seeding ────────────────────────────────────────────────────────

async function seedTrack(track, dryRun = false) {
  head(`${track.color}▶  Track: ${track.name}${C.reset}`);
  sep();

  if (dryRun) {
    track.questions.forEach((q, i) =>
      log(`  ${String(i + 1).padStart(2)}. [${q.difficulty.padEnd(6)}] ${q.title}`)
    );
    log(`${C.dim}  (dry-run — no DB writes)${C.reset}`);
    return { inserted: 0, updated: 0, skipped: track.questions.length };
  }

  const client = await pool.connect();
  let inserted = 0, updated = 0;

  try {
    await client.query('BEGIN');

    for (const q of track.questions) {
      const { is_insert } = await upsertQuestion(client, q);
      if (is_insert) {
        inserted++;
        ok(`[${q.difficulty.padEnd(6)}] ${q.title}`);
      } else {
        updated++;
        upd(`[${q.difficulty.padEnd(6)}] ${q.title}`);
      }
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    err(`Track "${track.name}" failed — rolled back. ${e.message}`);
    throw e;
  } finally {
    client.release();
  }

  return { inserted, updated, skipped: 0 };
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

async function main() {
  const args    = process.argv.slice(2);
  const dryRun  = args.includes('--dry-run');
  const trackArg = args.includes('--track') ? args[args.indexOf('--track') + 1] : null;

  log(`\n${C.bold}╔══════════════════════════════════════════════════════════╗${C.reset}`);
  log(`${C.bold}║     CodePath MCQ Generator — 100 Placement Questions     ║${C.reset}`);
  log(`${C.bold}╚══════════════════════════════════════════════════════════╝${C.reset}`);

  if (dryRun) log(`${C.yellow}  Mode: DRY RUN (no DB writes)${C.reset}`);
  if (trackArg) log(`  Filtering to track: ${C.cyan}${trackArg}${C.reset}`);

  const tracksToSeed = trackArg
    ? ALL_TRACKS.filter(t => t.name.toLowerCase().includes(trackArg.toLowerCase()))
    : ALL_TRACKS;

  if (tracksToSeed.length === 0) {
    err(`No track matching "${trackArg}". Available tracks:`);
    ALL_TRACKS.forEach(t => log(`  • ${t.name}`));
    process.exit(1);
  }

  const totals = { inserted: 0, updated: 0, skipped: 0 };
  const trackResults = [];

  for (const track of tracksToSeed) {
    const result = await seedTrack(track, dryRun);
    totals.inserted += result.inserted;
    totals.updated  += result.updated;
    totals.skipped  += result.skipped;
    trackResults.push({ name: track.name, ...result });
  }

  // Summary table
  log(`\n${C.bold}╔══════════════════════════════════════════════════════════╗${C.reset}`);
  log(`${C.bold}║                      SUMMARY                             ║${C.reset}`);
  log(`${C.bold}╠══════════════════════════════════════════════════════════╣${C.reset}`);
  trackResults.forEach(r => {
    const ins  = String(r.inserted).padStart(2);
    const upd_ = String(r.updated).padStart(2);
    const total = r.inserted + r.updated + r.skipped;
    log(`║  ${r.name.padEnd(26)} ${ins} inserted  ${upd_} updated  ${String(total).padStart(2)} total  ║`);
  });
  log(`${C.bold}╠══════════════════════════════════════════════════════════╣${C.reset}`);
  const grandTotal = totals.inserted + totals.updated + totals.skipped;
  log(`${C.bold}║  GRAND TOTAL${' '.repeat(15)}${String(totals.inserted).padStart(2)} inserted  ${String(totals.updated).padStart(2)} updated  ${String(grandTotal).padStart(3)} total ║${C.reset}`);
  log(`${C.bold}╚══════════════════════════════════════════════════════════╝${C.reset}\n`);

  if (!dryRun) await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });

