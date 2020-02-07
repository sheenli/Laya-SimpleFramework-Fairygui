export interface IState {
    stateId: number

    onEnter(prevState: IState, param: any): void

    onExit(nextState: IState, param: any): void

    onUpdate()
}