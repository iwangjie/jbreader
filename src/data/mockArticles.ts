export interface MockArticle {
  id: string;
  title: string;
  category: string;
  author: string;
  avatar: string;
  date: string;
  readTime: string;
  excerpt: string;
  content: string; // HTML formatted body
}

export const MOCK_ARTICLES: MockArticle[] = [
  {
    id: "react-server-components",
    title: "Advanced Patterns for React Server Components (RSC) in Large-Scale Apps",
    category: "React / Frontend",
    author: "Danielle Abrams",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    date: "June 24, 2026",
    readTime: "9 min read",
    excerpt: "Learn how to optimize bundle sizes, orchestrate data fetching across server-client boundaries, and avoid common waterfall rendering pitfalls in Next.js 15 apps.",
    content: `
      <p>React Server Components (RSC) represent a paradigm shift in how we build React applications. By shifting component rendering to the server, we can significantly reduce the JavaScript bundle size shipped to the client, leading to faster page loads and improved Core Web Vitals.</p>
      
      <h2>1. The Client-Server Component Boundary</h2>
      <p>A common point of confusion is how data flows across the client-server boundary. Server components can import and render client components, but not vice-versa. When a client component needs to render a server component, it must do so via the <code>children</code> prop or another render prop.</p>
      
      <pre><code class="language-tsx">// Good: Server component passing a Server Component as children to a Client Component
import ClientWrapper from './ClientWrapper';
import ServerContent from './ServerContent';

export default function Page() {
  return (
    &lt;ClientWrapper&gt;
      &lt;ServerContent /&gt;
    &lt;/ClientWrapper&gt;
  );
}</code></pre>

      <h2>2. Eliminating Rendering Waterfalls</h2>
      <p>Data fetching in nested server components can easily lead to rendering waterfalls if you do not orchestrate requests correctly. Consider the following example where fetching <code>ProfileDetails</code> waits for <code>ProfileHeader</code> to finish:</p>
      
      <blockquote>
        <strong>Performance Warning:</strong> Avoid await statements sequentially in separate nested components unless the second query depends on the result of the first.
      </blockquote>

      <p>Instead, use parallel data fetching. You can fire requests in parallel by initiating them at the page level using <code>Promise.all</code>, or by streaming content using Suspense boundaries:</p>

      <pre><code class="language-typescript">// Parallel fetch pattern
export default async function ProfilePage() {
  // Initiate fetches in parallel
  const userDataPromise = getUserData();
  const postsDataPromise = getPostsData();

  // Wait for both to resolve
  const [user, posts] = await Promise.all([userDataPromise, postsDataPromise]);
  
  return (
    &lt;div&gt;
      &lt;UserHeader user={user} /&gt;
      &lt;UserPosts posts={posts} /&gt;
    &lt;/div&gt;
  );
}</code></pre>

      <h2>3. Sharing State Across Components</h2>
      <p>Because Server Components don't maintain state, you cannot use traditional React Context or custom hook state managers. Instead, prefer URL search parameters for shared UI states, or let data fetching cache automatically at the network layer using Fetch API deduplication.</p>
      <p>By leveraging native platform APIs, we build resilient architectures that work even in low-bandwidth settings, maintaining high interactive performance.</p>
    `
  },
  {
    id: "rust-rewrite-analytics",
    title: "Why We Rewrote Our Core Analytics Engine in Rust",
    category: "Rust / System Design",
    author: "Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    date: "May 18, 2026",
    readTime: "12 min read",
    excerpt: "How replacing our memory-intensive Node.js stream processor with a concurrent Rust implementation cut our infrastructure costs by 73% and solved GC pause spikes.",
    content: `
      <p>At scale, memory footprint and runtime pauses become critical bottlenecks. Our real-time analytics engine was processing 150,000 events/second using a Node.js cluster. However, garbage collection (GC) sweeps were causing sporadic 300ms latency spikes, resulting in dropped socket connections.</p>
      
      <h2>1. The Bottleneck of Garbage Collection</h2>
      <p>In high-throughput event processing, object allocation rates are extremely high. In V8 (Node.js), this triggers frequent "Stop-the-World" scavenges and full GC cycles. Even with extensive optimization and object pooling, we couldn't eliminate these latency spikes completely.</p>
      
      <p>Rust's compile-time ownership model eliminates the runtime garbage collector entirely. Memory is reclaimed immediately when variables go out of scope, providing extremely predictable latency curves.</p>

      <h2>2. Leveraging Rayon for Concurrency</h2>
      <p>In our Rust rewrite, we utilized the <code>rayon</code> crate to distribute CPU-intensive aggregation pipelines across available CPU cores. Rayon implements work-stealing algorithms that optimize thread pool efficiency with minimal boilerplate code.</p>

      <pre><code class="language-rust">// Parallel iteration over event batches
use rayon::prelude::*;

fn process_events_parallel(events: &[Event]) -> AggregatedReport {
    events.par_iter()
        .filter(|e| e.is_valid())
        .map(|e| aggregate_event(e))
        .reduce(AggregatedReport::new, |mut acc, report| {
            acc.merge(report);
            acc
        })
}</code></pre>

      <h2>3. Benchmarks & Results</h2>
      <p>After migrating the core pipeline to production, we observed the following performance shifts:</p>
      <ul>
        <li><strong>CPU Utilization:</strong> Decreased by 45% due to optimized native execution.</li>
        <li><strong>Memory Footprint:</strong> Dropped from average 4.2GB per pod to a static 180MB.</li>
        <li><strong>P99 Latency:</strong> Flattened from 320ms to a steady 12ms.</li>
      </ul>
      <p>This efficiency allowed us to scale down our Kubernetes node groups, translating directly to a 73% decrease in monthly cloud infrastructure spend.</p>
    `
  },
  {
    id: "go-gc-allocation",
    title: "Deep Dive: Memory Allocation and GC Tuning in Go 1.26",
    category: "Go / Backend",
    author: "Yuki Tanaka",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    date: "April 02, 2026",
    readTime: "8 min read",
    excerpt: "An in-depth exploration of the Go memory allocator (mcache, mcentral, mheap) and how to configure GOGC and GOMEMLIMIT to achieve optimal memory utilization.",
    content: `
      <p>Go's runtime allocator is highly inspired by TCMalloc (Thread-Caching Malloc). While it shields developers from manual allocation, understanding stack vs. heap allocation is crucial for high-performance service optimization.</p>

      <h2>1. Stack vs. Heap: Escape Analysis</h2>
      <p>The Go compiler automatically performs escape analysis to decide whether a variable can be allocated on the stack (which is cheap and fast) or must escape to the heap (which requires GC tracking). If a pointer is returned from a function, it escapes:</p>

      <pre><code class="language-go">// Escapes to heap: returned pointer
func NewUser(name string) *User {
    u := User{Name: name}
    return &u // escapes to heap
}

// Stays on stack: value copy
func CreateUser(name string) User {
    u := User{Name: name}
    return u // remains on stack (copied)
}</code></pre>

      <h2>2. Understanding GOMEMLIMIT</h2>
      <p>Introduced in Go 1.19, <code>GOMEMLIMIT</code> provides a soft limit on the total memory the Go runtime can use. This is particularly helpful in containerized environments (like Docker or Kubernetes cgroups) to prevent Out-Of-Memory (OOM) kills.</p>
      
      <p>When the heap usage approaches <code>GOMEMLIMIT</code>, the GC will trigger more aggressively to keep memory under the limit. If memory cannot be freed, the runtime will prioritize maintaining the limit even if GC runs constantly, up to a threshold of CPU time limit to avoid GC thrashing.</p>

      <h2>3. Best Practices for Heap Optimization</h2>
      <ol>
        <li>Use <code>sync.Pool</code> to reuse large arrays or structs (like JSON encoder buffers).</li>
        <li>Pre-allocate slices and maps using <code>make([]T, 0, capacity)</code> when the size is known beforehand.</li>
        <li>Run benchmark profiles with <code>go test -bench . -memprofile mem.out</code> and analyze with <code>pprof</code>.</li>
      </ol>
    `
  },
  {
    id: "kafka-nestjs-microservices",
    title: "Implementing Event-Driven Microservices with Apache Kafka and NestJS",
    category: "Microservices / Architecture",
    author: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    date: "March 15, 2026",
    readTime: "10 min read",
    excerpt: "Step-by-step tutorial on building resilient, loosely-coupled microservices using Kafka message brokers and NestJS microservice controllers, handling message retries and DLQs.",
    content: `
      <p>Event-driven microservices decouple system components, allowing independent scaling and fault tolerance. In this guide, we will walk through setting up NestJS microservices communicating via Apache Kafka.</p>

      <h2>1. Architecture Overview</h2>
      <p>We will construct an Order Service that produces <code>order.created</code> events, which are consumed by an Inventory Service to adjust stock levels, and a Notification Service to alert the customer.</p>

      <h2>2. NestJS Kafka Client Setup</h2>
      <p>First, configure the Kafka transporter in the main application file:</p>

      <pre><code class="language-typescript">// NestJS Microservice transporter definition
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice&lt;MicroserviceOptions&gt;(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'inventory-consumer',
      },
    },
  });
  await app.listen();
}
bootstrap();</code></pre>

      <h2>3. Handling Events with Message Handlers</h2>
      <p>Inside the controller, use the <code>@EventPattern</code> decorator to subscribe to specific Kafka topics:</p>

      <pre><code class="language-typescript">import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class InventoryController {
  @EventPattern('order.created')
  async handleOrderCreated(@Payload() message: any) {
    const { orderId, items } = message.value;
    console.log(\`Received order \${orderId}. Deducting inventory...\`);
    await this.inventoryService.deductStock(items);
  }
}</code></pre>

      <h2>4. Implementing Retries and Dead Letter Queues (DLQ)</h2>
      <p>Network errors or database timeouts can cause event processing to fail. Instead of crashing, catch errors, retry with backoff, and eventually route failing payloads to a Dead Letter Queue (e.g., <code>order.created.dlq</code>) for manual inspection.</p>
    `
  }
];
