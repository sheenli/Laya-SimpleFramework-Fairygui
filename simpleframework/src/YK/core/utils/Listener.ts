export class Func {
    constructor(func: Function, thisObj: any) {
        this.func = func;
        this.thisObj = thisObj;
    }

    public func: Function;
    public thisObj: any;

    run(...argArray: any[]) {
        return this.func.call(this.thisObj, ...argArray);
    }
}

export class Listener {
    func: Array<Func> = new Array<Func>();

    static create(func, thisObj = null): Listener {
        let listener = new Listener();
        listener.add(func, thisObj);
        return listener;
    }

    add(func:Function, thisObj = null) {
        if (!this.has(func, thisObj)) {
            this.func.push(new Func(func, thisObj));
        }

    }

    remove(func, thisObj = null) {
        for (let i = this.func.length - 1; i >= 0; i--) {
            let fun = this.func[i];
            if (fun.func == func && fun.thisObj == thisObj) {
                this.func.splice(i, 1);
                break;
            }
        }
    }

    has(func: Function, thisObj: any): boolean {
        return this.func.findIndex(a=>a.thisObj == thisObj && a.func == func) != -1;

    }


    run(...args: any[]) {
        for (let i = 0; i < this.func.length; i++) {
            let func = this.func[i];
            func.func.call(func.thisObj, ...args);
        }
    }
}