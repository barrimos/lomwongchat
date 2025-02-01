class ProcessingQueue {
    private queue: (() => Promise<void>)[] = []
    private isProcessing: boolean = false

    // Method to add a task to the queue
    public addQueue(task: any): void {
        this.queue.push(task)
        // after first added first task
        // first task will processing and block all tasks come after
        // and adding them to queue
        // in process queue will dequeue automatic
        if (!this.isProcessing) this.processQueue()
    }

    // Method to process the queue
    public async processQueue(): Promise<void> {
        if (this.isProcessing) return

        this.isProcessing = true
        while (this.queue.length > 0) {
            const task = this.queue.shift() // Remove the first task
            if (task) {
                await task() // Process the task
            }
        }
        this.isProcessing = false
    }
}

export default ProcessingQueue
