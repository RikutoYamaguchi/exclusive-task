// シングルトン
import Deferred from "../class/Deferred";
import ExclusiveTask from "../class/ExclusiveTask";
import Task from '../class/Task'

// ログイン状態モックのための数字
let is_login = 0;

// モーダル出力モック
function showModal (dfd) {
  console.log('showModal');
  setTimeout(() => {
    // ユーザーが入力をしたりしているイメージの待ち時間
    dfd.resolve()
  }, 1000);
}

// ログイン判別APIモック
function isLogin (dfd) {
  console.log('isLogin');
  setTimeout(() => {
    if (is_login % 2 === 0) {
      dfd.reject();
    } else {
      dfd.resolve();
    }
    // is_login++;
  }, 1000)
}

// 認証モック
function auth (id, pass, dfd) {
  console.log('auth');
  setTimeout(() => {
    dfd.resolve();
  }, 1000)
}

// 排他処理のためのシングルトン
const sampleAuthTaskManager = new ExclusiveTask({continue_after_rejected: false});

// サンプルの認証タスク
// 認証に必要な処理をまとめる
class SampleAuthTask extends Task {
  constructor () {
    super();
    this.manager = sampleAuthTaskManager;
    // 管理に追加
    this.manager.push(this);
    // 続行用関数
    this.continue = this.start;
  }

  // タスク開始
  start () {
    // 同時処理での処理のみ実行
    if (this.manager.isFirst(this)) {
      this.checkAuth();
    }
    return this.dfd;
  }

  // 認証をチェックする
  checkAuth () {
    const dfd = new Deferred();
    isLogin(dfd);
    dfd
      .then(() => {
        this.complete();
      })
      .catch(() => {
        this.showModal();
      })
  }

  // モーダル表示
  showModal () {
    const dfd = new Deferred();
    showModal(dfd);
    dfd.then(() => {
      this.auth();
    }).catch(() => {
      this.error();
    })
  }

  // 認証
  auth () {
    const dfd = new Deferred();
    auth(null, null, dfd);
    dfd
      .then(() => {
        this.complete();
      })
      .catch(() => {
        this.showModal();
      })
  }

  // 完了
  complete () {
    console.log('complete');
    this.resolve();
    if (this.manager.isFirst(this)) {
      this.manager.drop(this);
      this.manager.allResolve({});
    }
  }

  error () {
    console.log('error');
    this.reject();
    if (this.manager.isFirst(this)) {
      this.manager.drop(this);
      this.manager.allReject({});
    }
  }
}

export default SampleAuthTask;
