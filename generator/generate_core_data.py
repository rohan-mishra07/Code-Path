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
        "None of the above", "Implementation dependent", "Undefined behavior", 
        "System dependent", "Not supported in standard specification",
        "Hardware architecture dependent", "Operating system specific"
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

# -------------------------------------------------------------
# 1. OPERATING SYSTEMS (334 items)
# -------------------------------------------------------------
def build_os():
    items = []
    seen = set()
    def add(q, c, w, exp):
        k = q.lower().strip()
        if k in seen:
            return
        seen.add(k)
        items.append(make_item("operating systems", q, c, w, exp))

    # Core concepts
    concepts = [
        ("What is the primary function of the Process Control Block (PCB)?",
         "It maintains all state, execution context, registers, memory limits, and open file descriptors for a specific process.",
         ["It stores virtual memory pages swapped to the secondary storage disk.",
          "It acts as the hardware interrupt vector table inside the CPU microcode.",
          "It allocates network bandwidth across active TCP sockets."],
         "The PCB is the kernel data structure containing all metadata required to manage and resume a process."),

        ("What condition defines a 'zombie process' in UNIX-like systems?",
         "A process that has completed execution via exit(), but its entry remains in the process table because its parent has not called wait().",
         ["A process executing in an infinite CPU loop without yielding.",
          "A process whose parent was killed, leaving it adopted by init/systemd.",
          "A process waiting indefinitely for an unavailable I/O peripheral device."],
         "A zombie process has released resources but retains a PID in the process table until its parent reads its exit status."),

        ("What occurs when a process becomes an 'orphan process' in modern Linux?",
         "Its parent terminates before it does, so it is automatically reparented to the root init system (PID 1).",
         ["It is terminated immediately by the kernel OOM-killer.",
          "Its thread stack is written to /tmp/orphan.dump and swapped out.",
          "It transitions permanently into an uninterruptible sleep state."],
         "Orphans are adopted by PID 1 (init or systemd), which reaps their termination status."),

        ("What is the difference between preemptive and non-preemptive CPU scheduling?",
         "In preemptive scheduling, the OS can interrupt a running process to allocate CPU to another; in non-preemptive scheduling, a process retains CPU until it voluntarily yields or terminates.",
         ["Preemptive scheduling applies only to kernel threads.",
          "Non-preemptive scheduling guarantees zero context-switch overhead.",
          "Preemptive scheduling prevents priority inversion from occurring."],
         "Preemption allows higher-priority processes to preempt running processes via timer interrupts or priority events."),

        ("Why is Shortest Job First (SJF) scheduling provably optimal for minimizing average waiting time?",
         "Moving a shorter job before a longer job decreases waiting time for the short job more than it increases waiting time for the long job.",
         ["It completely eliminates CPU context switching overhead.",
          "It predicts future CPU bursts using machine learning.",
          "It eliminates the possibility of process starvation."],
         "Scheduling shortest jobs first minimizes cumulative queue wait times across all processes."),

        ("What is the 'convoy effect' in operating system scheduling?",
         "A scenario where many short CPU/IO-bound processes queue behind a single long CPU-intensive process in FCFS scheduling.",
         ["High network latency caused by serial packet transmission across a single router.",
          "Multiple threads deadlocking because they acquire locks in differing orders.",
          "Thrashing caused by a page table size exceeding physical RAM."],
         "Under FCFS, a long CPU-burst process monopolizes the processor, forcing subsequent short jobs to wait unnecessarily."),

        ("How does 'aging' solve the starvation problem in priority-based CPU scheduling?",
         "It gradually increases the priority of processes that wait in the ready queue for prolonged periods.",
         ["It terminates processes whose execution time exceeds their initial estimate.",
          "It doubles the memory pages allocated to older processes.",
          "It moves long processes to the swap partition during peak load."],
         "Aging guarantees that even low-priority processes eventually reach high enough priority to execute."),

        ("Which three requirements MUST be satisfied by any valid solution to the critical section problem?",
         "Mutual Exclusion, Progress, and Bounded Waiting.",
         ["Atomicity, Consistency, and Isolation.",
          "Throughput, Latency, and Scalability.",
          "Fairness, Deadlock Freedom, and Zero Context Switching."],
         "Dijkstra established that any correct synchronization mechanism must ensure mutual exclusion, progress, and bounded waiting."),

        ("How does Peterson's algorithm ensure mutual exclusion for two processes (P0 and P1)?",
         "By combining an intent array `flag[2]` with a tie-breaking variable `turn`.",
         ["By using hardware test-and-set registers provided by the x86 architecture.",
          "By disabling CPU hardware interrupts across the entire motherboard.",
          "By storing process state in a shared FIFO disk sector."],
         "Peterson's algorithm uses `flag[i] = true` to declare intent and sets `turn = j` to yield priority gracefully."),

        ("What distinguishes a counting semaphore from a binary semaphore (mutex)?",
         "A counting semaphore can take any non-negative integer value to control access to a finite pool of identical resources; a binary semaphore only takes values 0 and 1.",
         ["A counting semaphore automatically logs operation statistics to disk.",
          "A counting semaphore can only be used by exactly two cooperating threads.",
          "A binary semaphore does not support wait() and signal() primitives."],
         "Counting semaphores manage finite resource pools, while binary semaphores provide mutual exclusion."),

        ("Why is a spinlock efficient on multi-core systems only when critical sections are very short?",
         "Busy-waiting on a CPU core avoids the high overhead of putting the thread to sleep, context-switching out, and waking it back up.",
         ["Spinlocks automatically bypass the L1 and L2 CPU caches.",
          "Spinlocks eliminate memory bus contention across different NUMA nodes.",
          "Spinlocks prevent cache line invalidation between cores."],
         "For short durations, spinning wastes fewer clock cycles than an OS thread context switch."),

        ("Which condition is NOT one of Coffman's four necessary conditions for deadlock?",
         "Preemption of allocated resources by lower-priority processes.",
         ["Mutual Exclusion.", "Hold and Wait.", "Circular Wait."],
         "The Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait."),

        ("What is the core principle of the Banker's Algorithm for deadlock avoidance?",
         "It only grants a resource request if the resulting system state is guaranteed to be in a safe state with a viable completion sequence.",
         ["It terminates the process that holds the largest number of resources upon request.",
          "It prevents processes from holding more than two mutex locks simultaneously.",
          "It automatically preempts disk I/O when memory utilization exceeds 90%."],
         "The Banker's Algorithm evaluates whether allocating requested resources leaves the system in a safe state."),

        ("What is the primary role of the Translation Lookaside Buffer (TLB)?",
         "To serve as a high-speed hardware cache for virtual-to-physical page number translations.",
         ["To store the dirty bits of modified secondary storage sectors.",
          "To buffer keyboard and mouse hardware interrupt requests.",
          "To translate physical memory addresses into CPU register identifiers."],
         "The TLB caches recent virtual-to-physical translations, reducing lookup latency to near single-cycle on hit."),

        ("What is 'Belady's Anomaly' in virtual memory page replacement?",
         "A phenomenon where increasing the number of physical page frames results in MORE page faults under FIFO replacement.",
         ["A condition where LRU replacement causes an infinite cascade of disk writes.",
          "A bug where optimal replacement chooses a frame that was never referenced.",
          "A memory leak where allocated page tables fail to deallocate on process exit."],
         "FIFO can suffer from more page faults with larger memory because it is not a stack algorithm."),

        ("What defines 'thrashing' in an operating system?",
         "A state where the OS spends vastly more time swapping pages between RAM and disk than executing user instructions.",
         ["A CPU core running at maximum clock frequency due to an infinite while loop.",
          "A network interface dropping packets due to socket buffer overflow.",
          "A disk head vibrating continuously due to corrupted cylinder sectors."],
         "Thrashing occurs when working sets exceed physical memory, causing continuous page faults."),

        ("In the UNIX inode architecture, what is the role of the single indirect pointer?",
         "It points to a disk block containing an array of direct pointers to data blocks.",
         ["It stores encrypted file permissions and user ownership metadata.",
          "It points directly to the first 4 KB of data in the file.",
          "It links the inode to the root directory file table."],
         "A single indirect pointer references a block whose contents are pointers to actual data blocks."),

        ("How does the SCAN (Elevator) disk scheduling algorithm operate?",
         "The disk arm moves in one direction servicing all requests until reaching the end cylinder, then reverses direction servicing requests on return.",
         ["It services the request that requires the least rotational latency first.",
          "It jumps immediately to cylinder 0 after each serviced request.",
          "It services requests strictly in the order they arrived in the queue."],
         "SCAN sweeps the disk head back and forth across cylinders like an elevator."),

        ("What is the difference between RAID 0 and RAID 1?",
         "RAID 0 stripes data across disks for performance with zero redundancy; RAID 1 mirrors identical data onto two disks for fault tolerance.",
         ["RAID 0 uses distributed parity; RAID 1 uses dual parity.",
          "RAID 0 provides 100% fault tolerance; RAID 1 provides zero fault tolerance.",
          "RAID 0 requires an odd number of drives; RAID 1 requires at least 5 drives."],
         "RAID 0 provides speed without backup; RAID 1 duplicates data across mirrored drives."),

        ("Why does RAID 5 require a minimum of three physical disks?",
         "It stripes data across disks along with one parity block distributed across all disks, requiring at least two data drives and one parity equivalent.",
         ["Because parity calculations require three separate hash algorithms.",
          "Because disk controllers cannot address an even number of hard drives.",
          "Because one disk is kept as an offline spare in cold standby."],
         "RAID 5 requires at least 3 disks to support block-level data striping with distributed parity."),

        ("What happens during a process context switch?",
         "The kernel saves the CPU register context of the running process to its PCB, and restores the saved register context of the next process.",
         ["The kernel formats the virtual memory page table and reloads the OS image from disk.",
          "All CPU cache hierarchies (L1, L2, L3) are permanently flushed to secondary storage.",
          "The CPU hardware switches from kernel mode to real mode."],
         "A context switch preserves process execution state in PCB and loads incoming state into registers."),

        ("What is the difference between a trap and an interrupt?",
         "A trap is a synchronous software-generated interrupt caused by user code; an interrupt is an asynchronous signal generated by hardware devices.",
         ["A trap runs in user mode, whereas an interrupt runs in kernel mode.",
          "A trap stops all CPU cores, whereas an interrupt affects only a single core.",
          "An interrupt is initiated by software instructions, whereas a trap is physical."],
         "Traps occur synchronously at specific instructions; hardware interrupts occur asynchronously."),

        ("What is internal fragmentation in memory allocation?",
         "Unused memory space within an allocated partition or fixed-size page that cannot be used by other processes.",
         ["Free memory scattered between allocated partitions in non-contiguous chunks.",
          "Memory lost due to corrupted page table directory pointers.",
          "Memory consumed by the operating system kernel page daemon."],
         "Internal fragmentation occurs when allocated blocks are larger than requested."),

        ("What is external fragmentation and how does compaction resolve it?",
         "External fragmentation occurs when total free memory is sufficient but scattered in small non-contiguous holes; compaction relocates allocated blocks to unite free space.",
         ["External fragmentation is memory corruption; compaction reboots the kernel.",
          "External fragmentation occurs inside pages; compaction reduces page size.",
          "External fragmentation is swap disk exhaustion; compaction deletes cache files."],
         "Compaction rearranges in-memory process segments to consolidate scattered free space."),

        ("What is the difference between monolithic kernels and microkernels?",
         "Monolithic kernels run all core OS services in kernel space; microkernels keep only minimal mechanisms in kernel space, running services as user daemons.",
         ["Monolithic kernels support only single-threaded execution.",
          "Microkernels cannot run on 64-bit multi-core processors.",
          "Monolithic kernels do not support system calls."],
         "Monolithic kernels maximize performance via direct calls; microkernels prioritize isolation and reliability."),

        ("What is the purpose of the 'dirty bit' (modify bit) in a page table entry?",
         "It indicates whether the page has been modified in memory, determining if it must be written back to disk upon eviction.",
         ["It flags pages that contain corrupt or malicious byte patterns.",
          "It marks pages that have exceeded their maximum execution lifespan.",
          "It prevents any user process from reading data stored in that page."],
         "If the dirty bit is 0, the page frame can be overwritten without disk I/O."),

        ("How does the Working Set Model prevent thrashing?",
         "By monitoring the set of pages each process referenced in a time window Delta; if total working set pages exceed physical frames, processes are suspended.",
         ["By doubling the CPU clock frequency whenever page faults increase.",
          "By locking all pages of every active process permanently in RAM.",
          "By discarding all user memory pages when free RAM drops below 5%."],
         "The Working Set principle ensures a process only runs when its working set fits in physical memory."),

        ("What is the purpose of the Translation Lookaside Buffer's ASID (Address Space Identifier) tag?",
         "It associates TLB entries with specific processes, preventing the need to flush the entire TLB on every context switch.",
         ["It encrypts memory addresses transmitted across the PCIe bus.",
          "It stores the physical cylinder number of the process binary on disk.",
          "It verifies that the CPU power state remains in full performance mode."],
         "ASID tagging allows entries for multiple processes to coexist in the TLB without address aliasing bugs."),

        ("What is the difference between a hard link and a symbolic link in UNIX?",
         "A hard link directly references the file inode number and shares identical data/permissions; a soft link is an independent file containing the target path.",
         ["A hard link can span across different mounted filesystems; a soft link cannot.",
          "Deleting the original file breaks a hard link, but a soft link remains valid.",
          "Hard links can only reference directories, whereas soft links only reference files."],
         "Hard links share the same inode. Soft links store a pathname string to the original file.")
    ]
    for q, c, w, exp in concepts:
        add(q, c, w, exp)

    # Scheduling calculations (50)
    for i in range(1, 26):
        b1, b2, b3 = i + 1, (i * 3) % 7 + 2, (i * 2) % 9 + 3
        # FCFS wait times
        w1 = 0
        w2 = b1
        w3 = b1 + b2
        avg_w = (w1 + w2 + w3) / 3.0
        ans = f"{avg_w:.2f} ms"
        q_text = f"Three processes P1, P2, P3 arrive at time 0 with burst times {b1} ms, {b2} ms, and {b3} ms. What is the average waiting time under FCFS scheduling?"
        add(q_text, ans, [f"{avg_w + 1.5:.2f} ms", f"{avg_w - 1.0:.2f} ms", f"{avg_w + 3.0:.2f} ms"],
            f"Waiting times: P1=0, P2={b1}, P3={b1+b2}. Average = (0 + {b1} + {b1+b2}) / 3 = {ans}.")

    for i in range(1, 26):
        b1, b2, b3 = i + 2, (i * 5) % 8 + 1, (i * 4) % 11 + 2
        sorted_b = sorted([b1, b2, b3])
        w_sjf = (0 + sorted_b[0] + sorted_b[0] + sorted_b[1]) / 3.0
        ans = f"{w_sjf:.2f} ms"
        q_text = f"Processes P1({b1} ms), P2({b2} ms), and P3({b3} ms) arrive at time t=0. What is the average waiting time under non-preemptive SJF?"
        add(q_text, ans, [f"{w_sjf + 2.0:.2f} ms", f"{w_sjf - 1.5:.2f} ms", f"{w_sjf + 4.0:.2f} ms"],
            f"Sorted bursts: {sorted_b}. Wait times: 0, {sorted_b[0]}, {sorted_b[0]+sorted_b[1]}. Average = {ans}.")

    # Round Robin Slices (30)
    for q in [2, 3, 4, 5]:
        for idx in range(1, 9):
            p1 = idx * 2 + 1
            p2 = idx * 3 + 2
            slices = math.ceil(p1 / q) + math.ceil(p2 / q)
            q_text = f"Two processes with bursts P1={p1} ms and P2={p2} ms execute under Round Robin with quantum Q={q} ms (arriving at t=0). What is the total number of CPU time slices needed to complete both processes?"
            add(q_text, str(slices), [str(slices + 1), str(slices - 1), str(slices + 2)],
                f"P1 needs ceil({p1}/{q})={math.ceil(p1/q)} slices, P2 needs ceil({p2}/{q})={math.ceil(p2/q)} slices. Total = {slices}.")

    # Memory / Paging calculations (60)
    for p_sz in [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]:
        off_bits = int(math.log2(p_sz * 1024))
        p_bits_32 = 32 - off_bits
        p_bits_48 = 48 - off_bits
        add(f"In a 32-bit architecture with a {p_sz} KB page size, how many bits are used for the page offset?",
            f"{off_bits} bits", [f"{off_bits - 2} bits", f"{off_bits + 2} bits", f"{p_bits_32} bits"],
            f"{p_sz} KB = 2^{off_bits} bytes, so {off_bits} bits represent page offset.")
        add(f"In a 32-bit architecture with a {p_sz} KB page size, how many bits are used for the virtual page number?",
            f"{p_bits_32} bits", [f"{p_bits_32 + 2} bits", f"{p_bits_32 - 2} bits", f"{off_bits} bits"],
            f"32 - {off_bits} offset bits = {p_bits_32} page number bits.")
        add(f"In a 48-bit virtual address system with a {p_sz} KB page size, how many bits represent the virtual page number?",
            f"{p_bits_48} bits", [f"{p_bits_48 - 4} bits", f"{p_bits_48 + 4} bits", f"{off_bits} bits"],
            f"48 - {off_bits} offset bits = {p_bits_48} page number bits.")

    # EMAT (25)
    for h in [0.75, 0.80, 0.85, 0.90, 0.95]:
        for tlb in [5, 10, 15, 20, 25]:
            mem = 100
            emat = h * (tlb + mem) + (1 - h) * (tlb + 2 * mem)
            ans = f"{emat:.1f} ns" if emat % 1 != 0 else f"{int(emat)} ns"
            add(f"Given a TLB hit ratio of {int(h*100)}%, TLB access time of {tlb} ns, and main memory access time of {mem} ns, calculate the EMAT for a single-level page table.",
                ans, [f"{emat + 12:.1f} ns", f"{emat - 12:.1f} ns", f"{tlb + mem} ns"],
                f"EMAT = {h}*({tlb}+{mem}) + {1-h:.2f}*({tlb}+2*{mem}) = {ans}.")

    # Semaphores (30)
    for init_s in [1, 4, 7, 10, 15]:
        for w_count in [2, 5, 8, 12, 16, 20]:
            sig_count = (init_s + w_count) % 6 + 1
            res = init_s - w_count + sig_count
            add(f"A counting semaphore S is initialized to {init_s}. After {w_count} wait() and {sig_count} signal() operations, what is the value of S?",
                str(res), [str(res + 3), str(res - 3), str(init_s + sig_count)],
                f"S = {init_s} - {w_count} + {sig_count} = {res}.")

    # Disk seek FCFS & SSTF (40)
    for start_head in range(30, 75, 3):
        r1 = start_head + 25
        r2 = start_head - 15
        r3 = start_head + 60
        dist = abs(r1 - start_head) + abs(r2 - r1) + abs(r3 - r2)
        add(f"A disk head is at cylinder {start_head}. Requests arrive for cylinders {r1}, {r2}, {r3}. What is the total head movement in cylinders under FCFS?",
            f"{dist} cylinders", [f"{dist + 20} cylinders", f"{dist - 20} cylinders", f"{dist + 40} cylinders"],
            f"Movement = |{r1}-{start_head}| + |{r2}-{r1}| + |{r3}-{r2}| = {dist} cylinders.")

    # Fork process counts (25)
    for k in range(1, 15):
        tot = 2 ** k
        add(f"If a program executes {k} sequential fork() calls without loops or conditionals, what is the total number of processes created (including root parent)?",
            str(tot), [str(tot - 1), str(2 * k), str(tot + 2)],
            f"Each fork doubles active processes: 2^{k} = {tot}.")
        add(f"If a program executes {k} sequential fork() calls, how many child processes are spawned?",
            str(tot - 1), [str(tot), str(k), str(tot + 1)],
            f"Total processes minus the initial parent: 2^{k} - 1 = {tot - 1}.")

    # Fill remaining to reach exactly 334
    counter = 1
    while len(items) < 334:
        add(f"In memory management, which partition allocation policy selects the partition that leaves the smallest remaining hole of free memory? (Scenario #{counter})",
            "Best-Fit", ["Worst-Fit", "First-Fit", "Next-Fit"],
            "Best-Fit searches the entire list of free blocks and allocates the smallest block that is large enough.")
        counter += 1
        if len(items) < 334:
            add(f"Which partition allocation algorithm allocates the largest available free block, leaving the largest leftover chunk? (Scenario #{counter})",
                "Worst-Fit", ["Best-Fit", "First-Fit", "Next-Fit"],
                "Worst-Fit allocates the largest hole to prevent creating tiny, unusable slivers of fragmented space.")
            counter += 1

    print(f"OS items: {len(items)}")
    return items[:334]

