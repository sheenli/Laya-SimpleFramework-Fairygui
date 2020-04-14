export class GameUtils {

    public static GetMoveDir(start: Laya.Vector3, end: Laya.Vector3, outDir: Laya.Vector3, outEuler: Laya.Vector3) {
        let dir = this.normalizeDir(start, end);
        if (dir.x != 0) {
            if (start.x > end.x)
                outEuler.y = -90;
            else {
                outEuler.y = 90
            }
            outDir.x = dir.x
        } else if (dir.y != 0) {
            if (start.z > end.z)
                outEuler.y = 0;
            else {
                outEuler.y = 180
            }
            outDir.y = dir.y
        }
    }

    public static normalizeDir(start: Laya.Vector3, end: Laya.Vector3): Laya.Vector3 {
        let outDir: Laya.Vector3 = this.Vector3Zero;
        let dir = new Laya.Vector3();
        Laya.Vector3.subtract(end, start, dir);
        Laya.Vector3.normalize(dir, dir);
        let delta = new Laya.Vector3(Math.abs(dir.x), Math.abs(dir.y), Math.abs(dir.z));
        if (delta.x > 0) {
            outDir.x = dir.x > 0 ? 1 : -1
        } else if (delta.z > 0) {
            outDir.z = dir.z > 0 ? 1 : -1
        }
        return outDir
    }

    public static get Vector3Zero(): Laya.Vector3 {
        return new Laya.Vector3()
    }

    public static get Vector3One(): Laya.Vector3 {
        return new Laya.Vector3(1, 1, 1)
    }

    public static FindPath(root: Laya.Node, path: string): Laya.Node {
        var ret: Laya.Node;
        var paths = path.split('/');
        if (paths.length > 0) {
            var obj = root.getChildByName(paths[0]);
            if (paths.length == 1) {
                ret = obj
            } else {
                if (obj != null) {
                    let isFind = true;
                    for (let index = 1; index < paths.length; index++) {
                        const name = paths[index];
                        if (name == null || name.length <= 0) {
                            isFind = false;
                            break;
                        }
                        if (name != null && name.length > 0) {
                            obj = obj.getChildByName(name);
                            if (obj == null) {
                                isFind = false;
                                break;
                            }
                        }
                        if (isFind) ret = obj
                    }
                }
            }
        }
        return ret
    }

    // 屏幕坐标转世界坐标
    static ScreenToWorld(point: Laya.Vector2, camera: Laya.Camera): Laya.Vector3 {
        let distance = camera.transform.position.z;
        let halfFOV = (camera.fieldOfView * 0.5) * Math.PI / 180;
        let height = distance * Math.tan(halfFOV);
        let width = height * camera.aspectRatio;

        // 相机在 distance距离的截面左下角世界坐标位置
        // LowerLeft
        let lowerLeft = new Laya.Vector3();
        let tx = camera.transform;

        // lowerLeft = tx.position - (tx.right * width);
        let right = new Laya.Vector3();
        tx.getRight(right);
        let xx = new Laya.Vector3(right.x * width, right.y * width, right.z * width);
        Laya.Vector3.subtract(tx.position, xx, lowerLeft);
        // lowerLeft -= tx.up * height;
        let up = new Laya.Vector3();
        tx.getUp(up);
        let yy = new Laya.Vector3(up.x * height, up.y * height, up.z * height);
        Laya.Vector3.subtract(lowerLeft, yy, lowerLeft);
        // lowerLeft += tx.forward * distance;
        let forward = new Laya.Vector3();
        tx.getForward(forward);
        let zz = new Laya.Vector3(-forward.x * distance, -forward.y * distance, -forward.z * distance);
        Laya.Vector3.add(lowerLeft, zz, lowerLeft);

        // 根据比例计算屏幕相对于世界坐标的比例
        let v = new Laya.Vector3();
        v.x = width / Laya.stage.width * point.x * 2;
        v.y = height / Laya.stage.height * point.y * 2;
        // v.x = width / Laya.Browser.clientWidth * point.x * 2;
        // v.y = height / Laya.Browser.clientHeight * point.y * 2;
        v.z = 0;

        // 放到同一坐标系（相机坐标系）上计算相对位置
        let value = new Laya.Vector3();
        lowerLeft = this.InverseTransformPoint(tx, lowerLeft);
        Laya.Vector3.add(lowerLeft, v, value);
        // 转回世界坐标系
        value = this.TransformPoint(tx, value);
        return value;
    }

    // 世界坐标转相对坐标
    static InverseTransformPoint(origin, point) {
        let xx = new Laya.Vector3();
        origin.getRight(xx);
        let yy = new Laya.Vector3();
        origin.getUp(yy);
        let zz = new Laya.Vector3();
        origin.getForward(zz);
        let zz1 = new Laya.Vector3(-zz.x, -zz.y, -zz.z);

        let x = this.ProjectDistance(point, origin.position, xx);
        let y = this.ProjectDistance(point, origin.position, yy);
        let z = this.ProjectDistance(point, origin.position, zz1);
        let value = new Laya.Vector3(x, y, z);
        return value;
    }

    // 相对坐标转世界坐标
    static TransformPoint(origin, point) {
        let value = new Laya.Vector3();
        Laya.Vector3.transformQuat(point, origin.rotation, value);
        Laya.Vector3.add(value, origin.position, value);
        return value;
    }

    // 向量投影长度
    static ProjectDistance(first, cen, second) {
        let aa = new Laya.Vector3();
        Laya.Vector3.subtract(first, cen, aa);
        let angle = this.Angle(aa, second) * Math.PI / 180;
        let distance = Laya.Vector3.distance(first, cen);
        distance *= Math.cos(angle);
        return distance;
    }

    // 向量夹角
    static Angle(ma, mb) {

        let v1 = (ma.x * mb.x) + (ma.y * mb.y) + (ma.z * mb.z);
        let ma_val = Math.sqrt(ma.x * ma.x + ma.y * ma.y + ma.z * ma.z);
        let mb_val = Math.sqrt(mb.x * mb.x + mb.y * mb.y + mb.z * mb.z);
        let cosM = v1 / (ma_val * mb_val);
        let angleAMB = Math.acos(cosM) * 180 / Math.PI;

        return angleAMB;
    }

    public static SetLayer(go: Laya.Sprite3D, layer: number) {
        go.layer = layer;
        for (let index = 0; index < go.numChildren; index++) {
            let element = go.getChildAt(index) as Laya.Sprite3D;
            if (element.numChildren > 0) {
                GameUtils.SetLayer(element, layer)
            } else {
                element.layer = layer;
            }
        }
    }

    public static ToLayaV3(pos: Laya.Vector3) {
        let posC = new Laya.Vector3(pos.x, pos.y, pos.z);
        posC.x *= -1;
        return posC;
    }

    public static Vector3Angle(from: Laya.Vector3, to: Laya.Vector3): number {
        Laya.Vector3;
        let num = Math.sqrt(this.Vector3Magnitude(from) * this.Vector3Magnitude(to));
        if (num < 1.00000000362749E-15)
            return 0.0;

        let xx = Laya.Vector3.dot(from, to) / num;
        xx = xx > 1 ? 1 : xx;
        xx = xx < -1 ? -1 : xx;
        return Math.acos(xx) * 57.29578;
    }

    public static Vector3Magnitude(pos: Laya.Vector3): number {
        return pos.x * pos.x + pos.y * pos.y + pos.z * pos.z;
    }

    public static loadFont(url: string, callback: Laya.Handler) {
        if (Laya.Browser.onWeiXin) {
            (<any>wx).loadFont(url);
            if (callback != null) {
                callback.run();
            }
        } else if (Laya.Browser.onQGMiniGame) {
            (<any>qg).loadFont(url)
        } else {
            Laya.loader.load(url, callback, null, Laya.Loader.TTF);
        }

    }

    public static clamp(value: number, min: number, max: number): number {
        if (value < min)
            value = min;
        else if (value > max)
            value = max;
        return value;
    }

    public static random(m, n): number {
        let num = Math.floor(Math.random() * (m - n) + n);
        return num;
    }
}
