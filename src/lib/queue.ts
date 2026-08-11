export type JobType =
  | "SEND_EMAIL"
  | "SEND_WHATSAPP"
  | "GENERATE_PAYROLL_PDF"
  | "GENERATE_BANK_EXPORT"
  | "PROCESS_AI_MATCHING";

export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface JobOptions {
  maxAttempts?: number;
  priority?: number;
}

export interface Job<T = any> {
  id: string;
  type: JobType;
  payload: T;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  error?: string;
  result?: any;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export type JobHandler<T = any, R = any> = (payload: T) => Promise<R>;

class BackgroundQueue {
  private jobs = new Map<string, Job>();
  private handlers = new Map<JobType, JobHandler>();
  private activeWorkers = 0;
  private maxConcurrency = 3;
  private isProcessing = false;

  constructor() {
    // Start background processing loop
    if (typeof window === "undefined") {
      this.startProcessingLoop();
    }
  }

  /**
   * Register a handler for a job type
   */
  registerHandler<T, R>(type: JobType, handler: JobHandler<T, R>) {
    this.handlers.set(type, handler as JobHandler);
  }

  /**
   * Enqueue a new background job
   */
  enqueue<T>(type: JobType, payload: T, options: JobOptions = {}): Job<T> {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const job: Job<T> = {
      id,
      type,
      payload,
      status: "PENDING",
      attempts: 0,
      maxAttempts: options.maxAttempts ?? 3,
      createdAt: new Date(),
    };

    this.jobs.set(id, job as Job);

    // Limit memory footprint: keep maximum 1,000 completed/failed job records
    if (this.jobs.size > 1000) {
      const oldestJobId = this.findOldestCompletedJob();
      if (oldestJobId) this.jobs.delete(oldestJobId);
    }

    // Trigger queue processing asynchronously
    this.processQueue();

    return job;
  }

  /**
   * Get job by ID
   */
  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  /**
   * List jobs filtered by status
   */
  listJobs(status?: JobStatus): Job[] {
    const all = Array.from(this.jobs.values());
    if (!status) return all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return all.filter((j) => j.status === status).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get Queue Statistics
   */
  getStats() {
    const jobsArr = Array.from(this.jobs.values());
    return {
      total: jobsArr.length,
      pending: jobsArr.filter((j) => j.status === "PENDING").length,
      processing: jobsArr.filter((j) => j.status === "PROCESSING").length,
      completed: jobsArr.filter((j) => j.status === "COMPLETED").length,
      failed: jobsArr.filter((j) => j.status === "FAILED").length,
      activeWorkers: this.activeWorkers,
      maxConcurrency: this.maxConcurrency,
    };
  }

  /**
   * Retry a failed job
   */
  retryJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job || job.status !== "FAILED") return false;

    job.status = "PENDING";
    job.attempts = 0;
    job.error = undefined;
    this.processQueue();
    return true;
  }

  /**
   * Process pending queue items
   */
  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.activeWorkers < this.maxConcurrency) {
        const pendingJob = Array.from(this.jobs.values()).find((j) => j.status === "PENDING");
        if (!pendingJob) break;

        this.executeJob(pendingJob);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a single job
   */
  private async executeJob(job: Job) {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      job.status = "FAILED";
      job.error = `No handler registered for job type: ${job.type}`;
      return;
    }

    job.status = "PROCESSING";
    job.attempts += 1;
    job.startedAt = new Date();
    this.activeWorkers += 1;

    try {
      const result = await handler(job.payload);
      job.status = "COMPLETED";
      job.result = result;
      job.completedAt = new Date();
    } catch (err: any) {
      console.error(`[JobQueue Error] Job ${job.id} (${job.type}) failed:`, err);
      if (job.attempts < job.maxAttempts) {
        job.status = "PENDING";
        // Exponential backoff retry delay (1s, 2s, 4s)
        const delay = Math.pow(2, job.attempts) * 1000;
        setTimeout(() => this.processQueue(), delay);
      } else {
        job.status = "FAILED";
        job.error = err?.message || String(err);
        job.completedAt = new Date();
      }
    } finally {
      this.activeWorkers = Math.max(0, this.activeWorkers - 1);
      // Process next in queue
      this.processQueue();
    }
  }

  private startProcessingLoop() {
    setInterval(() => {
      this.processQueue();
    }, 3000);
  }

  private findOldestCompletedJob(): string | undefined {
    for (const [id, job] of this.jobs.entries()) {
      if (job.status === "COMPLETED" || job.status === "FAILED") {
        return id;
      }
    }
    return undefined;
  }
}

// Global Singleton Instance
const globalForQueue = globalThis as unknown as {
  jobQueue: BackgroundQueue | undefined;
};

export const jobQueue = globalForQueue.jobQueue ?? new BackgroundQueue();

if (process.env.NODE_ENV !== "production") {
  globalForQueue.jobQueue = jobQueue;
}

export default jobQueue;