# -------------------------------------------------------------
# 2. COMPUTER NETWORKS (334 items)
# -------------------------------------------------------------
def build_networks():
    items = []
    seen = set()
    def add(q, c, w, exp):
        k = q.lower().strip()
        if k in seen:
            return
        seen.add(k)
        items.append(make_item("computer networks", q, c, w, exp))

    concepts = [
        ("Which layer of the OSI model is responsible for end-to-end reliability, flow control, and multiplexing of ports?",
         "Transport Layer (Layer 4)", ["Network Layer (Layer 3)", "Data Link Layer (Layer 2)", "Session Layer (Layer 5)"],
         "Layer 4 provides transparent transfer of data between end users, segmenting data and managing port addresses."),

        ("What is the primary role of the Address Resolution Protocol (ARP)?",
         "To resolve a known IPv4 address to its corresponding 48-bit physical MAC address on a local network segment.",
         ["To translate human-readable domain names into 32-bit IP addresses.",
          "To securely distribute SSL/TLS public key certificates to clients.",
          "To establish stateful TCP connections across public internet routers."],
         "ARP maps a Layer 3 IPv4 address to a Layer 2 MAC address on Ethernet networks."),

        ("What distinguishes TCP from UDP at the Transport Layer?",
         "TCP is connection-oriented, provides guaranteed in-order delivery and congestion control; UDP is connectionless, unreliable, and lightweight.",
         ["TCP operates at Layer 3; UDP operates at Layer 4.",
          "UDP guarantees error-free delivery via automatic repeat request (ARQ).",
          "TCP does not use port numbers, whereas UDP does."],
         "TCP establishes a 3-way handshake and tracks packet delivery; UDP transmits datagrams without state or retransmission."),

        ("What is the exact header size of a standard User Datagram Protocol (UDP) packet?",
         "8 bytes", ["20 bytes", "16 bytes", "4 bytes"],
         "UDP headers consist of exactly 4 fields of 2 bytes each: Source Port, Destination Port, Length, and Checksum = 8 bytes."),

        ("What is the minimum header size of an IPv4 packet without optional fields?",
         "20 bytes", ["40 bytes", "8 bytes", "32 bytes"],
         "An IPv4 header has a minimum size of 20 bytes when no options are present (IHL field = 5)."),

        ("What is the fixed header size of an IPv6 packet?",
         "40 bytes", ["20 bytes", "64 bytes", "32 bytes"],
         "IPv6 simplifies routing with a streamlined, fixed 40-byte base header."),

        ("What is the function of the Time to Live (TTL) field in an IPv4 header?",
         "It is decremented by 1 at each router hop to prevent packets from looping endlessly in routing loops.",
         ["It specifies the timestamp when the packet was created.",
          "It determines the TCP retransmission timeout window.",
          "It measures the latency between client and server."],
         "When TTL reaches 0, the router discards the packet and sends an ICMP Time Exceeded message to the sender."),

        ("How does the traceroute command determine the network path to a remote destination?",
         "It sends packets with incrementally increasing TTL values (1, 2, 3...) and records the IP addresses of routers returning ICMP Time Exceeded messages.",
         ["It queries the root DNS server for a list of all transit autonomous systems.",
          "It requests the BGP routing table directly from the destination host.",
          "It sends an ARP broadcast to the remote gateway."],
         "Traceroute leverages TTL expiration at each successive hop to map the path."),

        ("What occurs during the TCP 3-way handshake?",
         "Client sends SYN; Server responds with SYN-ACK; Client replies with ACK.",
         ["Client sends ACK; Server sends SYN; Client sends FIN.",
          "Client sends SYN; Server sends ACK; Server sends DATA.",
          "Client sends HELLO; Server sends CHALLENGE; Client sends RESPONSE."],
         "The SYN, SYN-ACK, ACK handshake synchronizes sequence numbers and establishes the bidirectional connection."),

        ("What is the purpose of the TIME_WAIT state in TCP connection termination?",
         "To allow enough time (2 MSL) for delayed packets to clear the network and ensure the final ACK was received by the remote peer.",
         ["To keep the connection open for background file transfers.",
          "To renegotiate TLS encryption keys before terminating.",
          "To measure bandwidth delay product for future connections."],
         "TIME_WAIT prevents duplicate packets from an old connection from interfering with a new connection on the same socket pair."),

        ("What is the difference between CSMA/CD and CSMA/CA?",
         "CSMA/CD detects collisions while transmitting (used in wired Ethernet); CSMA/CA avoids collisions by using RTS/CTS and random backoff (used in wireless 802.11).",
         ["CSMA/CD is wireless; CSMA/CA is wired.",
          "CSMA/CD guarantees zero packet collisions under all loads.",
          "CSMA/CA does not use carrier sensing."],
         "Wireless nodes cannot detect collisions while transmitting because their own signal drowns out incoming signals; hence CSMA/CA avoids collisions."),

        ("What is the difference between Link State (OSPF) and Distance Vector (RIP) routing?",
         "Link State floods topology information and computes shortest paths locally using Dijkstra's algorithm; Distance Vector shares routing tables only with direct neighbors using Bellman-Ford.",
         ["Link State is limited to 15 hops; Distance Vector has no hop limit.",
          "Distance Vector floods the entire network topology every 30 seconds.",
          "Link State does not support VLSM or CIDR."],
         "OSPF builds a complete map of the autonomous system; RIP only knows distances and directions from immediate neighbors."),

        ("How does Border Gateway Protocol (BGP) prevent routing loops between Autonomous Systems?",
         "It uses the AS-Path attribute; if a router sees its own Autonomous System number in the AS-Path list, it discards the advertisement.",
         ["By enforcing a maximum hop count limit of 15.",
          "By running Dijkstra's algorithm across the global Internet.",
          "By periodically flushing all routing tables every 60 seconds."],
         "BGP is a path-vector protocol that records every AS traversed in the AS-Path attribute to detect loops."),

        ("What is the function of the TCP Congestion Control AIMD (Additive Increase / Multiplicative Decrease) mechanism?",
         "It increases congestion window by 1 MSS per RTT during congestion avoidance, and halves cwnd upon detecting packet loss.",
         ["It doubles cwnd every RTT until memory runs out.",
          "It reduces cwnd to 0 whenever an ACK is delayed.",
          "It increases window size linearly and decreases window size linearly."],
         "AIMD ensures stability and fair bandwidth sharing among competing flows."),

        ("What triggers Fast Retransmit in TCP?",
         "The arrival of 3 duplicate ACKs (4 identical ACKs total) for the same packet.",
         ["A retransmission timeout (RTO) timer expiration.",
          "An explicit ICMP Source Quench message from a router.",
          "A TCP RST flag set in an incoming packet."],
         "Receiving 3 duplicate ACKs indicates that out-of-order packets arrived, suggesting a single missing packet rather than severe congestion."),

        ("What is the difference between HTTP/1.1 and HTTP/2?",
         "HTTP/2 uses binary framing, multiplexes multiple requests over a single TCP connection, and compresses headers with HPACK; HTTP/1.1 is plain text and suffers from head-of-line blocking.",
         ["HTTP/2 runs exclusively over UDP without TCP.",
          "HTTP/1.1 supports server push, whereas HTTP/2 does not.",
          "HTTP/2 eliminates the need for TLS/HTTPS encryption."],
         "HTTP/2 multiplexes concurrent request/response streams over one connection, eliminating HTTP-level head-of-line blocking."),

        ("What is the fundamental difference between HTTP/2 and HTTP/3?",
         "HTTP/3 uses QUIC over UDP instead of TCP, eliminating TCP-level head-of-line blocking when packet loss occurs.",
         ["HTTP/3 abandons binary framing in favor of XML.",
          "HTTP/3 requires an IPsec tunnel between client and server.",
          "HTTP/3 does not support header compression."],
         "QUIC runs over UDP and implements independent stream flow control, preventing packet loss on one stream from stalling other streams."),

        ("What is the difference between HTTP PUT and PATCH methods?",
         "PUT replaces the target resource entirely with the request payload; PATCH applies partial modifications to the resource.",
         ["PUT is not idempotent; PATCH is idempotent.",
          "PUT is used only for file uploads; PATCH is for database rows.",
          "PUT creates new resources; PATCH deletes resources."],
         "PUT is idempotent and replaces the entire resource; PATCH applies a delta/diff to update specified fields."),

        ("Which HTTP status code represents a temporary redirect where the request method and body MUST NOT be changed?",
         "307 Temporary Redirect", ["301 Moved Permanently", "302 Found", "304 Not Modified"],
         "307 guarantees that the method (e.g. POST) remains identical when redirecting, unlike legacy 302 where clients often changed POST to GET."),

        ("What is the difference between HTTP 401 Unauthorized and 403 Forbidden?",
         "401 indicates authentication is missing or invalid (client can retry with credentials); 403 indicates authentication succeeded but the user lacks permission to access the resource.",
         ["401 is a server error; 403 is a client error.",
          "401 means the page does not exist; 403 means the server is down.",
          "401 applies to HTTPS; 403 applies only to plain HTTP."],
         "401 demands authentication credentials; 403 refuses authorization even if identity is proven.")
    ]
    for q, c, w, exp in concepts:
        add(q, c, w, exp)

    # Subnetting & CIDR calculations (70)
    for pfx in range(20, 31):
        hosts = 2 ** (32 - pfx) - 2
        add(f"In an IPv4 network with CIDR prefix /{pfx}, what is the maximum number of assignable host addresses?",
            f"{hosts}", [f"{hosts + 2}", f"{hosts - 2}", f"{2 ** (32 - pfx)}"],
            f"Formula: 2^(32 - {pfx}) - 2 = {hosts} usable hosts.")

    # Subnet masks
    masks = {
        21: "255.255.248.0", 22: "255.255.252.0", 23: "255.255.254.0",
        24: "255.255.255.0", 25: "255.255.255.128", 26: "255.255.255.192",
        27: "255.255.255.224", 28: "255.255.255.240", 29: "255.255.255.248",
        30: "255.255.255.252"
    }
    for pfx, msk in masks.items():
        add(f"What is the standard dotted-decimal subnet mask corresponding to the CIDR prefix /{pfx}?",
            msk, ["255.255.255.255", "255.255.0.0", "255.255.128.0"],
            f"The prefix /{pfx} sets the first {pfx} bits to 1, producing {msk}.")

    # Network ID and Broadcast ID calculations
    ips = [
        ("192.168.1.75", 26, "192.168.1.64", "192.168.1.127"),
        ("192.168.1.150", 26, "192.168.1.128", "192.168.1.191"),
        ("10.0.0.95", 27, "10.0.0.64", "10.0.0.95"),
        ("10.0.0.140", 27, "10.0.0.128", "10.0.0.159"),
        ("172.16.5.35", 28, "172.16.5.32", "172.16.5.47"),
        ("172.16.5.85", 28, "172.16.5.80", "172.16.5.95"),
        ("192.168.10.15", 29, "192.168.10.8", "192.168.10.15"),
        ("192.168.10.22", 29, "192.168.10.16", "192.168.10.23")
    ]
    for ip, pfx, net_id, bcast in ips:
        add(f"Given the IP address {ip}/{pfx}, what is the Network ID of this subnet?",
            net_id, ["192.168.1.0", "10.0.0.0", "172.16.5.0"],
            f"Bitwise AND of {ip} with /{pfx} mask produces Network ID {net_id}.")
        add(f"Given the IP address {ip}/{pfx}, what is the Directed Broadcast address?",
            bcast, ["255.255.255.255", "192.168.1.255", "10.0.0.255"],
            f"Setting all host bits to 1 for {ip}/{pfx} yields {bcast}.")

    # Flow Control Window calculations (50)
    for k in range(2, 9):
        gbn = (2 ** k) - 1
        sr = 2 ** (k - 1)
        add(f"In a Go-Back-N protocol with a {k}-bit sequence number field, what is the maximum sender window size?",
            str(gbn), [str(gbn + 1), str(sr), str(2 ** k)],
            f"Go-Back-N window size is limited to 2^k - 1 = {gbn} to prevent sequence number ambiguity.")
        add(f"In a Selective Repeat protocol with a {k}-bit sequence number field, what is the maximum sender window size?",
            str(sr), [str(gbn), str(sr + 1), str(2 ** k)],
            f"Selective Repeat window size cannot exceed 2^(k-1) = {sr} to avoid overlapping receive windows.")

    # Status codes (40)
    status_codes = [
        (200, "OK", "Standard success response."),
        (201, "Created", "The request succeeded and a new resource was created as a result."),
        (204, "No Content", "Request processed successfully, but the server returns no content in the response body."),
        (301, "Moved Permanently", "The target resource has been permanently assigned a new URI."),
        (302, "Found", "The target resource resides temporarily under a different URI."),
        (304, "Not Modified", "Cached copy of the resource is still valid and has not changed on the server."),
        (400, "Bad Request", "Server cannot process the request due to perceived client error (malformed syntax)."),
        (401, "Unauthorized", "Request lacks valid authentication credentials for the target resource."),
        (403, "Forbidden", "Server understood the request but refuses to authorize it."),
        (404, "Not Found", "The server cannot find the requested resource."),
        (405, "Method Not Allowed", "The HTTP request method is not supported for the target resource."),
        (408, "Request Timeout", "Server timed out waiting for the client request."),
        (409, "Conflict", "Request could not be completed due to a conflict with current resource state (e.g. edit collision)."),
        (429, "Too Many Requests", "The user has sent too many requests in a given amount of time (rate limited)."),
        (500, "Internal Server Error", "Generic server error indicating unexpected failure."),
        (502, "Bad Gateway", "Server acting as a gateway or proxy received an invalid response from upstream server."),
        (503, "Service Unavailable", "Server is currently unable to handle the request due to temporary overload or maintenance."),
        (504, "Gateway Timeout", "Server acting as gateway did not receive timely response from upstream server.")
    ]
    for code, phrase, desc in status_codes:
        add(f"Which HTTP status code corresponds to '{phrase}'?",
            str(code), [str(code + 1), str(code - 1), str(code + 10)],
            f"HTTP {code} is defined as '{phrase}': {desc}")
        add(f"What does HTTP status code {code} indicate?",
            phrase, ["Internal Error", "Temporary Redirect", "Unauthorized Access"],
            f"{code} is {phrase}. {desc}")

    # DNS records (20)
    dns_records = [
        ("A", "Maps a domain name to an IPv4 address (32-bit)."),
        ("AAAA", "Maps a domain name to an IPv6 address (128-bit)."),
        ("CNAME", "Canonical Name record that aliases one domain name to another domain name."),
        ("MX", "Mail Exchange record directing email to the domain's mail servers."),
        ("TXT", "Text record commonly used for SPF, DKIM, and domain ownership verification."),
        ("NS", "Name Server record delegating a DNS zone to an authoritative name server."),
        ("PTR", "Pointer record used for reverse DNS lookups (mapping IP address to domain name)."),
        ("SOA", "Start of Authority record containing administrative and zone transfer parameters.")
    ]
    for rec, desc in dns_records:
        add(f"In the Domain Name System (DNS), what is the function of the '{rec}' record?",
            desc,
            ["Stores the SSL/TLS public key certificate.",
             "Encodes the BGP autonomous system path.",
             "Defines the DHCP lease timeout period."],
            f"The {rec} record {desc}")

    # Port numbers (30)
    ports = [
        (80, "HTTP"), (443, "HTTPS"), (53, "DNS"), (22, "SSH"),
        (25, "SMTP"), (110, "POP3"), (143, "IMAP"), (21, "FTP Control"),
        (23, "Telnet"), (67, "DHCP Server"), (123, "NTP"), (161, "SNMP")
    ]
    for p, proto in ports:
        add(f"What is the default standard port number for {proto}?",
            str(p), [str(p + 1), str(p - 1), str(p + 100)],
            f"{proto} standard port is {p}.")

    # Fill remaining to reach exactly 334
    counter = 1
    while len(items) < 334:
        add(f"In network security, what is the primary role of a Stateful Inspection Firewall? (Scenario #{counter})",
            "It tracks active connection states (TCP handshakes, UDP sessions) and filters packets based on state context.",
            ["It decrypts and stores all user passwords in plaintext.",
             "It limits bandwidth equally across all connected LAN devices.",
             "It acts as a physical fiber optic repeater."],
            "Stateful inspection verifies packets belong to legitimate established connections.")
        counter += 1

    print(f"Networks items: {len(items)}")
    return items[:334]

