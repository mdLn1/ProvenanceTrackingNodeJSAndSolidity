module.exports = class CustomError extends Error {
    constructor(message, statusCode = 0) {
        super(message);
        if(statusCode)
            this.statusCode = statusCode;
    }
}