class ApiError extends Error {
  status;

  constructor(status, message) {
    super(message);
    this.status = status;
  }

}

export default ApiError;
