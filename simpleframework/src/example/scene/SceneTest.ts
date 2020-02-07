import * as YK from "../../YK/YK";
import {Scene1, Scene2} from "./Scene";

export class SceneTest {
    public static test() {
        YK.Scene.init();
        YK.Scene.add(new Scene1());
        YK.Scene.add(new Scene2());

        YK.Scene.go(1, "测试1");
        Laya.timer.once(1000, this, () => {
            YK.Scene.go(Scene2.id, "测试2");
        });
    }

}