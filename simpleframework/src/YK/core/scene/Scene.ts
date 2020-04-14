import {IState} from "../statemechine/IState";
import {ActionsExecutionMode, TaskList} from "../task/TaskList";
import {Task} from "../task/Task";
import StateMachine from "../statemechine/StateMachine";

class SceneMgr {
    private static mSceneStateMachine = new StateMachine();

    public static get current() {
        return this.mSceneStateMachine.curState == null ? null : this.mSceneStateMachine.curState as Scene;
    }

    public static go(sceneId: number, param: any = null) {
        this.mSceneStateMachine.switchState(sceneId, param);
    }

    public static addScene(scene: Scene) {
        this.mSceneStateMachine.registerState(scene);
    }

    public static removeScene(sceneId: number) {
        this.mSceneStateMachine.removeState(sceneId);
    }

    public static init() {
        Laya.timer.frameLoop(1, this, this.onUpdate)
    }

    private static onUpdate() {
        this.mSceneStateMachine.update();
    }
}

export abstract class Scene implements IState {

    static init() {
        SceneMgr.init();
    }

    static go(sceneId: number, param: any = null) {
        SceneMgr.go(sceneId, param);
    }

    static add(scene: Scene) {
        SceneMgr.addScene(scene);
    }

    static remove(sceneId: number) {
        SceneMgr.removeScene(sceneId);
    }

    get stateId() {
        return this.sceneId;
    }

    public abstract get sceneId(): number;

    protected mSceneTask = new TaskList(ActionsExecutionMode.RunInParallel);

    constructor() {
        this.mSceneTask.setComplete(new Laya.Handler(this, () => {
            this.onTaskFinish();
            this.mSceneTask.actions.splice(0, this.mSceneTask.actions.length);
        }));
    }

    onEnter(prevState: IState, param: any): void {
        this.onSceneEnter(prevState as Scene, param);
        this.mSceneTask.execute(this)
    }

    onExit(nextState: IState, param: any): void {
        this.mSceneTask.reset();
        this.mSceneTask.endAction(false);
        this.onLeaveScene(nextState as Scene, param);
    }

    private mSequenceTask: TaskList = null;
    private mParallelTask: TaskList = null;

    public addSceneTask(task: Task, executionMode: ActionsExecutionMode = ActionsExecutionMode.RunInSequence): Scene {
        if (executionMode == ActionsExecutionMode.RunInParallel) {
            if (this.mParallelTask != null) {
                this.mParallelTask.addTask(task);
            } else {
                this.mParallelTask = new TaskList(executionMode);
                this.mParallelTask.addTask(task);
                this.mParallelTask.addTask(this.mSequenceTask);
            }
        } else {
            if (this.mSequenceTask != null) {
                this.mSequenceTask.addTask(task);
            } else {
                this.mSequenceTask = new TaskList(executionMode);
                this.mSequenceTask.addTask(task);
                this.mSceneTask.addTask(this.mSequenceTask);
            }
        }

        return this;
    }

    onUpdate() {
    }

    protected onTaskFinish() {

    }

    protected onSceneEnter(prevState: Scene, param: any) {

    }

    protected onLeaveScene(nextState: Scene, param: any) {
    }
}