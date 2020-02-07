export class Func {
    constructor(func, thisObj) {
        this.func = func;
        this.thisObj = thisObj;
    }

    public func: Function;
    public readonly thisObj: any;

    run(args: any[] = null) {
        return this.func.call(this.thisObj, args);
    }
}

export class Listener {
    func: Array<Func> = new Array<Func>();

    static create(func, thisObj = null): Listener {
        let listener = new Listener();
        listener.add(func, thisObj);
        return listener;
    }

    add(func, thisObj = null) {
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
        for (let i = this.func.length - 1; i >= 0; i--) {
            let fun = this.func[i];
            if (fun.func == func && fun.thisObj == thisObj) {
                return true;
            }
        }
        return false;
    }


    run(args: any[] = null) {
        for (let i = 0; i < this.func.length; i++) {
            let func = this.func[i];
            func.run(args)
        }
    }
}