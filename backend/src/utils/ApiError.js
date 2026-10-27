class ApiError extends Error {
  status;
  message;

  constructor(status, message) {
    super(message);
    this.status = status;
  }

}

export default ApiError;
