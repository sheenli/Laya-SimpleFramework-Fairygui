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