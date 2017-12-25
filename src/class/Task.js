import Deferred from "./Deferred";

class Task {
  constructor () {
    this.dfd = new Deferred();
    this.continue = null;
  }

  /**
   * resolveする
   * @param data
   */
  reject (data) {
    this.dfd.reject(data);
  }

  /**
   * rejectする
   * @param data
   */
  resolve (data) {
    this.dfd.resolve(data);
  }
}

export default Task;
