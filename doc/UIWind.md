# UIWind
基于fairygui的窗口系统进行的简单封装

## 使用方法：

所有窗口都需要继承UIWind，如果需要自动适配关闭按钮的需要设置按钮的名称为 BtnClose 也可以自定义名字

```typescript
class wind2 extends YK.UIWind {
    static show(){
        super.show("ui://MainPack/Wind2");
    }
    constructor() {
        super("MainPack", "Wind2");
    }
}
```
> 构造的时候设置下自己的包名和组件名

然后使用UIWind.add(new wind1());就能添加一个窗口了

调用UIWind.show(url)就能显示一个窗口


最后看看效果和完整案例：


``` typescript
	import * as YK from "../../YK/YK";

export class TestUI extends YK.UIWind {
    static test() {
        Laya.stage.addChild(fairygui.GRoot.inst.displayObject);
        YK.UIConfig.packRootUrl = "fgui";

        YK.UIWind.add(new wind1());
        YK.UIWind.add(new wind2());
        wind1.show();
    }
}

class wind1 extends YK.UIWind {
    static show() {
        super.show("ui://MainPack/Wind1");
    }

    constructor() {
        super("MainPack", "Wind1");
    }

    protected onInit(): void {
        super.onInit();

        this.contentPane.getChild("btnShow").asButton.onClick(this, () => {
            wind2.show();
        });
    }
}

class wind2 extends YK.UIWind {
    static show(){
        super.show("ui://MainPack/Wind2");
    }
    constructor() {
        super("MainPack", "Wind2");
    }
}
```

效果：

![Alt text](./GIF.gif)


