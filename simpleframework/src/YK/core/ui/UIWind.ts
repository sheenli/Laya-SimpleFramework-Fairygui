import IUISource = fgui.IUISource;
import { UIConfig } from "./UIConfig"
import UIPackage = fgui.UIPackage;

export class LoadFGUIPack implements IUISource {
    fileName: string;
    loaded: boolean;
    constructor(packName) {
        this.fileName = packName;
    }

    load(callback: Function, thisObj: any): void {
        fgui.UIPackage.loadPackage(UIConfig.packRootUrl + "/" + this.fileName, Laya.Handler.create(this, () => {
            this.loaded = true;
            callback.call(thisObj);
            //console.log("加载完成" + this.fileName);
        }));
    }
}


export class UIWind extends fgui.Window {

    private static readonly mWinds = new Map<string, UIWind>();

    public readonly packName: string;

    public readonly resName: string;

    protected readonly mCloseBtnName = "BtnClose";

    constructor(packName, resName) {
        super();
        this.packName = packName;
        this.resName = resName;
        this.url = `ui://${packName}/${resName}`;

        this.addUISource(new LoadFGUIPack(packName));
    }

    public static add(wind: UIWind) {
        this.mWinds.set(wind.url, wind);
        return wind;
    }

    public static remove(wind: UIWind) {
        if (this.mWinds.has(wind.url)) {
            this.mWinds.delete(wind.url);
            wind.dispose();
        }
    }

    public static show(url: string, param?: any) { 
        if (this.mWinds.has(url)) {
            let wind = this.mWinds.get(url);
            wind.data = param;
            if (wind.isShowing) {
                // wind.onShown();
            } else {
                wind.show();
            }
        } else {
            console.error("显示窗口失败没有注册窗口 url:" + url);
        }
    }

    public static hide(url: string, param?: any) {
        if (this.mWinds.has(url)) {
            let wind = this.mWinds.get(url);
            if (wind.isShowing) {
                wind.data = param;
                wind.hide();
            }
        } else {
            console.error("隐藏窗口失败没有注册窗口 url:" + url);
        }
    }

    public static hideAll(filter: Array<string> = null) {
        this.mWinds.forEach((v, k) => {
            if (v.isShowing && (filter == null || filter.findIndex(a => a == v.url) == -1)) {
                v.hide();
            }
        });
    }

    public static delAll(filter: Array<string> = null) {
        let needDel = new Array<string>();
        this.mWinds.forEach((v, k) => {
            if (filter == null || filter.findIndex(a => a == v.url) == -1) {
                needDel.push(v.url);
            }
        });

        for (let i = 0; i < needDel.length; i++) {
            this.remove(this.mWinds.get(needDel[i]));
        }
    }

    public static del(url: string): void {
        if (this.mWinds.has(url)) {
            this.remove(this.mWinds.get(url));
        }
    }

    protected onInit(): void {
        //console.log("显示成功");
        let windObj = UIPackage.createObjectFromURL(this.url);
        if (windObj == null) {
            console.error("创建窗口失败 url" + this.url);
            return;
        }
        this.contentPane = windObj.asCom;
        this.width = fairygui.GRoot.inst.width;
        this.height = fairygui.GRoot.inst.height;
        this.centerOn(fgui.GRoot.inst, true);
        if (this.mCloseBtnName != null && this.mCloseBtnName.length != 0) {
            let btnClose = this.contentPane.getChild(this.mCloseBtnName);
            if (btnClose && (btnClose.asCom || btnClose.asButton)) {
                this.closeButton = btnClose;
            }
        }
    }

    public url: string;
}