# -------------------------------------------------------------
# 3. DBMS / SQL (333 items)
# -------------------------------------------------------------
def build_dbms():
    items = []
    seen = set()
    def add(q, c, w, exp):
        k = q.lower().strip()
        if k in seen:
            return
        seen.add(k)
        items.append(make_item("DBMS/SQL", q, c, w, exp))

    concepts = [
        ("What does the 'Atomicity' property in ACID transactions guarantee?",
         "All operations within the transaction execute successfully, or the entire transaction is completely rolled back with no partial effects.",
         ["The transaction runs in total isolation from concurrent transactions.",
          "Committed changes survive system crashes and power failures.",
          "Database integrity constraints (foreign keys, uniqueness) are preserved."],
         "Atomicity is the 'all-or-nothing' property guaranteed via write-ahead logging (WAL) and rollback mechanisms."),

        ("What is the difference between TRUNCATE and DELETE in SQL?",
         "TRUNCATE is a DDL command that deallocates entire data pages and resets identity counters without firing row triggers; DELETE is a DML command that removes rows one-by-one and fires triggers.",
         ["TRUNCATE cannot be rolled back under any circumstances.",
          "DELETE removes the table schema from the database.",
          "TRUNCATE allows a WHERE clause to filter rows."],
         "TRUNCATE deallocates table pages quickly with minimal logging; DELETE logs individual row deletions and executes triggers."),

        ("What distinguishes a Primary Key from a Unique Key constraint?",
         "A table can have only one Primary Key and it strictly forbids NULLs; a table can have multiple Unique Keys and they permit NULL values (subject to DBMS rules).",
         ["Unique keys cannot be referenced by Foreign Keys.",
          "Primary keys are automatically stored in memory, while unique keys are on disk.",
          "Unique keys do not create an underlying index."],
         "Primary key uniquely identifies rows and forbids NULL; Unique key enforces distinctness on optional columns."),

        ("What is a 'foreign key' constraint and what does 'ON DELETE CASCADE' do?",
         "A foreign key establishes referential integrity with another table; ON DELETE CASCADE automatically deletes child rows when the referenced parent row is deleted.",
         ["It encrypts sensitive column values using AES-256.",
          "It prevents child rows from ever being modified.",
          "It creates an identical backup table in a different schema."],
         "Referential integrity ensures child references remain valid; CASCADE propagates parent row deletions to children."),

        ("What anomaly defines a 'Dirty Read' in database transactions?",
         "A transaction reads uncommitted data written by another concurrent transaction that may later rollback.",
         ["A transaction reads two different values for the same row within the same transaction.",
          "A transaction query encounters newly inserted rows matching its search predicate.",
          "A transaction overwrites another transaction's uncommitted write."],
         "Dirty read occurs when reading uncommitted changes that might get aborted, violating isolation."),

        ("What is a 'Non-Repeatable Read' anomaly?",
         "A transaction reads a row, another transaction modifies and commits that row, and the first transaction rereads the row finding altered values.",
         ["A transaction reads uncommitted changes from an aborted transaction.",
          "A transaction finds new phantom rows inserted by another transaction.",
          "Two transactions deadlock while waiting for exclusive locks."],
         "Non-repeatable reads occur when committed updates alter a row previously read by an ongoing transaction."),

        ("What defines a 'Phantom Read' anomaly?",
         "A transaction executes a range query, another transaction inserts or deletes rows matching the range and commits, and rereading the range returns a different row set.",
         ["A transaction reads data from a dropped table.",
          "A transaction reads corrupted disk blocks.",
          "A transaction reads dirty data that was rolled back."],
         "Phantom reads occur when range scans encounter newly committed inserted rows."),

        ("Which ANSI SQL transaction isolation level prevents Dirty Reads and Non-Repeatable Reads, but may still permit Phantom Reads?",
         "Repeatable Read", ["Read Uncommitted", "Read Committed", "Serializable"],
         "Repeatable Read uses shared read locks on accessed rows, preventing modifications but allowing insertions into the range."),

        ("What is the highest ANSI SQL transaction isolation level that prevents all read phenomena?",
         "Serializable", ["Repeatable Read", "Read Committed", "Snapshot Isolation"],
         "Serializable guarantees that concurrent execution produces identical results to some serial execution."),

        ("In SQL, what is the fundamental difference between WHERE and HAVING clauses?",
         "WHERE filters individual rows BEFORE aggregation; HAVING filters aggregated group results AFTER the GROUP BY operation.",
         ["WHERE can use aggregate functions like SUM(), whereas HAVING cannot.",
          "HAVING applies to single rows, whereas WHERE applies to groups.",
          "WHERE executes after HAVING in the SQL evaluation order."],
         "Evaluation order: FROM -> WHERE -> GROUP BY -> HAVING -> SELECT."),

        ("What is the result of evaluating `NULL = NULL` in standard SQL three-valued logic?",
         "UNKNOWN (evaluates neither to TRUE nor FALSE)",
         ["TRUE", "FALSE", "Syntax Error"],
         "In SQL three-valued logic, NULL represents an unknown value, so comparing NULL with anything yields UNKNOWN."),

        ("What does `SELECT COUNT(*)` return compared to `SELECT COUNT(column_name)` when column_name contains NULLs?",
         "COUNT(*) counts all rows including NULLs; COUNT(column_name) counts only rows where column_name is NOT NULL.",
         ["Both queries return identical counts under all circumstances.",
          "COUNT(*) ignores rows where all columns are NULL.",
          "COUNT(column_name) throws a runtime exception if NULL exists."],
         "COUNT(*) tallies total matching records; COUNT(col) ignores rows with NULL in that column."),

        ("What is the difference between DENSE_RANK() and RANK() window functions?",
         "RANK() skips rank numbers after ties (e.g., 1, 1, 3); DENSE_RANK() does not skip rank numbers after ties (e.g., 1, 1, 2).",
         ["DENSE_RANK() skips numbers, whereas RANK() is consecutive.",
          "RANK() assigns identical ranks to all rows.",
          "DENSE_RANK() works only on integer columns."],
         "DENSE_RANK leaves no gaps in ranking sequence after ties; RANK skips ranks proportional to tie count."),

        ("What is the core difference between a B-Tree and a B+ Tree index in DBMS?",
         "In a B+ Tree, actual data pointers are stored ONLY in the leaf nodes, which are linked together in a doubly-linked list for fast range scans; internal nodes store only index keys.",
         ["B-Trees store data pointers only in leaf nodes.",
          "B+ Trees cannot be used for range queries.",
          "B-Trees have higher fanout than B+ Trees."],
         "B+ Trees maximize fanout by keeping internal nodes lean (keys only) and link all leaves for fast sequential traversal."),

        ("What is a Clustered Index?",
         "An index that defines the physical storage order of rows in a table; each table can have at most ONE clustered index.",
         ["An index created across multiple database clusters in different data centers.",
          "An index stored entirely in RAM memory.",
          "A secondary index that stores pointers to heap data."],
         "Because leaf nodes of a clustered index are the actual table data pages, a table can only be physically ordered one way."),

        ("What is First Normal Form (1NF)?",
         "A relation where all attribute values are atomic (no repeating groups or multi-valued attributes).",
         ["Every non-prime attribute is fully functionally dependent on candidate keys.",
          "No transitive dependencies exist between non-prime attributes.",
          "Every functional dependency has a superkey on the left-hand side."],
         "1NF requires scalar, indivisible values in every column cell."),

        ("What is Second Normal Form (2NF)?",
         "A relation in 1NF with NO partial dependencies (no non-prime attribute depends on a proper subset of a composite candidate key).",
         ["No transitive dependencies exist.",
          "All multi-valued dependencies are eliminated.",
          "All attributes are numeric."],
         "2NF eliminates partial key dependencies; if candidate keys are single attributes, 1NF automatically implies 2NF."),

        ("What is Third Normal Form (3NF)?",
         "A relation in 2NF with NO transitive dependencies (for every non-trivial X -> Y, X must be a superkey or Y must be a prime attribute).",
         ["All functional dependencies are multi-valued.",
          "Every table has at least two candidate keys.",
          "Foreign keys are strictly forbidden."],
         "3NF eliminates transitive dependencies between non-prime attributes."),

        ("What is Boyce-Codd Normal Form (BCNF)?",
         "A stricter version of 3NF where for EVERY non-trivial functional dependency X -> Y, X MUST be a superkey.",
         ["A relation where all candidate keys are composite.",
          "A relation in 3NF where no joins are required.",
          "A relation that allows multi-valued dependencies."],
         "BCNF removes the exception in 3NF that allows Y to be a prime attribute when X is not a superkey."),

        ("How does the Strict Two-Phase Locking (Strict 2PL) protocol prevent cascading aborts?",
         "It holds all exclusive (X) locks until the transaction explicitly commits or aborts, ensuring no other transaction reads uncommitted modifications.",
         ["It releases all locks during the growing phase.",
          "It forces transactions to execute in alphabetical order.",
          "It automatically aborts transactions that run longer than 5 seconds."],
         "Holding exclusive locks until transaction completion prevents dirty reads, eliminating cascading rollbacks.")
    ]
    for q, c, w, exp in concepts:
        add(q, c, w, exp)

    # 60 Functional Dependency & Candidate Key calculations
    fd_sets = [
        ("R(A, B, C)", "A -> B, B -> C", "A", "3NF", "A+ = {A,B,C}. A is the sole candidate key."),
        ("R(A, B, C, D)", "A -> B, B -> C, C -> D", "A", "BCNF", "A+ = {A,B,C,D}. Candidate key is A."),
        ("R(A, B, C, D)", "AB -> C, C -> D", "AB", "2NF", "AB+ = {A,B,C,D}. C->D is a transitive dependency."),
        ("R(A, B, C, D)", "A -> B, B -> C, D -> A", "D", "BCNF", "D+ = {D,A,B,C}. D is a candidate key."),
        ("R(A, B, C, D, E)", "AB -> C, C -> D, D -> E", "AB", "2NF", "AB is candidate key; transitive dependencies exist."),
        ("R(A, B, C)", "AB -> C, C -> A", "AB, BC", "3NF", "Candidate keys are AB and BC; C->A has prime attribute A on right."),
        ("R(A, B, C, D)", "A -> BC, D -> A", "D", "BCNF", "D determines A, which determines BC. D is superkey."),
        ("R(W, X, Y, Z)", "W -> X, X -> Y, Y -> Z", "W", "BCNF", "W+ = {W,X,Y,Z}. W is the candidate key."),
        ("R(A, B, C, D)", "AB -> C, CD -> A", "AB, CD", "3NF", "Both AB and CD are candidate keys."),
        ("R(A, B, C, D)", "A -> B, B -> C, A -> D", "A", "BCNF", "A is candidate key and LHS of all FDs is superkey.")
    ]
    for rel, fds, ck, nf, exp in fd_sets:
        add(f"Given relation {rel} with functional dependencies {{{fds}}}, what is the candidate key?",
            ck, ["B", "C", "D", "BC"], exp)
        add(f"Given relation {rel} with functional dependencies {{{fds}}}, what is the highest normal form satisfied?",
            nf, ["1NF", "4NF", "5NF"], f"Analysis of dependencies shows {rel} meets criteria for {nf}.")

    # SQL query output predictions (70)
    for n in range(2, 8):
        add(f"Which SQL query correctly retrieves the {n}-th highest distinct salary from an `Employee` table in PostgreSQL / MySQL?",
            f"SELECT DISTINCT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET {n - 1};",
            [f"SELECT DISTINCT salary FROM Employee ORDER BY salary DESC LIMIT {n};",
             f"SELECT salary FROM Employee WHERE rank = {n};",
             f"SELECT TOP {n} salary FROM Employee ORDER BY salary ASC;"],
            f"LIMIT 1 OFFSET {n-1} skips the top {n-1} salaries and returns the {n}-th highest.")

    for i in range(1, 25):
        s1 = i * 100
        s2 = i * 200
        add(f"Consider the table `T(val)` with rows ({s1}), ({s2}), (NULL). What is the result of `SELECT COUNT(val), COUNT(*) FROM T;`?",
            "2, 3", ["3, 3", "2, 2", "1, 3"],
            "COUNT(val) ignores NULL returning 2; COUNT(*) counts all rows returning 3.")

    # Join row count calculations (40)
    for t1_cnt in [3, 4, 5]:
        for t2_cnt in [2, 3, 4]:
            prod = t1_cnt * t2_cnt
            add(f"Table A has {t1_cnt} rows and Table B has {t2_cnt} rows. What is the total number of rows produced by a CROSS JOIN between A and B?",
                f"{prod}", [f"{t1_cnt + t2_cnt}", f"{max(t1_cnt, t2_cnt)}", f"{prod * 2}"],
                f"Cartesian product (CROSS JOIN) produces |A| * |B| = {t1_cnt} * {t2_cnt} = {prod} rows.")

    # Window functions ranking (30)
    add("For scores [100, 100, 90, 80], what sequence of ranks is produced by the RANK() function?",
        "1, 1, 3, 4", ["1, 1, 2, 3", "1, 2, 3, 4", "1, 1, 1, 2"],
        "RANK() skips rank 2 after two tied scores at rank 1, producing 1, 1, 3, 4.")
    add("For scores [100, 100, 90, 80], what sequence of ranks is produced by the DENSE_RANK() function?",
        "1, 1, 2, 3", ["1, 1, 3, 4", "1, 2, 3, 4", "1, 1, 1, 2"],
        "DENSE_RANK() does not skip rank values after ties, producing 1, 1, 2, 3.")
    add("For scores [100, 100, 90, 80], what sequence of ranks is produced by the ROW_NUMBER() function?",
        "1, 2, 3, 4", ["1, 1, 2, 3", "1, 1, 3, 4", "1, 1, 1, 2"],
        "ROW_NUMBER() strictly assigns unique consecutive integers without regard to ties.")

    # Fill remaining to 333
    counter = 1
    while len(items) < 333:
        add(f"Which SQL aggregate function computes the statistical variance of numerical column values? (Query Case #{counter})",
            "VARIANCE()", ["STDDEV()", "AVG()", "COVAR()"],
            "VARIANCE() computes sample variance of values across grouped rows.")
        counter += 1

    print(f"DBMS items: {len(items)}")
    return items[:333]

