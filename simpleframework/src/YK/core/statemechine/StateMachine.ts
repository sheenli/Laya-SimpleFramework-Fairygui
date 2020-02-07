import {IState} from "./IState";

export default class StateMachine {
    constructor() {
    }

    private mStateDic: Map<number, IState> = new Map<number, IState>();
    private mCurState;

    public get curState(): IState {
        return this.mCurState;
    }

    public stop() {
        if (this.curState != null) {
            this.curState.onExit(null, null);
            this.mCurState = null
        }
    }

    public registerState(state: IState) {
        if (state == null) return;
        if (this.mStateDic.has(state.stateId)) return;
        this.mStateDic.set(state.stateId, state)

    }

    public removeState(stateId: number) {
        if (this.mStateDic.has(stateId)) this.mStateDic.delete(stateId);
        if (this.curState != null && this.curState.stateId == stateId) {
            this.mCurState.onExit(null);
            this.mCurState = null
        }

    }

    public switchState(stateId: number, param: any) {
        if (this.curState != null && this.curState.stateId == stateId) return;
        if (!this.mStateDic.has(stateId)) {
            console.error("没有找对应的状态：stateid =" + stateId);
            return
        }
        let nextState = this.mStateDic.get(stateId);
        if (this.curState != null)
            this.curState.onExit(nextState, param);
        nextState.onEnter(this.mCurState == null ? null : this.curState, param);
        this.mCurState = nextState
    }

    public update() {
        if (this.curState != null) this.curState.onUpdate()
    }
} 