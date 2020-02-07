# Scene

场景管理，场景管理是用状态机进行管理的
每个场景都是一个状态，

## 使用案例：
```typescript
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
```
------------------------------------------------------------------

## 场景跳转
``` typescript
import * as YK from "../../YK/YK";
import {Scene1, Scene2} from "./Scene";

export class SceneTest {
    public static test() {
        YK.Scene.init();
        YK.Scene.add(new Scene1());
        YK.Scene.add(new Scene2());

        YK.Scene.go(1, "测试2");
        Laya.timer.once(1000, this, () => {
            YK.Scene.go(Scene2.id, "测试1");
        });
    }
}
```

## 主要api说明

> init() 初始化场景管理器
>add() 添加一个场景到管理器
>remove() 移除一个场景
>go() 跳转到指定场景
>addSceneTask() 添加到一个场景人物
>onTaskFinish() 所有场景任务完成后