// Utility for custom error responses
export class APIError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.status = status;
    }
}