import {EventDispatcher} from "./EventDispatcher";

export class Event {
    public target: EventDispatcher;
    public data: any;
    public type: string;
    public isPropagationImmediateStopped: boolean;

    public stopImmediatePropagation(): void {
        this.isPropagationImmediateStopped = true;
    }

    protected clean(): void {
        this.data = this.target = null;
        this.isPropagationImmediateStopped = false;
    }

    public constructor(type: string, data?: any) {
        this.type = type;
        this.data = data;
    }

    public static create<T extends Event>(EventClass: { new(type: string): T; eventPool?: Event[] }, type: string): T {
        let eventPool: Event[];
        let hasEventPool = (EventClass as any).hasOwnProperty("eventPool");
        if (hasEventPool) {
            eventPool = EventClass.eventPool;
        }

        if (!eventPool) {
            eventPool = EventClass.eventPool = [];
        }
        if (eventPool.length) {
            let event: T = <T>eventPool.pop();
            event.type = type;
            return event;
        }
        return new EventClass(type);
    }

    public static dispatchEvent(target: EventDispatcher, type: string, data?: any) {
        let event = Event.create(Event, type);
        event.data = data;
        target.dispatchEvent(event);
        Event.release(event);
    }

    public static release(event: Event): void {
        event.clean();
        let EventClass: any = Object.getPrototypeOf(event).constructor;
        EventClass.eventPool.push(event);
    }

}