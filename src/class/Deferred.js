class Deferred {
  constructor () {
    this._resolve = null;
    this._reject = null;
    this.promise = null;
    this.status = 'initial';
    this._setPromise();
  }

  _setPromise () {
    this.status = 'pendding';
    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    })
  }

  resolve (value) {
    this.status = 'fulfilled';
    this._resolve(value);
  }

  reject (reason) {
    this.status = 'rejected';
    this._reject(reason);
  }

  reset () {
    this._setPromise();
  }

  then (fn) {
    if (this.promise !== null && (this.status === 'pendding' || this.status === 'initial' )) {
      this.promise.then(fn, (data) => {})
    }
    return this
  }

  catch (fn) {
    if (this.promise !== null && (this.status === 'pendding' || this.status === 'initial' )) {
      this.promise.catch(fn)
    }
    return this
  }
}

export default Deferred;
