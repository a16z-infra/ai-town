class Timer {
  private totalTime: number;
  private remainingTime: number;
  private updateInterval: number;
  private timerInterval: any;

  constructor(totalTime: number, updateInterval = 1000) {
    this.totalTime = totalTime;
    this.remainingTime = totalTime;
    this.updateInterval = updateInterval;
    this.timerInterval = null;
  }

  start() {
    if (this.timerInterval) {
      console.log("Timer is already running.");
      return;
    }

    this.timerInterval = setInterval(() => {
      this.remainingTime -= this.updateInterval;

      if (this.remainingTime <= 0) {
        this.stop();
        console.log("Timer expired");
        return;
      }
    }, this.updateInterval);
  }

  stop() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  getRemainingTime() {
    return this.remainingTime;
  }
}

export default Timer;
