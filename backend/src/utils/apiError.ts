export class ApiError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const notFound = (message: string) => new ApiError(404, message);
export const badRequest = (message: string) => new ApiError(400, message);
