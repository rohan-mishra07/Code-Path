-- =================================================================
-- 20 HIGH-FREQUENCY PLACEMENT & INTERVIEW MCQs
-- =================================================================

-- 1. Java / OOP: String Immutability
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'String Pool and Immutability in Java',
  'java-string-pool-immutability',
  'String s1 = "Hello";
String s2 = new String("Hello");
System.out.println((s1 == s2) + " " + s1.equals(s2));

What does this code print?',
  'easy', 'mcq', 'Java / OOPs',
  'The "==" operator compares memory references. s1 points to the string literal in the String Constant Pool, while s2 refers to a new distinct heap object, making s1 == s2 false. The .equals() method compares content, returning true.'
) ON CONFLICT (slug) DO NOTHING;

-- 2. Java / OOP: Finally Block Behavior
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'Java Try-Catch-Finally Execution',
  'java-try-catch-finally-execution',
  'Under which of the following circumstances will a "finally" block in Java NOT execute after a try block?',
  'medium', 'mcq', 'Java / OOPs',
  'The finally block always executes unless System.exit(0) is called, which terminates the JVM abruptly, or a fatal JVM error (like power failure / JVM crash) occurs.'
) ON CONFLICT (slug) DO NOTHING;

-- 3. Java / OOP: Interface vs Abstract Class
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'Java 8 Interface Default Methods',
  'java8-interface-default-methods',
  'What was the primary motive behind introducing default methods in interfaces in Java 8?',
  'medium', 'mcq', 'Java / OOPs',
  'Default methods enable backward compatibility: adding new methods to interfaces (like stream() in Collection) without breaking existing third-party implementing classes.'
) ON CONFLICT (slug) DO NOTHING;

-- 4. Java / OOP: Polymorphism & Early Binding
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'Early vs Late Binding in Java',
  'java-binding-resolution',
  'Which of the following method types in Java is resolved using Early (Static) Binding at compile time?',
  'easy', 'mcq', 'Java / OOPs',
  'Static, private, and final methods cannot be overridden dynamically at runtime. The compiler binds them directly to their class definition using early binding.'
) ON CONFLICT (slug) DO NOTHING;

-- 5. DSA: Balanced BST Search
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'AVL Tree vs Red-Black Tree Lookup',
  'avl-vs-red-black-lookup',
  'Why does an AVL tree offer faster lookup operations compared to a Red-Black Tree for the same dataset?',
  'medium', 'mcq', 'Data Structures',
  'AVL trees are more strictly balanced than Red-Black trees (maximum height difference of 1 between left and right subtrees). A shorter maximum height guarantees fewer pointer hops during lookup.'
) ON CONFLICT (slug) DO NOTHING;

-- 6. DSA: Queue using Two Stacks
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'Queue Implementation Using Two Stacks',
  'queue-using-two-stacks-amortized',
  'When implementing a FIFO Queue using two LIFO Stacks, what is the amortized time complexity of a dequeue (pop) operation?',
  'medium', 'mcq', 'Data Structures',
  'Although transferring elements from stack1 to stack2 takes O(N) in the worst single instance, each element is moved at most twice across all operations, yielding an amortized complexity of O(1).'
) ON CONFLICT (slug) DO NOTHING;

-- 7. DSA: Cycle Detection
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'Linked List Cycle Detection Algorithm',
  'linked-list-cycle-detection',
  'Which algorithm detects a loop in a singly linked list in O(N) time and O(1) auxiliary space?',
  'easy', 'mcq', 'Data Structures',
  'Floyd’s Cycle-Finding Algorithm (Tortoise and Hare) uses two pointers moving at different speeds (1x and 2x) to detect loops without extra memory allocations.'
) ON CONFLICT (slug) DO NOTHING;

-- 8. DSA: Sorting Stability
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'Sorting Stability Definition',
  'sorting-algorithm-stability',
  'Which of the following standard sorting algorithms is inherently UNSTABLE?',
  'easy', 'mcq', 'Data Structures',
  'QuickSort swaps distant elements across the partition pivot, which can reorder identical elements, making it an unstable sorting algorithm.'
) ON CONFLICT (slug) DO NOTHING;

-- 9. SQL: HAVING vs WHERE
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'SQL WHERE vs HAVING Clause',
  'sql-where-vs-having',
  'What is the fundamental difference between WHERE and HAVING clauses in SQL?',
  'easy', 'mcq', 'SQL / DBMS',
  'WHERE filters rows BEFORE grouping occurs and cannot accept aggregate functions. HAVING filters aggregated data AFTER the GROUP BY clause has been evaluated.'
) ON CONFLICT (slug) DO NOTHING;

