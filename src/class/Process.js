/**
 * タスク種類
 */
const TASK_TYPES = {
  TASK: 'TASK',
  ERROR: 'ERROR',
  COMPLETE: 'COMPLETE',
  ALWAYS: 'ALWAYS'
};

/**
 * プロセス管理クラス
 * task    : PromiseオブジェクトまたはDeferredオブジェクトを返す関数を設定 (引数:前taskの結果・エラー, 前taskが成功したか)
 * success : 前task成功時に実行 (引数:前taskの結果)
 * fail    : 前task失敗時に実行 (引数:前taskのエラー)
 * failStop: 前task失敗時に実行かつその後のtaskを止める (引数:前taskのエラー)
 * complete: 全task成功時に実行 (引数:全taskの結果配列)
 * always  : 全task後必ず実行 (引数:全taskの結果配列、全taskのエラー配列)
 * error   : 全task終了後failを一度でもすれば実行 (引数:全taskのエラー配列)
 * abort   : 処理中断
 * aborted : abortにより処理が中断した時に実行
 * exec    : 実行
 */
class Process {
  constructor () {
    // フラグ類
    this.has_error = false;
    this.stop = false;
    this.abort_flag = false;
    this.kill_flag = false;

    // 現在のtask
    this.current_index = 0;

    // リセット回数
    this.reset_count = 0;

    // 結果
    this.results = [];
    this.errors = [];
    this.task_statuses = [];

    // 関数名とtaskインデックス紐付け
    this.fn_name_index = {};

    // タスク・関数
    this.tasks = [];
    this.successes = [];
    this.fails = [];
    this.failStops = [];
    this.aborted_fn = null;
  }

  /**
   * タスクを追加する
   * @param fn
   * @returns {Process}
   */
  task (fn) {
    this.tasks.push({type: TASK_TYPES.TASK, fn: fn});

    // 関数名がある場合indexと関数名を紐付けておく
    if (fn.name) {
      this.fn_name_index[fn.name] = this.tasks.length - 1;
    }
    return this;
  }

  /**
   * フィードバック系関数の登録
   * @param array
   * @param fn
   * @returns {*}
   * @private
   */
  _addFeedbackFn (array, fn) {
    const task_index = this.tasks.length - 1;
    if (array.length === task_index) {
      array.push(fn);
    } else if (array.length > task_index) {
      console.warn('taskに対して多重に同一のfeedback系関数を設定することはできません。');
    } else {
      array.push(null);
      return this._addFeedbackFn(array, fn);
    }
  }

  /**
   * task成功時の処理
   * @param fn
   * @returns {*}
   */
  success (fn) {
    this._addFeedbackFn(this.successes, fn);
    return this;
  }

  /**
   * task失敗時の処理
   * @param fn
   * @returns {*}
   */
  fail (fn) {
    this._addFeedbackFn(this.fails, fn);
    return this;
  }

  /**
   * task失敗時の処理＆完了形taskへスキップ
   * @param fn
   * @returns {*}
   */
  failStop (fn) {
    this._addFeedbackFn(this.failStops, fn);
    return this;
  }

  /**
   * 処理を中断し、abortedへスキップ
   */
  abort () {
    this.abort_flag = true;
  }

  /**
   * プロセスを初期状態に戻す
   */
  reset () {
    this.reset_count++;
    this.has_error = false;
    this.stop = false;
    this.abort_flag = false;
    this.kill_flag = false;
    this.current_index = 0;
    this.results = [];
    this.errors = [];
    this.task_statuses = [];
  }

  /**
   * プロセスを初期状態からやり直す
   */
  restart () {
    this.reset();
    this.exec();
  }

  /**
   * プロセスを強制的に終了にする
   */
  kill () {
    this.kill_flag = true;
  }

  /**
   * プロセスを破棄する(完全に初期状態に戻しtaskも消去)
   */
  destroy () {
    this.reset();
    this.tasks = [];
    this.successes = [];
    this.fails = [];
    this.failStops = [];
    this.aborted_fn = null;
  }

  /**
   * 全task成功時に実行
   * @param fn
   * @returns {Process}
   */
  complete (fn) {
    this.tasks.push({type: TASK_TYPES.COMPLETE, fn: fn});
    return this;
  }

  /**
   * abort以外かならず実行
   * @param fn
   * @returns {Process}
   */
  always (fn) {
    this.tasks.push({type: TASK_TYPES.ALWAYS, fn: fn});
    return this;
  }

  /**
   * abort時に実行
   * @param fn
   * @returns {Process}
   */
  aborted (fn) {
    this.aborted_fn = fn;
    return this;
  }

  /**
   * 全task終了時、エラーが発生していた場合実行
   * @param fn
   * @returns {Process}
   */
  error (fn) {
    this.tasks.push({type: TASK_TYPES.ERROR, fn: fn});
    return this;
  }

  /**
   * 最新の結果を取得
   * @returns {*}
   */
  getLastResult () {
    if (this.results.length === 0) return null;
    return this.results[this.results.length - 1];
  }

  /**
   * 最新のエラーを取得
   * @returns {*}
   */
  getLastError () {
    if (this.errors.length === 0) return null;
    return this.errors[this.errors.length - 1];
  }

  /**
   * 最新のtaskの成否を取得
   * @returns {*}
   */
  getLastStatus () {
    if (this.task_statuses.length === 0) return null;
    return this.task_statuses[this.task_statuses.length - 1];
  }

  /**
   * 関数名から結果を取得する（無名関数の場合は取得できない）
   * @param fn_name
   */
  getResultByFnName (fn_name) {
    if (this.fn_name_index[fn_name] !== 'undefined') {
      return this.results[this.fn_name_index[fn_name]];
    }
  }

  /**
   * 実行
   * @returns {boolean}
   */
  exec () {
    // taskがない
    if (!this.tasks[this.current_index]) return false;

    // killの場合何もしない
    if (this.kill_flag) return false;

    // abortだったらabortedのみ
    if (this.abort_flag) {
      if (typeof this.aborted_fn === 'function') this.aborted_fn();
      return false;
    }

    // 完了系タスク or Stopフラグ
    if (this.tasks[this.current_index].type !== TASK_TYPES.TASK || this.stop) {
      switch(this.tasks[this.current_index].type) {
        case TASK_TYPES.COMPLETE:
          if (!this.has_error) this.tasks[this.current_index].fn(this.results);
          break;
        case TASK_TYPES.ALWAYS:
          this.tasks[this.current_index].fn(this.results, this.errors);
          break;
        case TASK_TYPES.ERROR:
          if (this.has_error) this.tasks[this.current_index].fn(this.errors);
          break;
      }
      this.current_index++;
      this.exec();
      return false;
    }

    const last_status = this.getLastStatus();
    const last_data = last_status ? this.getLastResult() : this.getLastError();

    this.tasks[this.current_index].fn(last_data, last_status)
      .then((data) => {
        this.results.push(data);
        this.errors.push(null);
        this.task_statuses.push(true);

        if (typeof this.successes[this.current_index] === 'function') {
          this.successes[this.current_index](this.getLastResult());
        }

        this.current_index++;
        this.exec();
      })
      .catch((data) => {
        this.results.push(null);
        this.errors.push(data);
        this.task_statuses.push(false);
        this.has_error = true;

        if (typeof this.failStops[this.current_index] === 'function') {
          this.failStops[this.current_index](this.getLastError());
          this.stop = true;
          this.exec();
          return false;
        }

        if (typeof this.fails[this.current_index] === 'function') {
          this.fails[this.current_index](this.getLastError())
        }
        this.current_index++;
        this.exec();
      })
  }
}

export default Process;
