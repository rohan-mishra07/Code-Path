-- Ensure schema columns exist
ALTER TABLE problems ADD COLUMN IF NOT EXISTS problem_type VARCHAR(20) DEFAULT 'coding';
ALTER TABLE problems ADD COLUMN IF NOT EXISTS topic VARCHAR(50) DEFAULT 'General';
ALTER TABLE problems ADD COLUMN IF NOT EXISTS explanation TEXT;

CREATE TABLE IF NOT EXISTS mcq_options (
  id SERIAL PRIMARY KEY,
  problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
  option_key VARCHAR(10) NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false
);

-- Question 1: Java & OOP
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'Java Method Overriding and Static Methods',
  'java-method-overriding-static',
  'Can static or private methods be overridden in Java?',
  'easy',
  'mcq',
  'Java / OOPs',
  'Static methods belong to the class, not the instance. In a subclass, declaring the same signature creates method hiding, not overriding. Private methods are not inherited, so they cannot be overridden.'
) ON CONFLICT (slug) DO NOTHING;

-- Question 2: Data Structures & Hashing
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'HashMap Collision Complexity',
  'hashmap-collision-complexity',
  'What is the worst-case lookup time complexity in a standard separate-chaining HashMap when all keys collide into a single bucket?',
  'medium',
  'mcq',
  'Data Structures',
  'Without treeification (like Red-Black trees in Java 8+), all colliding keys form a single linked list of length N, resulting in O(N) lookup.'
) ON CONFLICT (slug) DO NOTHING;

-- Question 3: DBMS / SQL
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'Primary Key vs Unique Constraint',
  'sql-primary-vs-unique-key',
  'Which statement is true regarding PRIMARY KEY and UNIQUE constraints in SQL?',
  'easy',
  'mcq',
  'SQL / DBMS',
  'A table can have only one PRIMARY KEY which strictly forbids NULL values. Multiple UNIQUE constraints are permitted on a table and may accept NULL values.'
) ON CONFLICT (slug) DO NOTHING;

-- Question 4: JavaScript Asynchronous Output
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'JS Event Loop Execution Order',
  'event-loop-execution-order',
  'What is the console output order for this snippet?\n\nconsole.log(1);\nsetTimeout(() => console.log(2), 0);\nPromise.resolve().then(() => console.log(3));\nconsole.log(4);',
  'medium',
  'mcq',
  'JavaScript',
  'Synchronous execution runs 1 and 4 first. Microtasks (Promise callbacks) run before macrotasks, printing 3. The Macrotask queue (setTimeout callback) executes last, printing 2.'
) ON CONFLICT (slug) DO NOTHING;

-- Question 5: Operating Systems / Concurrency
INSERT INTO problems (title, slug, description, difficulty, problem_type, topic, explanation)
VALUES (
  'Deadlock Necessary Conditions',
  'deadlock-necessary-conditions',
  'Which of the following is NOT one of Coffman''s four necessary conditions for a deadlock to occur?',
  'medium',
  'mcq',
  'OS & System Design',
  'Preemption actually breaks deadlocks. The necessary condition is No Preemption (resources cannot be forcibly taken away from a holding process).'
) ON CONFLICT (slug) DO NOTHING;

-- Insert Options for all 5 questions
DO $$
DECLARE
  p1 INT; p2 INT; p3 INT; p4 INT; p5 INT;
BEGIN
  SELECT id INTO p1 FROM problems WHERE slug = 'java-method-overriding-static';
  IF p1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = p1) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (p1, 'A', 'Yes, both static and private methods can be overridden.', false),
      (p1, 'B', 'No, static methods are hidden (method hiding) and private methods are not inherited.', true),
      (p1, 'C', 'Only private methods can be overridden.', false),
      (p1, 'D', 'Only static methods can be overridden.', false);
  END IF;

  SELECT id INTO p2 FROM problems WHERE slug = 'hashmap-collision-complexity';
  IF p2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = p2) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (p2, 'A', 'O(1)', false),
      (p2, 'B', 'O(log n)', false),
      (p2, 'C', 'O(n)', true),
      (p2, 'D', 'O(n^2)', false);
  END IF;

  SELECT id INTO p3 FROM problems WHERE slug = 'sql-primary-vs-unique-key';
  IF p3 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = p3) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (p3, 'A', 'A table can have multiple PRIMARY KEYs but only one UNIQUE key.', false),
      (p3, 'B', 'PRIMARY KEY accepts NULL, while UNIQUE rejects NULL.', false),
      (p3, 'C', 'Only one PRIMARY KEY (no NULLs) is allowed, but multiple UNIQUE keys (allowing NULL) are permitted.', true),
      (p3, 'D', 'There is no difference between them.', false);
  END IF;

  SELECT id INTO p4 FROM problems WHERE slug = 'event-loop-execution-order';
  IF p4 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = p4) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (p4, 'A', '1, 4, 3, 2', true),
      (p4, 'B', '1, 2, 3, 4', false),
      (p4, 'C', '1, 4, 2, 3', false),
      (p4, 'D', '1, 3, 4, 2', false);
  END IF;

  SELECT id INTO p5 FROM problems WHERE slug = 'deadlock-necessary-conditions';
  IF p5 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mcq_options WHERE problem_id = p5) THEN
    INSERT INTO mcq_options (problem_id, option_key, option_text, is_correct) VALUES
      (p5, 'A', 'Mutual Exclusion', false),
      (p5, 'B', 'Hold and Wait', false),
      (p5, 'C', 'Preemption', true),
      (p5, 'D', 'Circular Wait', false);
  END IF;
END $$;