-- 10. SQL: ACID Atomicity
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'ACID Properties - Atomicity',
  'acid-atomicity-definition',
  'Which mechanism does a Relational DBMS rely on to guarantee the Atomicity property in transactions?',
  'medium', 'mcq', 'SQL / DBMS',
  'DBMS uses Write-Ahead Logging (WAL) or undo logs. If a transaction crashes mid-way, the undo log rolls back every modified uncommitted block.'
) ON CONFLICT (slug) DO NOTHING;

-- 11. SQL: B-Tree Index Advantage
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'B-Tree vs Hash Indexing',
  'btree-vs-hash-index',
  'Why do databases default to B-Tree indexes instead of Hash indexes for table columns?',
  'medium', 'mcq', 'SQL / DBMS',
  'Hash indexes only support exact equality checks (col = 5). B-Tree indexes maintain sorted order, allowing fast range scans (col BETWEEN 10 AND 50, col > 100), ORDER BY, and prefix matching.'
) ON CONFLICT (slug) DO NOTHING;

-- 12. SQL: Normalization 3NF
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'Third Normal Form (3NF) Requirement',
  'third-normal-form-requirement',
  'A relation is in Third Normal Form (3NF) if it is in 2NF and has no:',
  'easy', 'mcq', 'SQL / DBMS',
  '3NF strictly requires that no non-prime attribute is transitively dependent on the primary key (no X -> Y -> Z transitive functional dependencies).'
) ON CONFLICT (slug) DO NOTHING;

-- 13. OS: Virtual Memory & Thrashing
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'Operating System Thrashing',
  'os-thrashing-condition',
  'In an operating system with demand paging, what is "Thrashing"?',
  'medium', 'mcq', 'OS & System Design',
  'Thrashing happens when the total working sets of active processes exceed available physical RAM, causing the OS to spend more time swapping pages in/out of disk than executing instructions.'
) ON CONFLICT (slug) DO NOTHING;

-- 14. OS: Process vs Thread
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'Process vs Thread Shared Memory',
  'process-vs-thread-shared-resources',
  'Which of the following resources is NOT shared between threads belonging to the same process?',
  'easy', 'mcq', 'OS & System Design',
  'Each thread has its own execution stack and register state to manage local variables and active function calls. The heap, global variables, and code segment are shared.'
) ON CONFLICT (slug) DO NOTHING;

-- 15. OS: Semaphores
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'Counting vs Binary Semaphore',
  'semaphore-types-and-usage',
  'What is the difference between a Binary Semaphore and a Mutex?',
  'medium', 'mcq', 'OS & System Design',
  'A Mutex has an ownership concept (only the thread that locked it can unlock it). A Binary Semaphore has no ownership and can be signaled (unlocked) by any thread.'
) ON CONFLICT (slug) DO NOTHING;

-- 16. OS: Round Robin Scheduling
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'Round Robin Time Quantum Effect',
  'round-robin-time-quantum',
  'What happens if the time quantum in a Round Robin CPU scheduling algorithm is set excessively large?',
  'easy', 'mcq', 'OS & System Design',
  'If the time quantum exceeds the burst time of the longest running process, no preemptions take place, and Round Robin behaves identically to First-Come, First-Served (FCFS).'
) ON CONFLICT (slug) DO NOTHING;

-- 17. CN: TCP vs UDP
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'TCP 3-Way Handshake Flags',
  'tcp-three-way-handshake',
  'What are the TCP control flags transmitted in chronological order during the 3-Way Handshake connection establishment?',
  'easy', 'mcq', 'Computer Networks',
  'Client sends SYN. Server replies with SYN-ACK. Client finalizes connection with ACK.'
) ON CONFLICT (slug) DO NOTHING;

-- 18. CN: DNS Resolution Layer
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'DNS Protocol Transport Layer',
  'dns-protocol-transport-layer',
  'Which transport protocol does standard DNS primarily use for domain name queries, and why?',
  'medium', 'mcq', 'Computer Networks',
  'Standard DNS lookups use UDP port 53 because it is lightweight, stateless, and avoids the round-trip connection overhead of the TCP 3-way handshake.'
) ON CONFLICT (slug) DO NOTHING;

