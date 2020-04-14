export class GameFlag {
    /// <summary>
    /// 标志量
    /// </summary>
    private mValue: number = 0;

    public get value(): number {
        return this.mValue
    }

    public set value(v) {
        this.mValue = v
    }

    public constructor(flag = 0) {
        this.mValue = flag
    }

    public add(flag) {
        if (!this.has(flag))
            this.mValue |= flag;
        return this
    }

    public remove(flag) {
        if (this.has(flag))
            this.mValue &= ~flag;
        return this
    }

    public has(flag) {
        return (this.mValue & flag) != 0
    }
}