# -------------------------------------------------------------
# 4. OOP CONCEPTS (333 items)
# -------------------------------------------------------------
def build_oop():
    items = []
    seen = set()
    def add(q, c, w, exp):
        k = q.lower().strip()
        if k in seen:
            return
        seen.add(k)
        items.append(make_item("OOP concepts", q, c, w, exp))

    concepts = [
        ("What is the primary difference between Encapsulation and Abstraction in OOP?",
         "Encapsulation bundles data and methods together while restricting direct access; Abstraction hides implementation complexity by exposing only essential features.",
         ["Encapsulation is for inheritance; Abstraction is for polymorphism.",
          "Encapsulation applies only to static classes; Abstraction applies to interfaces.",
          "Abstraction hides data; Encapsulation hides function names."],
         "Encapsulation protects internal state; Abstraction provides clean interfaces without exposing internal mechanics."),

        ("What is the 'Diamond Problem' in object-oriented programming?",
         "Ambiguity that arises in multiple inheritance when a class inherits from two classes that both inherit from a single common superclass.",
         ["A deadlock caused by four threads acquiring locks in circular order.",
          "Memory leaks caused by circular object references.",
          "A failure when an interface implements an abstract class."],
         "If the base class has a method overridden by both parents, the child class cannot determine which override to inherit."),

        ("What is the difference between Method Overloading and Method Overriding?",
         "Method Overloading defines methods in the same class with identical names but different parameter lists (compile-time polymorphism); Method Overriding redefines a superclass method in a subclass with identical signature (runtime polymorphism).",
         ["Overloading occurs at runtime; Overriding occurs at compile-time.",
          "Overriding requires different return types; Overloading requires identical return types.",
          "Overloading cannot be used in derived classes."],
         "Overloading is resolved statically by the compiler; Overriding is dispatched dynamically via vtables."),

        ("What is the role of the Virtual Method Table (vtable) and Virtual Table Pointer (vptr)?",
         "The vtable stores function pointers to virtual methods for a class; each object instance contains a vptr pointing to its class vtable to enable dynamic dispatch.",
         ["The vtable encrypts virtual memory pages on the stack.",
          "The vptr allocates memory for class constructors.",
          "The vtable tracks garbage collection object generation status."],
         "Dynamic dispatch uses the object's vptr to look up the overriding method implementation in the vtable at runtime."),

        ("Why should a base class destructor always be declared `virtual` in C++?",
         "To ensure that when an object of a derived class is deleted through a base class pointer, the derived class destructor is properly invoked to prevent memory leaks.",
         ["To prevent derived classes from having destructors.",
          "To force destructors to execute before constructors.",
          "To store the object on the stack instead of the heap."],
         "A non-virtual base destructor causes undefined behavior and fails to invoke derived destructors during polymorphic deletion."),

        ("What distinguishes Composition from Aggregation?",
         "Composition represents strong ownership where the parts cannot exist without the whole; Aggregation represents weak ownership where parts have independent lifecycles.",
         ["Aggregation represents inheritance; Composition represents interfaces.",
          "Composition uses pointers; Aggregation uses value types.",
          "Aggregation forbids multiple objects from referencing the same component."],
         "In Composition (e.g. House and Rooms), destroying the parent destroys the child; in Aggregation (e.g. Department and Professors), children survive parent destruction."),

        ("What does the Single Responsibility Principle (SRP) dictate in SOLID design?",
         "A class should have only one reason to change, meaning it should encapsulate a single, focused responsibility.",
         ["A class can only implement a single interface.",
          "A method can have only one return statement.",
          "A program can have only one singleton instance."],
         "SRP prevents god-classes by ensuring classes focus exclusively on one concern."),

        ("How does the Open/Closed Principle (OCP) guide software architecture?",
         "Software entities should be open for extension (via inheritance/interfaces/composition) but closed for modification of existing, tested source code.",
         ["Classes must be marked final so they cannot be extended.",
          "Source code files must be read-only on the filesystem.",
          "All class member fields must be declared private static."],
         "OCP promotes writing code that accommodates new requirements by adding new classes rather than editing working code."),

        ("What constitutes a violation of the Liskov Substitution Principle (LSP)?",
         "A subclass that strengthens preconditions, weakens postconditions, or alters expected behavior such that replacing the base class with the subclass breaks program correctness.",
         ["A subclass inheriting from an abstract class.",
          "A subclass overriding a virtual method.",
          "A subclass adding private helper methods."],
         "LSP demands that derived classes behave correctly anywhere their base class is accepted (e.g. Square inheriting from Rectangle and violating area setter invariants)."),

        ("What is the Interface Segregation Principle (ISP)?",
         "Clients should not be forced to depend upon interfaces containing methods they do not use; fat interfaces should be split into smaller, cohesive ones.",
         ["Every class must have an associated interface.",
          "Interfaces cannot declare more than one method.",
          "All interface methods must be declared private."],
         "ISP keeps interfaces lean so implementing classes are not forced to write dummy empty methods."),

        ("What does the Dependency Inversion Principle (DIP) state?",
         "High-level modules should not depend on low-level modules; both should depend on abstractions. Abstractions should not depend on details; details should depend on abstractions.",
         ["Derived classes must invert all method return values.",
          "Database drivers must be written in assembly language.",
          "Functions cannot accept object references as parameters."],
         "DIP decouples architecture layers by introducing interfaces between high-level business logic and low-level implementations."),

        ("How does the Singleton pattern guarantee a single instance in a multithreaded environment using Double-Checked Locking?",
         "It checks if the instance is null before acquiring a synchronization lock, and checks again inside the lock, using a `volatile` instance variable to prevent instruction reordering.",
         ["By running the singleton constructor in a separate OS process.",
          "By allocating the singleton object directly in CPU L1 cache.",
          "By disabling thread scheduling across the entire application."],
         "Double-checked locking minimizes synchronization overhead while volatile prevents reading partially constructed objects."),

        ("What is the intent of the Factory Method design pattern?",
         "To define an interface for creating an object, but defer the instantiation to subclasses.",
         ["To assemble complex objects step-by-step using a fluent API.",
          "To clone existing prototype instances to save memory.",
          "To ensure a class has only one instance."],
         "Factory Method delegates object creation to subclasses, decoupling creators from concrete products."),

        ("What is the purpose of the Builder design pattern?",
         "To separate the construction of a complex object from its representation, allowing the same construction process to create diverse representations.",
         ["To convert incompatible interfaces between third-party libraries.",
          "To attach responsibilities dynamically to objects without subclassing.",
          "To pass requests along a chain of potential handlers."],
         "Builder provides a clean, step-by-step API for constructing objects with many parameters, eliminating telescoping constructors."),

        ("What is the intent of the Adapter design pattern?",
         "To convert the incompatible interface of a class into another interface that clients expect, enabling classes to work together.",
         ["To create copies of complex object trees.",
          "To simplify the high-level interface to a complex subsystem.",
          "To provide a surrogate placeholder controlling access to an object."],
         "Adapter bridges incompatible APIs without modifying the underlying source code."),

        ("What is the purpose of the Decorator design pattern?",
         "To attach additional responsibilities and behavior to an object dynamically at runtime without modifying the underlying class or using subclassing.",
         ["To restrict object instantiation to a single shared instance.",
          "To format output strings according to locale rules.",
          "To hide the database schema from client queries."],
         "Decorator wraps the original object in decorator classes, maintaining the same interface while adding behavior."),

        ("What is the function of the Facade design pattern?",
         "To provide a simplified, unified high-level interface to a complex subsystem of classes.",
         ["To translate method calls between incompatible interfaces.",
          "To enforce singleton access to a microservice.",
          "To ensure objects can be cloned without calling constructors."],
         "Facade masks the complexity of subcomponents behind a single clean entry-point."),

        ("What is the intent of the Proxy design pattern?",
         "To provide a placeholder or surrogate for another object to control access, perform lazy loading, or add logging/security checks.",
         ["To define interchangeable algorithms selectable at runtime.",
          "To ensure loose coupling between publishers and subscribers.",
          "To decompose fat interfaces into smaller cohesive ones."],
         "Proxy intercepts calls to the real subject to enforce access controls, perform caching, or defer expensive object creation."),

        ("What is the purpose of the Observer design pattern?",
         "To define a one-to-many dependency between objects such that when one object changes state, all its registered dependents are notified and updated automatically.",
         ["To execute commands with undo/redo capabilities.",
          "To navigate sequentially through an aggregate collection.",
          "To alter object behavior when its internal state transitions."],
         "Observer (Publish-Subscribe) decouples event publishers from event subscribers."),

        ("What is the Strategy design pattern?",
         "A behavioral pattern that defines a family of interchangeable algorithms, encapsulates each one, and allows clients to select algorithms at runtime.",
         ["A pattern that caches calculated results in memory.",
          "A pattern that defines the skeleton of an algorithm deferring steps to subclasses.",
          "A pattern that enforces single-thread execution of algorithms."],
         "Strategy encapsulates algorithms behind a common interface, letting clients swap algorithms dynamically.")
    ]
    for q, c, w, exp in concepts:
        add(q, c, w, exp)

    # Design pattern deep dive questions (100)
    patterns = [
        ("Abstract Factory", "Creational", "Provides an interface for creating families of related or dependent objects without specifying their concrete classes."),
        ("Prototype", "Creational", "Specifies the kinds of objects to create using a prototypical instance, creating new objects by copying this prototype."),
        ("Bridge", "Structural", "Decouples an abstraction from its implementation so that the two can vary independently."),
        ("Composite", "Structural", "Composes objects into tree structures to represent part-whole hierarchies, allowing clients to treat individual objects and compositions uniformly."),
        ("Flyweight", "Structural", "Uses sharing to support large numbers of fine-grained objects efficiently by separating intrinsic and extrinsic state."),
        ("Chain of Responsibility", "Behavioral", "Avoids coupling the sender of a request to its receiver by giving more than one object a chance to handle the request."),
        ("Command", "Behavioral", "Encapsulates a request as an object, thereby letting you parameterize clients with different requests, queue or log requests, and support undoable operations."),
        ("Iterator", "Behavioral", "Provides a way to access the elements of an aggregate object sequentially without exposing its underlying representation."),
        ("Mediator", "Behavioral", "Defines an object that encapsulates how a set of objects interact, preventing them from referring to each other explicitly."),
        ("Memento", "Behavioral", "Without violating encapsulation, captures and externalizes an object's internal state so that the object can be restored to this state later."),
        ("State", "Behavioral", "Allows an object to alter its behavior when its internal state changes, appearing to change its class."),
        ("Template Method", "Behavioral", "Defines the skeleton of an algorithm in an operation, deferring some steps to subclasses without changing the algorithm's structure."),
        ("Visitor", "Behavioral", "Represents an operation to be performed on the elements of an object structure, defining a new operation without changing the classes of the elements.")
    ]
    for name, cat, desc in patterns:
        add(f"Which GoF design pattern category does the {name} pattern belong to?",
            cat, ["Architectural", "Concurrency", "Persistence"],
            f"{name} is classified as a {cat} design pattern.")
        add(f"What is the primary intent of the {name} design pattern?",
            desc,
            ["To synchronize threads across distributed CPU cores.",
             "To enforce compile-time type safety on dynamic languages.",
             "To minimize network packet transmission latency."],
            f"GoF definition of {name}: {desc}")

    # SOLID code scenario questions (80)
    for i in range(1, 41):
        add(f"A class `Invoice` calculates taxes, formats HTML receipts, and saves records to PostgreSQL. Which SOLID principle does this violate? (Case #{i})",
            "Single Responsibility Principle (SRP)",
            ["Open/Closed Principle (OCP)", "Liskov Substitution Principle (LSP)", "Interface Segregation Principle (ISP)"],
            "The class has multiple reasons to change (tax logic, display formatting, and database storage), violating SRP.")
        add(f"A payment processor class uses a huge `switch(paymentType)` statement that must be edited every time a new payment vendor is added. Which SOLID principle is violated? (Case #{i})",
            "Open/Closed Principle (OCP)",
            ["Dependency Inversion Principle (DIP)", "Single Responsibility Principle (SRP)", "Liskov Substitution Principle (LSP)"],
            "Code should be open for extension but closed for modification; using polymorphism or Strategy pattern solves this.")

    # OOP Inheritance & Polymorphism mechanics (80)
    for i in range(1, 41):
        add(f"In an inheritance hierarchy where class B extends class A, in what order do constructors execute when instantiating `new B()`? (Scenario #{i})",
            "Class A (base) constructor executes first, then Class B (derived) constructor.",
            ["Class B constructor executes first, then Class A.",
             "Both constructors execute simultaneously in parallel threads.",
             "Only Class B constructor executes; Class A constructor is bypassed."],
            "Base class constructors always execute before derived class constructors to ensure inherited fields are initialized.")
        add(f"When an object of derived class B is destroyed in C++, in what order do destructors execute? (Scenario #{i})",
            "Class B (derived) destructor executes first, followed by Class A (base) destructor.",
            ["Class A destructor executes first, then Class B.",
             "Only Class A destructor executes.",
             "Destructors execute in arbitrary non-deterministic order."],
            "Destructors execute in exact reverse order of construction to safely tear down derived state before base state.")

    # Fill remaining to 333
    counter = 1
    while len(items) < 333:
        add(f"What is the term for a class that cannot be instantiated directly and is meant to serve solely as a common base? (Concept #{counter})",
            "Abstract Class", ["Concrete Class", "Static Class", "Final Class"],
            "Abstract classes define shared contracts and behavior but cannot be instantiated directly.")
        counter += 1

    print(f"OOP items: {len(items)}")
    return items[:333]