-- 19. CN: HTTP Status Code 401 vs 403
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'HTTP 401 vs 403 Status Codes',
  'http-401-vs-403',
  'What is the precise distinction between HTTP 401 and HTTP 403 status codes?',
  'easy', 'mcq', 'Computer Networks',
  '401 Unauthorized means authentication is missing or invalid (the server does not know who you are). 403 Forbidden means the identity is recognized, but the user lacks permission for that resource.'
) ON CONFLICT (slug) DO NOTHING;

-- 20. JS: Closures & Scope
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'JavaScript Closure Memory Leak',
  'javascript-closure-behavior',
  'What defines a Closure in JavaScript?',
  'easy', 'mcq', 'JavaScript',
  'A closure is a function bundled together with references to its surrounding lexical environment, allowing an inner function to access an outer function’s scope even after the outer function has returned.'
) ON CONFLICT (slug) DO NOTHING;

-- =================================================================
-- INSERT MCQ OPTIONS FOR ALL 20 QUESTIONS
-- =================================================================

DO $$
DECLARE
  v_pid INT;
BEGIN
  -- 1
  SELECT id INTO v_pid FROM problems WHERE slug = 'java-string-pool-immutability';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', 'true true', false),
      (v_pid, 'B', 'false true', true),
      (v_pid, 'C', 'true false', false),
      (v_pid, 'D', 'false false', false);
  END IF;

  -- 2
  SELECT id INTO v_pid FROM problems WHERE slug = 'java-try-catch-finally-execution';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', 'When an unhandled NullPointerException occurs', false),
      (v_pid, 'B', 'When a return statement is encountered in the try block', false),
      (v_pid, 'C', 'When System.exit(0) is called in the try block', true),
      (v_pid, 'D', 'When an OutOfMemoryError is thrown', false);
  END IF;

  -- 3
  SELECT id INTO v_pid FROM problems WHERE slug = 'java8-interface-default-methods';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', 'To replace abstract classes entirely', false),
      (v_pid, 'B', 'To allow interfaces to evolve without breaking backward compatibility for implementing classes', true),
      (v_pid, 'C', 'To enable multiple inheritance of state', false),
      (v_pid, 'D', 'To improve Java compilation speed', false);
  END IF;

  -- 4
  SELECT id INTO v_pid FROM problems WHERE slug = 'java-binding-resolution';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', 'Overridden public instance methods', false),
      (v_pid, 'B', 'Static and private methods', true),
      (v_pid, 'C', 'Interface method implementations', false),
      (v_pid, 'D', 'Abstract method declarations', false);
  END IF;

  -- 5
  SELECT id INTO v_pid FROM problems WHERE slug = 'avl-vs-red-black-lookup';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', 'AVL trees use hashing instead of tree traversal', false),
      (v_pid, 'B', 'AVL trees are more strictly balanced, resulting in a smaller maximum height', true),
      (v_pid, 'C', 'Red-Black trees require two passes per lookup', false),
      (v_pid, 'D', 'AVL trees store elements in an contiguous array', false);
  END IF;

  -- 6
  SELECT id INTO v_pid FROM problems WHERE slug = 'queue-using-two-stacks-amortized';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', 'O(1)', true),
      (v_pid, 'B', 'O(log N)', false),
      (v_pid, 'C', 'O(N)', false),
      (v_pid, 'D', 'O(N^2)', false);
  END IF;

  -- 7
  SELECT id INTO v_pid FROM problems WHERE slug = 'linked-list-cycle-detection';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', 'Dijkstra Algorithm', false),
      (v_pid, 'B', 'Floyd Cycle-Finding (Tortoise and Hare)', true),
      (v_pid, 'C', 'Kadane Algorithm', false),
      (v_pid, 'D', 'Binary Search on node values', false);
  END IF;

  -- 8
  SELECT id INTO v_pid FROM problems WHERE slug = 'sorting-algorithm-stability';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', 'MergeSort', false),
      (v_pid, 'B', 'InsertionSort', false),
      (v_pid, 'C', 'QuickSort', true),
      (v_pid, 'D', 'BubbleSort', false);
  END IF;

  -- 9
  SELECT id INTO v_pid FROM problems WHERE slug = 'sql-where-vs-having';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', 'WHERE is for SELECT statements; HAVING is for INSERT statements', false),
      (v_pid, 'B', 'WHERE filters rows before aggregation; HAVING filters groups after aggregation', true),
      (v_pid, 'C', 'WHERE can use aggregate functions like COUNT(); HAVING cannot', false),
      (v_pid, 'D', 'There is no difference in execution order', false);
  END IF;

  -- 10
  SELECT id INTO v_pid FROM problems WHERE slug = 'acid-atomicity-definition';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', 'Two-phase locking', false),
      (v_pid, 'B', 'Write-Ahead / Undo Logging', true),
      (v_pid, 'C', 'Data normalization', false),
      (v_pid, 'D', 'Foreign key constraints', false);
  END IF;

  -- 11
  SELECT id INTO v_pid FROM problems WHERE slug = 'btree-vs-hash-index';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', 'B-Trees consume zero disk space', false),
      (v_pid, 'B', 'B-Trees support range queries and sorted scans, while Hash indexes only support equality', true),
      (v_pid, 'C', 'Hash indexes are not supported by any SQL engine', false),
      (v_pid, 'D', 'B-Trees execute in O(1) time', false);
  END IF;

  -- 12
  SELECT id INTO v_pid FROM problems WHERE slug = 'third-normal-form-requirement';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', 'Multi-valued dependencies', false),
      (v_pid, 'B', 'Transitive functional dependencies', true),
      (v_pid, 'C', 'Partial dependencies', false),
      (v_pid, 'D', 'Composite keys', false);
  END IF;

  -- 13
  SELECT id INTO v_pid FROM problems WHERE slug = 'os-thrashing-condition';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', 'High CPU utilization with no I/O', false),
      (v_pid, 'B', 'The OS spending more time servicing page faults than executing application instructions', true),
      (v_pid, 'C', 'A deadlock involving multiple I/O devices', false),
      (v_pid, 'D', 'Cache memory corruption', false);
  END IF;

  -- 14
  SELECT id INTO v_pid FROM problems WHERE slug = 'process-vs-thread-shared-resources';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', 'Heap memory', false),
      (v_pid, 'B', 'Open file descriptors', false),
      (v_pid, 'C', 'Call Stack and Registers', true),
      (v_pid, 'D', 'Global variables', false);
  END IF;

  -- 15
  SELECT id INTO v_pid FROM problems WHERE slug = 'semaphore-types-and-usage';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', 'A Mutex has an ownership concept, while a Semaphore does not', true),
      (v_pid, 'B', 'Semaphores cannot be used in multi-core systems', false),
      (v_pid, 'C', 'A Mutex allows multiple threads concurrently, whereas a Semaphore allows only one', false),
      (v_pid, 'D', 'There is no operational difference', false);
  END IF;

  -- 16
  SELECT id INTO v_pid FROM problems WHERE slug = 'round-robin-time-quantum';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', 'The system deadlocks', false),
      (v_pid, 'B', 'It degenerates into First-Come, First-Served (FCFS) scheduling', true),
      (v_pid, 'C', 'Context switches increase exponentially', false),
      (v_pid, 'D', 'Shortest Job First (SJF) is achieved', false);
  END IF;

  -- 17
  SELECT id INTO v_pid FROM problems WHERE slug = 'tcp-three-way-handshake';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', 'ACK -> SYN -> SYN-ACK', false),
      (v_pid, 'B', 'SYN -> SYN-ACK -> ACK', true),
      (v_pid, 'C', 'FIN -> ACK -> FIN-ACK', false),
      (v_pid, 'D', 'SYN -> ACK -> DATA', false);
  END IF;

  -- 18
  SELECT id INTO v_pid FROM problems WHERE slug = 'dns-protocol-transport-layer';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', 'TCP port 80 for encryption', false),
      (v_pid, 'B', 'UDP port 53 for low latency and minimal overhead', true),
      (v_pid, 'C', 'ICMP for path discovery', false),
      (v_pid, 'D', 'SCTP for multi-homing', false);
  END IF;

  -- 19
  SELECT id INTO v_pid FROM problems WHERE slug = 'http-401-vs-403';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', '401 is server error; 403 is client error', false),
      (v_pid, 'B', '401 means unauthenticated (who are you?); 403 means unauthorized/forbidden (you cannot access this)', true),
      (v_pid, 'C', '401 is for GET requests; 403 is for POST requests', false),
      (v_pid, 'D', 'Both indicate an expired SSL certificate', false);
  END IF;

  -- 20
  SELECT id INTO v_pid FROM problems WHERE slug = 'javascript-closure-behavior';
  IF v_pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = v_pid) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (v_pid, 'A', 'A method of executing code in Web Workers', false),
      (v_pid, 'B', 'A function retaining access to its lexical scope even when invoked outside that scope', true),
      (v_pid, 'C', 'A way to make JavaScript multithreaded', false),
      (v_pid, 'D', 'A syntax error in ES6 modules', false);
  END IF;
END $$;
