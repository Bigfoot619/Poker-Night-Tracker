export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (msg) => new ApiError(400, msg);
export const notFound = (msg) => new ApiError(404, msg);
export const conflict = (msg) => new ApiError(409, msg);
