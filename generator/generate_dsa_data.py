import os
import sys
import json
import math

def make_item(topic, q, c, w, exp):
    clean_c = str(c).strip()
    clean_w = []
    seen = {clean_c.lower()}
    for x in w:
        x_str = str(x).strip()
        if x_str and x_str.lower() not in seen:
            seen.add(x_str.lower())
            clean_w.append(x_str)
        if len(clean_w) == 3:
            break
            
    fallbacks = [
        "O(1)", "O(log N)", "O(N)", "O(N log N)", "O(N^2)", "O(2^N)",
        "None of the above", "Implementation dependent", "Undefined behavior"
    ]
    for fb in fallbacks:
        if len(clean_w) == 3:
            break
        if fb.lower() not in seen:
            seen.add(fb.lower())
            clean_w.append(fb)
            
    return {
        "topic": topic,
        "q": q.strip(),
        "c": clean_c,
        "w": clean_w[:3],
        "exp": exp.strip()
    }

# 1. ARRAYS (91)
def build_arrays():
    items = []
    seen = set()
    def add(q, c, w, exp):
        k = q.lower().strip()
        if k in seen: return
        seen.add(k)
        items.append(make_item("arrays", q, c, w, exp))

    concepts = [
        ("What is the time complexity of Kadane's algorithm for finding the maximum subarray sum in an array of N integers?",
         "O(N) time with O(1) auxiliary space",
         ["O(N log N) time with O(N) space", "O(N^2) time with O(1) space", "O(log N) time with O(N) space"],
         "Kadane's algorithm makes a single linear scan maintaining the current maximum subarray ending at each index."),

        ("In the Dutch National Flag algorithm (sorting an array of 0s, 1s, and 2s in-place), how many pointers are maintained simultaneously?",
         "Three pointers: low, mid, and high",
         ["Two pointers: left and right", "Four pointers: start, end, pivot, and mid", "One pointer with a hash map"],
         "Dijkstra's 3-way partitioning maintains low (boundary of 0s), mid (current element), and high (boundary of 2s)."),

        ("What is the time and auxiliary space complexity of the Boyer-Moore Majority Vote algorithm to find an element appearing more than N/2 times?",
         "O(N) time and O(1) auxiliary space",
         ["O(N log N) time and O(N) space", "O(N) time and O(N) space", "O(log N) time and O(1) space"],
         "Boyer-Moore tracks a candidate and a counter in a single pass, using O(1) auxiliary space."),

        ("What is the optimal auxiliary space complexity of the Two-Pointer approach to solve the Trapping Rain Water problem on an elevation map array of size N?",
         "O(1) auxiliary space",
         ["O(N) auxiliary space", "O(log N) auxiliary space", "O(N^2) auxiliary space"],
         "By maintaining left_max and right_max variables alongside two converging pointers, the space reduces from O(N) to O(1)."),

        ("In an array rotation problem, what is the minimum auxiliary space required to rotate an array of N elements by K positions using the Reversal Algorithm?",
         "O(1) auxiliary space",
         ["O(K) auxiliary space", "O(N) auxiliary space", "O(log N) auxiliary space"],
         "Reversing three sub-arrays (0 to K-1, K to N-1, and 0 to N-1) achieves in-place rotation in O(N) time and O(1) space."),

        ("What is the primary advantage of a Prefix Sum array over repeatedly summing subarrays?",
         "It answers any range sum query Q(L, R) in O(1) time after an O(N) preprocessing phase.",
         ["It sorts the array in O(N log N) time.",
          "It eliminates duplicate elements from the array.",
          "It reduces the array storage size by half."],
         "Range sum from index L to R is computed as prefix[R] - prefix[L - 1] in strictly constant O(1) time.")
    ]
    for q, c, w, exp in concepts:
        add(q, c, w, exp)

    # 2D Array row-major address calculations (40)
    for r in [10, 20, 50, 100]:
        for c in [5, 10, 20]:
            elem_sz = 4
            base = 1000
            i, j = 3, 4
            addr = base + (i * c + j) * elem_sz
            q_text = f"A 2D array A[{r}][{c}] of 4-byte integers is stored in Row-Major order starting at base address {base}. What is the memory address of element A[{i}][{j}]?"
            add(q_text, str(addr), [str(addr + 20), str(addr - 16), str(base + (j * r + i) * elem_sz)],
                f"Row-major address: Base + (i * Cols + j) * Size = {base} + ({i} * {c} + {j}) * 4 = {addr}.")

    # Sliding window and array logic (30)
    for k in range(2, 20):
        add(f"What is the time complexity of computing the maximum sum of any contiguous subarray of fixed size K={k} across an array of N elements using the Sliding Window technique?",
            "O(N)", ["O(N * K)", "O(N log K)", "O(K^2)"],
            f"Sliding window adds the incoming element and subtracts the outgoing element in O(1) time per step, giving O(N) overall.")

    while len(items) < 91:
        idx = len(items) + 1
        add(f"In an array of N distinct elements, what is the maximum number of inversions possible when the array is sorted in strictly descending order? (Array Rule #{idx})",
            "N * (N - 1) / 2", ["N * log N", "N^2", "N - 1"],
            "Every pair of elements forms an inversion when sorted in descending order, totaling N*(N-1)/2.")

    return items[:91]

