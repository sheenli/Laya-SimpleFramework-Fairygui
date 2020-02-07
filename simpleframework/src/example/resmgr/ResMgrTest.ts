import * as YK from "../../YK/YK";

export class ResMgrTest {
    static test() {
        let group = new YK.LoadGroup();
        group.add("unitylib/Conventional/SampleScene.ls")
            .add("unitylib/Conventional/SampleScene.json")
            .add("res/graph/GameGraphCanvas.json")
            .onCompletion(Laya.Handler.create(this, () => {
                this.init();
            })).start();
    }

    static init(){
        let scene: Laya.Sprite3D = YK.ResMgr.instance.getRes("unitylib/Conventional/SampleScene.ls") as Laya.Sprite3D;
        Laya.stage.addChild(scene);
    }
}