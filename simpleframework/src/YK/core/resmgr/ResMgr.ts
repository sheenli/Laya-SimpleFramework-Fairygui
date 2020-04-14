import Handler = Laya.Handler;
import {Func} from "../utils/Listener";

class ResInfo {
    public url: string;
    public type: string;
    public isKeepMemory = false;
}

type resDicType = { [key: string]: ResInfo }

export class LoadGroup {
    public Progress: number = 0;
    public needLoad: Array<ResInfo> = new Array<ResInfo>();

    public add(url: string, type?: string, isKeepMemory = true) {
        let index = this.needLoad.findIndex((value: ResInfo, index: number, obj: Array<ResInfo>) => {
            return value.url == url
        });
        if (index == -1) {
            let info = new ResInfo();
            info.isKeepMemory = isKeepMemory;
            info.url = url;
            info.type = type;
            this.needLoad.push(info)
        }
        return this
    }

    public onCompletion(callback: Laya.Handler) {
        this.finish = callback;
        return this
    }

    public onItemCompletion(callback: Laya.Handler) {
        this.loadItem = callback;
        return this
    }


    public start() {
        ResMgr.instance.loadGroup(this)
    }

    public loadItem: Laya.Handler;
    public finish: Laya.Handler;
}

export class ResMgr {
    constructor() {
        if (ResMgr.mInstance == null) ResMgr.mInstance = this
    }

    private mOldRes: Array<string> = new Array<string>();
    private resDic: Map<string, ResInfo> = new Map<string, ResInfo>();
    private static mInstance: ResMgr = null;

    public static get instance(): ResMgr {
        if (this.mInstance == null) new ResMgr();
        return this.mInstance
    }

    public getRes(url) {
        return Laya.loader.getRes(url)
    }

    public loadGroup(loads: LoadGroup) {

        let urls: Array<any> = new Array<any>();
        loads.needLoad.forEach(element => {
            urls.push({url: element.url, type: element.type})
        });
        Laya.loader.create(urls, Handler.create(this, (success: boolean) => {
            if (success) {
                for (let index = 0; index < loads.needLoad.length; index++) {
                    let info = loads.needLoad[index];
                    this.resDic.set(info.url, info)
                }
                if (loads.finish != null) {
                    loads.finish.run();
                }
            } else {
                console.error("加载资源失败：",urls);
            }
        }), Handler.create(this, (progress: number) => {
            loads.Progress = progress * 100;
            if (loads.loadItem != null) {
                loads.loadItem.runWith([loads.Progress])
            }
        }))
    }

    public load(url: any, callback: Laya.Handler) {
        let u: any = {};
        let loadInfo: ResInfo = new ResInfo();
        if (typeof (url) == "string") {
            loadInfo.url = url;
            loadInfo.isKeepMemory = true;
            u = url;
        } else {
            loadInfo = u;
            u.type = url.type;
            u.url = url.url;
        }
        Laya.loader.create(u, Laya.Handler.create(this, () => {
            this.resDic.set(loadInfo.url, loadInfo);
            if (callback != null) {
                callback.run();
            }
        }));
    }

    /**
     * 释放资源
     * @param forced 是否强制释放所有
     */
    public pop(forced = false) {
        if (forced) {
            this.mOldRes.splice(0, this.mOldRes.length);

            this.resDic.forEach((v: ResInfo, key: string) => {
                this.mOldRes.push(key)
            });
        }
        while (this.mOldRes.length > 0) {
            let url = this.mOldRes.pop();
            let info = this.resDic.get(url);
            if (info != null) {
                this.resDic.delete(info.url)
            }
            Laya.loader.clearRes(url)
        }

        if (forced) {
            this.resDic.clear();
            Laya.loader.clearUnLoaded();
        }
    }

    /**
     * 压入要释放的资源
     */
    public push() {
        this.resDic.forEach((v: ResInfo, key: string) => {
            if (!v.isKeepMemory)
                this.mOldRes.push(key)
        });
    }
}