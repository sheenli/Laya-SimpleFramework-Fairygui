import * as YK from "./../../YK/YK";

export class Scene1 extends YK.Scene {
    public static id = 1;
    get sceneId(): number {
        return Scene1.id;
    }

    protected onSceneEnter(prevState: YK.Scene, param: any) {
        console.log("进入场景1",prevState,"参数",param)
    }

    protected onLeaveScene(nextState: YK.Scene, param: any) {
        console.log("离开场景1",nextState,"参数",param)

    }
}

export class Scene2 extends YK.Scene {
    public static id = 2;
    get sceneId(): number {
        return Scene2.id;
    }
    protected onSceneEnter(prevState: YK.Scene, param: any) {
        console.log("进入场景2",prevState,"参数",param)
    }

    protected onLeaveScene(nextState: YK.Scene, param: any) {
        console.log("离开场景2",nextState,"参数",param)
    }
}