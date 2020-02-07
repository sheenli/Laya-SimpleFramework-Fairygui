import {Status, Task} from "./Task";

export enum ActionsExecutionMode {
    RunInSequence,
    RunInParallel
}

export class TaskList extends Task {
    public actions = new Array<Task>();
    public finished = new Array<number>();
    public executionMode = ActionsExecutionMode.RunInSequence;
    private mCurIndex: number;

    public get progress(): number {
        let cur = 0;
        for (let i = 0; i < this.actions.length; i++) {
            cur += this.actions[i].progress;
        }
        return cur / this.actions.length;
    }

    protected onExecute() {
        this.mCurIndex = 0;
        this.finished.splice(0, this.finished.length);
        this.mProgress = 0;
    }

    protected onUpdate() {
        super.onUpdate();
        if (this.actions.length == 0) {
            this.endAction();
            return;
        }
        switch (this.executionMode) {
            case ActionsExecutionMode.RunInParallel:
                this.checkParallelTask();
                break;
            case ActionsExecutionMode.RunInSequence:
                this.checkInSequenceTask();
                break;
        }
    }

    private checkParallelTask() {
        for (let i = 0; i < this.actions.length; i++) {
            if (this.finished.findIndex(a => a == i) != -1)
                continue;
            let status = this.actions[i].tick(this.mOwnerSystem);
            if (status == Status.Failure) {
                this.mErr = this.actions[i].errInfo;
                this.endAction(false);
                return;
            }

            if (status == Status.Success) this.finished.push(i);
        }
        if (this.finished.length == this.actions.length) this.endAction();
    }

    private checkInSequenceTask() {
        for (let i = this.mCurIndex; i < this.actions.length; i++) {

            let status = this.actions[i].tick(this.mOwnerSystem);

            if (status == Status.Failure) {
                this.endAction(false);
                return;
            }

            if (status == Status.Running) {
                this.mCurIndex = i;
                return;
            }
        }
        this.endAction();
    }

    protected onReset() {
        for (let i = 0; i < this.actions.length; i++) {
            this.actions[i].reset();
        }

        this.mCurIndex = 0;
        this.finished.splice(0, this.finished.length);
    }

    public addTask(task: Task): TaskList {
        this.actions.push(task);
        return this;
    }

    constructor(executionMode: ActionsExecutionMode) {
        super();
        this.executionMode = executionMode;
    }
}