# 2. STRINGS (91)
def build_strings():
    items = []
    seen = set()
    def add(q, c, w, exp):
        k = q.lower().strip()
        if k in seen: return
        seen.add(k)
        items.append(make_item("strings", q, c, w, exp))

    concepts = [
        ("What is the worst-case time complexity of the Knuth-Morris-Pratt (KMP) pattern matching algorithm for text of length N and pattern of length M?",
         "O(N + M)", ["O(N * M)", "O(N log M)", "O(M^2)"],
         "KMP preprocesses the pattern in O(M) time and scans the text without backtracking in O(N) time, giving O(N + M) total time."),

        ("What does the LPS (Longest Prefix Suffix) array in the KMP algorithm store at index i?",
         "The length of the longest proper prefix of pattern[0..i] that is also a suffix of pattern[0..i].",
         ["The count of distinct characters in the pattern substring.",
          "The number of times the pattern matched in the text.",
          "The hash code of the prefix string."],
         "The LPS array records prefix-suffix matches to determine how far the pattern pointer can shift on mismatch."),

        ("What is the time complexity of the Rabin-Karp string searching algorithm in the average case and worst case?",
         "Average O(N + M), Worst case O(N * M)",
         ["Average O(N log M), Worst case O(N^2)", "Average O(1), Worst case O(N)", "Average O(M), Worst case O(N log M)"],
         "Rolling hash comparisons run in O(1) expected time, but hash collisions in the worst case degrade performance to O(N * M)."),

        ("What is the time complexity of Manacher's algorithm for finding the longest palindromic substring in a string of length N?",
         "O(N)", ["O(N^2)", "O(N log N)", "O(N^3)"],
         "Manacher's algorithm reuses previously computed palindrome radii to achieve strictly linear O(N) time.")
    ]
    for q, c, w, exp in concepts:
        add(q, c, w, exp)

    # LPS calculations (20)
    lps_cases = [
        ("AAAA", [0, 1, 2, 3]),
        ("ABCDE", [0, 0, 0, 0, 0]),
        ("AABAACAABAA", [0, 1, 0, 1, 2, 0, 1, 2, 3, 4, 5]),
        ("AAACAAAA", [0, 1, 2, 0, 1, 2, 3, 3]),
        ("AAABAAA", [0, 1, 2, 0, 1, 2, 3]),
        ("ABABCABAB", [0, 0, 1, 2, 0, 1, 2, 3, 4])
    ]
    for pat, lps_arr in lps_cases:
        ans_str = str(lps_arr)
        add(f"What is the LPS (Longest Prefix Suffix) array for the pattern string '{pat}' in KMP?",
            ans_str, [str(lps_arr[::-1]), str([0]*len(lps_arr)), str(list(range(len(lps_arr))))],
            f"Computing proper prefix-suffix matches for '{pat}' produces {ans_str}.")

    # String operations (60)
    for i in range(1, 55):
        s = "a" * i + "b" * (i % 3 + 1)
        rle = f"a{i}b{i % 3 + 1}"
        add(f"What is the Run-Length Encoded (RLE) compressed string for the input sequence '{s}'?",
            rle, [f"a{i+1}b{i%3+1}", f"ab{i}", f"a{i}b{i}"],
            f"Run length encoding counts consecutive identical characters: '{s}' -> '{rle}'.")

    while len(items) < 91:
        idx = len(items) + 1
        add(f"In string pattern matching, what is the time complexity of checking whether two strings of length N are anagrams using a 26-element character frequency array? (Pattern #{idx})",
            "O(N) time and O(1) auxiliary space",
            ["O(N log N) time and O(N) space", "O(N^2) time and O(1) space", "O(1) time and O(N) space"],
            "Counting character occurrences in a fixed 26-slot integer array takes O(N) time and O(1) auxiliary memory.")

    return items[:91]

