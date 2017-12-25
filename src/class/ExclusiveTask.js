/**
 * 排他タスクtaskを管理する
 */
class ExclusiveTask {
  constructor (options) {
    this.settings = Object.assign({
      continue_after_rejected: false // rejectをされた後、後のタスクを続行するか
    }, options);
    this.tasks = [];
  }

  /**
   * 管理taskを追加
   * @param task
   */
  push (task) {
    this.tasks.push(task);
  }

  /**
   * 管理taskを削除
   * @param task
   */
  drop (task) {
    this.tasks.splice(this._getIndex(task), 1);
  }

  /**
   * タスクが現在の先頭か返す
   * @param task
   * @returns {boolean}
   */
  isFirst (task) {
    return this._getIndex(task) === 0;
  }

  /**
   * すべてのタスクをresolveする
   * @param data
   */
  allResolve (data) {
    for (let i = 0; i < this.tasks.length; i++) {
      this.tasks[i].resolve(data);
    }
    this.reset();
  }

  /**
   * すべてのタスクをrejectする
   * @param data
   */
  allReject (data) {
    if (!this.settings.continue_after_rejected) {
      for (let i = 0; i < this.tasks.length; i++) {
        this.tasks[i].reject(data);
      }
    } else {
      // 続行フラグがある場合全タスクの続行処理をする
      for (let i = 0; i < this.tasks.length; i++) {
        if (typeof this.tasks[i] === 'function') {
          this.tasks[i].continue();
        }
      }
    }
    this.reset();
  }

  /**
   * 全タスク削除
   */
  reset () {
    this.tasks = [];
  }

  /**
   * タスクのインデックスを取得する
   * @param task
   * @returns {*}
   * @private
   */
  _getIndex (task) {
    for (let i = 0; i < this.tasks.length; i++) {
      if (this.tasks[i] === task) {
        return i;
      }
    }
    // taskが存在しない
    return false;
  }
}

export default ExclusiveTask;