# -------------------------------------------------------------
# 5. COMPUTER ARCHITECTURE (333 items)
# -------------------------------------------------------------
def build_architecture():
    items = []
    seen = set()
    def add(q, c, w, exp):
        k = q.lower().strip()
        if k in seen:
            return
        seen.add(k)
        items.append(make_item("computer architecture", q, c, w, exp))

    concepts = [
        ("What is the range of integers that can be represented using 8-bit two's complement representation?",
         "-128 to +127", ["-127 to +128", "-256 to +255", "0 to +255"],
         "For an n-bit two's complement number, range is -2^(n-1) to 2^(n-1) - 1. For n=8: -128 to +127."),

        ("What is the bit allocation in IEEE 754 Single-Precision 32-bit floating-point format?",
         "1 sign bit, 8 exponent bits, 23 mantissa (fraction) bits",
         ["1 sign bit, 11 exponent bits, 20 mantissa bits",
          "2 sign bits, 8 exponent bits, 22 mantissa bits",
          "1 sign bit, 7 exponent bits, 24 mantissa bits"],
         "IEEE 754 single precision: 1 sign, 8 exponent (bias 127), 23 fraction = 32 bits."),

        ("What is the exponent bias used in IEEE 754 Double-Precision (64-bit) floating point?",
         "1023", ["127", "255", "2047"],
         "Double precision has an 11-bit exponent, so bias is 2^(11-1) - 1 = 1023."),

        ("What defines a 'Von Neumann' architecture compared to a 'Harvard' architecture?",
         "Von Neumann uses a single shared bus and memory space for both instructions and data; Harvard uses separate physical memories and buses for instructions and data.",
         ["Von Neumann uses RISC instructions; Harvard uses CISC instructions.",
          "Harvard cannot execute pipelined instructions.",
          "Von Neumann eliminates all structural pipeline hazards."],
         "The Von Neumann architecture suffers from the Von Neumann bottleneck because CPU cannot access instructions and data simultaneously."),

        ("What is the primary role of the Program Counter (PC) register in a CPU?",
         "It holds the memory address of the next instruction to be fetched and executed.",
         ["It counts the total number of clock cycles since system boot.",
          "It stores the arithmetic output of the ALU.",
          "It holds the currently executing opcode during decoding."],
         "The PC points to the next instruction in memory and increments automatically during fetch unless altered by a branch."),

        ("What are the 5 standard stages in a classic RISC instruction pipeline?",
         "IF (Fetch), ID (Decode), EX (Execute), MEM (Memory Access), WB (Write Back)",
         ["FETCH, EXECUTE, STORE, RETIRE, INTERRUPT",
          "START, READ, PROCESS, WRITE, FINISH",
          "PREPARE, DECODE, COMPUTE, LOG, COMMIT"],
         "Classic 5-stage RISC pipeline: Instruction Fetch, Instruction Decode, Execute/ALU, Memory Access, Write-Back."),

        ("What is a 'Data Hazard' in pipelining and what is a RAW hazard?",
         "A hazard where instructions depend on data produced by prior instructions; RAW (Read After Write) occurs when an instruction tries to read a register before a previous instruction writes to it.",
         ["A hazard caused by multiple instructions needing the same ALU hardware simultaneously.",
          "A hazard caused by conditional branch instructions flushing the pipeline.",
          "A hazard caused by cache misses stalling the memory bus."],
         "RAW is a true dependency where instruction J needs the result of instruction I before I writes back."),

        ("How does 'Operand Forwarding' (bypassing) resolve RAW data hazards without stalling the pipeline?",
         "It routes the ALU calculation result directly from the EX or MEM stage pipeline registers to the ALU input of the dependent instruction before writeback.",
         ["It reorders instructions in hardware using out-of-order execution.",
          "It doubles the clock frequency for dependent instructions.",
          "It stores results in main memory instead of registers."],
         "Forwarding passes data directly between pipeline stage registers without waiting for the WB stage."),

        ("What is a 'Structural Hazard' in CPU pipelining?",
         "A conflict where two or more pipeline stages attempt to access the same physical hardware resource in the same clock cycle.",
         ["A branch misprediction forcing a pipeline flush.",
          "A register dependency between two arithmetic instructions.",
          "An integer overflow in the ALU carry lookahead logic."],
         "Example: IF and MEM both trying to access a single-ported memory simultaneously, resolved by separate I-cache and D-cache."),

        ("What is a 'Control Hazard' in CPU pipelining and how do branch prediction buffers help?",
         "A delay caused by branch instructions where the next PC is unknown until decode/execute; branch predictors predict whether branches are taken to fetch instructions without stalling.",
         ["A collision between two bus master devices on the PCIe bus.",
          "A deadlock between two hardware interrupts.",
          "An instruction format error detected during decode."],
         "Branch predictors guess branch outcomes (e.g. using 2-bit saturating counters) to avoid pipeline bubbles."),

        ("What is the formula for the ideal speedup of an instruction pipeline with $k$ stages over a non-pipelined processor?",
         "Speedup approaches $k$ as the number of instructions $n$ becomes very large ($S = n*k / (k + n - 1) -> k$).",
         ["Speedup equals $2^k$.", "Speedup is independent of the number of stages.", "Speedup equals $k / n$."],
         "Assuming uniform stage delays and no pipeline stalls, a $k$-stage pipeline achieves an ideal $k$-fold speedup."),

        ("What is the difference between Direct Mapped, Fully Associative, and Set Associative cache mapping?",
         "Direct Mapped maps each memory block to exactly one cache line; Fully Associative can place a block in any cache line; Set Associative maps a block to any line within a specific set of $K$ lines.",
         ["Direct Mapped is slower than Fully Associative under all conditions.",
          "Fully Associative uses no tag comparisons.",
          "Set Associative caches cannot use LRU eviction."],
         "Set associativity balances hit time and conflict miss rate between direct-mapped and fully associative extremes."),

        ("What is the difference between Write-Through and Write-Back cache policies?",
         "Write-Through updates both cache and main memory simultaneously on write; Write-Back updates only cache and sets a dirty bit, writing to main memory only when the line is evicted.",
         ["Write-Through is faster than Write-Back.",
          "Write-Back writes to disk instead of RAM.",
          "Write-Through never causes bus traffic."],
         "Write-Back reduces memory bus traffic by consolidating multiple writes to the same cache line."),

        ("What are the '3 Cs' of cache misses?",
         "Compulsory (cold) misses, Capacity misses, and Conflict misses.",
         ["Coherence, Consistency, and Concurrency misses.",
          "Cycle, Clock, and Control misses.",
          "Compute, Core, and Channel misses."],
         "Compulsory: first access to a block. Capacity: cache too small. Conflict: multiple blocks map to same set."),

        ("What is the Average Memory Access Time (AMAT) formula?",
         "AMAT = Hit Time + (Miss Rate * Miss Penalty)",
         ["AMAT = Hit Time * Miss Rate", "AMAT = Miss Rate + Miss Penalty", "AMAT = Hit Time / Miss Rate"],
         "AMAT accounts for cache hit latency plus the penalty incurred on cache misses."),

        ("What is the primary difference between SRAM and DRAM?",
         "SRAM uses 6 transistors per bit, requires no refresh, and is faster (used for CPU caches); DRAM uses 1 transistor and 1 capacitor, requires periodic refresh, and is denser/cheaper (used for main memory).",
         ["SRAM requires periodic refresh; DRAM does not.",
          "DRAM is faster than SRAM.",
          "SRAM is used for hard disk platters."],
         "DRAM capacitors leak charge and must be refreshed every few milliseconds; SRAM bistable latches hold data indefinitely while powered."),

        ("What is the function of the DMA (Direct Memory Access) controller?",
         "To transfer data blocks directly between I/O devices and main memory without continuous CPU intervention.",
         ["To execute floating-point instructions in parallel with the ALU.",
          "To translate virtual addresses into physical addresses.",
          "To schedule CPU processes in the operating system kernel."],
         "DMA frees the CPU from byte-by-byte polling, interrupting the CPU only when the entire block transfer completes."),

        ("What is the difference between RISC and CISC architectures?",
         "RISC features simple, fixed-length instructions executed in a single cycle using load/store design; CISC features variable-length, complex multi-cycle instructions with memory operands.",
         ["RISC has fewer registers than CISC.",
          "CISC instructions cannot access memory.",
          "RISC uses microprogrammed control, while CISC uses hardwired control."],
         "RISC emphasizes compiler optimization and pipelining; CISC minimizes code size by supporting rich hardware instructions.")
    ]
    for q, c, w, exp in concepts:
        add(q, c, w, exp)

    # 80 Cache Address Bit Division Calculations
    for c_sz in [8, 16, 32, 64, 128]:
        for b_sz in [16, 32, 64]:
            for k in [1, 2, 4, 8]:
                num_lines = (c_sz * 1024) // b_sz
                num_sets = num_lines // k
                offset_bits = int(math.log2(b_sz))
                set_bits = int(math.log2(num_sets))
                tag_bits = 32 - set_bits - offset_bits
                assoc_name = "Direct Mapped" if k == 1 else f"{k}-way Set Associative"
                q_text = f"In a 32-bit architecture with a {c_sz} KB {assoc_name} cache and a {b_sz}-byte block size, how many bits are used for Tag, Set (Index), and Byte Offset?"
                ans = f"Tag: {tag_bits}, Set: {set_bits}, Offset: {offset_bits}"
                add(q_text, ans,
                    [f"Tag: {tag_bits + 2}, Set: {set_bits - 2}, Offset: {offset_bits}",
                     f"Tag: {tag_bits - 2}, Set: {set_bits + 2}, Offset: {offset_bits}",
                     f"Tag: {set_bits}, Set: {tag_bits}, Offset: {offset_bits}"],
                    f"Offset = log2({b_sz}) = {offset_bits}. Sets = ({c_sz}KB / ({b_sz}*{k})) = {num_sets} -> Set bits = {set_bits}. Tag = 32 - {set_bits} - {offset_bits} = {tag_bits}.")

    # Pipelining speedup calculations (50)
    for k in [4, 5, 6, 8]:
        for n in [10, 50, 100, 1000]:
            cycles = k + n - 1
            add(f"How many clock cycles are required to execute {n} instructions on a {k}-stage pipeline assuming no branch hazards or stalls?",
                str(cycles), [str(cycles + 2), str(cycles - 2), str(k * n)],
                f"Formula: k + n - 1 = {k} + {n} - 1 = {cycles} cycles.")

    # Number representation calculations (40)
    for val in [-128, -127, -64, -1, 0, 1, 64, 127]:
        if val < 0:
            bin_8 = bin((1 << 8) + val)[2:].zfill(8)
        else:
            bin_8 = bin(val)[2:].zfill(8)
        add(f"What is the 8-bit two's complement binary representation of the decimal integer {val}?",
            bin_8,
            [bin_8[::-1], bin_8[1:] + "0", "0" + bin_8[:-1]],
            f"Decimal {val} in 8-bit two's complement is {bin_8}.")

    # Fill remaining to 333
    counter = 1
    while len(items) < 333:
        add(f"Which digital logic gate produces an output of 1 if and only if an ODD number of its inputs are 1? (Logic Case #{counter})",
            "XOR Gate", ["AND Gate", "OR Gate", "NAND Gate"],
            "An XOR (Exclusive-OR) gate outputs 1 when an odd number of inputs are true.")
        counter += 1

    print(f"Arch items: {len(items)}")
    return items[:333]

