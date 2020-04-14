(function () {
    'use strict';

    class GameConfig {
        constructor() {
        }
        static init() {
            var reg = Laya.ClassUtils.regClass;
        }
    }
    GameConfig.width = 1136;
    GameConfig.height = 640;
    GameConfig.scaleMode = "fixedwidth";
    GameConfig.screenMode = "horizontal";
    GameConfig.alignV = "top";
    GameConfig.alignH = "left";
    GameConfig.startScene = "";
    GameConfig.sceneRoot = "";
    GameConfig.debug = false;
    GameConfig.stat = false;
    GameConfig.physicsDebug = false;
    GameConfig.exportSceneToJson = true;
    GameConfig.init();

    class GameFlag {
        constructor(flag = 0) {
            this.mValue = 0;
            this.mValue = flag;
        }
        get value() {
            return this.mValue;
        }
        set value(v) {
            this.mValue = v;
        }
        add(flag) {
            if (!this.has(flag))
                this.mValue |= flag;
            return this;
        }
        remove(flag) {
            if (this.has(flag))
                this.mValue &= ~flag;
            return this;
        }
        has(flag) {
            return (this.mValue & flag) != 0;
        }
    }

    class Func {
        constructor(func, thisObj) {
            this.func = func;
            this.thisObj = thisObj;
        }
        run(...argArray) {
            return this.func.call(this.thisObj, ...argArray);
        }
    }
    class Listener {
        constructor() {
            this.func = new Array();
        }
        static create(func, thisObj = null) {
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
        has(func, thisObj) {
            return this.func.findIndex(a => a.thisObj == thisObj && a.func == func) != -1;
        }
        run(...args) {
            for (let i = 0; i < this.func.length; i++) {
                let func = this.func[i];
                func.func.call(func.thisObj, ...args);
            }
        }
    }

    class Event {
        constructor(type, data) {
            this.type = type;
            this.data = data;
        }
        stopImmediatePropagation() {
            this.isPropagationImmediateStopped = true;
        }
        clean() {
            this.data = this.target = null;
            this.isPropagationImmediateStopped = false;
        }
        static create(EventClass, type) {
            let eventPool;
            let hasEventPool = EventClass.hasOwnProperty("eventPool");
            if (hasEventPool) {
                eventPool = EventClass.eventPool;
            }
            if (!eventPool) {
                eventPool = EventClass.eventPool = [];
            }
            if (eventPool.length) {
                let event = eventPool.pop();
                event.type = type;
                return event;
            }
            return new EventClass(type);
        }
        static dispatchEvent(target, type, data) {
            let event = Event.create(Event, type);
            event.data = data;
            target.dispatchEvent(event);
            Event.release(event);
        }
        static release(event) {
            event.clean();
            let EventClass = Object.getPrototypeOf(event).constructor;
            EventClass.eventPool.push(event);
        }
    }

    class EventDispatcher {
        constructor() {
            this.dicEventListener = new Map();
            this.onceList = new Array();
        }
        on(type, listener, caller, priority, once) {
            let arr;
            if (this.hasEventListener(type)) {
                arr = this.dicEventListener.get(type);
            }
            else {
                arr = new Array();
                this.dicEventListener.set(type, arr);
            }
            this.insertEventBin(arr, type, listener, caller, priority, !!once);
            return this;
        }
        once(type, listener, caller, priority) {
            this.on(type, listener, caller, priority, true);
            return this;
        }
        off(type, listener, caller) {
            this.removeListener(type, listener, caller);
            return this;
        }
        offAll(type) {
            if (!!type && this.hasEventListener(type)) {
                this.dicEventListener.delete(type);
            }
            else {
                this.dicEventListener.clear();
            }
            return this;
        }
        offAllCaller(caller) {
            let arr = new Array();
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
        hasEventListener(type) {
            return this.dicEventListener.has(type);
        }
        dispatchEvent(ev) {
            ev.target = this;
            this.notifyListener(ev);
        }
        dispatchEventWith(type, data) {
            if (this.hasEventListener(type)) {
                let event = Event.create(Event, type);
                event.data = data;
                this.dispatchEvent(event);
                Event.release(event);
            }
            return true;
        }
        insertEventBin(list, type, listener, thisObject, priority, dispatchOnce) {
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
            let eventBin = {
                type: type, listener: listener, thisObject: thisObject, priority: priority,
                target: this, dispatchOnce: !!dispatchOnce
            };
            if (insertIndex !== -1) {
                list.splice(insertIndex, 0, eventBin);
            }
            else {
                list.push(eventBin);
            }
            return true;
        }
        removeListener(type, listener, caller) {
            if (this.hasEventListener(type)) {
                this.removeEventBin(this.dicEventListener.get(type), listener, caller);
            }
        }
        removeEventBin(list, listener, caller) {
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
        notifyListener(event) {
            let list = this.dicEventListener.get(event.type);
            if (!list) {
                return;
            }
            let length = list.length;
            if (length == 0) {
                return;
            }
            for (let i = 0; i < list.length; i++) {
                let eventBin = list[i];
                if (eventBin == null) {
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

    var Handler = Laya.Handler;
    class ResInfo {
        constructor() {
            this.isKeepMemory = false;
        }
    }
    class LoadGroup {
        constructor() {
            this.Progress = 0;
            this.needLoad = new Array();
        }
        add(url, type, isKeepMemory = true) {
            let index = this.needLoad.findIndex((value, index, obj) => {
                return value.url == url;
            });
            if (index == -1) {
                let info = new ResInfo();
                info.isKeepMemory = isKeepMemory;
                info.url = url;
                info.type = type;
                this.needLoad.push(info);
            }
            return this;
        }
        onCompletion(callback) {
            this.finish = callback;
            return this;
        }
        onItemCompletion(callback) {
            this.loadItem = callback;
            return this;
        }
        start() {
            ResMgr.instance.loadGroup(this);
        }
    }
    class ResMgr {
        constructor() {
            this.mOldRes = new Array();
            this.resDic = new Map();
            if (ResMgr.mInstance == null)
                ResMgr.mInstance = this;
        }
        static get instance() {
            if (this.mInstance == null)
                new ResMgr();
            return this.mInstance;
        }
        getRes(url) {
            return Laya.loader.getRes(url);
        }
        loadGroup(loads) {
            let urls = new Array();
            loads.needLoad.forEach(element => {
                urls.push({ url: element.url, type: element.type });
            });
            Laya.loader.create(urls, Handler.create(this, (success) => {
                if (success) {
                    for (let index = 0; index < loads.needLoad.length; index++) {
                        let info = loads.needLoad[index];
                        this.resDic.set(info.url, info);
                    }
                    if (loads.finish != null) {
                        loads.finish.run();
                    }
                }
                else {
                    console.error("加载资源失败：", urls);
                }
            }), Handler.create(this, (progress) => {
                loads.Progress = progress * 100;
                if (loads.loadItem != null) {
                    loads.loadItem.runWith([loads.Progress]);
                }
            }));
        }
        load(url, callback) {
            let u = {};
            let loadInfo = new ResInfo();
            if (typeof (url) == "string") {
                loadInfo.url = url;
                loadInfo.isKeepMemory = true;
                u = url;
            }
            else {
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
        pop(forced = false) {
            if (forced) {
                this.mOldRes.splice(0, this.mOldRes.length);
                this.resDic.forEach((v, key) => {
                    this.mOldRes.push(key);
                });
            }
            while (this.mOldRes.length > 0) {
                let url = this.mOldRes.pop();
                let info = this.resDic.get(url);
                if (info != null) {
                    this.resDic.delete(info.url);
                }
                Laya.loader.clearRes(url);
            }
            if (forced) {
                this.resDic.clear();
                Laya.loader.clearUnLoaded();
            }
        }
        push() {
            this.resDic.forEach((v, key) => {
                if (!v.isKeepMemory)
                    this.mOldRes.push(key);
            });
        }
    }
    ResMgr.mInstance = null;

    var Status;
    (function (Status) {
        Status[Status["None"] = 0] = "None";
        Status[Status["Running"] = 1] = "Running";
        Status[Status["Success"] = 2] = "Success";
        Status[Status["Failure"] = 3] = "Failure";
    })(Status || (Status = {}));
    class Task {
        constructor() {
            this.mStatus = Status.None;
            this.mErr = "";
            this.mProgress = 0;
        }
        get progress() {
            return this.mProgress;
        }
        elapsedTime() {
            return Laya.timer.currTimer - this.mStartedTime;
        }
        get status() {
            return this.mStatus;
        }
        get taskName() {
            return "";
        }
        get errInfo() {
            return this.mErr;
        }
        get isRunning() {
            return this.status == Status.Running;
        }
        setComplete(callback) {
            this.onFinish = callback;
            return this;
        }
        execute(owner = null) {
            this.mProgress = 0;
            if (!this.isRunning) {
                Laya.timer.frameLoop(1, this, this.update, [owner]);
            }
        }
        tick(owner) {
            if (this.status == Status.Running) {
                this.onUpdate();
                this.latch = false;
                return this.mStatus;
            }
            if (this.latch) {
                this.latch = false;
                return this.mStatus;
            }
            this.mStartedTime = Laya.timer.currTimer;
            this.mStatus = Status.Running;
            this.mOwnerSystem = owner;
            this.onExecute();
            if (Status.Running == this.mStatus) {
                this.onUpdate();
            }
            return this.mStatus;
        }
        update(owner) {
            if (this.tick(owner) != Status.Running) {
                if (this.onFinish != null)
                    this.onFinish.runWith([this.status == Status.Success]);
                Laya.timer.clear(this, this.update);
            }
        }
        endAction(success = true) {
            if (this.status != Status.Running) {
                this.onForcedStop();
                return;
            }
            this.latch = true;
            this.mStatus = success ? Status.Success : Status.Failure;
            this.mProgress = this.mStatus == Status.Success ? 1 : 0;
            this.onStop();
        }
        reset() {
            this.latch = false;
            this.mStatus = Status.None;
            Laya.timer.clear(this, this.update);
            this.onReset();
            this.onForcedStop();
        }
        onExecute() {
        }
        onUpdate() {
        }
        onStop() {
        }
        onReset() {
        }
        onForcedStop() {
        }
    }

    var ActionsExecutionMode;
    (function (ActionsExecutionMode) {
        ActionsExecutionMode[ActionsExecutionMode["RunInSequence"] = 0] = "RunInSequence";
        ActionsExecutionMode[ActionsExecutionMode["RunInParallel"] = 1] = "RunInParallel";
    })(ActionsExecutionMode || (ActionsExecutionMode = {}));
    class TaskList extends Task {
        constructor(executionMode) {
            super();
            this.actions = new Array();
            this.finished = new Array();
            this.executionMode = ActionsExecutionMode.RunInSequence;
            this.executionMode = executionMode;
        }
        get progress() {
            let cur = 0;
            for (let i = 0; i < this.actions.length; i++) {
                cur += this.actions[i].progress;
            }
            let v = cur / this.actions.length;
            v = isNaN(v) ? 0 : v;
            if (this.actions.length == 0)
                v = 1;
            return v;
        }
        onExecute() {
            this.mCurIndex = 0;
            this.finished.splice(0, this.finished.length);
            this.mProgress = 0;
        }
        onUpdate() {
            super.onUpdate();
            if (this.actions.length == 0) {
                this.endAction();
                return;
            }
            switch (this.executionMode) {
                case ActionsExecutionMode.RunInParallel:
                    this.checkParallelTask();
                    break;
                case ActionsExecutionMode.RunInSequence:
                    this.checkInSequenceTask();
                    break;
            }
        }
        checkParallelTask() {
            for (let i = 0; i < this.actions.length; i++) {
                if (this.finished.findIndex(a => a == i) != -1)
                    continue;
                let status = this.actions[i].tick(this.mOwnerSystem);
                if (status == Status.Failure) {
                    this.mErr = this.actions[i].errInfo;
                    this.endAction(false);
                    if (this.actions[i].onFinish != null)
                        this.actions[i].onFinish.runWith(true);
                    return;
                }
                if (status == Status.Success) {
                    this.finished.push(i);
                    if (this.actions[i].onFinish != null)
                        this.actions[i].onFinish.runWith(true);
                }
            }
            if (this.finished.length == this.actions.length)
                this.endAction();
        }
        checkInSequenceTask() {
            for (let i = this.mCurIndex; i < this.actions.length; i++) {
                let status = this.actions[i].tick(this.mOwnerSystem);
                if (status == Status.Failure) {
                    this.endAction(false);
                    if (this.actions[i].onFinish != null)
                        this.actions[i].onFinish.runWith(false);
                    return;
                }
                if (status == Status.Running) {
                    this.mCurIndex = i;
                    return;
                }
                else {
                    if (this.actions[i].onFinish != null)
                        this.actions[i].onFinish.runWith(true);
                }
            }
            this.endAction();
        }
        onReset() {
            for (let i = 0; i < this.actions.length; i++) {
                this.actions[i].reset();
            }
            this.mCurIndex = 0;
            this.finished.splice(0, this.finished.length);
        }
        addTask(task) {
            this.actions.push(task);
            return this;
        }
        clear() {
            this.reset();
            this.onForcedStop();
            this.actions.splice(0, this.actions.length);
        }
    }

    class StateMachine {
        constructor() {
            this.mStateDic = new Map();
        }
        get curState() {
            return this.mCurState;
        }
        stop() {
            if (this.curState != null) {
                this.curState.onExit(null, null);
                this.mCurState = null;
            }
        }
        registerState(state) {
            if (state == null)
                return;
            if (this.mStateDic.has(state.stateId))
                return;
            this.mStateDic.set(state.stateId, state);
        }
        removeState(stateId) {
            if (this.mStateDic.has(stateId))
                this.mStateDic.delete(stateId);
            if (this.curState != null && this.curState.stateId == stateId) {
                this.mCurState.onExit(null);
                this.mCurState = null;
            }
        }
        switchState(stateId, param) {
            if (this.curState != null && this.curState.stateId == stateId)
                return;
            if (!this.mStateDic.has(stateId)) {
                console.error("没有找对应的状态：stateid =" + stateId);
                return;
            }
            let nextState = this.mStateDic.get(stateId);
            if (this.curState != null)
                this.curState.onExit(nextState, param);
            nextState.onEnter(this.mCurState == null ? null : this.curState, param);
            this.mCurState = nextState;
        }
        update() {
            if (this.curState != null)
                this.curState.onUpdate();
        }
    }

    class SceneMgr {
        static get current() {
            return this.mSceneStateMachine.curState == null ? null : this.mSceneStateMachine.curState;
        }
        static go(sceneId, param = null) {
            this.mSceneStateMachine.switchState(sceneId, param);
        }
        static addScene(scene) {
            this.mSceneStateMachine.registerState(scene);
        }
        static removeScene(sceneId) {
            this.mSceneStateMachine.removeState(sceneId);
        }
        static init() {
            Laya.timer.frameLoop(1, this, this.onUpdate);
        }
        static onUpdate() {
            this.mSceneStateMachine.update();
        }
    }
    SceneMgr.mSceneStateMachine = new StateMachine();
    class Scene {
        constructor() {
            this.mSceneTask = new TaskList(ActionsExecutionMode.RunInParallel);
            this.mSequenceTask = null;
            this.mParallelTask = null;
            this.mSceneTask.setComplete(new Laya.Handler(this, () => {
                this.onTaskFinish();
                this.mSceneTask.actions.splice(0, this.mSceneTask.actions.length);
            }));
        }
        static init() {
            SceneMgr.init();
        }
        static go(sceneId, param = null) {
            SceneMgr.go(sceneId, param);
        }
        static add(scene) {
            SceneMgr.addScene(scene);
        }
        static remove(sceneId) {
            SceneMgr.removeScene(sceneId);
        }
        get stateId() {
            return this.sceneId;
        }
        onEnter(prevState, param) {
            this.onSceneEnter(prevState, param);
            this.mSceneTask.execute(this);
        }
        onExit(nextState, param) {
            this.mSceneTask.reset();
            this.mSceneTask.endAction(false);
            this.onLeaveScene(nextState, param);
        }
        addSceneTask(task, executionMode = ActionsExecutionMode.RunInSequence) {
            if (executionMode == ActionsExecutionMode.RunInParallel) {
                if (this.mParallelTask != null) {
                    this.mParallelTask.addTask(task);
                }
                else {
                    this.mParallelTask = new TaskList(executionMode);
                    this.mParallelTask.addTask(task);
                    this.mParallelTask.addTask(this.mSequenceTask);
                }
            }
            else {
                if (this.mSequenceTask != null) {
                    this.mSequenceTask.addTask(task);
                }
                else {
                    this.mSequenceTask = new TaskList(executionMode);
                    this.mSequenceTask.addTask(task);
                    this.mSceneTask.addTask(this.mSequenceTask);
                }
            }
            return this;
        }
        onUpdate() {
        }
        onTaskFinish() {
        }
        onSceneEnter(prevState, param) {
        }
        onLeaveScene(nextState, param) {
        }
    }

    class UIConfig {
    }
    UIConfig.packRootUrl = "";

    var UIPackage = fgui.UIPackage;
    class LoadFGUIPack {
        constructor(packName) {
            this.fileName = packName;
        }
        load(callback, thisObj) {
            fgui.UIPackage.loadPackage(UIConfig.packRootUrl + "/" + this.fileName, Laya.Handler.create(this, () => {
                this.loaded = true;
                callback.call(thisObj);
            }));
        }
    }
    class UIWind extends fgui.Window {
        constructor(packName, resName) {
            super();
            this.mCloseBtnName = "BtnClose";
            this.packName = packName;
            this.resName = resName;
            this.url = `ui://${packName}/${resName}`;
            this.addUISource(new LoadFGUIPack(packName));
        }
        static add(wind) {
            this.mWinds.set(wind.url, wind);
            return wind;
        }
        static remove(wind) {
            if (this.mWinds.has(wind.url)) {
                this.mWinds.delete(wind.url);
                wind.dispose();
            }
        }
        static show(url, param) {
            if (this.mWinds.has(url)) {
                let wind = this.mWinds.get(url);
                wind.data = param;
                if (wind.isShowing) {
                }
                else {
                    wind.show();
                }
            }
            else {
                console.error("显示窗口失败没有注册窗口 url:" + url);
            }
        }
        static hide(url, param) {
            if (this.mWinds.has(url)) {
                let wind = this.mWinds.get(url);
                if (wind.isShowing) {
                    wind.data = param;
                    wind.hide();
                }
            }
            else {
                console.error("隐藏窗口失败没有注册窗口 url:" + url);
            }
        }
        static hideAll(filter = null) {
            this.mWinds.forEach((v, k) => {
                if (v.isShowing && (filter == null || filter.findIndex(a => a == v.url) == -1)) {
                    v.hide();
                }
            });
        }
        static delAll(filter = null) {
            let needDel = new Array();
            this.mWinds.forEach((v, k) => {
                if (filter == null || filter.findIndex(a => a == v.url) == -1) {
                    needDel.push(v.url);
                }
            });
            for (let i = 0; i < needDel.length; i++) {
                this.remove(this.mWinds.get(needDel[i]));
            }
        }
        static del(url) {
            if (this.mWinds.has(url)) {
                this.remove(this.mWinds.get(url));
            }
        }
        onInit() {
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
    }
    UIWind.mWinds = new Map();

    class EventTest {
        static test() {
            this.eventDis = new EventDispatcher$1();
            this.testListener();
            this.testSend();
        }
        static testListener() {
            this.eventDis.on(CustomizeEvent.testId, this.testListener1, this, 1);
            this.eventDis.on(CustomizeEvent.testId, this.testListener2, this, 2);
        }
        static testSend() {
            Laya.timer.loop(1000, this, () => {
                let ev = Event.create(CustomizeEvent, CustomizeEvent.testId);
                this.eventDis.dispatchEvent(ev);
            });
        }
        static testListener1(ev) {
            console.log("testListener1", ev);
        }
        static testListener2(ev) {
            console.log("testListener2", ev);
        }
    }
    class CustomizeEvent extends Event {
    }
    CustomizeEvent.testId = "testId";
    class EventDispatcher$1 extends EventDispatcher {
    }

    class LogTask extends Task {
        constructor(log) {
            super();
            this.log = log;
        }
        onExecute() {
            super.onExecute();
            Laya.timer.once(1000, this, () => {
                this.endAction(true);
            });
            console.log(Laya.timer.currTimer, this.log);
        }
    }
    class TaskTest {
        static test() {
            let parallel = new TaskList(ActionsExecutionMode.RunInParallel);
            let sequence = new TaskList(ActionsExecutionMode.RunInSequence);
            sequence.addTask(new LogTask("顺序测试1"))
                .addTask(new LogTask("顺序测试2"))
                .addTask(new LogTask("顺序测试3"));
            parallel.addTask(new LogTask("并行测试1"))
                .addTask(new LogTask("并行测试2"))
                .addTask(new LogTask("并行测试3"));
            let task = new TaskList(ActionsExecutionMode.RunInParallel)
                .addTask(sequence)
                .addTask(parallel)
                .setComplete(Laya.Handler.create(this, () => {
                console.log("任务完成");
            }))
                .execute(null);
        }
    }

    class ResMgrTest {
        static test() {
            let group = new LoadGroup();
            group.add("unitylib/Conventional/SampleScene.ls")
                .add("unitylib/Conventional/SampleScene.json")
                .add("res/graph/GameGraphCanvas.json")
                .onCompletion(Laya.Handler.create(this, () => {
                this.init();
            })).start();
        }
        static init() {
            let scene = ResMgr.instance.getRes("unitylib/Conventional/SampleScene.ls");
            Laya.stage.addChild(scene);
        }
    }

    class Scene1 extends Scene {
        get sceneId() {
            return Scene1.id;
        }
        onSceneEnter(prevState, param) {
            console.log("进入场景1", prevState, "参数", param);
        }
        onLeaveScene(nextState, param) {
            console.log("离开场景1", nextState, "参数", param);
        }
    }
    Scene1.id = 1;
    class Scene2 extends Scene {
        get sceneId() {
            return Scene2.id;
        }
        onSceneEnter(prevState, param) {
            console.log("进入场景2", prevState, "参数", param);
        }
        onLeaveScene(nextState, param) {
            console.log("离开场景2", nextState, "参数", param);
        }
    }
    Scene2.id = 2;

    class SceneTest {
        static test() {
            Scene.init();
            Scene.add(new Scene1());
            Scene.add(new Scene2());
            Scene.go(1, "测试1");
            Laya.timer.once(1000, this, () => {
                Scene.go(Scene2.id, "测试2");
            });
        }
    }

    class TestUI extends UIWind {
        static test() {
            Laya.stage.addChild(fairygui.GRoot.inst.displayObject);
            UIConfig.packRootUrl = "fgui";
            UIWind.add(new wind1());
            UIWind.add(new wind2());
            wind1.show();
        }
    }
    class wind1 extends UIWind {
        static show() {
            super.show("ui://MainPack/Wind1");
        }
        constructor() {
            super("MainPack", "Wind1");
        }
        onInit() {
            super.onInit();
            this.contentPane.getChild("btnShow").asButton.onClick(this, () => {
                wind2.show();
            });
        }
    }
    class wind2 extends UIWind {
        static show() {
            super.show("ui://MainPack/Wind2");
        }
        constructor() {
            super("MainPack", "Wind2");
        }
    }

    class GameTest {
        constructor() {
            TestUI.test();
        }
    }

    class Main {
        constructor() {
            if (window["Laya3D"])
                Laya3D.init(GameConfig.width, GameConfig.height);
            else
                Laya.init(GameConfig.width, GameConfig.height, Laya["WebGL"]);
            Laya["Physics"] && Laya["Physics"].enable();
            Laya["DebugPanel"] && Laya["DebugPanel"].enable();
            Laya.stage.scaleMode = GameConfig.scaleMode;
            Laya.stage.screenMode = GameConfig.screenMode;
            Laya.stage.alignV = GameConfig.alignV;
            Laya.stage.alignH = GameConfig.alignH;
            Laya.URL.exportSceneToJson = GameConfig.exportSceneToJson;
            if (GameConfig.debug || Laya.Utils.getQueryString("debug") == "true")
                Laya.enableDebugPanel();
            if (GameConfig.physicsDebug && Laya["PhysicsDebugDraw"])
                Laya["PhysicsDebugDraw"].enable();
            if (GameConfig.stat)
                Laya.Stat.show();
            Laya.alertGlobalError = true;
            Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);
        }
        onVersionLoaded() {
            Laya.AtlasInfoManager.enable("fileconfig.json", Laya.Handler.create(this, this.onConfigLoaded));
        }
        onConfigLoaded() {
            new GameTest();
        }
    }
    new Main();

}());
