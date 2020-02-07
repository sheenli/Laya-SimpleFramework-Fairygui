# ResMgr
主要是对腊鸭自身的资源加载进行的简易封装

##LoadGroupInfo

使用loadGroupInfo来加载一组资源

使用YK.ResMgr.instance.getRes来同步获取一个资源
也可以使用 YK.ResMgr.instance.load() 异步获取资源

```typescript
let group = new YK.LoadGroup();
        group.add("unitylib/Conventional/SampleScene.ls")
            .add("unitylib/Conventional/SampleScene.json")
            .add("res/graph/GameGraphCanvas.json")
            .onCompletion(Laya.Handler.create(this, () => {
                this.init();
            })).start();
            
static init(){
        let scene: Laya.Sprite3D = YK.ResMgr.instance.getRes("unitylib/Conventional/SampleScene.ls") as Laya.Sprite3D;
        Laya.stage.addChild(scene);
    }
```

## 资源释放

调用 push()来记录上一次加载的不是常驻内存资源

然后调用pop()来释放