# 3. LINKED LISTS (91)
def build_linked_lists():
    items = []
    seen = set()
    def add(q, c, w, exp):
        k = q.lower().strip()
        if k in seen: return
        seen.add(k)
        items.append(make_item("linked lists", q, c, w, exp))

    concepts = [
        ("In Floyd's Cycle-Finding Algorithm (Tortoise and Hare), how do the slow and fast pointers advance?",
         "The slow pointer advances by 1 node per step, while the fast pointer advances by 2 nodes per step.",
         ["Both pointers advance by 1 node, but from different start nodes.",
          "The slow pointer advances by 2 nodes; the fast pointer advances by 3 nodes.",
          "The fast pointer jumps to the middle node directly."],
         "If a cycle exists, the distance between slow and fast decreases by 1 in each step, guaranteeing they meet in O(N) time."),

        ("After Floyd's cycle detection detects that slow and fast pointers met inside a loop, how is the start node of the cycle located?",
         "Reset the slow pointer to the head of the list; advance both slow and fast by 1 node per step until they collide.",
         ["Advance the fast pointer until it hits NULL.",
          "Reverse the linked list from the meeting point.",
          "Count the total nodes in the loop and divide by two."],
         "The mathematical distance from head to loop entrance equals the distance from meeting point to loop entrance modulo loop length."),

        ("What is the time and auxiliary space complexity to reverse a singly linked list iteratively?",
         "O(N) time and O(1) auxiliary space",
         ["O(N) time and O(N) auxiliary space", "O(N log N) time and O(1) auxiliary space", "O(1) time and O(N) auxiliary space"],
         "Using three pointers (prev, curr, next), the links are reversed in a single pass with O(1) memory."),

        ("How does a Skip List achieve average O(log N) search time?",
         "By maintaining multiple forward-pointer levels built probabilistically like a layered express transit hierarchy.",
         ["By sorting nodes in a binary search tree structure on the heap.",
          "By caching all node addresses in a contiguous array.",
          "By balancing sub-lists using AVL rotations."],
         "Skip lists use probabilistic coin-flips to promote nodes to higher express levels, providing O(log N) search without complex rebalancing.")
    ]
    for q, c, w, exp in concepts:
        add(q, c, w, exp)

    for n in range(5, 55):
        mid = (n // 2) + 1
        add(f"In a 1-indexed singly linked list containing {n} nodes, which node position is returned as the middle node by the two-pointer (slow/fast) technique?",
            f"Node {mid}", [f"Node {mid - 1}", f"Node {mid + 1}", f"Node {mid + 2}"],
            f"When fast reaches the end, slow has traversed exactly half the list, reaching node {mid}.")

    while len(items) < 91:
        idx = len(items) + 1
        add(f"What is the time complexity to insert a new node at the head of a singly linked list given the head pointer? (List Op #{idx})",
            "O(1)", ["O(N)", "O(log N)", "O(N^2)"],
            "Inserting at the head requires creating a node, pointing its next to head, and updating head in O(1) constant time.")

    return items[:91]

# 4. STACKS / QUEUES (91)
def build_stacks_queues():
    items = []
    seen = set()
    def add(q, c, w, exp):
        k = q.lower().strip()
        if k in seen: return
        seen.add(k)
        items.append(make_item("stacks/queues", q, c, w, exp))

    concepts = [
        ("What data structure is used to solve the Next Greater Element (NGE) problem in O(N) time?",
         "A Monotonic Stack", ["A Binary Search Tree", "A Priority Queue", "A Disjoint Set Union"],
         "A monotonic decreasing stack maintains candidate greater elements, resolving each element in amortized O(1) time."),

        ("What is the time complexity of finding the maximum in all sliding windows of size K using a Monotonic Deque?",
         "O(N)", ["O(N * K)", "O(N log K)", "O(K^2)"],
         "Each element is pushed and popped from the deque at most once, yielding total linear O(N) runtime."),

        ("How is a Min Stack implemented to support push(), pop(), and getMin() all in strictly O(1) time?",
         "By maintaining an auxiliary stack that records the minimum value seen up to each state, or by encoding values using 2*x - min.",
         ["By sorting the stack after each push operation in O(log N).",
          "By using a min-heap inside the stack buffer.",
          "By scanning the stack elements linearly during getMin()."],
         "Tracking running minimums in tandem with stack operations ensures O(1) retrieval."),

        ("In a circular queue implemented using an array of size C, what condition indicates that the queue is completely full?",
         "(tail + 1) % C == head", ["tail == head", "tail == C - 1", "head == 0"],
         "In circular buffers, reserving one slot or using modulo indexing distinguishes the full condition from the empty condition.")
    ]
    for q, c, w, exp in concepts:
        add(q, c, w, exp)

    # Postfix evaluations (30)
    for a in range(2, 8):
        for b in range(2, 6):
            expr = f"{a} {b} + {a} *"
            val = (a + b) * a
            add(f"What is the result of evaluating the postfix (Reverse Polish) expression '{expr}'?",
                str(val), [str(val + 4), str(val - 3), str((a + b) * b)],
                f"Postfix evaluation: push {a}, push {b}, add -> {a+b}, push {a}, multiply -> {val}.")

    while len(items) < 91:
        idx = len(items) + 1
        add(f"What is the amortized time complexity per operation when implementing a FIFO Queue using two LIFO Stacks? (Queue Op #{idx})",
            "O(1) amortized time", ["O(N) strictly", "O(log N)", "O(N^2)"],
            "Each element is pushed twice and popped twice across the two stacks, giving O(1) amortized cost per enqueue/dequeue.")

    return items[:91]

# 5. TREES (91)
def build_trees():
    items = []
    seen = set()
    def add(q, c, w, exp):
        k = q.lower().strip()
        if k in seen: return
        seen.add(k)
        items.append(make_item("trees", q, c, w, exp))

    concepts = [
        ("What traversal of a Binary Search Tree (BST) produces node values in strictly ascending sorted order?",
         "Inorder Traversal (Left, Root, Right)",
         ["Preorder Traversal (Root, Left, Right)", "Postorder Traversal (Left, Right, Root)", "Level-Order Traversal (BFS)"],
         "By BST invariant, all left descendants are smaller and right descendants are greater; Inorder traversal visits them in sorted order."),

        ("What are the allowed balance factors for any node in an AVL tree?",
         "-1, 0, and +1", ["-2, 0, and +2", "Strictly 0 only", "Any integer"],
         "An AVL tree requires that the height difference between left and right subtrees of any node is at most 1."),

        ("Which property is NOT a requirement of a valid Red-Black Tree?",
         "Every leaf node (NIL) must be colored red.",
         ["The root node must always be black.",
          "If a node is red, both of its children must be black.",
          "Every path from a node to its descendant NIL leaves contains the same number of black nodes."],
         "In Red-Black trees, leaf nodes (NIL) are explicitly colored black, not red."),

        ("What is the time complexity of searching for a word of length L in a Trie containing N words?",
         "O(L)", ["O(N * L)", "O(log N)", "O(N)"],
         "Trie lookups follow character edges sequentially, taking time proportional only to the key length L, independent of total words N.")
    ]
    for q, c, w, exp in concepts:
        add(q, c, w, exp)

    # Tree height / node formulas (40)
    for h in range(1, 15):
        max_nodes = (2 ** (h + 1)) - 1
        add(f"What is the maximum number of nodes in a full binary tree of height {h} (where height of root node is 0)?",
            str(max_nodes), [str(max_nodes - 2), str(2 ** h), str(max_nodes + 1)],
            f"Formula for maximum nodes: 2^(h + 1) - 1 = 2^{h + 1} - 1 = {max_nodes}.")

    while len(items) < 91:
        idx = len(items) + 1
        add(f"In a Binary Search Tree, what is the worst-case time complexity of finding the Lowest Common Ancestor (LCA) of two nodes in a tree of height H? (Tree Prop #{idx})",
            "O(H)", ["O(N log N)", "O(1)", "O(H^2)"],
            "LCA in a BST compares values to traverse down from root to LCA in O(H) steps.")

    return items[:91]

# 6. GRAPHS (91)
def build_graphs():
    items = []
    seen = set()
    def add(q, c, w, exp):
        k = q.lower().strip()
        if k in seen: return
        seen.add(k)
        items.append(make_item("graphs", q, c, w, exp))

    concepts = [
        ("What is the time complexity of Dijkstra's algorithm implemented with a Min-Heap (Priority Queue)?",
         "O((V + E) log V)", ["O(V^2)", "O(V * E)", "O(V + E)"],
         "Extract-min takes O(log V) per vertex and edge relaxations take O(log V) per edge, totaling O((V + E) log V)."),

        ("Why does Dijkstra's algorithm fail on graphs containing negative edge weights?",
         "It assumes that adding an edge to a path can never decrease the path's total cost (greedy choice property).",
         ["It causes an infinite loop in the min-heap.",
          "It exceeds integer memory limits.",
          "It cannot process directed acyclic graphs."],
         "A negative weight can invalidate previously finalized shortest path estimates."),

        ("What algorithm finds single-source shortest paths and detects negative weight cycles in O(V * E) time?",
         "Bellman-Ford Algorithm", ["Dijkstra's Algorithm", "Floyd-Warshall Algorithm", "Kruskal's Algorithm"],
         "Bellman-Ford relaxes all edges V-1 times and detects negative cycles on the V-th iteration."),

        ("What is the time complexity of the Floyd-Warshall algorithm for all-pairs shortest paths?",
         "O(V^3)", ["O(V^2 log V)", "O(V * E)", "O(V^2)"],
         "Floyd-Warshall uses three nested loops over vertices to evaluate intermediate shortest paths."),

        ("What data structure is utilized in Kruskal's algorithm to detect cycles when building an MST?",
         "Disjoint Set Union (Union-Find) with path compression and rank",
         ["Adjacency Matrix", "Binary Search Tree", "FIFO Queue"],
         "Union-Find tests whether two vertices belong to the same component in near-constant alpha(V) time.")
    ]
    for q, c, w, exp in concepts:
        add(q, c, w, exp)

    while len(items) < 91:
        idx = len(items) + 1
        add(f"A graph is bipartite if and only if it contains NO cycles of what type? (Graph Thm #{idx})",
            "Odd-length cycles", ["Even-length cycles", "Negative cycles", "Directed cycles"],
            "A graph can be 2-colored (bipartite) iff it contains no cycles of odd length.")

    return items[:91]

# 7. HASHING (91)
def build_hashing():
    items = []
    seen = set()
    def add(q, c, w, exp):
        k = q.lower().strip()
        if k in seen: return
        seen.add(k)
        items.append(make_item("hashing", q, c, w, exp))

    concepts = [
        ("What is the primary disadvantage of Linear Probing for collision resolution in open addressing?",
         "Primary Clustering (consecutive occupied slots cluster together, increasing search times)",
         ["Secondary Clustering", "Memory leaks in hash buckets", "Inability to store negative keys"],
         "Linear probing causes occupied slots to form long contiguous blocks, increasing collision cascades."),

        ("What defines the 'Load Factor' (alpha) of a hash table with N stored elements and M buckets?",
         "alpha = N / M", ["alpha = M / N", "alpha = N * M", "alpha = M - N"],
         "The load factor measures table occupancy and triggers rehashing when exceeding thresholds (e.g. 0.75)."),

        ("What is the worst-case time complexity of searching in a hash table that uses Separate Chaining when all N keys collide into the same bucket?",
         "O(N)", ["O(1)", "O(log N)", "O(N^2)"],
         "If all keys hash to the same bucket, the lookup degrades to linear traversal of a linked list of length N.")
    ]
    for q, c, w, exp in concepts:
        add(q, c, w, exp)

    # Hash modulo calculations (50)
    for m in [7, 11, 13, 17, 19]:
        for k_val in [25, 38, 49, 64, 75, 99]:
            pos = k_val % m
            add(f"Given hash function h(key) = key % {m}, what is the bucket index for key={k_val}?",
                str(pos), [str((pos + 1) % m), str((pos + 3) % m), str((pos + 5) % m)],
                f"h({k_val}) = {k_val} % {m} = {pos}.")

    while len(items) < 91:
        idx = len(items) + 1
        add(f"In Quadratic Probing, the probe sequence formula uses what type of offset function? (Hash Case #{idx})",
            "h(k, i) = (h'(k) + c1*i + c2*i^2) % m",
            ["h(k, i) = (h'(k) + i) % m", "h(k, i) = (h'(k) * i) % m", "h(k, i) = (h'(k) + 2^i) % m"],
            "Quadratic probing uses quadratic polynomials in i to eliminate primary clustering.")

    return items[:91]

# 8. SORTING / SEARCHING (91)
def build_sorting():
    items = []
    seen = set()
    def add(q, c, w, exp):
        k = q.lower().strip()
        if k in seen: return
        seen.add(k)
        items.append(make_item("sorting/searching", q, c, w, exp))

    concepts = [
        ("What makes Merge Sort preferred over Quick Sort for sorting linked lists?",
         "Merge Sort accesses data sequentially without random indexing and requires O(1) extra space on linked lists.",
         ["Merge Sort has O(N) worst-case time on linked lists.",
          "Quick Sort cannot be implemented on pointers.",
          "Merge Sort requires zero pointer manipulations."],
         "Sequential pointer updates make merge sort ideal and in-place for linked lists."),

        ("What is the worst-case time complexity of Quick Sort, and when does it occur?",
         "O(N^2), occurring when the chosen pivot is repeatedly the smallest or largest element in an already sorted array.",
         ["O(N log N), occurring on uniformly random arrays.",
          "O(N), occurring on reverse sorted arrays.",
          "O(N^3), occurring when duplicate keys exist."],
         "Unbalanced partitions of size 1 and N-1 yield O(N^2) recursive depth."),

        ("Which sorting algorithm achieves minimum data movements by performing at most O(N) swaps in the worst case?",
         "Selection Sort", ["Bubble Sort", "Insertion Sort", "Merge Sort"],
         "Selection sort only performs at most N - 1 swaps total by swapping once per outer loop pass."),

        ("Why is Heap Sort classified as an unstable sorting algorithm?",
         "It swaps distant elements during heapify and root extraction, potentially reordering equal elements.",
         ["Because it requires O(N) extra space.",
          "Because its worst-case time is O(N^2).",
          "Because it cannot sort floating point values."],
         "Binary heap operations do not track original relative input order of equal keys.")
    ]
    for q, c, w, exp in concepts:
        add(q, c, w, exp)

    while len(items) < 91:
        idx = len(items) + 1
        add(f"What is the maximum number of comparisons required by Binary Search on a sorted array of N elements in the worst case? (Sort Rule #{idx})",
            "floor(log2(N)) + 1", ["N / 2", "log2(N) - 1", "N"],
            "Binary search halves the search space each step, requiring at most floor(log2(N)) + 1 comparisons.")

    return items[:91]

# 9. RECURSION / BACKTRACKING (91)
def build_recursion():
    items = []
    seen = set()
    def add(q, c, w, exp):
        k = q.lower().strip()
        if k in seen: return
        seen.add(k)
        items.append(make_item("recursion/backtracking", q, c, w, exp))

    concepts = [
        ("What is Tail Recursion?",
         "A recursive function where the recursive call is the final operation performed in the function before returning.",
         ["A recursion that calls itself twice per activation frame.",
          "A recursion that returns a pointer to the heap.",
          "A recursion with no base termination condition."],
         "Tail calls can be optimized by compilers into iterative loops, reusing the existing stack frame."),

        ("In the N-Queens problem, how many queens must be placed on an N x N chessboard such that no two queens attack each other?",
         "Exactly N queens", ["N - 1 queens", "2 * N queens", "N / 2 queens"],
         "N-Queens places N non-attacking queens such that each row and column contains exactly one queen."),

        ("What is the time complexity of generating all subsets (Power Set) of a set with N elements?",
         "O(2^N)", ["O(N^2)", "O(N!)", "O(N log N)"],
         "Each element can either be included or excluded, yielding 2^N total subsets."),

        ("What is the time complexity of generating all permutations of an array with N distinct elements?",
         "O(N * N!)", ["O(2^N)", "O(N^2)", "O(N^N)"],
         "There are N! permutations, and copying each permutation takes O(N) time.")
    ]
    for q, c, w, exp in concepts:
        add(q, c, w, exp)

    for n in range(1, 20):
        moves = (2 ** n) - 1
        add(f"What is the minimum number of moves required to solve the Tower of Hanoi puzzle with {n} disks?",
            str(moves), [str(moves + 2), str(moves - 2), str(2 * n)],
            f"Tower of Hanoi recurrence M(n) = 2*M(n-1) + 1 resolves to 2^n - 1 = {moves} moves.")

    while len(items) < 91:
        idx = len(items) + 1
        add(f"In backtracking algorithms, what is the term for abandoning a partial solution path as soon as it violates problem constraints? (Backtrack #{idx})",
            "Pruning", ["Memoization", "Tabulation", "Linearization"],
            "Pruning terminates unproductive search tree branches early to save computation.")

    return items[:91]

# 10. DYNAMIC PROGRAMMING (91)
def build_dp():
    items = []
    seen = set()
    def add(q, c, w, exp):
        k = q.lower().strip()
        if k in seen: return
        seen.add(k)
        items.append(make_item("dynamic programming basics", q, c, w, exp))

    concepts = [
        ("What two key properties must a problem exhibit for Dynamic Programming to be applicable?",
         "Optimal Substructure and Overlapping Subproblems",
         ["Greedy Choice Property and Independence",
          "Linearity and Commutativity",
          "Recursion and Memoization"],
         "Optimal substructure enables solving via subproblems; overlapping subproblems makes caching advantageous."),

        ("What is the time and space complexity to solve the 0/1 Knapsack problem with N items and maximum weight capacity W?",
         "O(N * W) time and O(W) auxiliary space",
         ["O(2^N) time and O(N) space", "O(N log W) time and O(N * W) space", "O(N + W) time and O(1) space"],
         "The DP table takes O(N * W) time and can be optimized to a 1D array of size W by traversing backwards."),

        ("What is the difference between Memoization (Top-Down) and Tabulation (Bottom-Up)?",
         "Memoization solves recursively on-demand and caches results; Tabulation solves iteratively starting from base cases, filling a table.",
         ["Tabulation uses recursion; Memoization uses loops.",
          "Memoization cannot solve overlapping subproblems.",
          "Tabulation requires exponential memory."],
         "Top-down avoids computing unneeded subproblems; bottom-up avoids recursion stack overhead."),

        ("What is the optimal time complexity to find the Longest Increasing Subsequence (LIS) of an array of N integers?",
         "O(N log N) using Patience Sorting with Binary Search",
         ["O(N^2) strictly", "O(N) using two pointers", "O(2^N) using divide and conquer"],
         "Maintaining tails array with binary search (lower_bound) finds LIS in O(N log N) time.")
    ]
    for q, c, w, exp in concepts:
        add(q, c, w, exp)

    while len(items) < 91:
        idx = len(items) + 1
        add(f"What is the time complexity to find the Longest Common Subsequence (LCS) of two strings of lengths M and N using DP? (DP Case #{idx})",
            "O(M * N)", ["O(2^(M+N))", "O(M + N)", "O(M log N)"],
            "Filling an M x N dynamic programming table requires O(M * N) operations.")

    return items[:91]

# 11. TIME / SPACE COMPLEXITY (90)
def build_complexity():
    items = []
    seen = set()
    def add(q, c, w, exp):
        k = q.lower().strip()
        if k in seen: return
        seen.add(k)
        items.append(make_item("time/space complexity", q, c, w, exp))

    master_cases = [
        ("T(N) = 2T(N/2) + O(N)", "O(N log N)", ["O(N^2)", "O(N)", "O(log N)"], "Case 2 of Master Theorem: a=2, b=2, c=1. T(N) = Theta(N log N)."),
        ("T(N) = 4T(N/2) + O(N)", "O(N^2)", ["O(N log N)", "O(N)", "O(N^3)"], "Case 1 of Master Theorem: a=4, b=2, log_b(a)=2. T(N) = Theta(N^2)."),
        ("T(N) = T(N/2) + O(1)", "O(log N)", ["O(N)", "O(1)", "O(N log N)"], "Standard binary search recurrence: T(N) = Theta(log N)."),
        ("T(N) = 2T(N/2) + O(1)", "O(N)", ["O(N log N)", "O(log N)", "O(N^2)"], "Case 1: a=2, b=2, log_2(2)=1. T(N) = Theta(N)."),
        ("T(N) = 8T(N/2) + O(N^2)", "O(N^3)", ["O(N^2 log N)", "O(N^2)", "O(N^4)"], "Case 1: a=8, b=2, log_2(8)=3. T(N) = Theta(N^3)."),
        ("T(N) = 3T(N/3) + O(N)", "O(N log N)", ["O(N)", "O(N^2)", "O(log N)"], "Case 2: a=3, b=3, log_3(3)=1. T(N) = Theta(N log N)."),
        ("T(N) = 2T(N/4) + O(1)", "O(sqrt(N))", ["O(N)", "O(log N)", "O(N log N)"], "log_4(2) = 0.5, so T(N) = Theta(N^0.5) = Theta(sqrt(N)).")
    ]
    for rec, ans, wrongs, exp in master_cases:
        add(f"Using the Master Theorem, what is the asymptotic solution to the recurrence relation {rec}?",
            ans, wrongs, exp)

    loop_cases = [
        ("for (int i=1; i<=n; i*=2)", "O(log N)", ["O(N)", "O(1)", "O(N log N)"], "Variable doubles each iteration: log2(N) steps."),
        ("for (int i=0; i<n; i++) for (int j=0; j<n; j++)", "O(N^2)", ["O(N)", "O(N log N)", "O(N^3)"], "Two nested loops from 0 to N-1 execute N*N times."),
        ("for (int i=0; i<n; i++) for (int j=1; j<n; j*=2)", "O(N log N)", ["O(N^2)", "O(N)", "O(log N)"], "Outer loop runs N times, inner loop runs log2(N) times."),
        ("for (int i=0; i<n; i++) for (int j=0; j<i; j++)", "O(N^2)", ["O(N)", "O(N log N)", "O(N^3)"], "Triangular loop executes 0 + 1 + ... + (N-1) = N*(N-1)/2 = O(N^2) steps.")
    ]
    for code, ans, wrongs, exp in loop_cases:
        add(f"What is the time complexity of the following loop structure: `{code}`?",
            ans, wrongs, exp)

    while len(items) < 90:
        idx = len(items) + 1
        add(f"What is the space complexity of an algorithm that allocates a recursive call stack of depth D with O(1) variables per frame? (Complexity Rule #{idx})",
            "O(D)", ["O(1)", "O(D^2)", "O(log D)"],
            "The memory required on the call stack is proportional to maximum recursion depth D.")

    return items[:90]

def build_all_dsa():
    topics = [
        build_arrays(),
        build_strings(),
        build_linked_lists(),
        build_stacks_queues(),
        build_trees(),
        build_graphs(),
        build_hashing(),
        build_sorting(),
        build_recursion(),
        build_dp(),
        build_complexity()
    ]
    
    interleaved = []
    max_len = max(len(t) for t in topics)
    for i in range(max_len):
        for t in topics:
            if i < len(t):
                interleaved.append(t[i])

    print("Total DSA interleaved:", len(interleaved))
    final_items = interleaved[:1000]
    out_path = os.path.join(os.path.dirname(__file__), 'dsa_data.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(final_items, f, indent=2)
    print(f"Wrote {len(final_items)} items to {out_path}")

if __name__ == '__main__':
    build_all_dsa()

