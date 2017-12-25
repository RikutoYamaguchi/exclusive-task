import Process from './class/Process'
import SampleAuthTask from './task/SampleAuthTask'

const buttonA = document.querySelector('#process-a');
const buttonB = document.querySelector('#process-b');

buttonA.addEventListener('click', () => {
  // タスク・プロセスの生成
  const authTask = new SampleAuthTask();
  const sampleProcessA = new Process();
  sampleProcessA
    .task(() => authTask.start())
    .success(() => {
      console.log('sampleProcessA success');
    })
    .fail(() => {
      console.log('sampleProcessA fail')
    });
  sampleProcessA.exec();
});

buttonB.addEventListener('click', () => {
  // タスク・プロセスの生成
  const authTask = new SampleAuthTask();
  const sampleProcessB = new Process();
  sampleProcessB
    .task(() => authTask.start())
    .success(() => {
      console.log('sampleProcessB success');
    })
    .fail(() => {
      console.log('sampleProcessB fail')
    });
  sampleProcessB.exec();
});
