module.exports = promisify = (fn, ...params) =>
new Promise((resolve, reject) =>
    fn(...params, (err, res) => {
        if (err) {
            reject(err);
        } else {
            resolve(res);
        }
    })
);
