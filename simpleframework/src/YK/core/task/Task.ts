export enum Status {
    None = 0,
    Running,
    Success,
    Failure
}

export abstract class Task {
    private latch: boolean
    protected mStatus: Status = Status.None
    protected mErr = ""
    protected mProgress: number = 0;
    protected mOwnerSystem: any
    protected mStartedTime: number
    public onFinish: Laya.Handler


    public get progress(): number {
        return this.mProgress
    }


    public elapsedTime(): number {
        return Laya.timer.currTimer - this.mStartedTime
    }

    public get status(): Status {
        return this.mStatus
    }


    public get taskName(): string {
        return ""
    }

    public get errInfo(): string {
        return this.mErr
    }

    public get isRunning(): boolean {
        return this.status == Status.Running
    }

    public setComplete(callback: Laya.Handler): Task {
        this.onFinish = callback
        return this
    }

    public execute(owner: any = null) {
        this.mProgress = 0
        if (!this.isRunning) {
            Laya.timer.frameLoop(1, this, this.update, [owner])
        }
    }

    public tick(owner: any): Status {
        if (this.status == Status.Running) {
            this.onUpdate()
            this.latch = false
            return this.mStatus
        }
        //如果任务结束了跳过这一帧//
        if (this.latch) {
            this.latch = false
            return this.mStatus
        }
        this.mStartedTime = Laya.timer.currTimer
        this.mStatus = Status.Running
        this.mOwnerSystem = owner
        this.onExecute()
        if (Status.Running == this.mStatus) {
            this.onUpdate()
        }
        return this.mStatus
    }

    private update(owner: any) {
        if (this.tick(owner) != Status.Running) {
            if (this.onFinish != null)
                this.onFinish.runWith([this.status == Status.Success])
            Laya.timer.clear(this, this.update)
        }
    }

    public endAction(success = true) {
        if (this.status != Status.Running) {
            this.onForcedStop()
            return
        }
        this.latch = true
        this.mStatus = success ? Status.Success : Status.Failure
        this.mProgress = this.mStatus == Status.Success ? 1 : 0

        this.onStop()

    }

    public reset() {
        this.latch = false
        this.mStatus = Status.None
        Laya.timer.clear(this, this.update)
        this.onReset()
        this.onForcedStop()
    }


    protected onExecute() {
    }

    protected onUpdate() {
    }

    protected onStop() {
    }

    protected onReset() {

    }

    protected onForcedStop() {
    }
}