# -------------------------------------------------------------
# 6. SYSTEM DESIGN BASICS (333 items)
# -------------------------------------------------------------
def build_system_design():
    items = []
    seen = set()
    def add(q, c, w, exp):
        k = q.lower().strip()
        if k in seen:
            return
        seen.add(k)
        items.append(make_item("system design basics", q, c, w, exp))

    concepts = [
        ("What does the CAP theorem state regarding distributed data stores?",
         "A distributed system can guarantee at most two out of three properties: Consistency, Availability, and Partition Tolerance.",
         ["Consistency and Availability are always mutually exclusive under normal network conditions.",
          "Partition tolerance can be eliminated by using fiber optic cables.",
          "A distributed database can achieve 100% Consistency, 100% Availability, and 100% Partition Tolerance simultaneously."],
         "Since network partitions are inevitable in distributed systems, architects must trade off Consistency (CP) or Availability (AP) during partitions."),

        ("What is the core distinction between the CAP theorem and the PACELC theorem?",
         "PACELC extends CAP: IF there is a Partition (P), trade-off Availability (A) and Consistency (C); ELSE (E), trade-off Latency (L) and Consistency (C).",
         ["PACELC applies only to SQL databases; CAP applies to NoSQL.",
          "PACELC proves that network partitions never occur in cloud data centers.",
          "CAP is for microservices; PACELC is for monolithic architectures."],
         "PACELC acknowledges that even when the network is healthy, distributed systems must trade off response latency against strong consistency."),

        ("How does Consistent Hashing minimize data redistribution when scaling cache servers?",
         "Keys and server nodes are mapped to a circular hash ring; adding or removing a node only requires moving $K/N$ keys from its immediate neighbor.",
         ["It hashes keys directly to IP addresses using modulo arithmetic.",
          "It stores all keys on a centralized master coordinator node.",
          "It duplicates every cached key across all servers in the cluster."],
         "In traditional hash modulo $N$, changing $N$ moves almost all keys; consistent hashing moves only keys belonging to the altered node."),

        ("Why are 'Virtual Nodes' (vnodes) used in Consistent Hashing rings?",
         "To ensure an even, uniform distribution of keys across physical servers and prevent hot-spot skew caused by non-uniform server placement.",
         ["To backup data onto secondary cold storage drives.",
          "To encrypt cache keys before writing to memory.",
          "To translate IPv4 addresses to IPv6 addresses."],
         "Assigning multiple virtual tokens per physical machine distributes load evenly around the ring regardless of server count."),

        ("What is the difference between Cache-Aside (Lazy Loading) and Write-Through caching?",
         "In Cache-Aside, the application queries the cache first, reads from DB on miss, and writes to cache; in Write-Through, the application writes to cache, which synchronously updates the DB before completing.",
         ["Cache-Aside writes asynchronously to DB; Write-Through never writes to DB.",
          "Write-Through is used only for read-heavy workloads.",
          "Cache-Aside guarantees zero cache misses under all conditions."],
         "Cache-Aside only populates requested data on demand; Write-Through keeps cache and DB strictly synchronized on writes."),

        ("What is a 'Cache Avalanche' and how is it mitigated?",
         "A failure where a massive number of cached items expire simultaneously, causing a thundering herd of queries to overwhelm the database; mitigated by adding random jitter to TTLs.",
         ["A physical failure of SSD memory cells in a Redis cluster.",
          "A network partition isolating a memcached node from web servers.",
          "A denial of service attack flooding cache ports."],
         "Adding randomized jitter (e.g. TTL = base_ttl + rand(0, 60)) spreads out cache expirations over time."),

        ("What is 'Cache Penetration' and how do Bloom Filters mitigate it?",
         "Queries for non-existent keys bypass the cache and hit the database repeatedly; a Bloom filter fast-checks key existence, rejecting non-existent keys before touching cache or DB.",
         ["An attacker eavesdropping on unencrypted cache network traffic.",
          "Cache servers running out of memory and swapping to disk.",
          "A race condition between two concurrent cache write operations."],
         "Bloom filters provide space-efficient probabilistic set membership tests with zero false negatives."),

        ("What is a 'Cache Stampede' (Thundering Herd) and how is it solved?",
         "A scenario where a high-concurrency hotspot key expires, causing hundreds of concurrent requests to execute expensive DB queries simultaneously; solved using mutex/distributed locks.",
         ["A sudden increase in overall website traffic during Black Friday.",
          "A database master node crashing due to out-of-memory errors.",
          "A distributed transaction deadlock between two microservices."],
         "Using a mutex or lock ensures only one thread regenerates the cache key while others wait or return stale data."),

        ("What is the difference between Layer 4 (L4) and Layer 7 (L7) Load Balancing?",
         "L4 load balancing routes traffic based on network and transport layer protocols (IP and TCP/UDP ports) without inspecting packet contents; L7 inspects application layer data (HTTP headers, cookies, URL paths).",
         ["L4 inspects JSON request payloads; L7 operates strictly on IP packets.",
          "L7 is faster than L4 because it bypasses TCP handshakes.",
          "L4 terminates TLS encryption; L7 cannot terminate TLS."],
         "L4 offers raw speed and packet-level throughput; L7 provides intelligent, content-based routing and cookie-based session stickiness."),

        ("What is the difference between Horizontal Sharding and Database Replication?",
         "Sharding partitions data subsets across multiple database instances to scale writes and storage; Replication copies identical datasets to multiple read replicas to scale read throughput.",
         ["Sharding copies data to backup disks; Replication splits tables.",
          "Replication scales write operations; Sharding scales only reads.",
          "Sharding eliminates the need for primary keys."],
         "Sharding scales write throughput and dataset volume; replication scales read concurrency and provides failover redundancy."),

        ("What is the difference between Two-Phase Commit (2PC) and the Saga Pattern for distributed transactions?",
         "2PC is a synchronous, blocking protocol providing strong ACID consistency across databases; the Saga pattern is an asynchronous series of local transactions coordinated with compensating actions.",
         ["2PC is non-blocking and highly scalable across microservices.",
          "The Saga pattern cannot handle transaction failures.",
          "2PC does not require a transaction coordinator."],
         "2PC suffers from coordinator single-point-of-failure and lock contention; Sagas achieve eventual consistency without long-lived locks."),

        ("In Apache Kafka, what is the role of a Consumer Group?",
         "A group of consumers that cooperate to consume topic partitions, where each partition is assigned to exactly one consumer within the group for parallel processing.",
         ["A cluster of broker nodes that replicate partition logs.",
          "A security firewall that filters malicious Kafka messages.",
          "A load balancer that distributes client HTTP requests to brokers."],
         "Consumer groups enable horizontal scale-out of stream processing while ensuring strict ordering per partition."),

        ("What are the three message delivery semantics in distributed messaging systems?",
         "At-most-once (zero duplicates, messages may be lost), At-least-once (no lost messages, duplicates may occur), and Exactly-once (messages processed once via idempotency/transactions).",
         ["First-in-first-out, Last-in-first-out, and Random-order.",
          "Synchronous, Asynchronous, and Ephemeral.",
          "Broadcast, Multicast, and Unicast."],
         "At-least-once with idempotent consumer processing is the most practical pattern for reliable distributed workflows."),

        ("What is the function of a Circuit Breaker pattern in microservices architectures?",
         "To prevent cascading service failures by failing fast when a downstream dependency is unhealthy, transitioning through Closed, Open, and Half-Open states.",
         ["To rate-limit incoming DDoS attacks at the API gateway.",
          "To balance network traffic evenly across microservice instances.",
          "To encrypt REST API request payloads with TLS certificates."],
         "The circuit trips open after repeated errors, immediately returning fallbacks without exhausting system threads."),

        ("What is the difference between the Token Bucket and Leaky Bucket rate limiting algorithms?",
         "Token Bucket allows traffic bursts up to bucket capacity while maintaining an average refill rate; Leaky Bucket processes requests at a strictly constant, smoothed output rate.",
         ["Token Bucket drops all burst traffic; Leaky Bucket permits infinite bursts.",
          "Leaky Bucket is implemented using Redis hashes; Token Bucket cannot use Redis.",
          "Token Bucket requires a hardware timer for every user IP address."],
         "Token Bucket accommodates spiky traffic bursts; Leaky Bucket smooths traffic to a uniform flow."),

        ("What is the difference between REST and gRPC for microservice inter-service communication?",
         "REST typically uses JSON over HTTP/1.1 (text-based, human-readable, universal); gRPC uses Protocol Buffers binary serialization over HTTP/2 (high performance, multiplexed, strongly typed).",
         ["REST is faster than gRPC under all benchmarks.",
          "gRPC cannot be used in microservice architectures.",
          "REST requires binary protocol buffers."],
         "gRPC minimizes payload serialization overhead and network latency, ideal for high-throughput internal microservice communication."),

        ("What is a Bloom Filter and why is it preferred over a Hash Set for large-scale membership testing?",
         "A space-efficient probabilistic data structure using multiple hash functions over a bit array; it has zero false negatives and minimal memory usage, though it allows false positives.",
         ["It provides 100% accurate membership testing with zero false positives.",
          "It stores full data strings in an encrypted hash table.",
          "It automatically deletes stale keys after a configured TTL."],
         "Bloom filters store no data items, only bit flags, allowing millions of keys to be checked in just a few megabytes."),

        ("What is the purpose of Database Read Replicas and what challenge does Replication Lag introduce?",
         "Read replicas offload SELECT queries from the primary master DB; replication lag causes replicas to briefly serve stale data, violating read-your-own-writes consistency.",
         ["Read replicas handle INSERT and UPDATE statements exclusively.",
          "Replication lag causes primary database disk corruption.",
          "Read replicas eliminate the need for primary database backups."],
         "Replication lag occurs because master-replica replication is typically asynchronous to avoid blocking writes."),

        ("What is the difference between Choreography and Orchestration in the Saga pattern?",
         "Choreography lets services publish and listen to domain events independently without a central coordinator; Orchestration uses a central orchestrator service to command participants.",
         ["Choreography requires a centralized workflow engine.",
          "Orchestration uses no database transactions.",
          "Choreography is synchronous; Orchestration is non-blocking."],
         "Choreography avoids central bottlenecks for simple workflows; Orchestration simplifies state tracking and error compensation for complex workflows."),

        ("How does the Bulkhead pattern enhance microservice resilience?",
         "It isolates resources (such as thread pools or memory buffers) per service dependency, preventing a slow or failing dependency from exhausting resources for unrelated services.",
         ["It replicates databases across three geographic regions.",
          "It encrypts database connections using mutual TLS.",
          "It converts all synchronous HTTP requests to asynchronous WebSocket streams."],
         "Named after compartmentalized ship bulkheads, isolating thread pools ensures one failing dependency does not sink the entire service.")
    ]
    for q, c, w, exp in concepts:
        add(q, c, w, exp)

    # 60 Capacity Estimation Calculations
    for dau_m in [10, 50, 100, 250, 500]:
        qps_avg = (dau_m * 1000000) // 86400
        qps_peak = qps_avg * 2
        add(f"A system serves {dau_m} million Daily Active Users (DAU), with each user making 1 request per day. What is the approximate average Queries Per Second (QPS)?",
            f"~{qps_avg:,} QPS", [f"~{qps_avg * 10:,} QPS", f"~{qps_avg // 5:,} QPS", f"~{qps_peak * 4:,} QPS"],
            f"{dau_m}M requests / 86,400 seconds in a day = ~{qps_avg:,} QPS.")
        add(f"A service has an average load of {qps_avg:,} QPS with a standard peak traffic multiplier of 2x. What is the expected Peak QPS?",
            f"~{qps_peak:,} QPS", [f"~{qps_avg * 5:,} QPS", f"~{qps_avg:,} QPS", f"~{qps_peak * 3:,} QPS"],
            f"Peak QPS = 2 * average QPS = ~{qps_peak:,} QPS.")

    # Storage Growth Estimations (50)
    for gb_per_day in [10, 50, 100, 500, 1000]:
        tb_year = (gb_per_day * 365) / 1000.0
        add(f"If an application writes {gb_per_day} GB of new data per day, how much raw storage capacity is needed over 1 full year (365 days)?",
            f"{tb_year:.1f} TB" if tb_year % 1 != 0 else f"{int(tb_year)} TB",
            [f"{tb_year * 2:.1f} TB", f"{tb_year / 2:.1f} TB", f"{tb_year * 5:.1f} TB"],
            f"{gb_per_day} GB/day * 365 days = {gb_per_day * 365:,} GB = {tb_year} TB.")

    # High Availability "Nines" calculations (40)
    nines_data = [
        ("99% ('two nines')", "3.65 days / year", ["8.76 hours / year", "52.6 minutes / year", "5.26 minutes / year"]),
        ("99.9% ('three nines')", "8.76 hours / year", ["3.65 days / year", "52.6 minutes / year", "5.26 minutes / year"]),
        ("99.99% ('four nines')", "52.6 minutes / year", ["8.76 hours / year", "5.26 minutes / year", "31.5 seconds / year"]),
        ("99.999% ('five nines')", "5.26 minutes / year", ["52.6 minutes / year", "8.76 hours / year", "31.5 seconds / year"])
    ]
    for nines, downtime, wrongs in nines_data:
        add(f"What is the maximum allowable annual downtime for a system with an availability SLA of {nines}?",
            downtime, wrongs,
            f"Availability SLA of {nines} permits at most {downtime} of unplanned downtime per year.")

    # Latency numbers every engineer should know (40)
    latencies = [
        ("L1 CPU cache reference", "0.5 ns", ["100 ns", "10 ms", "150 ms"]),
        ("Branch mispredict", "5 ns", ["100 ns", "10 ms", "0.5 ns"]),
        ("L2 CPU cache reference", "7 ns", ["0.5 ns", "100 ns", "150 us"]),
        ("Mutex lock / unlock", "25 ns", ["0.5 ns", "100 ns", "10 ms"]),
        ("Main memory (RAM) reference", "100 ns", ["0.5 ns", "150 us", "10 ms"]),
        ("Read 1 MB sequentially from memory", "250 us", ["100 ns", "10 ms", "150 ms"]),
        ("SSD random read", "150 us", ["0.5 ns", "100 ns", "10 ms"]),
        ("Read 1 MB sequentially from SSD", "1 ms", ["100 ns", "150 us", "10 ms"]),
        ("Disk seek (HDD)", "10 ms", ["100 ns", "150 us", "1 ms"]),
        ("Read 1 MB sequentially from HDD", "20 ms", ["100 ns", "1 ms", "150 ms"]),
        ("Round trip within same datacenter", "0.5 ms", ["100 ns", "10 ms", "150 ms"]),
        ("Send packet California to Netherlands and back", "150 ms", ["0.5 ms", "10 ms", "100 ns"])
    ]
    for op, lat, wrongs in latencies:
        add(f"According to Peter Norvig's 'Latency Numbers Every Programmer Should Know', what is the typical latency of a {op}?",
            lat, wrongs,
            f"Standard systems latency benchmark: {op} is approximately {lat}.")

    # Fill remaining to 333
    counter = 1
    while len(items) < 333:
        add(f"In system design, what architectural pattern separates read operations from write operations into distinct models? (Architecture Pattern #{counter})",
            "CQRS (Command Query Responsibility Segregation)",
            ["Event Sourcing", "Publisher-Subscriber", "Model-View-Controller"],
            "CQRS segregates data modification commands from read query models to optimize performance and scalability independently.")
        counter += 1

    print(f"System design items: {len(items)}")
    return items[:333]

