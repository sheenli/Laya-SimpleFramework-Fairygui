import {Event} from "./Evnet";

export class EventDispatcher {

    private dicEventListener: Map<string, Array<EventBin>> = new Map<string, Array<EventBin>>();
    private onceList: Array<EventBin> = new Array<EventBin>();

    on(type: string, listener: Function, caller: any, priority?: number, once?: boolean): EventDispatcher {
        let arr: Array<EventBin>;
        if (this.hasEventListener(type)) {
            arr = this.dicEventListener.get(type);
        } else {
            arr = new Array<EventBin>();
            this.dicEventListener.set(type, arr);
        }
        this.insertEventBin(arr, type, listener, caller, priority, !!once);
        return this;
    }

    once(type: string, listener: Function, caller: any, priority?: number): EventDispatcher {
        this.on(type, listener, caller, priority, true);
        return this;
    }

    off(type: string, listener: Function, caller: any): EventDispatcher {
        this.removeListener(type, listener, caller);
        return this;
    }

    offAll(type?: string): EventDispatcher {
        if (!!type && this.hasEventListener(type)) {
            this.dicEventListener.delete(type);
        } else {
            this.dicEventListener.clear();
        }
        return this;
    }

    offAllCaller(caller: any): EventDispatcher {
        let arr: Array<EventBin> = new Array<EventBin>();
        this.dicEventListener.forEach(v => {
            for (let i = 0; i < v.length; i++) {
                let eventBin = v[i];
                if (eventBin.thisObject == caller) {
                    arr.push(eventBin);
                }
            }
        });
        for (let i = 0; i < arr.length; i++) {
            let e = arr[i];
            this.removeListener(e.type, e.listener, e.thisObject);
        }
        return this;
    }

    hasEventListener(type: string): boolean {
        return this.dicEventListener.has(type);
    }

    dispatchEvent(ev: Event) {
        ev.target = this;
        this.notifyListener(ev);
    }

    dispatchEventWith(type: string, data?: any): boolean {
        if (this.hasEventListener(type)) {
            let event: Event = Event.create(Event, type);
            event.data = data;
            this.dispatchEvent(event);
            Event.release(event);
        }
        return true;
    }

    private insertEventBin(list: any[], type: string, listener: Function, thisObject: any,
                           priority?: number, dispatchOnce?: boolean): boolean {
        priority = +priority | 0;
        let insertIndex = -1;
        let length = list.length;
        for (let i = 0; i < length; i++) {
            let bin = list[i];
            if (bin.listener == listener && bin.thisObject == thisObject && bin.target == this) {
                return false;
            }
            if (insertIndex == -1 && bin.priority < priority) {
                insertIndex = i;
            }
        }
        let eventBin: EventBin = {
            type: type, listener: listener, thisObject: thisObject, priority: priority,
            target: this, dispatchOnce: !!dispatchOnce
        };

        if (insertIndex !== -1) {
            list.splice(insertIndex, 0, eventBin);
        } else {
            list.push(eventBin);
        }
        return true;
    }

    private removeListener(type: string, listener: Function, caller: any) {
        if (this.hasEventListener(type)) {
            this.removeEventBin(this.dicEventListener.get(type), listener, caller);
        }
    }

    private removeEventBin(list: any[], listener: Function, caller: any): boolean {
        let length = list.length;
        for (let i = 0; i < length; i++) {
            let bin = list[i];
            if (bin.listener == listener && bin.thisObject == caller && bin.target == this) {
                list.splice(i, 1);
                return true;
            }
        }

        return false;
    }

    private notifyListener(event: Event) {
        let list: Array<EventBin> = this.dicEventListener.get(event.type);
        if (!list) {
            return;
        }
        let length = list.length;
        if (length == 0) {
            return;
        }
        for (let i = 0; i < list.length; i++) {
            let eventBin = list[i];
            if (eventBin == null){
                continue;
            }
            eventBin.listener.call(eventBin.thisObject, event);

            if (eventBin.dispatchOnce) {
                this.onceList.push(eventBin);
            }
            if (event.isPropagationImmediateStopped) {
                break;
            }
        }
        while (this.onceList.length) {
            let eventBin = this.onceList.pop();
            eventBin.target.off(eventBin.type, eventBin.listener, eventBin.thisObject);
        }
    }
}

/**
 * @private
 * 事件信息对象
 */
export interface EventBin {
    type: string;
    listener: Function;
    thisObject: any;
    priority: number;
    target: EventDispatcher;
    dispatchOnce: boolean;
}