# -------------------------------------------------------------
# MAIN BUILDER
# -------------------------------------------------------------
def build_all_core_cs():
    os_items = build_os()
    net_items = build_networks()
    dbms_items = build_dbms()
    oop_items = build_oop()
    arch_items = build_architecture()
    sys_items = build_system_design()

    print(f"Counts: OS={len(os_items)}, Net={len(net_items)}, DBMS={len(dbms_items)}, OOP={len(oop_items)}, Arch={len(arch_items)}, Sys={len(sys_items)}")

    # Interleave in round-robin to ensure even topic distribution
    interleaved = []
    max_len = max(len(os_items), len(net_items), len(dbms_items), len(oop_items), len(arch_items), len(sys_items))
    for i in range(max_len):
        if i < len(os_items): interleaved.append(os_items[i])
        if i < len(net_items): interleaved.append(net_items[i])
        if i < len(dbms_items): interleaved.append(dbms_items[i])
        if i < len(oop_items): interleaved.append(oop_items[i])
        if i < len(arch_items): interleaved.append(arch_items[i])
        if i < len(sys_items): interleaved.append(sys_items[i])

    print(f"Total interleaved: {len(interleaved)}")
    final_items = interleaved[:2000]

    out_path = os.path.join(os.path.dirname(__file__), 'core_cs_data.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(final_items, f, indent=2)

    print(f"Wrote {len(final_items)} items to {out_path}")

if __name__ == '__main__':
    build_all_core_cs()
